from services.dataset_service import DatasetService
from services.profiling_service import ProfilingService
from services.statistics_service import StatisticsService
from services.eda_service import EDAService
from services.problem_detection_service import ProblemDetectionService
from services.ai_insights_service import AIInsightsService
from services.context_ranking_service import ContextRankingService
from repositories.training_repository import TrainingRepository
from core.logger import logger

class RetrievalService:
    """
    Retrieval Service to centralize dataset context aggregation. Exposes methods
    to fetch raw context blocks and filter them using keyword ranking metrics.
    """

    @staticmethod
    def get_dataset_context(dataset_id: str, user_id=None) -> dict:
        """
        Retrieves the complete, raw aggregated diagnostic context for a dataset.
        """
        logger.info(f"Retrieving raw aggregated dataset context for: {dataset_id}")
        
        # Verify dataset exists
        dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=user_id)
        if dataset is None:
            logger.warning(f"Retrieval failed: Dataset {dataset_id} not found.")
            return None
            
        profiling = ProfilingService.profile_dataset(dataset_id)
        statistics = StatisticsService.get_statistics(dataset_id)
        eda = EDAService.analyze_dataset(dataset_id)
        problem = ProblemDetectionService.detect_problem(dataset_id, user_id=user_id)
        evaluation = TrainingRepository.get_evaluation_result(dataset_id, user_id=user_id)
        insights_data = AIInsightsService.get_insights(dataset_id)
        insights = insights_data.get("insights", []) if insights_data else []

        return {
            "dataset_id": dataset_id,
            "filename": dataset.get("filename") if dataset else "dataset",
            "profiling": profiling,
            "statistics": statistics,
            "eda": eda,
            "problem_type": problem,
            "evaluation": evaluation,
            "insights": insights
        }

    @staticmethod
    def get_relevant_context(dataset_id: str, question: str, user_id=None) -> dict:
        """
        Retrieves and ranks context blocks relative to the user query, pruning
        irrelevant diagnostic files.
        """
        logger.info(f"Retrieving relevant context for dataset {dataset_id} relative to query: '{question[:35]}...'")
        full_context = RetrievalService.get_dataset_context(dataset_id, user_id=user_id)
        if full_context is None:
            return None

        # Delegate ranking logic to ContextRankingService
        ranked = ContextRankingService.rank_context(full_context, question)
        
        # Keep dataset ID and filename for prompt building
        ranked["dataset_id"] = dataset_id
        ranked["filename"] = full_context.get("filename", "dataset")
        return ranked

    @staticmethod
    def get_context(dataset_id: str, user_id=None) -> dict:
        """
        Alias method for backward compatibility.
        """
        return RetrievalService.get_dataset_context(dataset_id, user_id=user_id)
