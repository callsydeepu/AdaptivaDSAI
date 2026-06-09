from services.retrieval_service import RetrievalService
from services.prompt_builder import PromptBuilder
from services.llm.factory import get_llm
from repositories.copilot_repository import CopilotRepository, HISTORY_FILE
from core.logger import logger
import os
import json
from core.database import db, db_connected

class CopilotService:
    """
    Copilot Service coordinating Dataset Chat features. Handles user inquiries,
    constructs context prompts, queries LLM providers, logs chat histories, and
    compiles smart suggested questions.
    """

    @staticmethod
    def chat(dataset_id: str, session_id: str, question: str) -> str:
        # Security & Validation checks
        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")
            
        if len(question) > 1000:
            raise ValueError("Question exceeds maximum length of 1000 characters.")
            
        logger.info(f"Processing copilot chat request for dataset {dataset_id}, session {session_id}. Query length: {len(question)}")
        
        # 1. Retrieve prompt package using ContextBuilder
        try:
            from services.context_builder import ContextBuilder
            prompt_package = ContextBuilder.build_prompt_package(dataset_id, session_id, question)
        except Exception as e:
            logger.error(f"Failed to construct prompt package: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to build context: {str(e)}")
            
        # 2. Format context prompt
        prompt = PromptBuilder.build(prompt_package)
        
        # 3. Call LLM Abstraction Layer
        try:
            llm = get_llm()
            answer = llm.generate(prompt)
        except Exception as e:
            logger.error(f"LLM generation failed during dataset chat: {str(e)}", exc_info=True)
            raise RuntimeError(f"AI completions failed: {str(e)}") from e
            
        # 4. Save history in database repository
        try:
            CopilotRepository.save_chat(dataset_id, session_id, question, answer)
        except Exception as e:
            logger.error(f"Failed to persist chat conversation log: {str(e)}")
            # Do not block response delivery if storage logs fail
            
        return answer

    @staticmethod
    def get_history(dataset_id: str) -> list:
        """
        Retrieves previous conversation log entries for the selected dataset.
        """
        if db_connected and db is not None:
            try:
                cursor = db.copilot_conversations.find({"dataset_id": dataset_id}).sort("created_at", 1)
                history = list(cursor)
                for h in history:
                    h.pop("_id", None)
                return history
            except Exception as e:
                logger.error(f"Error reading history from MongoDB: {e}. Falling back to JSON.")

        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r") as f:
                    history = json.load(f)
                filtered = [h for h in history if h.get("dataset_id") == dataset_id]
                filtered.sort(key=lambda x: x.get("created_at", ""))
                return filtered
            except Exception:
                return []
        return []

    @staticmethod
    def get_suggestions(dataset_id: str) -> list:
        """
        Generates dynamic suggested queries based on the selected dataset context.
        """
        logger.info(f"Compiling suggested questions for dataset {dataset_id}")
        context = RetrievalService.get_context(dataset_id)
        if context is None:
            return []
            
        suggestions = []
        
        # Heuristic 1: Data quality issues (missing values/duplicates)
        profiling = context.get("profiling", {}) or {}
        missing = profiling.get("missing_values", 0)
        duplicates = profiling.get("duplicate_rows", 0)
        if missing > 0 or duplicates > 0:
            suggestions.append("Are there any data quality issues?")
            
        # Heuristic 2: Outliers presence
        eda = context.get("eda", {}) or {}
        outliers = eda.get("outliers", {}) or {}
        total_outliers = sum(outliers.values())
        if total_outliers > 0:
            suggestions.append("Which columns contain the most outliers?")
            
        # Heuristic 3: Correlation presence
        corr_matrix = eda.get("correlation_matrix", {}) or {}
        if corr_matrix:
            suggestions.append("What does the correlation analysis reveal?")
            
        # Heuristic 4: Model evaluation
        evaluation = context.get("evaluation", {})
        if evaluation:
            best_model = evaluation.get("best_model", "the selected model")
            suggestions.append(f"Why was {best_model} selected?")
            suggestions.append("What are the most important features?")
        else:
            suggestions.append("Which machine learning models are recommended?")
            
        # Add default general questions
        suggestions.append("What preprocessing was applied?")
        suggestions.append("What does this dataset summarize?")
        
        # Filter unique suggestions, keeping order, capped at 5
        seen = set()
        unique_suggestions = []
        for s in suggestions:
            if s not in seen:
                seen.add(s)
                unique_suggestions.append(s)
                
        return unique_suggestions[:5]

