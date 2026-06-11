import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { QualityScoreGauge } from "../components/QualityScoreGauge";
import { DatasetPreviewTable } from "../components/DatasetPreviewTable";
import { useDataset } from "../contexts/DatasetContext";
import { useQuery } from "@tanstack/react-query";
import { analysisService } from "../services/analysisService";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

export function DataProfiling() {
  const navigate = useNavigate();
  const { currentDatasetId, currentDataset } = useDataset();
  const { user, requireAuth } = useContext(AuthContext);

  const isHousePricingDemo = currentDatasetId === "demo-house-pricing";
  const isDemoDataset = currentDatasetId === "demo-titanic-survival" || isHousePricingDemo;
  const enabledQuery = !!user && !!currentDatasetId && !isDemoDataset;

  // Mock data fallbacks for Demo Datasets
  const demoProfileTitanic = {
    rows: 891,
    columns: 12,
    missing_values: 866,
    duplicate_rows: 0
  };

  const demoStatsTitanic = {
    PassengerId: { min: 1, max: 891, mean: 446.00 },
    Age: { min: 0.42, max: 80.00, mean: 29.70 },
    SibSp: { min: 0, max: 8, mean: 0.52 },
    Parch: { min: 0, max: 6, mean: 0.38 },
    Fare: { min: 0, max: 512.33, mean: 32.20 }
  };

  const demoEdaTitanic = {
    outliers: { PassengerId: 0, Age: 7, SibSp: 12, Parch: 15, Fare: 116 },
    numeric_columns: ["PassengerId", "Age", "SibSp", "Parch", "Fare"],
    categorical_columns: ["Survived", "Pclass", "Name", "Sex", "Ticket", "Cabin", "Embarked"]
  };

  const demoPreviewTitanic = [
    { PassengerId: 1, Survived: 0, Pclass: 3, Name: "Braund, Mr. Owen Harris", Sex: "male", Age: 22 },
    { PassengerId: 2, Survived: 1, Pclass: 1, Name: "Cumings, Mrs. John Bradley", Sex: "female", Age: 38 },
    { PassengerId: 3, Survived: 1, Pclass: 3, Name: "Heikkinen, Miss. Laina", Sex: "female", Age: 26 },
    { PassengerId: 4, Survived: 1, Pclass: 1, Name: "Futrelle, Mrs. Jacques Heath", Sex: "female", Age: 35 },
    { PassengerId: 5, Survived: 0, Pclass: 3, Name: "Allen, Mr. William Henry", Sex: "male", Age: 35 }
  ];

  const demoProfileHouse = {
    rows: 1460,
    columns: 81,
    missing_values: 5960,
    duplicate_rows: 0
  };

  const demoStatsHouse = {
    Id: { min: 1, max: 1460, mean: 730.50 },
    MSSubClass: { min: 20, max: 190, mean: 56.90 },
    LotArea: { min: 1300, max: 215245, mean: 10516.80 },
    YearBuilt: { min: 1872, max: 2010, mean: 1971.26 },
    GrLivArea: { min: 334, max: 5642, mean: 1515.46 },
    FullBath: { min: 0, max: 3, mean: 1.56 },
    GarageCars: { min: 0, max: 4, mean: 1.77 },
    SalePrice: { min: 34900, max: 755000, mean: 180921.20 }
  };

  const demoEdaHouse = {
    outliers: { Id: 0, MSSubClass: 0, LotArea: 69, YearBuilt: 0, GrLivArea: 31, FullBath: 0, GarageCars: 0, SalePrice: 61 },
    numeric_columns: ["Id", "MSSubClass", "LotArea", "YearBuilt", "GrLivArea", "FullBath", "GarageCars", "SalePrice"],
    categorical_columns: ["MSZoning", "Street", "Alley", "LotShape", "LandContour", "Utilities", "LotConfig"]
  };

  const demoPreviewHouse = [
    { Id: 1, MSSubClass: 60, MSZoning: "RL", LotArea: 8450, SalePrice: 208500 },
    { Id: 2, MSSubClass: 20, MSZoning: "RL", LotArea: 9600, SalePrice: 181500 },
    { Id: 3, MSSubClass: 60, MSZoning: "RL", LotArea: 11250, SalePrice: 223500 },
    { Id: 4, MSSubClass: 70, MSZoning: "RL", LotArea: 9550, SalePrice: 140000 },
    { Id: 5, MSSubClass: 60, MSZoning: "RL", LotArea: 14260, SalePrice: 250000 }
  ];

  // Queries
  const { data: serverProfile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ["profiling", currentDatasetId],
    queryFn: () => analysisService.getProfiling(currentDatasetId),
    enabled: enabledQuery,
  });

  const { data: serverStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["statistics", currentDatasetId],
    queryFn: () => analysisService.getStatistics(currentDatasetId),
    enabled: enabledQuery,
  });

  const { data: serverEda, isLoading: isEdaLoading } = useQuery({
    queryKey: ["eda", currentDatasetId],
    queryFn: () => analysisService.getEDA(currentDatasetId),
    enabled: enabledQuery,
  });

  const { data: serverPreview, isLoading: isPreviewLoading } = useQuery({
    queryKey: ["preview", currentDatasetId],
    queryFn: async () => {
      const response = await api.get(`/datasets/${currentDatasetId}/preview`);
      return response.data;
    },
    enabled: enabledQuery,
  });

  if (!currentDatasetId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 glass-card rounded-2xl p-8">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">analytics</span>
        <h2 className="font-headline-sm text-white">No Dataset Selected</h2>
        <p className="text-on-surface-variant max-w-sm text-sm">
          Please upload or select a dataset on the Dashboard to view its data profile and analytics.
        </p>
        <button 
          onClick={() => navigate("/upload")}
          className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg text-body-sm font-bold hover:bg-accent-hover active:scale-95 transition-all"
        >
          Upload Dataset
        </button>
      </div>
    );
  }

  const isLoading = enabledQuery && (isProfileLoading || isStatsLoading || isEdaLoading || isPreviewLoading);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant text-body-sm">Analyzing dataset structure, computing correlations, and building profiles...</p>
      </div>
    );
  }

  if (enabledQuery && (profileError || !serverProfile)) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center max-w-lg mx-auto">
        <span className="material-symbols-outlined text-4xl text-error">error</span>
        <h3 className="font-headline-sm text-white">Profiling Analysis Failed</h3>
        <p className="text-on-surface-variant text-sm">
          There was an error profiling this dataset. Please ensure the file is a valid CSV and is not empty.
        </p>
        <button 
          onClick={() => navigate("/")}
          className="bg-transparent border border-on-surface/20 text-on-surface px-6 py-2 rounded-lg text-body-sm font-medium hover:bg-surface-container-high transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const profile = enabledQuery ? serverProfile : (isHousePricingDemo ? demoProfileHouse : demoProfileTitanic);
  const stats = enabledQuery ? serverStats : (isHousePricingDemo ? demoStatsHouse : demoStatsTitanic);
  const eda = enabledQuery ? serverEda : (isHousePricingDemo ? demoEdaHouse : demoEdaTitanic);
  const preview = enabledQuery ? serverPreview : (isHousePricingDemo ? demoPreviewHouse : demoPreviewTitanic);

  // Quality score formula
  const missingCellRatio = profile.missing_values / (profile.rows * profile.columns || 1);
  const duplicateRatio = profile.duplicate_rows / (profile.rows || 1);
  const qualityScore = Math.max(0, Math.round(100 - (missingCellRatio * 50) - (duplicateRatio * 50)));

  // Dynamic observations
  const observations = [];
  const missingPercent = ((profile.missing_values / (profile.rows * profile.columns || 1)) * 100).toFixed(2);
  
  if (profile.missing_values === 0) {
    observations.push({ text: "Perfect integrity! No missing values detected in the dataset.", type: "success" });
  } else {
    observations.push({ text: `Missing values detected: ${profile.missing_values.toLocaleString()} values (${missingPercent}% of cells). Imputation will be applied.`, type: "warning" });
  }

  if (profile.duplicate_rows === 0) {
    observations.push({ text: "Excellent! No duplicate rows found in this dataset.", type: "success" });
  } else {
    const dupPercent = ((profile.duplicate_rows / profile.rows) * 100).toFixed(1);
    observations.push({ text: `Found ${profile.duplicate_rows.toLocaleString()} duplicate rows (${dupPercent}%). They will be dropped automatically.`, type: "tip" });
  }

  if (eda) {
    const totalOutliers = Object.values(eda.outliers).reduce((a, b) => a + b, 0);
    if (totalOutliers > 0) {
      observations.push({ text: `Detected ${totalOutliers.toLocaleString()} outliers across numeric features. Review column metrics to examine details.`, type: "tip" });
    } else {
      observations.push({ text: "No outliers detected in the numeric columns of the dataset.", type: "success" });
    }
  }

  // Dynamic Column breakdowns
  const columnsStats = [];
  if (eda) {
    eda.numeric_columns.forEach((colName) => {
      const colStats = stats?.[colName] || {};
      const outlierCount = eda.outliers?.[colName] || 0;
      columnsStats.push({
        name: colName,
        type: "Numeric",
        min: `Min: ${colStats.min !== undefined ? colStats.min.toFixed(2) : "N/A"}`,
        max: `Max: ${colStats.max !== undefined ? colStats.max.toFixed(2) : "N/A"}`,
        metric: `Mean: ${colStats.mean !== undefined ? colStats.mean.toFixed(2) : "N/A"} | Outliers: ${outlierCount}`,
        width: "85%",
        highlight: outlierCount > 0,
      });
    });

    eda.categorical_columns.forEach((colName) => {
      columnsStats.push({
        name: colName,
        type: "Categorical",
        min: "N/A",
        max: "N/A",
        metric: "Categorical Column",
        width: "100%",
        highlight: false,
      });
    });
  }

  const renderHeatmap = () => {
    if (enabledQuery) {
      return (
        <div className="aspect-square bg-surface-container rounded-lg overflow-hidden relative flex items-center justify-center border border-border-subtle/50 shadow-inner">
          <img 
            className="w-full h-full object-cover" 
            alt="A sophisticated dark-themed correlation heatmap visualization."
            src={`${api.defaults.baseURL || "http://localhost:8000"}/datasets/${currentDatasetId}/correlation-plot`}
          />
          <div 
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[2px]"
          >
            <a
              href={`${api.defaults.baseURL || "http://localhost:8000"}/datasets/${currentDatasetId}/correlation-plot`}
              target="_blank"
              rel="noreferrer"
              className="bg-primary-container text-on-primary-container px-4 py-2 rounded-full font-bold text-label-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">zoom_in</span>
              Open Full Matrix
            </a>
          </div>
        </div>
      );
    }

    const cols = isHousePricingDemo 
      ? ["Id", "LotArea", "GrLivArea", "GarageCars", "SalePrice"]
      : ["PassengerId", "Survived", "Pclass", "Age", "Fare"];
    
    const matrix = isHousePricingDemo ? [
      [1.0, 0.07, 0.08, 0.16, -0.02],
      [0.07, 1.0, 0.26, 0.15, 0.26],
      [0.08, 0.26, 1.0, 0.47, 0.71],
      [0.16, 0.15, 0.47, 1.0, 0.64],
      [-0.02, 0.26, 0.71, 0.64, 1.0]
    ] : [
      [1.0, -0.01, -0.04, 0.04, 0.01],
      [-0.01, 1.0, -0.34, -0.08, 0.26],
      [-0.04, -0.34, 1.0, -0.37, -0.55],
      [0.04, -0.08, -0.37, 1.0, 0.10],
      [0.01, 0.26, -0.55, 0.10, 1.0]
    ];

    const getColorClass = (val) => {
      if (val === 1.0) return "bg-[#ffe251] text-black font-bold";
      if (val > 0.6) return "bg-[#ffe251]/80 text-black";
      if (val > 0.3) return "bg-[#ffe251]/50 text-white";
      if (val > 0.1) return "bg-[#ffe251]/20 text-white/80";
      if (val > -0.1) return "bg-surface-container-highest text-white/50";
      if (val > -0.3) return "bg-[#ea4335]/25 text-white/80";
      if (val > -0.6) return "bg-[#ea4335]/50 text-white";
      return "bg-[#ea4335]/80 text-white";
    };

    return (
      <div className="aspect-square bg-surface-container rounded-lg p-3 flex flex-col justify-between border border-border-subtle/50 shadow-inner relative group">
        <div className="grid grid-cols-6 gap-1 h-full w-full text-[9px] font-mono">
          <div className="flex items-center justify-center text-on-surface-variant font-bold truncate"></div>
          {cols.map(c => (
            <div key={c} className="flex items-center justify-center text-on-surface-variant font-bold text-center truncate select-none" title={c}>
              {c.substring(0, 4)}
            </div>
          ))}

          {cols.map((rowName, rIdx) => (
            <React.Fragment key={rowName}>
              <div className="flex items-center text-on-surface-variant font-bold truncate pr-1 select-none" title={rowName}>
                {rowName.substring(0, 4)}
              </div>
              {matrix[rIdx].map((val, cIdx) => (
                <div key={cIdx} className={`rounded flex items-center justify-center transition-all ${getColorClass(val)}`} title={`${rowName} vs ${cols[cIdx]}: ${val}`}>
                  {val.toFixed(2)}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] rounded-lg p-4 text-center">
          <p className="text-white text-xs font-bold mb-2">Interactive Correlation Heatmap</p>
          <button
            onClick={() => requireAuth(() => {}, "view_correlation")}
            className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full font-bold text-[11px] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">zoom_in</span>
            Sign In to Unlock
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-subtle/30 pb-6">
        <div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary-fixed mb-2">
            Data Profiling
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Analyzing <span className="text-primary font-bold">{currentDataset?.filename}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate('/reports')}
            className="bg-surface-container-high border border-border-subtle px-4 py-2.5 rounded-lg text-body-sm font-medium hover:bg-surface-container-highest active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Compile Report
          </button>
          <button 
            onClick={() => navigate('/models')}
            className="bg-primary-container text-on-primary-container px-4 py-2.5 rounded-lg text-body-sm font-bold hover:bg-accent-hover active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">model_training</span>
            Model Specs
          </button>
        </div>
      </header>

      {/* KPI stats grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {/* Quality Score gauge card */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 flex items-center justify-between overflow-hidden relative border border-border-subtle/55 shadow-md">
          <div className="z-10">
            <p className="font-label-md text-on-surface-variant uppercase tracking-widest mb-1 text-xs">Quality Score</p>
            <h2 className="font-display-lg text-primary-fixed text-display-lg-mobile mb-1">
              {qualityScore}%
            </h2>
            <p className="text-body-sm text-green-400 flex items-center gap-1 text-xs whitespace-nowrap">
              <span className="material-symbols-outlined text-sm">trending_up</span> Stable
            </p>
          </div>
          <QualityScoreGauge score={qualityScore} />
          <div className="absolute top-0 right-0 w-32 h-full shimmer-ai opacity-30 pointer-events-none"></div>
        </div>

        {/* Row Count */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between border-l-4 border-l-primary-container">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-4">table_rows</span>
          <div>
            <p className="font-label-md text-on-surface-variant uppercase tracking-tighter text-xs">Total Rows</p>
            <h3 className="font-display-lg text-white text-headline-sm">{profile.rows.toLocaleString()}</h3>
          </div>
        </div>

        {/* Columns Count */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-4">view_column</span>
          <div>
            <p className="font-label-md text-on-surface-variant uppercase tracking-tighter text-xs">Columns</p>
            <h3 className="font-display-lg text-white text-headline-sm">{profile.columns}</h3>
          </div>
        </div>

        {/* Missing fields */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-4 text-orange-400">warning</span>
          <div>
            <p className="font-label-md text-on-surface-variant uppercase tracking-tighter text-xs">Missing Values</p>
            <h3 className="font-display-lg text-white text-headline-sm">{profile.missing_values.toLocaleString()}</h3>
          </div>
        </div>

        {/* Duplicates */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-4 text-primary-container">content_copy</span>
          <div>
            <p className="font-label-md text-on-surface-variant uppercase tracking-tighter text-xs">Duplicates</p>
            <h3 className="font-display-lg text-white text-headline-sm">{profile.duplicate_rows.toLocaleString()}</h3>
          </div>
        </div>
      </section>

      {/* Bento Layout section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table preview */}
        <div className="lg:col-span-8 flex flex-col">
          <DatasetPreviewTable type="profiling" data={preview} />
        </div>

        {/* Sidebar observations and heatmaps */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI observations */}
          <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                <h4 className="font-headline-sm text-white">AI Observations</h4>
              </div>
              <ul className="space-y-4">
                {observations.map((obs, idx) => {
                  const getIcon = (type) => {
                    if (type === "success") return <span className="material-symbols-outlined text-green-400 mt-0.5">check_circle</span>;
                    if (type === "tip") return <span className="material-symbols-outlined text-primary-container mt-0.5">lightbulb</span>;
                    return <span className="material-symbols-outlined text-orange-400 mt-0.5">info</span>;
                  };

                  return (
                    <li key={idx} className="flex gap-3 items-start text-xs sm:text-sm">
                      {getIcon(obs.type)}
                      <p className="text-body-sm text-on-surface leading-normal">{obs.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Correlation Heatmap */}
          <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-label-md text-on-surface-variant uppercase tracking-widest text-xs">
                  Correlation Heatmap
                </h4>
                <button 
                  onClick={() => {
                    requireAuth(() => {
                      window.open(`${api.defaults.baseURL || "http://localhost:8000"}/datasets/${currentDatasetId}/correlation-plot`, '_blank');
                    }, "download_correlation");
                  }}
                  className="text-primary-fixed hover:text-white flex items-center gap-1 text-[11px] font-bold transition-all bg-transparent border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download Matrix
                </button>
              </div>
              {renderHeatmap()}
            </div>
          </div>
        </div>
      </section>

      {/* Column Breakdowns */}
      <section className="space-y-6">
        <h4 className="font-headline-sm text-white">Column Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {columnsStats.map((col, idx) => (
            <div 
              key={idx} 
              className={`glass-panel rounded-xl p-5 border-t-2 ${
                col.highlight ? "border-t-primary-container" : "border-t-border-subtle"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h5 className="font-body-md font-bold text-white text-sm sm:text-base">{col.name}</h5>
                  <span className="text-[10px] text-on-surface-variant font-mono uppercase bg-surface-container-highest px-2 py-0.5 rounded mt-1 inline-block">
                    {col.type}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body-sm text-xs sm:text-sm">
                  <span className="text-on-surface-variant">Min / Count:</span>
                  <span className="text-white font-mono">{col.min}</span>
                </div>
                <div className="flex justify-between text-body-sm text-xs sm:text-sm">
                  <span className="text-on-surface-variant">Max / Modes:</span>
                  <span className="text-white font-mono">{col.max}</span>
                </div>
                <div className="flex justify-between text-body-sm text-xs sm:text-sm">
                  <span className="text-on-surface-variant">Metrics:</span>
                  <span className={`font-mono ${col.highlight ? "text-orange-400" : "text-white"}`}>
                    {col.metric}
                  </span>
                </div>
              </div>
              
              <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-container transition-all duration-1000" 
                  style={{ width: col.width }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
