from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from services.profiling_service import ProfilingService
from services.dataset_service import DatasetService
from services.statistics_service import StatisticsService
from services.eda_service import EDAService
from services.problem_detection_service import ProblemDetectionService
from services.feature_engineering_service import FeatureEngineeringService
from services.model_recommendation_service import ModelRecommendationService
from services.training_service import TrainingService
from services.evaluation_service import EvaluationService
from services.report_service import ReportService
from services.job_service import JobService
from core.config import UPLOAD_DIR, REPORT_DIR
from core.logger import logger
from core.exceptions import NotFoundException, BadRequestException, DatabaseException
import os

app = FastAPI()

@app.exception_handler(NotFoundException)
async def not_found_exception_handler(request: Request, exc: NotFoundException):
    logger.error(f"Not Found: {exc.message}")
    return JSONResponse(status_code=404, content={"detail": exc.message})

@app.exception_handler(BadRequestException)
async def bad_request_exception_handler(request: Request, exc: BadRequestException):
    logger.error(f"Bad Request: {exc.message}")
    return JSONResponse(status_code=400, content={"detail": exc.message})

@app.exception_handler(DatabaseException)
async def database_exception_handler(request: Request, exc: DatabaseException):
    logger.error(f"Database Error: {exc.message}")
    return JSONResponse(status_code=500, content={"detail": "Internal database error"})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Error: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": f"Internal server error: {str(exc)}"})


@app.post("/upload")
async def upload(file: UploadFile = File(...)):

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files allowed"
        )

    return await DatasetService.upload_dataset(file)


@app.get("/datasets")
def get_datasets():

    return DatasetService.get_all_datasets()

@app.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str):

    dataset = DatasetService.get_dataset_by_id(dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    return dataset

@app.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: str):

    deleted = DatasetService.delete_dataset(dataset_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    return {
        "message": "Dataset deleted successfully"
    }

@app.get("/datasets/{dataset_id}/profile")
def profile_dataset(dataset_id: str):

    profile = ProfilingService.profile_dataset(dataset_id)

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    return profile

@app.get("/datasets/{dataset_id}/statistics")
def get_statistics(dataset_id: str):

    statistics = StatisticsService.get_statistics(
        dataset_id
    )

    if statistics is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    return statistics

@app.get("/datasets/{dataset_id}/eda")
def get_eda(dataset_id: str):

    eda = EDAService.analyze_dataset(
        dataset_id
    )

    if eda is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    return eda


@app.get("/problem-detection/{dataset_id}")
def detect_problem(dataset_id: str):

    try:
        result = ProblemDetectionService.detect_problem(dataset_id)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Dataset not found"
            )

        return result

    except ValueError as e:
        if str(e) == "Dataset empty":
            raise HTTPException(
                status_code=400,
                detail="Dataset empty"
            )
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@app.get("/feature-engineering/{dataset_id}")
def process_dataset(dataset_id: str):

    try:
        result = FeatureEngineeringService.process_dataset(dataset_id)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Dataset not found"
            )

        return result

    except ValueError as e:
        if str(e) == "Dataset empty":
            raise HTTPException(
                status_code=400,
                detail="Dataset empty"
            )
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@app.get("/model-recommendation/{dataset_id}")
def recommend_models(dataset_id: str):

    try:
        result = ModelRecommendationService.recommend_models(dataset_id)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Dataset not found"
            )

        return result

    except ValueError as e:
        if str(e) == "Dataset empty":
            raise HTTPException(
                status_code=400,
                detail="Dataset empty"
            )
        if str(e) == "Problem type not detected":
            raise HTTPException(
                status_code=400,
                detail="Problem type not detected"
            )
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@app.post("/train/{dataset_id}")
def train_models(dataset_id: str, background_tasks: BackgroundTasks):
    dataset = DatasetService.get_dataset_by_id(dataset_id)
    if dataset is None:
        raise NotFoundException("Dataset not found")
        
    job_id = JobService.create_job(dataset_id, "training")
    background_tasks.add_task(JobService.run_training_job, job_id, dataset_id)
    return {"job_id": job_id}


@app.get("/evaluation/{dataset_id}")
def get_evaluation(dataset_id: str):

    try:
        result = EvaluationService.evaluate_dataset(dataset_id)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Dataset not found"
            )

        return result

    except FileNotFoundError as e:
        status_code = 404 if "Training results not found" in str(e) else 400
        raise HTTPException(
            status_code=status_code,
            detail=str(e)
        )
    except ValueError as e:
        if str(e) == "Dataset empty":
            raise HTTPException(
                status_code=400,
                detail="Dataset empty"
            )
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}"
        )


@app.get("/reports/generate/{dataset_id}")
def generate_report(dataset_id: str, background_tasks: BackgroundTasks):
    dataset = DatasetService.get_dataset_by_id(dataset_id)
    if dataset is None:
        raise NotFoundException("Dataset not found")
        
    # Verify that evaluation results exist before queueing report job
    from repositories.training_repository import TrainingRepository
    evaluation = TrainingRepository.get_evaluation_result(dataset_id)
    if evaluation is None:
        raise NotFoundException("Evaluation results not found")
        
    job_id = JobService.create_job(dataset_id, "report_generation")
    background_tasks.add_task(JobService.run_report_job, job_id, dataset_id)
    return {"job_id": job_id}


@app.get("/reports/download/{dataset_id}")
def download_report(dataset_id: str):
    report_path = os.path.join(REPORT_DIR, f"{dataset_id}_report.pdf")
    if not os.path.exists(report_path):
        raise NotFoundException("Report not found")

    return FileResponse(
        report_path,
        media_type="application/pdf",
        filename=f"{dataset_id}_report.pdf"
    )

@app.get("/jobs")
def get_all_jobs():
    return JobService.get_all_jobs()

@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    job = JobService.get_job(job_id)
    if job is None:
        raise NotFoundException("Job not found")
    return job