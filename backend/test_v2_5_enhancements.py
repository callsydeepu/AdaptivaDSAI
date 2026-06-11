import sys
import os
import time
import io

# Add backend and backend/app directories to the python path
sys.path.append(r"c:\Users\WELCOME\Desktop\AdaptiveDSAI\backend")
sys.path.append(r"c:\Users\WELCOME\Desktop\AdaptiveDSAI\backend\app")

from services.dataset_service import DatasetService
from fastapi.testclient import TestClient
from main import app
from auth.jwt_service import JWTService

client = TestClient(app)

token = JWTService.create_access_token(user_id="test_user_id", email="test@example.com", provider="local")
headers = {"Authorization": f"Bearer {token}"}

# Global test dataset
dataset_id = None

def setup_test_dataset():
    global dataset_id
    print("Uploading test dataset...")
    csv_content = "feature_1,feature_2,target\n" + "\n".join(f"{float(i)},{float(i*2)},{float(i*10)}" for i in range(1, 21))
    file_like = io.BytesIO(csv_content.encode("utf-8"))
    
    res = client.post(
        "/upload",
        files={"file": ("test_auth_dataset.csv", file_like, "text/csv")},
        headers=headers
    )
    assert res.status_code == 200, f"Upload failed with {res.status_code}: {res.text}"
    data = res.json()
    dataset_id = data["dataset_id"]
    print(f"Uploaded dataset successfully, ID: {dataset_id}")

def test_correlation_plot():
    global dataset_id
    print("Testing /datasets/{dataset_id}/correlation-plot endpoint...")
    res = client.get(f"/datasets/{dataset_id}/correlation-plot", headers=headers)
    assert res.status_code == 200, f"Correlation plot failed with status {res.status_code}"
    assert res.headers["content-type"] == "image/png", f"Unexpected content-type: {res.headers['content-type']}"
    print(f"Correlation plot endpoint verified! PNG size: {len(res.content)} bytes")

def test_custom_hyperparameters():
    global dataset_id
    print("\nTesting Custom Experiment with customized Hyperparameters...")
    
    # 1. Fetch available columns
    res = client.get(f"/datasets/{dataset_id}/columns", headers=headers)
    assert res.status_code == 200
    columns = res.json()["columns"]
    target_column = "target"
    
    # 2. Trigger Custom Experiment with Hyperparameters
    payload = {
        "dataset_id": dataset_id,
        "target_column": target_column,
        "split_ratio": 0.8,
        "imputation_strategy": "median",
        "selected_models": ["RandomForestRegressor", "LinearRegression"],
        "outlier_threshold": 3.0,
        "hyperparameters": {
            "RandomForestRegressor": {
                "n_estimators": 50,
                "max_depth": 5
            },
            "LinearRegression": {
                "fit_intercept": False
            }
        }
    }
    
    res = client.post("/experiments", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    experiment_id = data["experiment_id"]
    
    # Poll status
    status = "pending"
    for attempt in range(15):
        res = client.get(f"/experiments/status/{experiment_id}", headers=headers)
        assert res.status_code == 200
        status_data = res.json()
        status = status_data["experiment"]["status"]
        if status in ["completed", "failed"]:
            break
        time.sleep(2)
        
    assert status == "completed", f"Experiment failed or timed out. Status: {status}"
    
    # Check that joblib model has the correct n_estimators and max_depth
    import joblib
    model_path = f"trained_models/{dataset_id}_{experiment_id}_RandomForestRegressor.pkl"
    assert os.path.exists(model_path), "RandomForestRegressor model file missing!"
    
    model = joblib.load(model_path)
    print(f"Loaded RandomForestRegressor params: {model.get_params()}")
    assert model.n_estimators == 50, f"Expected n_estimators=50, got {model.n_estimators}"
    assert model.max_depth == 5, f"Expected max_depth=5, got {model.max_depth}"
    
    lr_model_path = f"trained_models/{dataset_id}_{experiment_id}_LinearRegression.pkl"
    assert os.path.exists(lr_model_path), "LinearRegression model file missing!"
    lr_model = joblib.load(lr_model_path)
    print(f"Loaded LinearRegression params: {lr_model.get_params()}")
    assert lr_model.fit_intercept is False, "Expected fit_intercept to be False"
    
    print("Hyperparameter tuning successfully verified on the backend!")

def cleanup_test_dataset():
    global dataset_id
    if dataset_id:
        print(f"Deleting test dataset {dataset_id}...")
        res = client.delete(f"/datasets/{dataset_id}", headers=headers)
        assert res.status_code == 200, f"Failed to delete test dataset: {res.text}"
        print("Test dataset cleaned up successfully.")

if __name__ == "__main__":
    setup_test_dataset()
    try:
        test_correlation_plot()
        test_custom_hyperparameters()
    finally:
        cleanup_test_dataset()
