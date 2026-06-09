from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
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
from services.llm.factory import get_llm
from services.ai_insights_service import AIInsightsService
from services.copilot_service import CopilotService
from pydantic import BaseModel
from core.config import UPLOAD_DIR, REPORT_DIR
from core.logger import logger
from core.exceptions import NotFoundException, BadRequestException, DatabaseException
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


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
        raise NotFoundException("Dataset not found")

    return dataset

@app.get("/datasets/{dataset_id}/preview")
def get_dataset_preview(dataset_id: str):
    df = DatasetService.get_dataframe(dataset_id)
    if df is None:
        raise NotFoundException("Dataset not found")
    return df.head(5).fillna("").to_dict(orient="records")

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

@app.get("/ai/test")
def ai_test():
    llm = get_llm()
    response = llm.generate("Explain machine learning in one sentence.")
    return {
        "provider": llm.__class__.__name__,
        "response": response
    }

@app.get("/datasets/{dataset_id}/insights")
def get_dataset_insights(dataset_id: str):
    insights = AIInsightsService.get_insights(dataset_id)
    if insights is None:
        raise NotFoundException("Dataset not found")
    return insights

class ChatRequest(BaseModel):
    dataset_id: str
    session_id: str
    question: str

class SessionCreateRequest(BaseModel):
    dataset_id: str

@app.post("/copilot/session")
def create_copilot_session(request: SessionCreateRequest):
    dataset = DatasetService.get_dataset_by_id(request.dataset_id)
    if dataset is None:
        raise NotFoundException("Dataset not found")
    
    from services.memory_service import MemoryService
    try:
        session_data = MemoryService.create_session(request.dataset_id)
        return session_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/copilot/sessions/{dataset_id}")
def get_copilot_sessions(dataset_id: str):
    dataset = DatasetService.get_dataset_by_id(dataset_id)
    if dataset is None:
        raise NotFoundException("Dataset not found")
    
    from services.memory_service import MemoryService
    try:
        return MemoryService.get_sessions(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/copilot/session/{session_id}/history")
def get_copilot_session_history(session_id: str):
    from services.memory_service import MemoryService
    try:
        return MemoryService.get_session_history(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/copilot/chat")
def copilot_chat(request: ChatRequest):
    try:
        answer = CopilotService.chat(request.dataset_id, request.session_id, request.question)
        return {"answer": answer}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/copilot/history/{dataset_id}")
def copilot_history(dataset_id: str):
    # Verify dataset existence first
    dataset = DatasetService.get_dataset_by_id(dataset_id)
    if dataset is None:
        raise NotFoundException("Dataset not found")
    return CopilotService.get_history(dataset_id)

@app.get("/copilot/suggestions/{dataset_id}")
def copilot_suggestions(dataset_id: str):
    # Verify dataset existence first
    dataset = DatasetService.get_dataset_by_id(dataset_id)
    if dataset is None:
        raise NotFoundException("Dataset not found")
    return CopilotService.get_suggestions(dataset_id)


@app.get("/system-logs")
def get_system_logs(limit: int = 200):
    log_file_path = "logs/app.log"
    if not os.path.exists(log_file_path):
        return {"logs": []}
    try:
        with open(log_file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        tail_lines = [line.rstrip("\r\n") for line in lines[-limit:]]
        return {"logs": tail_lines}
    except Exception as e:
        logger.error(f"Failed to read system logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read logs: {str(e)}")


@app.post("/system-logs/clear")
def clear_system_logs():
    log_file_path = "logs/app.log"
    try:
        with open(log_file_path, "w", encoding="utf-8") as f:
            f.write("")
        logger.info("System log cleared by user request.")
        return {"message": "Logs cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear system logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear logs: {str(e)}")


# --- Settings & Experiments Endpoints ---

class SettingsUpdateRequest(BaseModel):
    mongodb_url: str = None
    database_name: str = None
    groq_model: str = None
    llm_provider: str = None
    groq_api_key: str = None

@app.get("/settings")
def get_settings():
    import core.config as config
    from core.database import db_connected
    
    return {
        "MONGODB_URL": config.MONGODB_URL,
        "DATABASE_NAME": config.DATABASE_NAME,
        "GROQ_MODEL": config.GROQ_MODEL,
        "LLM_PROVIDER": config.LLM_PROVIDER,
        "GROQ_API_KEY_CONFIGURED": bool(config.GROQ_API_KEY),
        "MONGODB_CONNECTED": bool(db_connected)
    }

@app.post("/settings")
def update_settings(request: SettingsUpdateRequest):
    import core.config as config
    import core.database as database
    
    # Update .env file
    env_path = ".env"
    if not os.path.exists(env_path):
        for level in range(1, 4):
            candidate = os.path.join(*([".."] * level), ".env")
            if os.path.exists(candidate):
                env_path = candidate
                break

    lines = []
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()

    env_keys = {}
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            parts = stripped.split("=", 1)
            if len(parts) == 2:
                env_keys[parts[0].strip()] = i

    updates = {}
    if request.mongodb_url is not None:
        updates["MONGODB_URL"] = request.mongodb_url
    if request.database_name is not None:
        updates["DATABASE_NAME"] = request.database_name
    if request.groq_model is not None:
        updates["GROQ_MODEL"] = request.groq_model
    if request.llm_provider is not None:
        updates["LLM_PROVIDER"] = request.llm_provider
    if request.groq_api_key is not None:
        updates["GROQ_API_KEY"] = request.groq_api_key

    for key, val in updates.items():
        if key in env_keys:
            idx = env_keys[key]
            lines[idx] = f"{key}={val}\n"
        else:
            lines.append(f"{key}={val}\n")

    try:
        with open(env_path, "w") as f:
            f.writelines(lines)
    except Exception as e:
        logger.error(f"Failed to write to .env file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save settings to disk")

    # Reload variables in memory
    for key, val in updates.items():
        os.environ[key] = val
    
    if "MONGODB_URL" in updates:
        config.MONGODB_URL = updates["MONGODB_URL"]
    if "DATABASE_NAME" in updates:
        config.DATABASE_NAME = updates["DATABASE_NAME"]
    if "GROQ_MODEL" in updates:
        config.GROQ_MODEL = updates["GROQ_MODEL"]
    if "LLM_PROVIDER" in updates:
        config.LLM_PROVIDER = updates["LLM_PROVIDER"]
    if "GROQ_API_KEY" in updates:
        config.GROQ_API_KEY = updates["GROQ_API_KEY"]

    # Reconnect to MongoDB dynamically
    database.connect_db()

    return {
        "message": "Settings updated successfully",
        "mongodb_connected": bool(database.db_connected)
    }

@app.get("/datasets/{dataset_id}/columns")
def get_dataset_columns(dataset_id: str):
    df = DatasetService.get_dataframe(dataset_id)
    if df is None:
        raise NotFoundException("Dataset not found")
    return {"columns": df.columns.tolist()}

class ExperimentCreateRequest(BaseModel):
    dataset_id: str
    target_column: str = None
    split_ratio: float = 0.8
    imputation_strategy: str = "median"
    selected_models: list = None
    outlier_threshold: float = None

@app.post("/experiments")
def create_experiment(request: ExperimentCreateRequest, background_tasks: BackgroundTasks):
    dataset = DatasetService.get_dataset_by_id(request.dataset_id)
    if dataset is None:
        raise NotFoundException("Dataset not found")

    from services.experiment_service import ExperimentService
    try:
        # Create experiment metadata config
        experiment = ExperimentService.create_experiment(
            dataset_id=request.dataset_id,
            target_column=request.target_column,
            split_ratio=request.split_ratio,
            imputation_strategy=request.imputation_strategy,
            selected_models=request.selected_models,
            outlier_threshold=request.outlier_threshold
        )
        experiment_id = experiment["experiment_id"]
        
        # Create background Job
        job_id = JobService.create_job(request.dataset_id, "experiment")
        
        # Link job_id to experiment metadata
        experiment["job_id"] = job_id
        from repositories.experiment_repository import ExperimentRepository
        ExperimentRepository.save_experiment(experiment)

        # Trigger async worker execution
        background_tasks.add_task(JobService.run_experiment_job, job_id, request.dataset_id, experiment_id)
        
        return {
            "experiment_id": experiment_id,
            "job_id": job_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/experiments/{dataset_id}")
def get_experiments(dataset_id: str):
    dataset = DatasetService.get_dataset_by_id(dataset_id)
    if dataset is None:
        raise NotFoundException("Dataset not found")

    from services.experiment_service import ExperimentService
    return ExperimentService.get_experiments(dataset_id)

@app.get("/experiments/status/{experiment_id}")
def get_experiment_status(experiment_id: str):
    from services.experiment_service import ExperimentService
    experiment = ExperimentService.get_experiment(experiment_id)
    if not experiment:
        raise NotFoundException("Experiment not found")

    job_id = experiment.get("job_id")
    job_details = None
    if job_id:
        job_details = JobService.get_job(job_id)

    return {
        "experiment": experiment,
        "job": job_details
    }



