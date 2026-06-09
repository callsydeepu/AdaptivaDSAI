import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CandidateModelCard } from "../components/CandidateModelCard";
import { useDataset } from "../contexts/DatasetContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { mlService } from "../services/mlService";
import { analysisService } from "../services/analysisService";

export function ModelRecommendation() {
  const navigate = useNavigate();
  const { currentDatasetId, currentDataset } = useDataset();
  const [launchError, setLaunchError] = useState("");

  // Queries
  const { data: recommendations, isLoading: isRecLoading, error: recError } = useQuery({
    queryKey: ["recommendations", currentDatasetId],
    queryFn: () => mlService.getRecommendations(currentDatasetId),
    enabled: !!currentDatasetId,
  });

  const { data: problem, isLoading: isProblemLoading } = useQuery({
    queryKey: ["problem-detection", currentDatasetId],
    queryFn: () => analysisService.getProblemDetection(currentDatasetId),
    enabled: !!currentDatasetId,
  });

  // Launch training mutation
  const trainMutation = useMutation({
    mutationFn: () => mlService.startTraining(currentDatasetId),
    onSuccess: (data) => {
      navigate(`/training?job_id=${data.job_id}&dataset_id=${currentDatasetId}`);
    },
    onError: (err) => {
      setLaunchError(err.response?.data?.detail || "Failed to start training. Please make sure the dataset is processed.");
    },
  });

  if (!currentDatasetId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 glass-card rounded-2xl p-8">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">model_training</span>
        <h2 className="font-headline-sm text-white">No Dataset Selected</h2>
        <p className="text-on-surface-variant max-w-sm text-sm">
          Please upload or select a dataset on the Dashboard to view model recommendations.
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

  const isLoading = isRecLoading || isProblemLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant text-body-sm">Analyzing feature statistics and recommending optimal machine learning models...</p>
      </div>
    );
  }

  if (recError || !recommendations) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center max-w-lg mx-auto">
        <span className="material-symbols-outlined text-4xl text-error">error</span>
        <h3 className="font-headline-sm text-white">Recommendations Failed</h3>
        <p className="text-on-surface-variant text-sm">
          Could not recommend models. Please ensure the dataset is processed under Data Profiling first.
        </p>
        <button 
          onClick={() => navigate("/profiling")}
          className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg text-body-sm font-bold hover:bg-accent-hover active:scale-95 transition-all"
        >
          Go to Data Profiling
        </button>
      </div>
    );
  }

  const recommendedModels = recommendations.recommended_models || [];

  return (
    <div className="space-y-12 pb-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-subtle/30 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary-fixed">
            <span className="material-symbols-outlined text-body-md">verified_user</span>
            <span className="font-label-md text-label-md tracking-widest uppercase text-xs">
              AI Engine Diagnostics
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-tight">
            Model Recommendation
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm sm:text-base">
            Analyzing <span className="text-white font-bold">{currentDataset?.filename}</span>. Below are the architectural recommendations tailored for your data profile.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => navigate('/profiling')}
            className="bg-surface-container px-6 py-2.5 rounded-lg border border-border-subtle hover:bg-surface-container-high transition-all font-label-md flex items-center gap-2 active:scale-95 text-sm"
          >
            <span className="material-symbols-outlined text-sm">analytics</span>
            View Profile
          </button>
          <button 
            onClick={() => trainMutation.mutate()}
            disabled={trainMutation.isPending}
            className="bg-primary-container text-on-primary-container px-8 py-2.5 rounded-lg hover:bg-accent-hover transition-all font-bold shadow-lg shadow-primary-container/10 active:scale-95 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {trainMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></div>
                Starting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                Launch Training
              </>
            )}
          </button>
        </div>
      </header>

      {launchError && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex gap-3 items-center text-error max-w-2xl">
          <span className="material-symbols-outlined text-xl">error</span>
          <p className="text-body-sm text-xs sm:text-sm">{launchError}</p>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Left Column: Constraints */}
        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          {/* Problem Detection */}
          <section className="glass-card rounded-xl p-6 md:p-8 ai-glow relative overflow-hidden">
            <div className="shimmer absolute inset-0 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6 z-10 relative">
              <span className="font-label-md text-label-md text-primary-fixed text-xs uppercase tracking-wider">
                Problem Detection
              </span>
              <span className="bg-primary-fixed/10 text-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold border border-primary-fixed/20">
                99.8% CERTAINTY
              </span>
            </div>
            
            <div className="space-y-4 z-10 relative">
              <h2 className="font-headline-md text-headline-md text-primary">
                {problem?.problem_type || "Detecting..."}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs sm:text-sm">
                Target classification scope matches dataset characteristics. Imbalance parameters configured automatically.
              </p>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4 z-10 relative">
              <div className="bg-background/40 p-4 rounded-lg border border-border-subtle">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Target</p>
                <p className="text-body-md font-code-snippet font-mono text-xs sm:text-sm">
                  {problem?.target_column || "N/A"}
                </p>
              </div>
              <div className="bg-background/40 p-4 rounded-lg border border-border-subtle">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Imbalance</p>
                <p className="text-body-md font-code-snippet font-mono text-xs sm:text-sm">
                  {problem?.classification_type || "N/A"}
                </p>
              </div>
            </div>
          </section>

          {/* Constraints */}
          <section className="glass-card rounded-xl p-6 md:p-8">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-6">Optimization Constraints</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-fixed">speed</span>
                  <span className="text-body-md text-xs sm:text-sm">Inference Latency</span>
                </div>
                <span className="text-body-sm font-code-snippet text-primary-fixed font-mono text-xs">&lt; 15ms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-fixed">memory</span>
                  <span className="text-body-md text-xs sm:text-sm">Memory Footprint</span>
                </div>
                <span className="text-body-sm font-code-snippet text-primary-fixed font-mono text-xs">Lightweight</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-fixed">visibility</span>
                  <span className="text-body-md text-xs sm:text-sm">Explainability</span>
                </div>
                <span className="text-body-sm font-code-snippet text-primary-fixed font-mono text-xs">High (SHAP/LIME)</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Model Candidates */}
        <div className="col-span-12 lg:col-span-8 space-y-gutter">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-headline-sm text-headline-sm text-primary">Candidate Models</h3>
          </div>
          
          <div className="space-y-4">
            {recommendedModels.map((cand, idx) => (
              <CandidateModelCard
                key={idx}
                name={cand.model}
                score={Math.round(100 - (cand.priority * 8))} // priority 1 = 92, priority 2 = 84, etc.
                recommended={cand.priority === 1}
                description={cand.reason}
                metrics={[`Priority: ${cand.priority}`]}
                disabled={cand.model.toLowerCase().includes("xgboost")} // disable XGBoost in frontend since mvp trains sklearn
              />
            ))}
            {recommendedModels.length === 0 && (
              <div className="glass-panel p-6 text-center text-on-surface-variant text-body-sm">
                No model candidates recommended for this dataset.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strategic Rationalization */}
      <section className="space-y-6">
        <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-fixed">psychology</span>
          Strategic Rationalization
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="glass-card rounded-xl p-6 space-y-4 hover:border-primary-fixed/30 transition-all cursor-pointer">
            <div className="w-10 h-10 bg-primary-fixed/10 flex items-center justify-center rounded-lg border border-primary-fixed/20 text-primary-fixed">
              <span className="material-symbols-outlined">hub</span>
            </div>
            <h5 className="font-headline-sm text-headline-sm text-primary text-body-lg">Feature Distribution</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-xs sm:text-sm">
              Model parameters set to reflect scale and distribution constraints. Favors tree-based ensembles for non-linear structures.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 space-y-4 hover:border-primary-fixed/30 transition-all cursor-pointer">
            <div className="w-10 h-10 bg-primary-fixed/10 flex items-center justify-center rounded-lg border border-primary-fixed/20 text-primary-fixed">
              <span className="material-symbols-outlined">balance</span>
            </div>
            <h5 className="font-headline-sm text-headline-sm text-primary text-body-lg">Imbalance Handling</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-xs sm:text-sm">
              Auto-detect imbalance ratios. Applies balanced class weights inside logistic and forest classifiers to guard precision boundaries.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 space-y-4 relative overflow-hidden hover:border-primary-fixed/30 transition-all cursor-pointer">
            <div className="w-10 h-10 bg-primary-fixed/10 flex items-center justify-center rounded-lg border border-primary-fixed/20 text-primary-fixed">
              <span className="material-symbols-outlined">insights</span>
            </div>
            <h5 className="font-headline-sm text-headline-sm text-primary text-body-lg">Cardinality Management</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-xs sm:text-sm z-10 relative">
              Label encoding and min-max scaling performed inside Feature Engineering pipeline. Prevents dimensionality explosion on trees.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
