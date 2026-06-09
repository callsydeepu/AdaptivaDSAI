# Adaptive Data Science Assistant (ADSA)

## Vision

ADSA is an AI-powered Data Science Platform that behaves like a Junior Data Scientist.

The user uploads a dataset.

The system automatically:

* Understands the dataset
* Profiles the dataset
* Performs statistical analysis
* Performs EDA
* Detects ML problem type
* Recommends models
* Trains models
* Evaluates results
* Generates reports
* Provides AI explanations

---

# High Level Flow

User Uploads Dataset

↓

Dataset Storage

↓

Dataset Profiling

↓

Statistics Analysis

↓

EDA Analysis

↓

Problem Detection

↓

Feature Engineering

↓

Model Recommendation

↓

Model Training

↓

Model Evaluation

↓

Report Generation

↓

AI Copilot

---

# User Journey

## Step 1

Upload Dataset

Supported:

* CSV
* Excel

System stores:

* Dataset Metadata
* Dataset File

Output:

```json
{
  "dataset_id": "...",
  "rows": 1000,
  "columns": 20
}
```

---

## Step 2

Dataset Profiling

Detect:

* Missing Values
* Data Types
* Duplicate Rows
* Unique Values

Output:

```json
{
  "missing_values": {},
  "duplicates": 10,
  "column_types": {}
}
```

---

## Step 3

Statistics Analysis

Generate:

* Mean
* Median
* Mode
* Variance
* Standard Deviation

Output:

```json
{
  "Age": {
    "mean": 30,
    "std": 15
  }
}
```

---

## Step 4

EDA Analysis

Generate:

* Correlation Matrix
* Outliers
* Numeric Columns
* Categorical Columns

Output:

```json
{
  "correlation_matrix": {},
  "outliers": {}
}
```

---

## Step 5

Problem Detection

Determine:

* Classification
* Regression
* Clustering
* Time Series

Example:

Target:

Survived

Output:

```json
{
  "problem_type": "Classification"
}
```

---

## Step 6

Feature Engineering

Perform:

### Missing Values

* Mean Imputation
* Median Imputation
* Mode Imputation

### Encoding

* Label Encoding
* One Hot Encoding

### Scaling

* StandardScaler
* MinMaxScaler

Output:

```json
{
  "processed_dataset": true
}
```

---

## Step 7

Model Recommendation

Classification:

* Logistic Regression
* Random Forest
* XGBoost

Regression:

* Linear Regression
* Random Forest Regressor
* XGBoost Regressor

Clustering:

* KMeans
* DBSCAN

Output:

```json
{
  "recommended_models": []
}
```

---

## Step 8

Model Training

Train:

* Top Recommended Models

Perform:

* Train/Test Split
* Cross Validation

Store:

* Metrics
* Trained Model

---

## Step 9

Evaluation

Classification:

* Accuracy
* Precision
* Recall
* F1 Score
* ROC AUC

Regression:

* RMSE
* MAE
* R²

Store results.

---

## Step 10

Report Generation

Generate:

### PDF

Contains:

* Profiling
* Statistics
* EDA
* Model Results

Stored in:

reports/

---

# Backend Architecture

backend/

app/

api/
services/
repositories/
schemas/
models/
utils/
core/

---

# Service Responsibilities

DatasetService

Responsible for:

* Upload
* Metadata
* Dataset Retrieval

---

ProfilingService

Responsible for:

* Missing Values
* Data Types
* Duplicates

---

StatisticsService

Responsible for:

* Mean
* Median
* Variance

---

EDAService

Responsible for:

* Correlation
* Outliers

---

ProblemDetectionService

Responsible for:

* Determine ML problem

---

FeatureEngineeringService

Responsible for:

* Cleaning
* Encoding
* Scaling

---

ModelRecommendationService

Responsible for:

* Suggest Algorithms

---

TrainingService

Responsible for:

* Train Models

---

EvaluationService

Responsible for:

* Generate Metrics

---

ReportService

Responsible for:

* PDF Reports

---

# Frontend Pages

Dashboard

Upload Dataset

Data Profiling

Statistics

EDA

Problem Detection

Model Recommendation

Training

Reports

AI Copilot

Settings

---

# Dashboard KPIs

Datasets Uploaded

Models Trained

Best Accuracy

Generated Reports

Recent Activity

---

# Future AI Copilot

User Questions:

"Why is Fare important?"

"Which features affect survival?"

"Suggest a better model."

"Explain correlation matrix."

Powered By:

* LangChain
* RAG
* Vector Search

---

# Future AI Agents

Dataset Agent

EDA Agent

ML Agent

Report Agent

Research Agent

---

# Current Development Status

Completed:

* Dataset Upload
* Profiling
* Statistics
* EDA

Next:

1. Problem Detection
2. Feature Engineering
3. Model Recommendation
4. Model Training
5. Evaluation
6. Reports
7. MongoDB
8. Frontend Integration
9. AI Copilot

---

# Production Goal

User uploads dataset.

Within 1 click:

* Understand data
* Detect problem
* Train models
* Compare results
* Generate report
* Explain findings using AI

Exactly like a Junior Data Scientist.
