from core.logger import logger

class ContextRankingService:
    """
    Context Ranking Service to dynamically evaluate the relevance of dataset context
    sections relative to a user's question. Performs rule-based keyword matching
    to prune unrelated parameters, optimizing prompt size.
    """

    # Keyword mappings defining section scopes
    KEYWORDS = {
        "profiling": [
            "missing", "null", "blank", "empty", "duplicate", "dimension", "rows", 
            "columns", "size", "shape", "quality", "clean", "impute", "nulls", "health"
        ],
        "statistics": [
            "mean", "median", "mode", "average", "std", "standard deviation", 
            "min", "max", "variance", "range", "deviation", "variance"
        ],
        "eda": [
            "outlier", "anomaly", "correlation", "relationship", "relation", "vs",
            "heatmap", "coefficient", "positive", "negative", "spend", "outliers"
        ],
        "problem_type": [
            "target", "label", "task", "classification", "regression", "binary", 
            "multi-class", "classes", "predict", "predictive"
        ],
        "evaluation": [
            "accuracy", "f1", "precision", "recall", "r2", "rmse", "mae", "fit", 
            "metric", "forest", "linear", "logistics", "tree", "best model", 
            "feature importance", "feature weights", "performance", "metrics", "underfit"
        ],
        "insights": [
            "summary", "observation", "insight", "problem", "trend", "findings", 
            "report", "observations", "insights", "data quality"
        ]
    }

    @staticmethod
    def rank_context(context: dict, question: str) -> dict:
        """
        Evaluates relevance scores for each context block.
        Returns a pruned context containing only matching high-score blocks.
        """
        logger.info(f"Ranking context relevance for user query: '{question[:45]}...'")
        
        lower_question = question.lower()
        scores = {}
        
        # Calculate matching overlap
        for section, keywords in ContextRankingService.KEYWORDS.items():
            base_score = 1 # baseline score
            matches = 0
            for kw in keywords:
                if kw in lower_question:
                    matches += 1
            
            # Substantial weight shift if keywords are found
            scores[section] = base_score + (matches * 10)

        # Build pruned context
        relevant_context = {}
        included_sections = []
        
        for section, score in scores.items():
            # Include if the score is greater than 5 (i.e. at least one keyword matched)
            if score > 5:
                relevant_context[section] = context.get(section)
                included_sections.append(section)

        # Fallback: if no keywords matched, supply a default baseline context to LLM
        if not relevant_context:
            logger.info("No section keywords matched. Supplying default context blocks.")
            default_sections = ["profiling", "insights", "problem_type"]
            for sec in default_sections:
                relevant_context[sec] = context.get(sec)
                included_sections.append(sec)
        else:
            logger.info(f"Relevant context blocks selected: {included_sections}")

        return relevant_context
