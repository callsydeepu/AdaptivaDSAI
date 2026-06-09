import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { datasetService } from "../services/datasetService";
import { useDataset } from "../contexts/DatasetContext";

export function UploadDataset() {
  const navigate = useNavigate();
  const { refreshDatasets, selectDataset } = useDataset();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle, uploading, success, error
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedMeta, setUploadedMeta] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        setStatus("error");
        setErrorMsg("Only CSV files are allowed.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setStatus("idle");
      setErrorMsg("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setUploadProgress(0);
    try {
      const data = await datasetService.uploadDataset(selectedFile, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setUploadedMeta(data);
      setStatus("success");
      
      // Refresh global context and select new dataset
      await refreshDatasets();
      selectDataset(data.dataset_id);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.response?.data?.detail || "Upload failed. Please try again.");
    }
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-8 pb-12">
      <header className="border-b border-border-subtle/30 pb-6">
        <h1 className="font-display-lg text-headline-md text-primary-fixed mb-2">
          Upload Dataset
        </h1>
        <p className="font-body-md text-on-surface-variant">
          Upload your tabular data (CSV format) to begin automated profiling and model training.
        </p>
      </header>

      <div className="glass-card rounded-2xl p-8 space-y-6">
        {status === "success" ? (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-400">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-white mb-2">Upload Completed!</h3>
              <p className="text-on-surface-variant text-sm">
                Dataset <span className="text-white font-bold">{uploadedMeta?.filename}</span> was successfully processed.
              </p>
            </div>
            
            <div className="max-w-md mx-auto grid grid-cols-2 gap-4 bg-surface-container/30 p-4 rounded-xl border border-border-subtle">
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Rows</p>
                <p className="text-headline-sm font-mono text-white text-base">{uploadedMeta?.rows.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Columns</p>
                <p className="text-headline-sm font-mono text-white text-base">{uploadedMeta?.columns}</p>
              </div>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  setStatus("idle");
                }}
                className="bg-transparent border border-on-surface/20 text-on-surface px-6 py-2.5 rounded-lg text-body-sm font-medium hover:bg-surface-container-high transition-colors"
              >
                Upload Another
              </button>
              <button 
                onClick={() => navigate("/")}
                className="bg-primary-container text-on-primary-container px-8 py-2.5 rounded-lg text-body-sm font-bold hover:bg-accent-hover transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Drop Zone / Picker */}
            <div className="border-2 border-dashed border-border-subtle hover:border-primary-container rounded-xl p-10 text-center transition-all cursor-pointer relative bg-surface-container-low/20">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                disabled={status === "uploading"}
              />
              <div className="space-y-4">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                  upload_file
                </span>
                <div>
                  <p className="font-label-md text-white font-semibold">
                    {selectedFile ? selectedFile.name : "Click to select a file"}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    CSV files up to 50MB supported
                  </p>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {status === "error" && (
              <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex gap-3 items-center text-error">
                <span className="material-symbols-outlined text-xl">error</span>
                <p className="text-body-sm text-xs sm:text-sm">{errorMsg}</p>
              </div>
            )}

            {/* Uploading progress bar */}
            {status === "uploading" && (
              <div className="space-y-2 bg-surface-container-low p-4 rounded-xl border border-border-subtle/50">
                <div className="flex justify-between text-body-sm text-xs font-medium">
                  <span className="text-on-surface-variant">Uploading...</span>
                  <span className="text-white font-mono">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-container transition-all duration-150" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleUpload}
                disabled={!selectedFile || status === "uploading"}
                className={`px-8 py-3 rounded-lg font-bold transition-all text-sm flex items-center gap-2 shadow-lg ${
                  selectedFile && status !== "uploading"
                    ? "bg-primary-container text-on-primary-container hover:bg-accent-hover active:scale-95 cursor-pointer shadow-primary-container/10"
                    : "bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed shadow-none"
                }`}
              >
                <span className="material-symbols-outlined text-lg">cloud_upload</span>
                Upload and Process
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
