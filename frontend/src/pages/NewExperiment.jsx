import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDataset } from "../contexts/DatasetContext";
import api from "../services/api";

export function NewExperiment() {
  const navigate = useNavigate();
  const { currentDatasetId, currentDataset } = useDataset();

  // Wizard state: 1: target, 2: preprocessing, 3: models, 4: running, 5: results
  const [step, setStep] = useState(1);
  const [columns, setColumns] = useState([]);
  const [loadingCols, setLoadingCols] = useState(false);

  // Form states
  const [targetColumn, setTargetColumn] = useState("");
  const [taskType, setTaskType] = useState("auto"); // auto, classification, regression
  const [splitRatio, setSplitRatio] = useState(0.8);
  const [imputationStrategy, setImputationStrategy] = useState("median");
  const [outlierThreshold, setOutlierThreshold] = useState(3.0);
  const [outliersEnabled, setOutliersEnabled] = useState(true);
  
  // Model checkboxes
  const [selectedModels, setSelectedModels] = useState({
    LogisticRegression: true,
    RandomForestClassifier: true,
    DecisionTreeClassifier: true,
    LinearRegression: true,
    RandomForestRegressor: true,
    DecisionTreeRegressor: true,
  });

  // Async task tracking
  const [experimentId, setExperimentId] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState("PENDING");
  const [jobProgress, setJobProgress] = useState(0);
  const [jobError, setJobError] = useState(null);
  const [evalResults, setEvalResults] = useState(null);

  // Load columns list when dataset changes
  useEffect(() => {
    if (!currentDatasetId) return;
    setLoadingCols(true);
    api.get(`/datasets/${currentDatasetId}/columns`)
      .then((res) => {
        const cols = res.data.columns || [];
        setColumns(cols);
        if (cols.length > 0) {
          setTargetColumn(cols[cols.length - 1]); // default to last column
        }
        setLoadingCols(false);
      })
      .catch((err) => {
        console.error("Failed to fetch columns:", err);
        setLoadingCols(false);
      });
  }, [currentDatasetId]);

  // Guess problem type when target column changes
  const guessedTaskType = useMemo(() => {
    if (!targetColumn) return "classification";
    const lower = targetColumn.toLowerCase();
    if (lower.includes("price") || lower.includes("sales") || lower.includes("count") || lower.includes("amount") || lower.includes("value") || lower.includes("target")) {
      return "regression";
    }
    return "classification";
  }, [targetColumn]);

  const activeTaskType = taskType === "auto" ? guessedTaskType : taskType;

  // Poll job status during step 4
  useEffect(() => {
    if (step !== 4 || !experimentId) return;

    let timer = setInterval(async () => {
      try {
        const res = await api.get(`/experiments/status/${experimentId}`);
        const { experiment, job } = res.data;
        
        if (job) {
          setJobStatus(job.status);
          setJobProgress(job.progress);
          
          if (job.status === "COMPLETED") {
            clearInterval(timer);
            setEvalResults(job.result);
            setStep(5);
          } else if (job.status === "FAILED") {
            clearInterval(timer);
            setJobError(job.error || "Background execution failed.");
          }
        }
      } catch (err) {
        console.error("Error polling experiment status:", err);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [step, experimentId]);

  const toggleModel = (name) => {
    setSelectedModels((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleStartExperiment = async () => {
    setJobError(null);
    setJobStatus("PENDING");
    setJobProgress(0);
    setStep(4);

    // Prepare lists of selected models depending on task type
    const modelsList = [];
    Object.keys(selectedModels).forEach((name) => {
      if (selectedModels[name]) {
        // Only include models fitting the task type
        if (activeTaskType === "classification" && name.endsWith("Classifier") || name === "LogisticRegression") {
          modelsList.push(name);
        } else if (activeTaskType === "regression" && name.endsWith("Regressor") || name === "LinearRegression") {
          modelsList.push(name);
        }
      }
    });

    const payload = {
      dataset_id: currentDatasetId,
      target_column: targetColumn,
      split_ratio: parseFloat(splitRatio),
      imputation_strategy: imputationStrategy,
      selected_models: modelsList,
      outlier_threshold: outliersEnabled ? parseFloat(outlierThreshold) : null,
    };

    try {
      const res = await api.post("/experiments", payload);
      setExperimentId(res.data.experiment_id);
      setJobId(res.data.job_id);
    } catch (err) {
      console.error("Failed to start experiment:", err);
      setJobError(err.response?.data?.detail || "Could not instantiate training task.");
    }
  };

  const getStageMessage = () => {
    if (jobProgress < 20) return "Queueing worker thread...";
    if (jobProgress < 50) return "Imputing values and scaling features...";
    if (jobProgress < 80) return "Fitting machine learning algorithms...";
    return "Evaluating performance matrices and model weights...";
  };

  if (!currentDatasetId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 glass-card rounded-2xl p-8">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">science</span>
        <h2 className="font-headline-sm text-white">No Dataset Selected</h2>
        <p className="text-on-surface-variant max-w-sm text-sm">
          Please upload or select a dataset on the Dashboard to execute custom experiments.
        </p>
        <button 
          onClick={() => navigate("/upload")}
          className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-accent-hover active:scale-95 transition-all"
        >
          Upload Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-headline-sm text-headline-sm text-primary-fixed">New Pipeline Experiment</h1>
          <p className="text-body-sm text-on-surface-variant">
            Create an isolated experiment. Choose custom target labels, split parameters, and specific preprocessing controls.
          </p>
        </div>
        <span className="px-3 py-1 rounded bg-surface-container text-on-surface-variant text-[10px] uppercase font-bold tracking-wider border border-border-subtle max-w-[200px] truncate">
          {currentDataset?.filename}
        </span>
      </div>

      {/* Step Progress indicators */}
      {step <= 3 && (
        <div className="flex items-center gap-2 px-1">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? "bg-primary-container shadow-md shadow-primary-container/20" : "bg-surface-container-high"
              }`}
            ></div>
          ))}
        </div>
      )}

      {/* Step 1: Select Target */}
      {step === 1 && (
        <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Step 1: Choose Target Label</h3>
            <p className="text-[11px] text-on-surface-variant">Select which column you would like your model to predict.</p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Target Column</label>
              {loadingCols ? (
                <div className="h-10 bg-surface-container rounded-xl animate-pulse"></div>
              ) : (
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Override Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
              >
                <option value="auto">Auto-detect (Guessed: {guessedTaskType})</option>
                <option value="classification">Classification (Predict Categories)</option>
                <option value="regression">Regression (Predict Numbers)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border-subtle/30">
            <button
              onClick={() => setStep(2)}
              className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all active:scale-95 flex items-center gap-1"
            >
              Continue
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preprocessing Config */}
      {step === 2 && (
        <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Step 2: Preprocessing Settings</h3>
            <p className="text-[11px] text-on-surface-variant">Customize split ratios, imputation policies, and outlier clamping thresholds.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Split Ratio (Train Size: {splitRatio * 100}%)</label>
              <input
                type="range"
                min="0.5"
                max="0.9"
                step="0.05"
                value={splitRatio}
                onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-bold">
                <span>50% Train / 50% Test</span>
                <span>90% Train / 10% Test</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Missing Values Imputation</label>
              <select
                value={imputationStrategy}
                onChange={(e) => setImputationStrategy(e.target.value)}
                className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
              >
                <option value="median">Median value (Imputes extreme middle values)</option>
                <option value="mean">Mean value (Imputes standard averages)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-3 p-4 rounded-xl border border-border-subtle bg-surface-container-low/40">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-white">Outliers Clamping</span>
                  <span className="text-[10px] text-on-surface-variant">Scale features within standard deviation limits</span>
                </div>
                <input
                  type="checkbox"
                  checked={outliersEnabled}
                  onChange={(e) => setOutliersEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border-subtle bg-surface-container cursor-pointer"
                />
              </div>

              {outliersEnabled && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Standard Deviation Limit (Std: {outlierThreshold})</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={outlierThreshold}
                    onChange={(e) => setOutlierThreshold(parseFloat(e.target.value))}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  />
                  <span className="text-[9px] text-on-surface-variant">Values exceeding mean +/- threshold * std will be clamped to prevent model distortion.</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border-subtle/30">
            <button
              onClick={() => setStep(1)}
              className="border border-border-subtle text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-surface-container transition-all active:scale-95 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all active:scale-95 flex items-center gap-1"
            >
              Continue
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Algorithm Selection */}
      {step === 3 && (
        <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Step 3: Select Candidate Algorithms</h3>
            <p className="text-[11px] text-on-surface-variant">
              Select which compatible algorithms to train. Tasks are dynamically routed depending on the target selection.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border-subtle/60 bg-surface-container-low flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2 text-primary-fixed">
              <span className="material-symbols-outlined text-sm">info</span>
              Target: <span className="font-mono font-bold text-white">{targetColumn}</span>
            </div>
            <span className="bg-primary-container/20 text-primary-fixed px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-primary-container/30">
              {activeTaskType} Task
            </span>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase">Algorithms to Train</label>
            
            {activeTaskType === "classification" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: "LogisticRegression", label: "Logistic Regression", desc: "Linear model for binary classifications" },
                  { name: "RandomForestClassifier", label: "Random Forest Classifier", desc: "Decision tree ensemble for complex nonlinear splits" },
                  { name: "DecisionTreeClassifier", label: "Decision Tree Classifier", desc: "Simple decision boundary model" }
                ].map((m) => (
                  <div 
                    key={m.name}
                    onClick={() => toggleModel(m.name)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      selectedModels[m.name] 
                        ? "border-primary-container bg-primary-container/5" 
                        : "border-border-subtle bg-surface-container-low hover:border-border-subtle/80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels[m.name]}
                      readOnly
                      className="w-4 h-4 rounded text-primary border-border-subtle bg-surface-container mt-0.5 cursor-pointer"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">{m.label}</span>
                      <span className="text-[10px] text-on-surface-variant">{m.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: "LinearRegression", label: "Linear Regression", desc: "Simple linear trendline fitting" },
                  { name: "RandomForestRegressor", label: "Random Forest Regressor", desc: "Decision tree ensemble fitting complex variances" },
                  { name: "DecisionTreeRegressor", label: "Decision Tree Regressor", desc: "Boundary regression split model" }
                ].map((m) => (
                  <div 
                    key={m.name}
                    onClick={() => toggleModel(m.name)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      selectedModels[m.name] 
                        ? "border-primary-container bg-primary-container/5" 
                        : "border-border-subtle bg-surface-container-low hover:border-border-subtle/80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels[m.name]}
                      readOnly
                      className="w-4 h-4 rounded text-primary border-border-subtle bg-surface-container mt-0.5 cursor-pointer"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">{m.label}</span>
                      <span className="text-[10px] text-on-surface-variant">{m.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-border-subtle/30">
            <button
              onClick={() => setStep(2)}
              className="border border-border-subtle text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-surface-container transition-all active:scale-95 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </button>
            <button
              onClick={handleStartExperiment}
              className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              Run Experiment
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Running Progress */}
      {step === 4 && (
        <div className="glass-panel p-8 rounded-2xl border border-border-subtle bg-surface-dim space-y-8 text-center flex flex-col items-center justify-center min-h-[350px]">
          {jobError ? (
            <div className="space-y-4 max-w-md">
              <span className="material-symbols-outlined text-4xl text-error">error</span>
              <h3 className="text-sm font-bold text-white">Experiment Execution Failed</h3>
              <p className="text-[11px] text-on-surface-variant">{jobError}</p>
              <button
                onClick={() => setStep(3)}
                className="bg-primary-container text-on-primary-container px-5 py-2 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all"
              >
                Back to Configs
              </button>
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-md">
              <div className="relative flex items-center justify-center">
                {/* Circular pulsing animations */}
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="material-symbols-outlined absolute text-xl text-primary animate-pulse">science</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white">Running Experiment</h3>
                <p className="text-[11px] text-primary-fixed font-semibold">{getStageMessage()}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden border border-border-subtle/20">
                  <div 
                    className="bg-primary-container h-full transition-all duration-300"
                    style={{ width: `${jobProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-on-surface-variant font-bold">
                  <span>Job Status: {jobStatus}</span>
                  <span>{jobProgress}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 5: Completed Results Dashboard */}
      {step === 5 && evalResults && (
        <div className="space-y-6">
          {/* Best Model highlight panel */}
          <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden group">
            <div className="ai-shimmer absolute inset-0 opacity-20 pointer-events-none"></div>
            
            <div className="space-y-2 relative z-10">
              <span className="bg-primary-container/20 text-primary-fixed px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-primary-container/30">
                Best Model Selected
              </span>
              <h2 className="text-xl font-display-lg text-white font-bold">{evalResults.best_model}</h2>
              <p className="text-[11px] text-on-surface-variant">
                Evaluated against the custom target column <span className="font-mono text-white font-semibold">"{targetColumn}"</span> with split ratio <span className="text-white font-semibold">{splitRatio}</span>.
              </p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all active:scale-95 flex items-center gap-1.5 relative z-10"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              New Experiment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model comparisons list */}
            <div className="glass-panel p-5 rounded-2xl border border-border-subtle bg-surface-dim space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Model Comparisons</h3>
              <hr className="border-border-subtle/30" />
              
              <div className="space-y-2">
                {evalResults.model_comparison.map((m, idx) => (
                  <div 
                    key={m.model}
                    className="p-4 rounded-xl bg-surface-container flex items-center justify-between border border-border-subtle/40 hover:border-primary-fixed/40 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-container/25 text-primary-fixed text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">{m.model}</span>
                    </div>

                    <div className="text-right">
                      {evalResults.problem_type === "Classification" ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{(m.accuracy * 100).toFixed(1)}% Accuracy</span>
                          <span className="text-[9px] text-on-surface-variant">F1: {(m.f1_score * 100).toFixed(1)}%</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">R²: {m.r2_score.toFixed(4)}</span>
                          <span className="text-[9px] text-on-surface-variant">MAE: {m.mae.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature importances or metrics */}
            <div className="glass-panel p-5 rounded-2xl border border-border-subtle bg-surface-dim space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-semibold">Feature Importance</h3>
              <hr className="border-border-subtle/30" />

              {Object.keys(evalResults.feature_importance).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(evalResults.feature_importance).slice(0, 5).map(([col, val]) => (
                    <div key={col} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white font-medium truncate">{col}</span>
                        <span className="text-primary-fixed font-bold">{(val * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${val * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-on-surface-variant flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-xl">bar_chart</span>
                  No tree-based estimator feature weights extracted for this model run.
                </div>
              )}
            </div>

            {/* Weaknesses if any */}
            {Object.values(evalResults.detailed_results).some(e => e.weaknesses && e.weaknesses.length > 0) && (
              <div className="md:col-span-2 glass-panel p-5 rounded-2xl border border-border-subtle bg-surface-dim space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Model Weaknesses Detected</h3>
                <hr className="border-border-subtle/30" />
                
                <div className="space-y-2">
                  {Object.entries(evalResults.detailed_results).map(([mName, mEval]) => (
                    mEval.weaknesses && mEval.weaknesses.map((w, wIdx) => (
                      <div key={`${mName}-${wIdx}`} className="p-3 rounded-lg border border-error/20 bg-error/5 text-error flex items-start gap-2.5 text-xs">
                        <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
                        <div>
                          <strong className="text-white mr-1.5">{mName}:</strong>
                          {w}
                        </div>
                      </div>
                    ))
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
