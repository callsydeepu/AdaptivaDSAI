from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
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
import os

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
def train_models(dataset_id: str):

    try:
        result = TrainingService.train_models(dataset_id)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Dataset not found"
            )

        return result

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=400,
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
            detail=f"Training failure: {str(e)}"
        )


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
def generate_report(dataset_id: str):

    try:
        result = ReportService.generate_report(dataset_id)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Dataset not found"
            )

        return result

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {str(e)}"
        )


@app.get("/reports/download/{dataset_id}")
def download_report(dataset_id: str):

    report_path = f"reports/{dataset_id}_report.pdf"

    if not os.path.exists(report_path):
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return FileResponse(
        report_path,
        media_type="application/pdf",
        filename=f"{dataset_id}_report.pdf"
    )