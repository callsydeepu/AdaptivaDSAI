import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { KPICard } from "../components/KPICard";
import { PerformanceChart } from "../components/PerformanceChart";
import { RecentActivity } from "../components/RecentActivity";
import { useDataset } from "../contexts/DatasetContext";
import { useCopilot } from "../components/copilot/CopilotContext";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { datasets, currentDatasetId, selectDataset } = useDataset();
  const { setIsCopilotOpen, setInputVal } = useCopilot();
  const { user, requireAuth } = useContext(AuthContext);

  const demoOverview = {
    total_datasets: 2,
    total_models: 4,
    total_reports: 1,
    total_conversations: 5,
    running_jobs: 0,
    completed_jobs: 4,
    failed_jobs: 0
  };

  const demoEvaluation = {
    best_model: "RandomForestClassifier",
    best_score: 0.945,
    problem_type: "Classification"
  };

  const demoInsights = {
    rating: "Good",
    score: 87,
    duplicates: 0,
    missing: 4,
    outliers: 2,
    insights: [
      "No duplicate rows detected. Data integrity is intact.",
      "A total of 4 missing cells were auto-imputed using feature medians.",
      "Found 2 outlier values in column 'Age', which were automatically clipped.",
      "The task is identified as Binary Classification suitable for tree models.",
      "Best performing model trained is RandomForestClassifier with 94.5% accuracy."
    ]
  };

  const demoReports = [
    {
      dataset_id: "demo-titanic-survival",
      filename: "titanic_survival_demo.csv",
      report_path: "reports/demo_titanic_report.pdf",
      generated_at: new Date().toISOString()
    }
  ];

  const demoPreview = [
    { PassengerId: 1, Survived: 0, Pclass: 3, Name: "Braund, Mr. Owen Harris", Sex: "male", Age: 22 },
    { PassengerId: 2, Survived: 1, Pclass: 1, Name: "Cumings, Mrs. John Bradley", Sex: "female", Age: 38 },
    { PassengerId: 3, Survived: 1, Pclass: 3, Name: "Heikkinen, Miss. Laina", Sex: "female", Age: 26 },
    { PassengerId: 4, Survived: 1, Pclass: 1, Name: "Futrelle, Mrs. Jacques Heath", Sex: "female", Age: 35 },
    { PassengerId: 5, Survived: 0, Pclass: 3, Name: "Allen, Mr. William Henry", Sex: "male", Age: 35 }
  ];

  const demoHousePricingEvaluation = {
    best_model: "RandomForestRegressor",
    best_score: 0.892,
    problem_type: "Regression"
  };

  const demoHousePricingInsights = {
    rating: "Good",
    score: 83,
    duplicates: 0,
    missing: 15,
    outliers: 8,
    insights: [
      "No duplicate rows detected. Data integrity is intact.",
      "A total of 15 missing cells were auto-imputed using column medians.",
      "Found 8 outlier values in 'LotArea' which were clamped.",
      "Task is identified as Regression suitable for tree-based ensemble models.",
      "Best performing model trained is RandomForestRegressor with 89.2% R2 score."
    ]
  };

  const demoHousePricingPreview = [
    { Id: 1, MSSubClass: 60, MSZoning: "RL", LotArea: 8450, SalePrice: 208500 },
    { Id: 2, MSSubClass: 20, MSZoning: "RL", LotArea: 9600, SalePrice: 181500 },
    { Id: 3, MSSubClass: 60, MSZoning: "RL", LotArea: 11250, SalePrice: 223500 },
    { Id: 4, MSSubClass: 70, MSZoning: "RL", LotArea: 9550, SalePrice: 140000 },
    { Id: 5, MSSubClass: 60, MSZoning: "RL", LotArea: 14260, SalePrice: 250000 }
  ];

  // 1. Fetch dashboard overview stats
  const { data: serverOverview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const response = await api.get("/dashboard/overview");
      return response.data;
    },
    refetchInterval: 5000,
    enabled: !!user,
  });
  const overview = user ? (serverOverview || {
    total_datasets: 0,
    total_models: 0,
    total_reports: 0,
    total_conversations: 0,
    running_jobs: 0,
    completed_jobs: 0,
    failed_jobs: 0
  }) : demoOverview;

  // 2. Fetch evaluation results for active dataset (Best Model Widget)
  const { data: serverEvaluation, error: evaluationError, isLoading: isEvaluationLoading } = useQuery({
    queryKey: ["evaluation", currentDatasetId],
    queryFn: async () => {
      if (!currentDatasetId) return null;
      const response = await api.get(`/evaluation/${currentDatasetId}`);
      return response.data;
    },
    enabled: !!user && !!currentDatasetId && currentDatasetId !== "demo-titanic-survival" && currentDatasetId !== "demo-house-pricing",
    retry: false,
  });
  
  const isHousePricingDemo = currentDatasetId === "demo-house-pricing";
  const evaluation = user ? serverEvaluation : (isHousePricingDemo ? demoHousePricingEvaluation : demoEvaluation);

  // 3. Fetch insights for active dataset (Data Quality and AI Insights)
  const { data: serverInsights, isLoading: isInsightsLoading } = useQuery({
    queryKey: ["insights", currentDatasetId],
    queryFn: async () => {
      if (!currentDatasetId) return null;
      const response = await api.get(`/datasets/${currentDatasetId}/insights`);
      return response.data;
    },
    enabled: !!user && !!currentDatasetId && currentDatasetId !== "demo-titanic-survival" && currentDatasetId !== "demo-house-pricing",
  });
  const insightsData = user ? serverInsights : (isHousePricingDemo ? demoHousePricingInsights : demoInsights);

  // 4. Fetch all generated reports
  const { data: serverReports, isLoading: isReportsLoading } = useQuery({
    queryKey: ["all-reports"],
    queryFn: async () => {
      const response = await api.get("/reports");
      return response.data;
    },
    refetchInterval: 5000,
    enabled: !!user,
  });
  const reports = user ? (serverReports || []) : demoReports;

  // 5. Fetch preview data for active dataset (Dataset Preview)
  const { data: serverPreview, isLoading: isPreviewLoading } = useQuery({
    queryKey: ["dataset-preview", currentDatasetId],
    queryFn: async () => {
      if (!currentDatasetId) return [];
      const response = await api.get(`/datasets/${currentDatasetId}/preview`);
      return response.data;
    },
    enabled: !!user && !!currentDatasetId && currentDatasetId !== "demo-titanic-survival" && currentDatasetId !== "demo-house-pricing",
  });
  const preview = user ? (serverPreview || []) : (isHousePricingDemo ? demoHousePricingPreview : demoPreview);

  const totalDatasets = datasets.length;

  return (
    <div className="space-y-12">
      {/* Header section with active dataset selector */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border-subtle/30 pb-6">
        <div>
          <h1 className="font-display-lg text-headline-md text-primary-fixed mb-1">
            Dashboard
          </h1>
          <p className="text-on-surface-variant text-body-sm">
            Overview of automated analysis pipeline and model operations.
          </p>
        </div>
        {totalDatasets > 0 && (
          <div className="flex items-center gap-3">
            <label htmlFor="dataset-select" className="text-body-sm font-medium text-on-surface-variant whitespace-nowrap">
              Active Dataset:
            </label>
            <select
              id="dataset-select"
              value={currentDatasetId || ""}
              onChange={(e) => selectDataset(e.target.value)}
              className="bg-surface-container border border-border-subtle px-4 py-2.5 rounded-lg text-body-sm font-medium text-white focus:outline-none focus:border-primary-container cursor-pointer"
            >
              <option value="" disabled>Select a dataset...</option>
              {datasets.map((d) => (
                <option key={d.dataset_id} value={d.dataset_id}>
                  {d.filename}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden min-h-[360px] flex items-center shadow-2xl">
        <img 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.3] contrast-[1.1]" 
          alt="A sophisticated data visualization dashboard showing interconnected neural networks."
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLiLqXrnF8aLVXklKSlSeqAJwYnaaWgJl0C7pDlwFiX0wUpJ8nXzdygqH98wR3Qjo8y1P3jiz5eZmVCJjoDBDRKZg6T9b00tHjxhULh_zc_lcwywWH6UEloxetz__J1FcG9MViR_xgjiyKgpirQ2mt6Og9UT5QdlsXcU7y3nIfM3yCJVbzJ7t2oSjkLrdxb3D6XCwhmciIu18e6foUfPcQY89Dv-DpvrsUVxSlJGufcvUm_ZP31BzE_Xao9OBKnmuAj9cpmyngPgo"
        />
        <div className="relative z-10 p-6 sm:p-10 md:p-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full mb-6">
            <span className="material-symbols-outlined text-primary-container text-sm animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <span className="text-primary-container font-label-md uppercase tracking-wider text-xs font-semibold">
              Next Gen Intelligence
            </span>
          </div>
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-4 leading-tight">
            Transform Raw Data Into <span className="text-primary-container italic">Intelligent Insights</span>
          </h2>
          <p className="text-on-surface-variant font-body-lg mb-10 max-w-xl text-sm sm:text-base">
            Harness the power of adaptive machine learning to profile, analyze, and deploy predictive models with unprecedented precision and speed.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => requireAuth(() => navigate('/upload'), "upload")}
              className="bg-primary-container text-on-primary-container px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold hover:bg-accent-hover active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">cloud_upload</span>
              Upload Dataset
            </button>
          </div>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <KPICard
          title="Total Datasets"
          value={overview.total_datasets.toString()}
          change="Uploaded datasets"
          icon="database"
          status="success"
        />
        <KPICard
          title="Models Trained"
          value={overview.total_models.toString()}
          change={`${overview.completed_jobs} completed`}
          icon="model_training"
          status="success"
        />
        <KPICard
          title="Reports Generated"
          value={overview.total_reports.toString()}
          change="Generated PDF files"
          icon="description"
          status="pending"
        />
        <KPICard
          title="Copilot Chats"
          value={overview.total_conversations.toString()}
          change="AI user queries"
          icon="chat"
          status="stable"
        />
      </section>

      {/* Bento Analytics Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Performance Chart */}
        <PerformanceChart />
        
        {/* Recent Activity Logs */}
        <RecentActivity />
      </section>

      {/* Active Dataset Insights section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {/* Data Quality Widget */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between min-h-[300px]">
          <div>
            <h5 className="text-primary font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
              <span className="material-symbols-outlined text-primary-container">fact_check</span>
              Data Quality Analytics
            </h5>
            
            {currentDatasetId ? (
              isInsightsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : insightsData ? (
                <div className="space-y-5">
                  {/* Score & Rating badge */}
                  <div className="flex items-center justify-between p-4 bg-surface-container/60 rounded-xl border border-border-subtle/40">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Consolidated Score</span>
                      <span className="text-2xl font-display-lg font-bold text-white mt-1">
                        {insightsData.data_quality_score} <span className="text-xs text-on-surface-variant">/ 100</span>
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-primary-container/10 border border-primary-container/20 rounded-lg text-primary text-xs font-bold tracking-wider uppercase ai-glow">
                      {insightsData.quality_rating}
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-surface-container-low rounded-xl text-center border border-border-subtle/20">
                      <span className="text-lg font-bold text-white font-mono">{insightsData.missing_values || 0}</span>
                      <p className="text-[9px] uppercase tracking-wider text-on-surface-variant mt-1">Missing</p>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl text-center border border-border-subtle/20">
                      <span className="text-lg font-bold text-white font-mono">{insightsData.duplicate_rows || 0}</span>
                      <p className="text-[9px] uppercase tracking-wider text-on-surface-variant mt-1">Duplicates</p>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl text-center border border-border-subtle/20">
                      <span className="text-lg font-bold text-white font-mono">{insightsData.outliers_count || 0}</span>
                      <p className="text-[9px] uppercase tracking-wider text-on-surface-variant mt-1">Outliers</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-on-surface-variant text-xs font-mono">No insights available.</div>
              )
            ) : (
              <div className="text-center py-12 text-on-surface-variant text-xs">Please upload or select a dataset first.</div>
            )}
          </div>
        </div>

        {/* Best Model Widget */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between min-h-[300px]">
          <div>
            <h5 className="text-primary font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
              <span className="material-symbols-outlined text-primary-container">military_tech</span>
              Best Performing Model
            </h5>
            
            {currentDatasetId ? (
              isEvaluationLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : evaluation ? (
                <div className="space-y-4">
                  <div className="p-4 bg-surface-container/60 rounded-xl border border-border-subtle/40">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Best algorithm</span>
                    <h6 className="text-white font-bold text-base mt-1 truncate">{evaluation.best_model || "None"}</h6>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-border-subtle/20">
                    <span className="text-xs font-semibold text-on-surface-variant">Performance Score</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {evaluation.problem_type === "Classification" 
                        ? `Accuracy: ${(evaluation.detailed_results?.[evaluation.best_model]?.metrics?.accuracy * 100).toFixed(1)}%`
                        : `R² Score: ${evaluation.detailed_results?.[evaluation.best_model]?.metrics?.r2_score?.toFixed(3)}`}
                    </span>
                  </div>

                  <button 
                    onClick={() => navigate('/training')}
                    className="w-full py-2.5 bg-primary-container/10 border border-primary-container/20 rounded-xl text-primary text-xs font-bold hover:bg-primary-container/20 transition-all active:scale-95"
                  >
                    View Model Training logs
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center h-full">
                  <p className="text-xs text-on-surface-variant">No trained models found for this dataset.</p>
                  <button 
                    onClick={() => navigate('/models')}
                    className="bg-primary-container hover:bg-accent-hover text-on-primary-container font-bold px-4 py-2.5 rounded-lg text-xs transition-all active:scale-95"
                  >
                    Train Recommended Models
                  </button>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-on-surface-variant text-xs">Please upload or select a dataset first.</div>
            )}
          </div>
        </div>

        {/* AI Insights Bullet Panel */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between min-h-[300px]">
          <div className="flex flex-col h-full w-full">
            <h5 className="text-primary font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
              <span className="material-symbols-outlined text-primary-container">psychology</span>
              AI Insights
            </h5>
            
            {currentDatasetId ? (
              isInsightsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : insightsData && insightsData.insights?.length > 0 ? (
                <div className="flex-grow overflow-y-auto max-h-[180px] custom-scrollbar pr-1">
                  <ul className="space-y-3">
                    {insightsData.insights.map((ins, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start bg-surface-container/30 p-2.5 rounded-lg border border-border-subtle/20">
                        <span className="text-primary-container select-none text-xs mt-0.5">•</span>
                        <span className="text-xs text-on-surface leading-normal">{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12 text-on-surface-variant text-xs font-mono">No insights generated.</div>
              )
            ) : (
              <div className="text-center py-12 text-on-surface-variant text-xs">Please upload or select a dataset first.</div>
            )}
          </div>
        </div>
      </section>

      {/* Dataset Preview Section */}
      {currentDatasetId && (
        <section className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-primary font-bold flex items-center gap-2 text-sm sm:text-base">
              <span className="material-symbols-outlined text-primary-container">table_chart</span>
              Dataset Preview ({datasets.find(d => d.dataset_id === currentDatasetId)?.filename})
            </h5>
            <button 
              onClick={() => navigate('/profiling')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Go to Full Profiling
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {isPreviewLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : preview.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border-subtle/50 bg-[#0c0d12] custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container border-b border-border-subtle/60 text-primary font-bold">
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key} className="px-4 py-3 select-none whitespace-nowrap">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/20 text-on-surface/90 font-mono">
                  {preview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      {Object.values(row).map((val, colIdx) => (
                        <td key={colIdx} className="px-4 py-3 truncate max-w-xs">{val.toString()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-on-surface-variant text-xs">
              No preview data loaded.
            </div>
          )}
        </section>
      )}

      {/* Platform Operations Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {/* Recent Datasets Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col min-h-[350px]">
          <h5 className="text-primary font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
            <span className="material-symbols-outlined text-primary-container">list_alt</span>
            Recent Datasets
          </h5>
          <div className="flex-grow overflow-y-auto max-h-[250px] custom-scrollbar pr-1">
            <div className="space-y-3">
              {datasets.map((d) => {
                const isSelected = d.dataset_id === currentDatasetId;
                return (
                  <div 
                    key={d.dataset_id}
                    onClick={() => {
                      selectDataset(d.dataset_id);
                      navigate('/profiling');
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:bg-surface-container-high ${
                      isSelected 
                        ? "bg-surface-container border-primary-container/60 shadow-lg shadow-primary-container/5"
                        : "bg-surface-container-low border-border-subtle/40"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-bold text-white truncate">{d.filename}</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">
                        {new Date(d.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex-shrink-0 px-2 py-1 bg-surface-container-highest rounded text-[10px] text-primary-fixed border border-border-subtle/50 font-semibold">
                      {d.problem_type || "Unknown"}
                    </div>
                  </div>
                );
              })}
              {datasets.length === 0 && (
                <div className="text-center py-12 text-on-surface-variant text-xs">
                  No datasets uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Reports List */}
        <div className="glass-card p-6 rounded-2xl flex flex-col min-h-[350px]">
          <h5 className="text-primary font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
            <span className="material-symbols-outlined text-primary-container">file_open</span>
            Generated Reports
          </h5>
          <div className="flex-grow overflow-y-auto max-h-[250px] custom-scrollbar pr-1">
            <div className="space-y-3">
              {reports.map((r) => {
                const dataset = datasets.find((d) => d.dataset_id === r.dataset_id);
                const name = dataset ? dataset.filename : r.filename || "Dataset Report";
                return (
                  <div 
                    key={r.dataset_id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border-subtle/40 bg-surface-container-low"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-bold text-white truncate">{name.replace(".csv", "")} PDF Report</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">
                        {r.generated_at ? new Date(r.generated_at).toLocaleDateString() : "Generated"}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => requireAuth(() => window.open(`http://localhost:8000/reports/download/${r.dataset_id}`, "_blank"))}
                      className="p-2 bg-primary-container hover:bg-accent-hover text-on-primary-container rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                      title="Download PDF"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                    </button>
                  </div>
                );
              })}
              {reports.length === 0 && (
                <div className="text-center py-12 text-on-surface-variant text-xs">
                  No reports generated yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Training Jobs & AI Copilot Quick Actions Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col min-h-[350px] justify-between">
          <div className="space-y-5 h-full flex flex-col justify-between">
            {/* Jobs Status Summary */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-xs">analytics</span>
                Training Workers
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-surface-container-low rounded-xl text-center border border-border-subtle/20">
                  <span className="text-sm font-bold text-primary animate-pulse">{overview.running_jobs}</span>
                  <p className="text-[9px] uppercase tracking-wider text-on-surface-variant mt-0.5">Running</p>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-xl text-center border border-border-subtle/20">
                  <span className="text-sm font-bold text-green-400">{overview.completed_jobs}</span>
                  <p className="text-[9px] uppercase tracking-wider text-on-surface-variant mt-0.5">Completed</p>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-xl text-center border border-border-subtle/20">
                  <span className="text-sm font-bold text-red-400">{overview.failed_jobs}</span>
                  <p className="text-[9px] uppercase tracking-wider text-on-surface-variant mt-0.5">Failed</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-xs">quick_reference_all</span>
                Copilot Quick Actions
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { text: "Explain Dataset", q: "Explain the overall characteristics and properties of this dataset" },
                  { text: "Detect Quality Issues", q: "What data quality issues, missing values, or outliers were detected in this dataset?" },
                  { text: "Recommend Best Model", q: "Which machine learning algorithms are recommended for this dataset and why?" },
                  { text: "Summarize Results", q: "Summarize the model training results and evaluation performance metrics" },
                  { text: "Generate Insights", q: "What key business insights and correlations can we extract from this dataset?" }
                ].map((act, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      requireAuth(() => {
                        setInputVal(act.q);
                        setIsCopilotOpen(true);
                      }, "copilot");
                    }}
                    className="px-2.5 py-1.5 bg-surface-container-high hover:bg-primary-container/20 border border-border-subtle/50 text-[10px] text-white rounded-lg transition-all active:scale-95 font-semibold cursor-pointer"
                  >
                    {act.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
