import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataset } from "../contexts/DatasetContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { mlService } from "../services/mlService";
import { reportService } from "../services/reportService";
import api from "../services/api";

export function Reports() {
  const navigate = useNavigate();
  const { currentDatasetId, currentDataset } = useDataset();
  const [activeJobId, setActiveJobId] = useState(null);
  const [generateError, setGenerateError] = useState("");

  // Query: Fetch evaluation results to ensure training was completed first
  const { data: evaluation, isLoading: isEvalLoading } = useQuery({
    queryKey: ["evaluation", currentDatasetId],
    queryFn: () => mlService.getEvaluation(currentDatasetId),
    enabled: !!currentDatasetId,
    retry: false,
  });

  // Query: Fetch all jobs to see if a report was already compiled
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await api.get("/jobs");
      return response.data;
    },
    refetchInterval: 5000,
  });

  // Query: Fetch details of the active report generation job
  const { data: job } = useQuery({
    queryKey: ["job", activeJobId],
    queryFn: () => mlService.getJobStatus(activeJobId),
    enabled: !!activeJobId,
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
                      onClick={() => generateMutation.mutate()}
                      disabled={generateMutation.isPending}
                      className="bg-surface-container border border-border-subtle text-white font-semibold px-6 py-3 rounded-xl hover:bg-surface-container-high active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">sync</span>
                      Recompile
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => generateMutation.mutate()}
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
    </div>
  );
}
