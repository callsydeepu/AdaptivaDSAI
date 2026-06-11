import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useDataset } from "../contexts/DatasetContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { mlService } from "../services/mlService";
import { reportService } from "../services/reportService";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

export function Reports() {
  const navigate = useNavigate();
  const { currentDatasetId, currentDataset } = useDataset();
  const { user, requireAuth } = useContext(AuthContext);
  const [activeJobId, setActiveJobId] = useState(null);
  const [generateError, setGenerateError] = useState("");
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isManualColabModalOpen, setIsManualColabModalOpen] = useState(false);
  const [isExportingColab, setIsExportingColab] = useState(false);
  const [githubTokenConfigured, setGithubTokenConfigured] = useState(false);

  useEffect(() => {
    const checkGithubToken = async () => {
      if (!user) return;
      try {
        const res = await api.get("/settings");
        setGithubTokenConfigured(!!res.data.GITHUB_TOKEN_CONFIGURED);
      } catch (err) {
        console.error("Failed to load settings in Reports page:", err);
      }
    };
    checkGithubToken();
  }, [user]);

  const handleDownloadNotebook = (mode = "clean") => {
    requireAuth(() => {
      window.open(`${api.defaults.baseURL || "http://localhost:8000"}/datasets/${currentDatasetId}/export/notebook?mode=${mode}`, "_blank");
      setIsExportDropdownOpen(false);
    }, "export_notebook");
  };

  const handleDownloadScript = () => {
    requireAuth(() => {
      window.open(`${api.defaults.baseURL || "http://localhost:8000"}/datasets/${currentDatasetId}/export/script?mode=clean`, "_blank");
      setIsExportDropdownOpen(false);
    }, "export_script");
  };

  const handleOpenInColab = async () => {
    setIsExportDropdownOpen(false);
    requireAuth(async () => {
      if (!githubTokenConfigured) {
        setIsManualColabModalOpen(true);
        return;
      }
      
      setIsExportingColab(true);
      try {
        const res = await api.post(`/datasets/${currentDatasetId}/export/colab`, { mode: "clean" });
        if (res.data && res.data.colab_url) {
          window.open(res.data.colab_url, "_blank");
        } else {
          alert("Failed to get Colab redirect URL from server.");
        }
      } catch (err) {
        console.error("Failed to export to Google Colab:", err);
        alert(err.response?.data?.detail || "Failed to export to Google Colab. Please check your GitHub token permissions.");
      } finally {
        setIsExportingColab(false);
      }
    }, "open_colab");
  };

  const isHousePricingDemo = currentDatasetId === "demo-house-pricing";
  const isDemoDataset = currentDatasetId === "demo-titanic-survival" || isHousePricingDemo;
  const enabledQuery = !!user && !!currentDatasetId && !isDemoDataset;

  const demoEvaluationTitanic = {
    best_model: "RandomForestClassifier",
    best_score: 0.945,
    problem_type: "Classification"
  };

  const demoEvaluationHouse = {
    best_model: "RandomForestRegressor",
    best_score: 0.892,
    problem_type: "Regression"
  };

  // Query: Fetch evaluation results to ensure training was completed first
  const { data: serverEvaluation, isLoading: isEvalLoading } = useQuery({
    queryKey: ["evaluation", currentDatasetId],
    queryFn: () => mlService.getEvaluation(currentDatasetId),
    enabled: enabledQuery,
    retry: false,
  });

  const evaluation = enabledQuery ? serverEvaluation : (isHousePricingDemo ? demoEvaluationHouse : demoEvaluationTitanic);

  // Query: Fetch all jobs to see if a report was already compiled
  const { data: serverJobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await api.get("/jobs");
      return response.data;
    },
    refetchInterval: 5000,
    enabled: !!user,
  });

  const jobs = !!user ? serverJobs : [];

  // Query: Fetch details of the active report generation job
  const { data: job } = useQuery({
    queryKey: ["job", activeJobId],
    queryFn: () => mlService.getJobStatus(activeJobId),
    enabled: !!activeJobId && !!user,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" || status === "RUNNING" ? 1000 : false;
    },
  });

  // Mutation: Trigger report generation
  const generateMutation = useMutation({
    mutationFn: () => reportService.generateReport(currentDatasetId),
    onSuccess: (data) => {
      setGenerateError("");
      setActiveJobId(data.job_id);
    },
    onError: (err) => {
      setGenerateError(
        err.response?.data?.detail || "Failed to generate report. Make sure evaluation results exist."
      );
    },
  });

  // Check if there is a completed report job for the current dataset
  const hasPreviouslyCompletedReport = jobs.some(
    (j) => j.dataset_id === currentDatasetId && j.job_type === "report_generation" && j.status === "COMPLETED"
  );

  // If no dataset is selected
  if (!currentDatasetId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 glass-card rounded-2xl p-8">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">description</span>
        <h2 className="font-headline-sm text-white">No Dataset Selected</h2>
        <p className="text-on-surface-variant max-w-sm text-sm">
          Please upload or select a dataset on the Dashboard to access the Report Center.
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

  // If training has not been run (no evaluation results found)
  if (!isEvalLoading && !evaluation) {
    return (
      <div className="max-w-lg mx-auto bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-amber-500">model_training</span>
        <div className="space-y-2">
          <h3 className="font-headline-sm text-white">Model Training Required</h3>
          <p className="text-on-surface-variant text-sm">
            To compile a comprehensive Data Science report, you must first train models and generate evaluation metrics.
          </p>
        </div>
        <button 
          onClick={() => navigate("/training")}
          className="bg-primary-container text-on-primary-container font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all text-xs"
        >
          Go to Model Training
        </button>
      </div>
    );
  }

  const isJobRunning = job?.status === "PENDING" || job?.status === "RUNNING";
  const isJobFailed = job?.status === "FAILED";
  const isJobCompleted = job?.status === "COMPLETED" || (!activeJobId && hasPreviouslyCompletedReport);

  const downloadUrl = reportService.downloadReportUrl(currentDatasetId);

  return (
    <div className="space-y-12 pb-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-subtle/30 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary-fixed">
            <span className="material-symbols-outlined text-body-md">description</span>
            <span className="font-label-md text-label-md tracking-widest uppercase text-xs">
              PDF Compiler Center
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-tight">
            Data Science Reports
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm sm:text-base">
            Compile automated executive summaries, profiling tables, and machine learning matrices into an exportable PDF format.
          </p>
        </div>
        {evaluation && (
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="bg-primary hover:bg-accent-hover text-background px-6 py-2.5 rounded-lg transition-all font-bold flex items-center gap-2 active:scale-95 text-sm shadow-lg shadow-primary/10"
              >
                <span className="material-symbols-outlined text-sm font-bold">download</span>
                Export Analysis
                <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
              </button>
              
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl bg-surface-container-high border border-border-subtle shadow-2xl z-50 py-1.5 animate-fadeIn">
                  <button
                    onClick={() => handleDownloadNotebook("clean")}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-primary-container/20 text-white text-xs flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-primary-fixed">description</span> Download Notebook (Clean)
                  </button>
                  <button
                    onClick={() => handleDownloadNotebook("learning")}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-primary-container/20 text-white text-xs flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-primary-fixed">school</span> Download Notebook (Learning)
                  </button>
                  <button
                    onClick={handleDownloadScript}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-primary-container/20 text-white text-xs flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-primary-fixed">code</span> Download Python Script
                  </button>
                  <button
                    onClick={handleOpenInColab}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-primary-container/20 text-white text-xs flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <span className="text-sm">🚀</span> Open in Google Colab
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {generateError && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex gap-3 items-center text-error max-w-2xl">
          <span className="material-symbols-outlined text-xl">error</span>
          <p className="text-body-sm text-xs sm:text-sm">{generateError}</p>
        </div>
      )}

      {/* Main Grid layout */}
      <div className="grid grid-cols-12 gap-gutter max-w-5xl mx-auto">
        {/* Left Column: Actions and status */}
        <div className="col-span-12 md:col-span-6 space-y-6">
          {/* Main Control Panel Card */}
          <div className="glass-card rounded-2xl p-8 space-y-8 flex flex-col justify-between min-h-[340px]">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center border border-primary-container/20 text-primary-container">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  picture_as_pdf
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-white text-lg sm:text-xl">Executive PDF Compiler</h3>
                <p className="text-on-surface-variant text-xs sm:text-sm mt-1">
                  Generates an analytical summary containing exploratory data charts, feature weights, confusion matrices, and model recommendations.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              {isJobCompleted && (
                <div className="bg-primary-container/5 border border-primary-container/20 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                    <span className="text-xs font-semibold text-on-surface">Report Compiled</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">PDF Ready</span>
                </div>
              )}

              {isJobRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-on-surface-variant font-mono">
                    <span>COMPILING...</span>
                    <span className="text-primary-fixed font-bold">{job.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border-subtle/50 p-0.5">
                    <div 
                      className="bg-primary-container h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,221,0,0.5)]"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {isJobCompleted ? (
                  <>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-grow bg-primary-container text-on-primary-container font-bold px-6 py-3 rounded-xl hover:bg-accent-hover active:scale-95 transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary-container/10"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Download PDF
                    </a>
                    <button
                      onClick={() => requireAuth(() => generateMutation.mutate(), "generate_report")}
                      disabled={generateMutation.isPending}
                      className="bg-surface-container border border-border-subtle text-white font-semibold px-6 py-3 rounded-xl hover:bg-surface-container-high active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">sync</span>
                      Recompile
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => requireAuth(() => generateMutation.mutate(), "generate_report")}
                    disabled={generateMutation.isPending || isJobRunning}
                    className="flex-grow bg-primary-container text-on-primary-container font-bold px-6 py-3 rounded-xl hover:bg-accent-hover active:scale-95 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-container/10"
                  >
                    {generateMutation.isPending || isJobRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></div>
                        Compiling PDF...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">build</span>
                        Generate Report PDF
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic compiler log */}
        <div className="col-span-12 md:col-span-6">
          <div className="glass-card rounded-2xl p-8 space-y-6 min-h-[340px] flex flex-col justify-between">
            <div>
              <h4 className="font-headline-sm text-headline-sm text-primary text-sm uppercase tracking-wider text-primary-fixed mb-4">
                Compiler Activity Logs
              </h4>
              
              <div className="space-y-3 font-mono text-xs text-on-surface-variant bg-background/50 p-4 rounded-xl border border-border-subtle/50 h-[180px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span>Report context configured for {currentDataset?.filename}</span>
                </div>
                
                {isJobRunning || isJobCompleted ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span>Loading EDA statistics & matrices...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${(job?.progress >= 40 || isJobCompleted) ? "bg-green-500" : "bg-primary-fixed animate-pulse"}`}></span>
                      <span className={(job?.progress >= 40 || isJobCompleted) ? "text-on-surface" : "text-primary-fixed"}>
                        {(job?.progress >= 40 || isJobCompleted) ? "Feature correlation coefficients mapped" : "Fitting correlation grids..."}
                      </span>
                    </div>
                  </>
                ) : null}

                {(job?.progress >= 100 || isJobCompleted) ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span>Loading ML evaluation metrics...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span>Drawing feature importances and residuals...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span className="text-primary-fixed font-bold">Report successfully saved to disk!</span>
                    </div>
                  </>
                ) : isJobRunning && job?.progress >= 40 ? (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse"></span>
                    <span className="text-primary-fixed">Assembling evaluation layouts...</span>
                  </div>
                ) : null}

                {isJobFailed && (
                  <div className="flex items-center gap-2 text-error">
                    <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                    <span>Compilation failed: {job.error || "unexpected server interruption"}</span>
                  </div>
                )}

                {!isJobRunning && !isJobCompleted && !isJobFailed && (
                  <div className="text-neutral-600 italic">
                    Waiting to compile report...
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-on-surface-variant font-mono border-t border-border-subtle/30 pt-4 flex justify-between">
              <span>FORMAT: PDF/A-1a</span>
              <span>COMPILER: report_service.py</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gist Upload Spinner Overlay */}
      {isExportingColab && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50 gap-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-white tracking-wide">Exporting Pipeline to GitHub Gist & Redirecting...</p>
        </div>
      )}

      {/* Manual Google Colab Instructions Modal */}
      {isManualColabModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-high border border-border-subtle rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-primary-fixed">
              <span className="material-symbols-outlined text-3xl">info</span>
              <h3 className="text-lg font-bold text-white">Google Colab Manual Upload</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              A GitHub Personal Access Token (PAT) was not detected in System Settings. Colab requires notebooks to be hosted on public repositories or Gists to open them automatically.
            </p>
            <div className="bg-background/60 p-3.5 rounded-xl border border-border-subtle/50 space-y-2.5">
              <p className="text-[10px] text-primary-fixed font-bold uppercase tracking-wider">Instructions:</p>
              <ol className="list-decimal pl-4 text-[11px] text-white space-y-1.5 leading-normal">
                <li>Click <b>Download Notebook</b> below to save the notebook locally.</li>
                <li>Visit <a href="https://colab.research.google.com" target="_blank" rel="noopener noreferrer" className="text-primary-fixed hover:underline font-bold">colab.research.google.com</a>.</li>
                <li>Go to the <b>Upload</b> tab in the popup dialog and upload your downloaded file.</li>
                <li><i>Tip: Add a GitHub PAT with `gist` scope in settings to enable 1-click Colab export!</i></li>
              </ol>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsManualColabModalOpen(false)}
                className="px-4 py-2 bg-surface-container text-white text-xs font-semibold rounded-lg hover:bg-surface-container-high active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDownloadNotebook();
                  setIsManualColabModalOpen(false);
                }}
                className="px-4 py-2 bg-primary text-background text-xs font-bold rounded-lg hover:bg-accent-hover active:scale-95 transition-all shadow-md"
              >
                Download & Open Colab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
