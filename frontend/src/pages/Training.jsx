import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDataset } from "../contexts/DatasetContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mlService } from "../services/mlService";

export function Training() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentDatasetId, currentDataset } = useDataset();

  // Extract job_id and dataset_id from URL search params
  const urlJobId = searchParams.get("job_id");
  const urlDatasetId = searchParams.get("dataset_id");

  // Keep track of active job ID in local state
  const [activeJobId, setActiveJobId] = useState(urlJobId || null);
  const targetDatasetId = urlDatasetId || currentDatasetId;

  const [launchError, setLaunchError] = useState("");

  // Sync state with URL search params changes
  useEffect(() => {
    if (urlJobId) {
      setActiveJobId(urlJobId);
    }
  }, [urlJobId]);

  // Query: Fetch details of the active job
  const { data: job, error: jobError } = useQuery({
    queryKey: ["job", activeJobId],
    queryFn: () => mlService.getJobStatus(activeJobId),
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Continue polling if job is PENDING or RUNNING
      return status === "PENDING" || status === "RUNNING" ? 1000 : false;
    },
  });

  // Query: Fetch evaluation results if they exist
  const { data: evaluation, isLoading: isEvalLoading, error: evalError } = useQuery({
    queryKey: ["evaluation", targetDatasetId],
    queryFn: () => mlService.getEvaluation(targetDatasetId),
    enabled: !!targetDatasetId && (!activeJobId || job?.status === "COMPLETED"),
    retry: false, // Don't spam retries on 404
  });

  // Mutation: Start training job
  const trainMutation = useMutation({
    mutationFn: () => mlService.startTraining(targetDatasetId),
    onSuccess: (data) => {
      setLaunchError("");
      setActiveJobId(data.job_id);
      setSearchParams({ job_id: data.job_id, dataset_id: targetDatasetId });
    },
    onError: (err) => {
      setLaunchError(err.response?.data?.detail || "Failed to start training. Please make sure the dataset is processed.");
    },
  });

  // Handle retraining
  const handleRetrain = () => {
    trainMutation.mutate();
  };

  // If no dataset is selected and no URL dataset_id is present
  if (!targetDatasetId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 glass-card rounded-2xl p-8">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">model_training</span>
        <h2 className="font-headline-sm text-white">No Dataset Selected</h2>
        <p className="text-on-surface-variant max-w-sm text-sm">
          Please upload or select a dataset on the Dashboard to start training.
        </p>
        <button 
          onClick={() => navigate("/upload")}
          className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg text-body-sm font-bold hover:bg-accent-hover active:scale-95 transition-all text-xs"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  // Determine which UI state to display
  const isJobRunning = job?.status === "PENDING" || job?.status === "RUNNING";
  const isJobFailed = job?.status === "FAILED";
  const hasResults = !!evaluation;

  return (
    <div className="space-y-12 pb-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-subtle/30 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary-fixed">
            <span className="material-symbols-outlined text-body-md">model_training</span>
            <span className="font-label-md text-label-md tracking-widest uppercase text-xs">
              MLOps Pipeline Execution
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-tight">
            Model Training & Evaluation
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm sm:text-base">
            Training candidate algorithms and evaluating validation metrics on <span className="text-white font-bold">{currentDataset?.filename || "dataset"}</span>.
          </p>
        </div>
        {hasResults && !isJobRunning && (
          <div>
            <button
              onClick={handleRetrain}
              disabled={trainMutation.isPending}
              className="bg-surface-container px-6 py-2.5 rounded-lg border border-border-subtle hover:bg-surface-container-high transition-all font-label-md flex items-center gap-2 active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined text-sm">replay</span>
              {trainMutation.isPending ? "Starting..." : "Retrain Models"}
            </button>
          </div>
        )}
      </header>

      {launchError && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex gap-3 items-center text-error max-w-2xl">
          <span className="material-symbols-outlined text-xl">error</span>
          <p className="text-body-sm text-xs sm:text-sm">{launchError}</p>
        </div>
      )}

      {/* Case 1: Job is currently executing (Running / Pending) */}
      {isJobRunning && (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center space-y-8 ai-glow relative overflow-hidden">
            <div className="shimmer absolute inset-0 pointer-events-none"></div>
            
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-fixed/10 text-primary-fixed border border-primary-fixed/20 animate-pulse">
                {job.status}
              </span>
              <h3 className="font-headline-md text-white text-xl sm:text-2xl">
                {job.status === "PENDING" ? "Queueing ML Models..." : "Training Algorithms..."}
              </h3>
              <p className="text-on-surface-variant text-xs sm:text-sm max-w-md mx-auto">
                Running grid searches and K-fold cross-validation on your feature-engineered splits.
              </p>
            </div>

            {/* Glowing Progress Bar */}
            <div className="space-y-2 max-w-lg mx-auto">
              <div className="flex justify-between text-xs text-on-surface-variant font-mono">
                <span>PROGRESS</span>
                <span className="text-primary-fixed font-bold">{job.progress}%</span>
              </div>
              <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-border-subtle/50 p-0.5">
                <div 
                  className="bg-primary-container h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,221,0,0.5)]"
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Pipeline Stage Messages */}
            <div className="text-xs text-on-surface-variant font-mono max-w-md mx-auto bg-background/50 p-4 rounded-xl border border-border-subtle/50 text-left space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span>Job Initialized ({job.job_id.substring(0, 8)}...)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${job.progress >= 30 ? "bg-green-500" : "bg-primary-fixed animate-pulse"}`}></span>
                <span className={job.progress >= 30 ? "text-on-surface" : "text-primary-fixed"}>
                  {job.progress >= 30 ? "Dataset preprocessed & splits loaded" : "Preprocessing dataset features..."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${job.progress >= 100 ? "bg-green-500" : job.progress >= 30 ? "bg-primary-fixed animate-pulse" : "bg-neutral-700"}`}></span>
                <span className={job.progress >= 100 ? "text-on-surface" : job.progress >= 30 ? "text-primary-fixed" : "text-neutral-500"}>
                  {job.progress >= 100 ? "Models training complete" : job.progress >= 30 ? "Fitting regression and forest classifiers..." : "Waiting to fit models..."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${job.progress >= 100 ? "bg-green-500" : "bg-neutral-700"}`}></span>
                <span className={job.progress >= 100 ? "text-on-surface" : "text-neutral-500"}>
                  Evaluating performance and saving weights
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case 2: Job failed */}
      {isJobFailed && (
        <div className="max-w-lg mx-auto bg-error/10 border border-error/20 rounded-2xl p-8 text-center space-y-6">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <div className="space-y-2">
            <h3 className="font-headline-sm text-white">Training Run Failed</h3>
            <p className="text-on-surface-variant text-sm">
              {job.error || "An unexpected error occurred during execution of the training background job."}
            </p>
          </div>
          <button 
            onClick={handleRetrain}
            className="bg-error-container hover:bg-error/20 text-on-error-container font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all text-xs"
          >
            Retry Training Job
          </button>
        </div>
      )}

      {/* Case 3: No active job and evaluation results are available */}
      {hasResults && !isJobRunning && !isJobFailed && (
        <div className="space-y-12 animate-fadeIn">
          {/* Top Row: Best Model Highlight */}
          <div className="grid grid-cols-12 gap-gutter">
            <div className="col-span-12 md:col-span-6 lg:col-span-5 glass-card rounded-2xl p-8 ai-glow relative overflow-hidden flex flex-col justify-between min-h-[260px]">
              <div className="shimmer absolute inset-0 pointer-events-none"></div>
              
              <div className="space-y-4">
                <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-bold border border-primary-container/20 tracking-wider uppercase inline-block">
                  Optimal Model Selected
                </span>
                <h2 className="font-display-lg text-primary text-2xl sm:text-3xl leading-tight">
                  {evaluation.best_model}
                </h2>
                <p className="text-on-surface-variant text-body-sm text-xs sm:text-sm leading-relaxed">
                  Based on target test splits, this model achieves the highest accuracy-to-generalizability balance, minimizing risk of variance inflation.
                </p>
              </div>

              <div className="mt-8 bg-background/50 border border-border-subtle p-4 rounded-xl flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Performance Index</span>
                <span className="text-xl font-headline-md font-bold text-primary-fixed font-mono">
                  {evaluation.problem_type === "Classification"
                    ? `${(evaluation.detailed_results?.[evaluation.best_model]?.metrics?.accuracy * 100).toFixed(1)}% Acc`
                    : `${(evaluation.detailed_results?.[evaluation.best_model]?.metrics?.r2_score * 100).toFixed(1)}% R²`}
                </span>
              </div>
            </div>

            {/* Top Row Right: Feature Importance */}
            <div className="col-span-12 md:col-span-6 lg:col-span-7 glass-card rounded-2xl p-8 flex flex-col justify-between">
              <div className="space-y-1 mb-6">
                <h4 className="font-headline-sm text-headline-sm text-primary">Global Feature Importance</h4>
                <p className="text-on-surface-variant text-body-sm text-xs">Relative impact weightings extracted from tree ensemble splits.</p>
              </div>

              <div className="space-y-4 flex-grow justify-center flex flex-col">
                {Object.entries(evaluation.feature_importance || {}).slice(0, 5).map(([feature, weight], idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-on-surface font-semibold truncate max-w-[180px] sm:max-w-xs">{feature}</span>
                      <span className="text-primary-fixed">{(weight * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                      <div 
                        className="bg-primary-container h-full rounded-full"
                        style={{ width: `${weight * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {Object.keys(evaluation.feature_importance || {}).length === 0 && (
                  <div className="text-center text-on-surface-variant text-xs font-mono py-8">
                    Feature importances not computed for this model architecture.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Model Comparison Table */}
          <section className="glass-card rounded-2xl overflow-hidden p-6 md:p-8">
            <h4 className="font-headline-sm text-headline-sm text-primary mb-6">Comparison Matrix</h4>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border-subtle/50 text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                    <th className="py-4 px-4">Model Architecture</th>
                    {evaluation.problem_type === "Classification" ? (
                      <>
                        <th className="py-4 px-4 text-right">Accuracy</th>
                        <th className="py-4 px-4 text-right">F1 Score</th>
                        <th className="py-4 px-4 text-right">Precision</th>
                        <th className="py-4 px-4 text-right">Recall</th>
                      </>
                    ) : (
                      <>
                        <th className="py-4 px-4 text-right">R² Score</th>
                        <th className="py-4 px-4 text-right">RMSE</th>
                        <th className="py-4 px-4 text-right">MAE</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30 font-mono">
                  {evaluation.model_comparison.map((modelRow, idx) => {
                    const modelDetails = evaluation.detailed_results?.[modelRow.model] || {};
                    const metrics = modelDetails.metrics || {};
                    const isBest = modelRow.model === evaluation.best_model;

                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors hover:bg-white/5 ${
                          isBest ? "bg-primary-fixed/5 font-semibold text-primary" : "text-on-surface-variant"
                        }`}
                      >
                        <td className="py-4 px-4 font-sans flex items-center gap-2">
                          {isBest && (
                            <span className="material-symbols-outlined text-primary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                          )}
                          <span>{modelRow.model}</span>
                        </td>
                        {evaluation.problem_type === "Classification" ? (
                          <>
                            <td className={`py-4 px-4 text-right ${isBest ? "text-primary-fixed" : ""}`}>
                              {(metrics.accuracy * 100).toFixed(2)}%
                            </td>
                            <td className="py-4 px-4 text-right">{(metrics.f1_score * 100).toFixed(2)}%</td>
                            <td className="py-4 px-4 text-right">{(metrics.precision * 100).toFixed(2)}%</td>
                            <td className="py-4 px-4 text-right">{(metrics.recall * 100).toFixed(2)}%</td>
                          </>
                        ) : (
                          <>
                            <td className={`py-4 px-4 text-right ${isBest ? "text-primary-fixed" : ""}`}>
                              {(metrics.r2_score * 100).toFixed(2)}%
                            </td>
                            <td className="py-4 px-4 text-right">{metrics.rmse?.toFixed(4)}</td>
                            <td className="py-4 px-4 text-right">{metrics.mae?.toFixed(4)}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Model Weakness Analysis */}
          <section className="space-y-6">
            <h4 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-error">warning</span>
              Diagnostics & Weaknesses
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(evaluation.detailed_results || {}).map(([modelName, mDetails], idx) => {
                const weaknesses = mDetails.weaknesses || [];
                return (
                  <div key={idx} className="glass-card rounded-xl p-6 border-l-4 border-l-border-subtle hover:border-l-primary-fixed transition-all">
                    <h5 className="font-bold text-white text-sm mb-3 flex justify-between items-center">
                      <span>{modelName}</span>
                      {modelName === evaluation.best_model && (
                        <span className="text-[10px] text-primary-fixed uppercase tracking-wider bg-primary-fixed/10 px-2 py-0.5 rounded border border-primary-fixed/20">
                          Selected
                        </span>
                      )}
                    </h5>
                    {weaknesses.length > 0 ? (
                      <ul className="space-y-2.5">
                        {weaknesses.map((weak, wIdx) => (
                          <li key={wIdx} className="flex gap-2 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-xs text-primary-fixed mt-0.5 select-none">arrow_right</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-green-400 flex items-center gap-1.5 font-mono">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        No significant warnings or performance regressions detected.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Page Actions */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 border-t border-border-subtle/30 pt-8">
            <button
              onClick={() => navigate("/reports")}
              className="w-full sm:w-auto bg-primary-container text-on-primary-container font-bold px-8 py-3.5 rounded-xl hover:bg-accent-hover active:scale-95 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-container/10"
            >
              <span className="material-symbols-outlined text-lg">description</span>
              Generate PDF Report
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full sm:w-auto bg-surface-container border border-border-subtle text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-surface-container-high active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Case 4: No active job, and no results exist (Ready for training) */}
      {!activeJobId && !hasResults && (
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center space-y-8">
            <div className="w-20 h-20 bg-primary-container/10 rounded-full flex items-center justify-center border border-primary-container/20 text-primary-container mx-auto">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                rocket_launch
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="font-headline-md text-white text-xl sm:text-2xl">Ready to Start Training</h3>
              <p className="text-on-surface-variant text-sm max-w-md mx-auto">
                All features and categorical scales have been engineered. We will fit regression equations and forest classifiers concurrently.
              </p>
            </div>

            {/* Dataset Meta Summary */}
            <div className="bg-background/50 border border-border-subtle p-6 rounded-xl text-left grid grid-cols-2 gap-4 max-w-md mx-auto font-mono text-xs">
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase font-bold mb-0.5">Dataset</p>
                <p className="text-white font-bold truncate">{currentDataset?.filename || "N/A"}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase font-bold mb-0.5">Records</p>
                <p className="text-white font-bold">{currentDataset?.rows || "N/A"}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase font-bold mb-0.5">Dimensions</p>
                <p className="text-white font-bold">{currentDataset?.columns || "N/A"} cols</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase font-bold mb-0.5">Split Ratio</p>
                <p className="text-white font-bold">80% Train / 20% Test</p>
              </div>
            </div>

            <button
              onClick={handleRetrain}
              disabled={trainMutation.isPending}
              className="bg-primary-container text-on-primary-container font-bold px-8 py-3.5 rounded-xl hover:bg-accent-hover active:scale-95 transition-all text-sm flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-container/10"
            >
              {trainMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></div>
                  Initializing Job...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  Launch Training Job
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
