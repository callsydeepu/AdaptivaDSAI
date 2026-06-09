import uuid
from datetime import datetime
from repositories.job_repository import JobRepository
from core.logger import logger

class JobService:
    @staticmethod
    def create_job(dataset_id: str, job_type: str) -> str:
        job_id = str(uuid.uuid4())
        job_data = {
            "job_id": job_id,
            "dataset_id": dataset_id,
            "job_type": job_type,
            "status": "PENDING",
            "progress": 0,
            "result": None,
            "error": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        JobRepository.save_job(job_data)
        logger.info(f"Job created: {job_id} ({job_type}) for dataset {dataset_id}")
        return job_id

    @staticmethod
    def update_job(job_id: str, status: str = None, progress: int = None, result: dict = None, error: str = None):
        job = JobRepository.get_job_by_id(job_id)
        if not job:
            logger.error(f"Job not found for update: {job_id}")
            return
        
        if status is not None:
            job["status"] = status
        if progress is not None:
            job["progress"] = progress
        if result is not None:
            job["result"] = result
        if error is not None:
            job["error"] = error
            
        job["updated_at"] = datetime.now().isoformat()
        JobRepository.save_job(job)

    @staticmethod
    def get_job(job_id: str):
        return JobRepository.get_job_by_id(job_id)

    @staticmethod
    def get_all_jobs():
        return JobRepository.get_all_jobs()

    @staticmethod
    def run_training_job(job_id: str, dataset_id: str):
        try:
            logger.info(f"Starting training job {job_id} in background")
            JobService.update_job(job_id, status="RUNNING", progress=10)
            
            # Import TrainingService here to avoid circular imports
            from services.training_service import TrainingService
            
            JobService.update_job(job_id, progress=30)
            
            # Execute training
            result = TrainingService.train_models(dataset_id)
            if result is None:
                raise ValueError("Dataset not found or could not be trained")
                
            JobService.update_job(job_id, status="COMPLETED", progress=100, result=result)
            logger.info(f"Training job {job_id} finished successfully")
        except Exception as e:
            logger.error(f"Training job {job_id} failed: {str(e)}", exc_info=True)
            JobService.update_job(job_id, status="FAILED", progress=100, error=str(e))

    @staticmethod
    def run_report_job(job_id: str, dataset_id: str):
        try:
            logger.info(f"Starting report generation job {job_id} in background")
            JobService.update_job(job_id, status="RUNNING", progress=10)
            
            # Import ReportService here to avoid circular imports
            from services.report_service import ReportService
            
            JobService.update_job(job_id, progress=40)
            
            result = ReportService.generate_report(dataset_id)
            if result is None:
                raise ValueError("Dataset not found or could not generate report")
                
            JobService.update_job(job_id, status="COMPLETED", progress=100, result=result)
            logger.info(f"Report generation job {job_id} finished successfully")
        except Exception as e:
            logger.error(f"Report generation job {job_id} failed: {str(e)}", exc_info=True)
            JobService.update_job(job_id, status="FAILED", progress=100, error=str(e))
