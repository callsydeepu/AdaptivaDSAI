from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request, Depends
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

from auth.routes import router as auth_router
app.include_router(auth_router)
from auth.jwt_service import get_current_user


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
async def upload(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files allowed"
        )

    return await DatasetService.upload_dataset(file, user_id=current_user["user_id"])


@app.get("/datasets")
def get_datasets(current_user: dict = Depends(get_current_user)):
    datasets = DatasetService.get_all_datasets(user_id=current_user["user_id"])
    for d in datasets:
        try:
            from services.problem_detection_service import ProblemDetectionService
            p_info = ProblemDetectionService.detect_problem(d["dataset_id"], user_id=current_user["user_id"])
            d["problem_type"] = p_info["problem_type"] if p_info else "Unknown"
        except Exception:
            d["problem_type"] = "Unknown"
    return datasets

@app.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):

    dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=current_user["user_id"])

    if dataset is None:
        raise NotFoundException("Dataset not found")

    return dataset

@app.get("/datasets/{dataset_id}/preview")
def get_dataset_preview(dataset_id: str, current_user: dict = Depends(get_current_user)):
    df = DatasetService.get_dataframe(dataset_id, user_id=current_user["user_id"])
    if df is None:
        raise NotFoundException("Dataset not found")
    return df.head(5).fillna("").to_dict(orient="records")


@app.get("/datasets/{dataset_id}/correlation-plot")
def get_correlation_plot(dataset_id: str, current_user: dict = Depends(get_current_user)):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns
    import io
    import numpy as np
    from fastapi.responses import StreamingResponse
    
    df = DatasetService.get_dataframe(dataset_id, user_id=current_user["user_id"])
    if df is None:
        raise NotFoundException("Dataset not found")
        
    numeric_df = df.select_dtypes(include=[np.number])
    
    # Set up matplotlib style
    plt.style.use("dark_background")
    fig, ax = plt.subplots(figsize=(8, 6))
    fig.patch.set_facecolor('#0f172a') # Slate-900 style color for dark mode harmony
    ax.set_facecolor('#0f172a')
    
    if numeric_df.shape[1] < 2:
        ax.text(0.5, 0.5, "Not enough numeric columns\nto compute correlation", 
                horizontalalignment='center', verticalalignment='center',
                transform=ax.transAxes, color='white', fontsize=14)
        ax.set_xticks([])
        ax.set_yticks([])
    else:
        corr = numeric_df.corr()
        sns.heatmap(corr, annot=True, cmap="coolwarm", fmt=".2f", linewidths=0.5, ax=ax, cbar=True)
        
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", dpi=100, facecolor=fig.get_facecolor(), edgecolor='none')
    buf.seek(0)
    plt.close(fig)
    
    return StreamingResponse(buf, media_type="image/png")


@app.get("/datasets/{dataset_id}/export/notebook")
def export_notebook(dataset_id: str, mode: str = "clean", current_user: dict = Depends(get_current_user)):
    import json
    import io
    from fastapi.responses import StreamingResponse
    from services.notebook_generator_service import NotebookGeneratorService
    
    try:
        notebook = NotebookGeneratorService.generate_notebook_dict(dataset_id, mode=mode, user_id=current_user["user_id"])
        notebook_str = json.dumps(notebook, indent=2)
        
        dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=current_user["user_id"])
        clean_name = dataset.get("filename", "dataset.csv").rsplit(".", 1)[0]
        filename = f"{clean_name}_Workflow_{mode.capitalize()}.ipynb" if mode != "clean" else f"{clean_name}_Workflow.ipynb"
        
        return StreamingResponse(
            io.BytesIO(notebook_str.encode("utf-8")),
            media_type="application/x-ipynb+json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as ve:
        raise NotFoundException(str(ve))
    except Exception as e:
        logger.error(f"Failed to export notebook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/datasets/{dataset_id}/export/script")
def export_script(dataset_id: str, mode: str = "clean", current_user: dict = Depends(get_current_user)):
    import io
    from fastapi.responses import StreamingResponse
    from services.notebook_generator_service import NotebookGeneratorService
    
    try:
        script_str = NotebookGeneratorService.generate_python_script(dataset_id, mode=mode, user_id=current_user["user_id"])
        
        dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=current_user["user_id"])
        clean_name = dataset.get("filename", "dataset.csv").rsplit(".", 1)[0]
        filename = f"{clean_name}_workflow_{mode}.py" if mode != "clean" else f"{clean_name}_workflow.py"
        
        return StreamingResponse(
            io.BytesIO(script_str.encode("utf-8")),
            media_type="text/x-python",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as ve:
        raise NotFoundException(str(ve))
    except Exception as e:
        logger.error(f"Failed to export script: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ColabExportRequest(BaseModel):
    github_token: str = None
    mode: str = "clean"


@app.post("/datasets/{dataset_id}/export/colab")
def export_colab(dataset_id: str, request: ColabExportRequest = None, current_user: dict = Depends(get_current_user)):
    from services.notebook_generator_service import NotebookGeneratorService
    import core.config as config
    
    try:
        token = None
        mode = "clean"
        if request:
            if request.github_token:
                token = request.github_token
            if request.mode:
                mode = request.mode
                
        if not token and config.GITHUB_TOKEN:
            token = config.GITHUB_TOKEN
            
        if not token:
            raise HTTPException(
                status_code=400,
                detail="GitHub Personal Access Token is required for 1-click Colab export. Please configure it in settings."
            )
            
        colab_url = NotebookGeneratorService.upload_to_gist(dataset_id, token, mode=mode, user_id=current_user["user_id"])
        return {"colab_url": colab_url}
    except ValueError as ve:
        raise NotFoundException(str(ve))
    except Exception as e:
        logger.error(f"Failed to export to Google Colab: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):

    deleted = DatasetService.delete_dataset(dataset_id, user_id=current_user["user_id"])

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    return {
        "message": "Dataset deleted successfully"
    }

@app.get("/datasets/{dataset_id}/profile")
def profile_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):

    profile = ProfilingService.profile_dataset(dataset_id, user_id=current_user["user_id"])

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    return profile

@app.get("/datasets/{dataset_id}/statistics")
def get_statistics(dataset_id: str, current_user: dict = Depends(get_current_user)):

    statistics = StatisticsService.get_statistics(
        dataset_id, user_id=current_user["user_id"]
    )

    if statistics is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    return statistics

@app.get("/datasets/{dataset_id}/eda")
def get_eda(dataset_id: str, current_user: dict = Depends(get_current_user)):

    eda = EDAService.analyze_dataset(
        dataset_id, user_id=current_user["user_id"]
    )

    if eda is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    return eda


@app.get("/problem-detection/{dataset_id}")
def detect_problem(dataset_id: str, current_user: dict = Depends(get_current_user)):

    try:
        result = ProblemDetectionService.detect_problem(dataset_id, user_id=current_user["user_id"])

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
def process_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):

    try:
        result = FeatureEngineeringService.process_dataset(dataset_id, user_id=current_user["user_id"])

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
def recommend_models(dataset_id: str, current_user: dict = Depends(get_current_user)):

    try:
        result = ModelRecommendationService.recommend_models(dataset_id, user_id=current_user["user_id"])

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
def train_models(dataset_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=current_user["user_id"])
    if dataset is None:
        raise NotFoundException("Dataset not found")
        
    job_id = JobService.create_job(dataset_id, "training", user_id=current_user["user_id"])
    background_tasks.add_task(JobService.run_training_job, job_id, dataset_id, current_user["user_id"])
    return {"job_id": job_id}


@app.get("/evaluation/{dataset_id}")
def get_evaluation(dataset_id: str, current_user: dict = Depends(get_current_user)):

    try:
        result = EvaluationService.evaluate_dataset(dataset_id, user_id=current_user["user_id"])

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
def generate_report(dataset_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=current_user["user_id"])
    if dataset is None:
        raise NotFoundException("Dataset not found")
        
    # Verify that evaluation results exist before queueing report job
    from repositories.training_repository import TrainingRepository
    evaluation = TrainingRepository.get_evaluation_result(dataset_id, user_id=current_user["user_id"])
    if evaluation is None:
        raise NotFoundException("Evaluation results not found")
        
    job_id = JobService.create_job(dataset_id, "report_generation", user_id=current_user["user_id"])
    background_tasks.add_task(JobService.run_report_job, job_id, dataset_id, current_user["user_id"])
    return {"job_id": job_id}


@app.get("/reports/download/{dataset_id}")
def download_report(dataset_id: str, current_user: dict = Depends(get_current_user)):
    dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=current_user["user_id"])
    if dataset is None:
        raise NotFoundException("Dataset not found")
        
    report_path = os.path.join(REPORT_DIR, f"{dataset_id}_report.pdf")
    if not os.path.exists(report_path):
        raise NotFoundException("Report not found")

    return FileResponse(
        report_path,
        media_type="application/pdf",
        filename=f"{dataset_id}_report.pdf"
    )

@app.get("/jobs")
def get_all_jobs(current_user: dict = Depends(get_current_user)):
    return JobService.get_all_jobs(user_id=current_user["user_id"])

@app.get("/jobs/{job_id}")
def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    job = JobService.get_job(job_id, user_id=current_user["user_id"])
    if job is None:
        raise NotFoundException("Job not found")
    return job

@app.get("/ai/test")
def ai_test(current_user: dict = Depends(get_current_user)):
    llm = get_llm()
    response = llm.generate("Explain machine learning in one sentence.")
    return {
        "provider": llm.__class__.__name__,
        "response": response
    }

@app.get("/datasets/{dataset_id}/insights")
def get_dataset_insights(dataset_id: str, current_user: dict = Depends(get_current_user)):
    insights = AIInsightsService.get_insights(dataset_id, user_id=current_user["user_id"])
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
def create_copilot_session(request: SessionCreateRequest, current_user: dict = Depends(get_current_user)):
    dataset = DatasetService.get_dataset_by_id(request.dataset_id, user_id=current_user["user_id"])
    if dataset is None:
        raise NotFoundException("Dataset not found")
    
    from services.memory_service import MemoryService
    try:
        session_data = MemoryService.create_session(request.dataset_id, user_id=current_user["user_id"])
        return session_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/copilot/sessions/{dataset_id}")
def get_copilot_sessions(dataset_id: str, current_user: dict = Depends(get_current_user)):
    dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=current_user["user_id"])
    if dataset is None:
        raise NotFoundException("Dataset not found")
    
    from services.memory_service import MemoryService
    try:
        return MemoryService.get_sessions(dataset_id, user_id=current_user["user_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/copilot/session/{session_id}/history")
def get_copilot_session_history(session_id: str, current_user: dict = Depends(get_current_user)):
    from services.memory_service import MemoryService
    try:
        return MemoryService.get_session_history(session_id, user_id=current_user["user_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/copilot/chat")
def copilot_chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    # Verify dataset existence first
    dataset = DatasetService.get_dataset_by_id(request.dataset_id, user_id=current_user["user_id"])
    if dataset is None:
        raise NotFoundException("Dataset not found")
        
    try:
        answer = CopilotService.chat(request.dataset_id, request.session_id, request.question, user_id=current_user["user_id"])
        return {"answer": answer}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/copilot/history/{dataset_id}")
def copilot_history(dataset_id: str, current_user: dict = Depends(get_current_user)):
    # Verify dataset existence first
    dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=current_user["user_id"])
    if dataset is None:
        raise NotFoundException("Dataset not found")
    return CopilotService.get_history(dataset_id, user_id=current_user["user_id"])

@app.get("/copilot/suggestions/{dataset_id}")
def copilot_suggestions(dataset_id: str, current_user: dict = Depends(get_current_user)):
    # Verify dataset existence first
    dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=current_user["user_id"])
    if dataset is None:
        raise NotFoundException("Dataset not found")
    return CopilotService.get_suggestions(dataset_id, user_id=current_user["user_id"])


@app.get("/dashboard/overview")
def get_dashboard_overview(current_user: dict = Depends(get_current_user)):
    from services.dataset_service import DatasetService
    from services.job_service import JobService
    from core.database import db, db_connected
    import json
    import os

    user_id = current_user["user_id"]

    # 1. Total datasets
    datasets = DatasetService.get_all_datasets(user_id=user_id)
    total_datasets = len(datasets)

    # 2. Total models trained
    jobs = JobService.get_all_jobs(user_id=user_id)
    total_models = len([j for j in jobs if j.get("job_type") in ("training", "experiment") and j.get("status") == "COMPLETED"])

    # 3. Total reports generated
    total_reports = 0
    report_metadata_file = "data/report_metadata.json"
    if os.path.exists(report_metadata_file):
        try:
            with open(report_metadata_file, "r") as f:
                reports = json.load(f)
                total_reports = len([r for r in reports if r.get("user_id") == user_id])
        except Exception:
            pass
    if db_connected and db is not None:
        try:
            total_reports = db.generated_reports.count_documents({"user_id": user_id})
        except Exception:
            pass

    # 4. Total copilot conversations (chats count, not sessions)
    total_conversations = 0
    history_file = "data/copilot_history.json"
    if os.path.exists(history_file):
        try:
            with open(history_file, "r") as f:
                history = json.load(f)
                total_conversations = len([h for h in history if h.get("user_id") == user_id])
        except Exception:
            pass
    if db_connected and db is not None:
        try:
            total_conversations = db.copilot_conversations.count_documents({"user_id": user_id})
        except Exception:
            pass

    # 5. Job statuses
    running_jobs = len([j for j in jobs if j.get("status") == "RUNNING"])
    completed_jobs = len([j for j in jobs if j.get("status") == "COMPLETED"])
    failed_jobs = len([j for j in jobs if j.get("status") == "FAILED"])

    return {
        "total_datasets": total_datasets,
        "total_models": total_models,
        "total_reports": total_reports,
        "total_conversations": total_conversations,
        "running_jobs": running_jobs,
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs
    }


@app.get("/copilot/sessions")
def get_all_copilot_sessions(current_user: dict = Depends(get_current_user)):
    from core.database import db, db_connected
    import os
    import json
    
    user_id = current_user["user_id"]

    # Try MongoDB first
    if db_connected and db is not None:
        try:
            cursor = db.copilot_sessions.find({"user_id": user_id}).sort("created_at", -1)
            sessions = list(cursor)
            for s in sessions:
                s.pop("_id", None)
            return sessions
        except Exception as e:
            logger.error(f"Error reading all sessions from MongoDB: {e}")
            
    # Fallback to local JSON
    sessions_file = "data/copilot_sessions.json"
    if os.path.exists(sessions_file):
        try:
            with open(sessions_file, "r") as f:
                sessions = json.load(f)
            filtered = [s for s in sessions if s.get("user_id") == user_id]
            filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return filtered
        except Exception:
            return []
    return []


@app.get("/reports")
def get_all_reports(current_user: dict = Depends(get_current_user)):
    import os
    import json
    from core.database import db, db_connected
    
    user_id = current_user["user_id"]

    # Try MongoDB first
    if db_connected and db is not None:
        try:
            docs = list(db.generated_reports.find({"user_id": user_id}))
            for doc in docs:
                doc.pop("_id", None)
            return docs
        except Exception as e:
            logger.error(f"Error reading reports from MongoDB: {e}")
            
    # Fallback to local JSON
    report_metadata_file = "data/report_metadata.json"
    if os.path.exists(report_metadata_file):
        try:
            with open(report_metadata_file, "r") as f:
                reports = json.load(f)
            return [r for r in reports if r.get("user_id") == user_id]
        except Exception:
            return []
    return []


@app.get("/system-logs")
def get_system_logs(limit: int = 200, current_user: dict = Depends(get_current_user)):
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
def clear_system_logs(current_user: dict = Depends(get_current_user)):
    log_file_path = "logs/app.log"
    try:
        with open(log_file_path, "w", encoding="utf-8") as f:
            f.write("")
        logger.info("System log cleared by user request.")
        return {"message": "Logs cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear system logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear logs: {str(e)}")


# --- Settings, Preferences & Experiments Endpoints ---

class SettingsUpdateRequest(BaseModel):
    mongodb_url: str = None
    database_name: str = None
    groq_model: str = None
    llm_provider: str = None
    groq_api_key: str = None
    github_token: str = None

class TokenTestRequest(BaseModel):
    github_token: str

@app.post("/settings/test-github")
def test_github_token(request: TokenTestRequest, current_user: dict = Depends(get_current_user)):
    import requests
    headers = {
        "Authorization": f"token {request.github_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    try:
        response = requests.get("https://api.github.com/user", headers=headers, timeout=5)
        if response.status_code == 200:
            scopes = response.headers.get("X-OAuth-Scopes", "")
            has_gist = "gist" in [s.strip() for s in scopes.split(",")]
            return {
                "valid": True,
                "username": response.json().get("login"),
                "scopes": scopes,
                "has_gist_scope": has_gist
            }
        else:
            return {"valid": False, "detail": f"GitHub API returned status {response.status_code}"}
    except Exception as e:
        return {"valid": False, "detail": str(e)}

@app.get("/settings")
def get_settings(current_user: dict = Depends(get_current_user)):
    import core.config as config
    from core.database import db_connected
    
    return {
        "MONGODB_URL_CONFIGURED": bool(config.MONGODB_URL),
        "DATABASE_NAME": config.DATABASE_NAME,
        "GROQ_MODEL": config.GROQ_MODEL,
        "LLM_PROVIDER": config.LLM_PROVIDER,
        "GROQ_API_KEY_CONFIGURED": bool(config.GROQ_API_KEY),
        "GITHUB_TOKEN_CONFIGURED": bool(config.GITHUB_TOKEN),
        "MONGODB_CONNECTED": bool(db_connected)
    }

@app.post("/settings")
def update_settings(request: SettingsUpdateRequest, current_user: dict = Depends(get_current_user)):
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
    if request.mongodb_url is not None and request.mongodb_url.strip() != "":
        updates["MONGODB_URL"] = request.mongodb_url
    if request.database_name is not None and request.database_name.strip() != "":
        updates["DATABASE_NAME"] = request.database_name
    if request.groq_model is not None and request.groq_model.strip() != "":
        updates["GROQ_MODEL"] = request.groq_model
    if request.llm_provider is not None and request.llm_provider.strip() != "":
        updates["LLM_PROVIDER"] = request.llm_provider
    if request.groq_api_key is not None and request.groq_api_key.strip() != "":
        updates["GROQ_API_KEY"] = request.groq_api_key
    if request.github_token is not None and request.github_token.strip() != "":
        updates["GITHUB_TOKEN"] = request.github_token

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
    if "GITHUB_TOKEN" in updates:
        config.GITHUB_TOKEN = updates["GITHUB_TOKEN"]

    # Reconnect to MongoDB dynamically
    database.connect_db()

    return {
        "message": "Settings updated successfully",
        "mongodb_connected": bool(database.db_connected)
    }

class PreferencesUpdateRequest(BaseModel):
    name: str = None
    email: str = None
    profile_photo: str = None
    ai_response_style: str = None
    notebook_export_style: str = None
    default_export_format: str = None
    auto_open_colab: bool = None
    notifications: dict = None
    dashboard: dict = None

@app.get("/preferences")
def get_preferences(current_user: dict = Depends(get_current_user)):
    from repositories.preferences_repository import PreferencesRepository
    return PreferencesRepository.get_preferences(user_id=current_user["user_id"])

@app.post("/preferences")
def update_preferences(request: PreferencesUpdateRequest, current_user: dict = Depends(get_current_user)):
    from repositories.preferences_repository import PreferencesRepository
    current = PreferencesRepository.get_preferences(user_id=current_user["user_id"])
    
    updates = request.dict(exclude_unset=True)
    for k, v in updates.items():
        if v is not None:
            if k in ("notifications", "dashboard") and isinstance(current.get(k), dict) and isinstance(v, dict):
                current[k].update(v)
            else:
                current[k] = v
                
    PreferencesRepository.save_preferences(current, user_id=current_user["user_id"])
    return current

@app.get("/datasets/{dataset_id}/columns")
def get_dataset_columns(dataset_id: str, current_user: dict = Depends(get_current_user)):
    df = DatasetService.get_dataframe(dataset_id, user_id=current_user["user_id"])
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
    hyperparameters: dict = None

@app.post("/experiments")
def create_experiment(request: ExperimentCreateRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    dataset = DatasetService.get_dataset_by_id(request.dataset_id, user_id=current_user["user_id"])
    if dataset is None:
        raise NotFoundException("Dataset not found")

    # Detect problem type for validation
    from services.problem_detection_service import ProblemDetectionService
    problem_info = ProblemDetectionService.detect_problem(request.dataset_id, user_id=current_user["user_id"])
    if not problem_info:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Could not detect problem type for dataset",
                "detail": "Could not detect problem type for dataset"
            }
        )
    problem_type = problem_info.get("problem_type")

    supported_class_models = {"LogisticRegression", "RandomForestClassifier", "DecisionTreeClassifier", "XGBoostClassifier", "SVMClassifier"}
    supported_reg_models = {"LinearRegression", "RandomForestRegressor", "DecisionTreeRegressor", "XGBoostRegressor"}

    if request.selected_models:
        for model_name in request.selected_models:
            if problem_type == "Classification" and model_name not in supported_class_models:
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": "Model type does not match dataset problem type.",
                        "detail": f"{model_name} cannot be used for a Classification problem. Please select a Classification model."
                    }
                )
            elif problem_type == "Regression" and model_name not in supported_reg_models:
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": "Model type does not match dataset problem type.",
                        "detail": f"{model_name} cannot be used for a Regression problem. Please select a Regression model."
                    }
                )

    from services.experiment_service import ExperimentService
    try:
        # Create experiment metadata config
        experiment = ExperimentService.create_experiment(
            dataset_id=request.dataset_id,
            target_column=request.target_column,
            split_ratio=request.split_ratio,
            imputation_strategy=request.imputation_strategy,
            selected_models=request.selected_models,
            outlier_threshold=request.outlier_threshold,
            hyperparameters=request.hyperparameters,
            user_id=current_user["user_id"]
        )
        experiment_id = experiment["experiment_id"]
        
        # Create background Job
        job_id = JobService.create_job(request.dataset_id, "experiment", user_id=current_user["user_id"])
        
        # Link job_id to experiment metadata
        experiment["job_id"] = job_id
        from repositories.experiment_repository import ExperimentRepository
        ExperimentRepository.save_experiment(experiment, user_id=current_user["user_id"])

        # Trigger async worker execution
        background_tasks.add_task(JobService.run_experiment_job, job_id, request.dataset_id, experiment_id, current_user["user_id"])
        
        return {
            "experiment_id": experiment_id,
            "job_id": job_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/experiments/{dataset_id}")
def get_experiments(dataset_id: str, current_user: dict = Depends(get_current_user)):
    dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=current_user["user_id"])
    if dataset is None:
        raise NotFoundException("Dataset not found")

    from services.experiment_service import ExperimentService
    return ExperimentService.get_experiments(dataset_id, user_id=current_user["user_id"])

@app.get("/experiments/status/{experiment_id}")
def get_experiment_status(experiment_id: str, current_user: dict = Depends(get_current_user)):
    from services.experiment_service import ExperimentService
    experiment = ExperimentService.get_experiment(experiment_id, user_id=current_user["user_id"])
    if not experiment:
        raise NotFoundException("Experiment not found")

    job_id = experiment.get("job_id")
    job_details = None
    if job_id:
        job_details = JobService.get_job(job_id, user_id=current_user["user_id"])

    return {
        "experiment": experiment,
        "job": job_details
    }



