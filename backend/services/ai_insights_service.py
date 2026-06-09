from services.dataset_service import DatasetService
from services.profiling_service import ProfilingService
from services.eda_service import EDAService
from services.problem_detection_service import ProblemDetectionService
from repositories.training_repository import TrainingRepository
from core.logger import logger

class AIInsightsService:
    """
    AI Insights Service to translate raw analytical results (from profiling, statistics,
    EDA, problem detection, and model evaluations) into business-readable natural
    language insights and computing a consolidated data quality score.
    """

    @staticmethod
    def get_insights(dataset_id: str):
        logger.info(f"Generating AI Insights for dataset: {dataset_id}")
        
        # 1. Retrieve dataset metadata to verify existence
        dataset = DatasetService.get_dataset_by_id(dataset_id)
        if dataset is None:
            logger.warning(f"Failed to generate insights: Dataset {dataset_id} not found.")
            return None

        # 2. Gather profiling details
        profile = ProfilingService.profile_dataset(dataset_id)
        if profile is None:
            logger.warning(f"Failed to generate insights: Profiling result for {dataset_id} not available.")
            return None

        # 3. Gather EDA details
        eda = EDAService.analyze_dataset(dataset_id)
        if eda is None:
            logger.warning(f"Failed to generate insights: EDA result for {dataset_id} not available.")
            return None

        # 4. Gather problem detection details
        problem = ProblemDetectionService.detect_problem(dataset_id)
        if problem is None:
            logger.warning(f"Failed to generate insights: Problem detection result for {dataset_id} not available.")
            return None

        # 5. Gather evaluation details (this can be None if training hasn't run yet)
        evaluation = TrainingRepository.get_evaluation_result(dataset_id)

        # 6. Compute Data Quality Score
        rows = profile.get("rows", 0)
        columns = profile.get("columns", 0)
        total_cells = rows * columns
        missing_values = profile.get("missing_values", 0)
        duplicate_rows = profile.get("duplicate_rows", 0)
        outliers_count = sum(eda.get("outliers", {}).values())

        # Penalties math
        if total_cells > 0:
            missing_pct = (missing_values / total_cells) * 100
            missing_penalty = min(25, int(missing_pct * 2.0))
        else:
            missing_pct = 0
            missing_penalty = 0

        if rows > 0:
            dup_pct = (duplicate_rows / rows) * 100
            duplicate_penalty = min(20, int(dup_pct * 1.5))
            
            outliers_pct = (outliers_count / rows) * 100
            outliers_penalty = min(15, int(outliers_pct * 0.5))
        else:
            dup_pct = 0
            duplicate_penalty = 0
            outliers_pct = 0
            outliers_penalty = 0

        data_quality_score = max(0, 100 - missing_penalty - duplicate_penalty - outliers_penalty)

        # Quality Rating Mapping
        if data_quality_score >= 90:
            quality_rating = "Excellent"
        elif data_quality_score >= 75:
            quality_rating = "Good"
        elif data_quality_score >= 50:
            quality_rating = "Needs Attention"
        else:
            quality_rating = "Poor"

        logger.info(f"Dataset {dataset_id} quality score: {data_quality_score} ({quality_rating})")

        # 7. Generate Natural Language Insights
        insights = []

        # Missing values insight
        if missing_values > 0:
            if missing_pct > 5.0:
                insights.append(f"Dataset contains {missing_pct:.1f}% missing values.")
            else:
                insights.append(f"Dataset contains {missing_values} missing values.")

        # Duplicate rows insight
        if duplicate_rows > 0:
            insights.append(f"Dataset contains {duplicate_rows} duplicate rows.")

        # Column-specific outlier insights
        outliers_dict = eda.get("outliers", {})
        for col, count in outliers_dict.items():
            if count > 0:
                insights.append(f"{col} contains {count} detected outliers.")

        # Correlation insights (Lexicographical ordering to deduplicate pairs)
        corr_matrix = eda.get("correlation_matrix", {})
        corr_cols = list(corr_matrix.keys())
        for i in range(len(corr_cols)):
            for j in range(i + 1, len(corr_cols)):
                col1 = corr_cols[i]
                col2 = corr_cols[j]
                corr_val = corr_matrix[col1].get(col2, 0.0)
                if corr_val >= 0.7:
                    insights.append(f"{col1} and {col2} are strongly positively correlated.")
                elif corr_val <= -0.7:
                    insights.append(f"{col1} and {col2} are strongly negatively correlated.")

        # Problem type insight
        problem_type = problem.get("problem_type")
        if problem_type:
            insights.append(f"The dataset appears to be a {problem_type.lower()} problem.")

        # Model evaluation insight
        if evaluation:
            best_model = evaluation.get("best_model")
            eval_prob_type = evaluation.get("problem_type")
            if best_model:
                metrics = evaluation.get("detailed_results", {}).get(best_model, {}).get("metrics", {})
                if eval_prob_type == "Classification":
                    accuracy = metrics.get("accuracy")
                    if accuracy is not None:
                        insights.append(f"{best_model} achieved the highest accuracy of {accuracy * 100:.1f}%.")
                    else:
                        insights.append(f"{best_model} achieved the highest accuracy.")
                else: # Regression
                    r2_score = metrics.get("r2_score")
                    if r2_score is not None:
                        insights.append(f"{best_model} produced the strongest regression performance with an R² score of {r2_score:.2f}.")
                    else:
                        insights.append(f"{best_model} produced the strongest regression performance.")
        else:
            insights.append("Model training and evaluation has not been executed yet.")

        return {
            "dataset_id": dataset_id,
            "data_quality_score": data_quality_score,
            "quality_rating": quality_rating,
            "insights": insights
        }
