// Mock Data Service for Adaptive Data Science Assistant

export const mockKpis = [
  {
    id: "total-datasets",
    title: "Total Datasets",
    value: "1,422",
    change: "+12% vs LY",
    icon: "database",
    status: "success"
  },
  {
    id: "models-trained",
    title: "Models Trained",
    value: "84",
    change: "+5.2% vs LW",
    icon: "model_training",
    status: "success"
  },
  {
    id: "reports-generated",
    title: "Reports Generated",
    value: "12,059",
    change: "48 Pending",
    icon: "description",
    status: "pending"
  },
  {
    id: "analysis-accuracy",
    title: "Analysis Accuracy",
    value: "99.2%",
    change: "Stable",
    icon: "bolt",
    status: "stable"
  }
];

export const mockActivities = [
  {
    id: 1,
    title: 'Model "Zeta-9" deployed',
    meta: "2 mins ago • Production",
    icon: "check_circle",
    color: "text-tertiary-fixed bg-tertiary-container/20"
  },
  {
    id: 2,
    title: "New Dataset uploaded",
    meta: "14 mins ago • User Admin",
    icon: "upload_file",
    color: "text-primary-container bg-primary-container/10"
  },
  {
    id: 3,
    title: "Anomaly detected in Profiling",
    meta: "1 hour ago • Edge Case",
    icon: "warning",
    color: "text-error bg-error/20"
  },
  {
    id: 4,
    title: "Report export complete",
    meta: "3 hours ago • PDF Format",
    icon: "description",
    color: "text-on-surface-variant bg-surface-container-highest"
  }
];

export const mockRecommendations = [
  {
    title: "Optimize Zeta-9 weights to reduce latency by 15%",
    borderClass: "border-primary-container"
  },
  {
    title: "Merge 'Retail_2023' with 'Customer_Logs' for depth",
    borderClass: "border-tertiary-container"
  }
];

export const mockProfileData = {
  qualityScore: 94,
  totalRows: "1.2M",
  columns: "42",
  missingValues: "0.12%",
  duplicates: "0%",
  datasetName: "census_data_2024_v1.csv",
  lastUpdated: "2 minutes ago",
  sampleRows: [
    { id: "001", timestamp: "2024-10-21 09:12:44", userId: "UID_9921", region: "North America", interaction: "PURCHASE", value: "$1,240.00" },
    { id: "002", timestamp: "2024-10-21 09:14:12", userId: "UID_4452", region: "Europe", interaction: "VIEW", value: "$0.00" },
    { id: "003", timestamp: "2024-10-21 09:15:01", userId: "UID_1209", region: "Asia-Pacific", interaction: "CLICK", value: "$0.00" },
    { id: "004", timestamp: "2024-10-21 09:18:22", userId: "UID_3321", region: "North America", interaction: "PURCHASE", value: "$45.99" },
    { id: "005", timestamp: "2024-10-21 09:20:05", userId: "UID_0021", region: "South America", interaction: "REFUND", value: "($12.00)" }
  ],
  observations: [
    { text: "Data distribution for VALUE is normal with slight right-skew.", type: "success" },
    { text: "Recommend handling the 1.4% outlier frequency in REGION before training.", type: "tip" },
    { text: "USER_ID contains 42 high-cardinality values which may cause noise.", type: "warning" }
  ],
  columnsStats: [
    { name: "TIMESTAMP", type: "Datetime", min: "2024-01-01", max: "2024-12-31", metric: "Uniqueness: 99.8%", width: "98%" },
    { name: "VALUE", type: "Numeric", min: "Mean: 452.12", max: "Std Dev: 112.05", metric: "Missing: 1.2%", width: "85%", highlight: true },
    { name: "REGION", type: "Categorical", min: "Count: 1.2M", max: "Modes: 6 Categories", metric: "Missing: 0%", width: "100%" }
  ]
};

export const mockCandidates = [
  {
    name: "XGBoost (Optimized)",
    score: 96,
    recommended: true,
    description: "Superior performance on tabular data with handled missing values. Automatic feature interaction mapping included.",
    metrics: ["Gini: 0.88", "F1-Score: 0.92", "LogLoss: 0.12"]
  },
  {
    name: "LightGBM",
    score: 88,
    recommended: false,
    description: "Higher training efficiency for large datasets. Balanced for speed and moderate hardware constraints.",
    metrics: ["Gini: 0.84", "F1-Score: 0.89"]
  },
  {
    name: "Random Forest",
    score: 74,
    recommended: false,
    disabled: true,
    description: "Excellent baseline for interpretability but may overfit on the current sparse feature set.",
    metrics: ["Gini: 0.72"]
  }
];

export const mockCopilotContext = {
  datasetName: "active_users_q4.csv",
  schemaHealth: "98.4%",
  schemaHealthDelta: "+2.1%",
  schemaHealthText: "Schema consistency is high. 3 missing values detected in 'user_retention' column.",
  stats: [
    { title: "Correlation Peak", value: "0.82", desc: "Spend vs Lifetime", icon: "functions" },
    { title: "Outliers Found", value: "12", desc: "Detected in 'Purchase_Amt'", icon: "warning" }
  ],
  sampleRows: [
    { userId: "#US_921", date: "2023-10-12", revenue: "$142.00", region: "West" },
    { userId: "#EU_102", date: "2023-11-01", revenue: "$89.50", region: "North" },
    { userId: "#AS_443", date: "2023-11-05", revenue: "$210.00", region: "East" },
    { userId: "#US_221", date: "2023-11-12", revenue: "$12.20", region: "West" }
  ],
  actions: [
    { title: "Impute Missing Revenue", desc: "Found 4 null values. Suggesting median imputation based on Region." },
    { title: "Normalize 'Purchase_Amt'", desc: "Distribution is highly skewed. Z-score normalization recommended." }
  ]
};
