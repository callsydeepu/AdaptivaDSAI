import uuid
from datetime import datetime
from repositories.experiment_repository import ExperimentRepository
from core.logger import logger

class ExperimentService:
    """
    Service layer coordinating dataset experiments. 
    Allows custom model selection, imputation strategy selection, split ratios, and outlier clipping.
    """

    @staticmethod
    def create_experiment(
        dataset_id: str, 
        target_column: str = None, 
        split_ratio: float = 0.8, 
        imputation_strategy: str = "median", 
        selected_models: list = None, 
        outlier_threshold: float = None,
        hyperparameters: dict = None,
        user_id=None
    ) -> dict:
        experiment_id = str(uuid.uuid4())
        
        # Build experiment configuration metadata
        experiment_data = {
            "experiment_id": experiment_id,
            "dataset_id": dataset_id,
            "target_column": target_column,
            "split_ratio": split_ratio,
            "imputation_strategy": imputation_strategy,
            "selected_models": selected_models,
            "outlier_threshold": outlier_threshold,
            "hyperparameters": hyperparameters,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        if user_id:
            experiment_data["user_id"] = user_id
        
        logger.info(f"Instantiating new experiment: {experiment_id} for dataset: {dataset_id}")
        return ExperimentRepository.save_experiment(experiment_data, user_id=user_id)

    @staticmethod
    def get_experiments(dataset_id: str, user_id=None) -> list:
        logger.info(f"Fetching all experiments for dataset: {dataset_id}")
        return ExperimentRepository.get_experiments_by_dataset(dataset_id, user_id=user_id)

    @staticmethod
    def get_experiment(experiment_id: str, user_id=None) -> dict:
        logger.info(f"Fetching experiment details for: {experiment_id}")
        return ExperimentRepository.get_experiment(experiment_id, user_id=user_id)

    @staticmethod
    def get_all_experiments(user_id=None) -> list:
        logger.info(f"Fetching all experiments for user: {user_id}")
        return ExperimentRepository.get_all_experiments(user_id=user_id)
