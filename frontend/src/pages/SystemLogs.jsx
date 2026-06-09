import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export function SystemLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(200);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const terminalEndRef = useRef(null);
  const terminalRef = useRef(null);

  const fetchLogs = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get(`/system-logs?limit=${limit}`);
      setLogs(res.data.logs || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch system logs:", err);
      setError("Failed to fetch system logs from server.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [limit]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs(false);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, limit]);

  // Scroll to bottom when logs load
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to clear the server system logs?")) {
      return;
    }
    try {
      await api.post("/system-logs/clear");
      setLogs([]);
    } catch (err) {
      console.error("Failed to clear system logs:", err);
      alert("Failed to clear logs on server.");
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([logs.join("\n")], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "adsa_system_logs.log";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const parseLogLine = (line) => {
    // Standard format: [2026-06-09 22:43:10] INFO [adsa:dataset_service.py:78] Message
    const regex = /^\[([^\]]+)\]\s+([A-Z]+)\s+\[([^\]]+)\]\s+(.*)$/;
    const match = line.match(regex);

    if (match) {
      const [_, timestamp, level, source, message] = match;
      let levelColor = "text-on-surface-variant";
      if (level === "INFO") levelColor = "text-green-400";
      else if (level === "WARNING") levelColor = "text-amber-400";
      else if (level === "ERROR" || level === "CRITICAL") levelColor = "text-red-400";

      return (
        <span className="block py-0.5 font-mono text-[11px] leading-relaxed select-text">
          <span className="text-on-surface-variant/75 mr-2">[{timestamp}]</span>
          <span className={`${levelColor} font-bold mr-2`}>{level}</span>
          <span className="text-blue-300 mr-2">[{source}]</span>
          <span className="text-white">{message}</span>
        </span>
      );
    }

    // Fallback if not matched
    let lineClass = "text-white";
    if (line.includes("INFO")) lineClass = "text-green-300";
    else if (line.includes("WARNING")) lineClass = "text-amber-300";
    else if (line.includes("ERROR") || line.includes("Exception")) lineClass = "text-red-300";

    return (
      <span className={`block py-0.5 font-mono text-[11px] leading-relaxed select-text ${lineClass}`}>
        {line}
      </span>
    );
  };

  const filteredLogs = logs.filter((line) =>
    line.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-headline-sm text-headline-sm text-primary-fixed flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-primary">terminal</span>
            System Logs
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Monitor live FastAPI server activities, background training jobs, and database triggers.
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 border border-border-subtle/50 px-4 py-2 rounded-xl text-xs font-semibold text-white hover:bg-surface-container-high transition-all active:scale-95 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Dashboard
        </button>
      </div>

      <div className="glass-panel border border-border-subtle bg-surface-dim rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Terminal Header / Controls */}
        <div className="p-4 bg-surface-container border-b border-border-subtle/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-grow sm:flex-grow-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-surface-dim border border-border-subtle/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-primary-fixed w-full sm:w-60 transition-all"
              />
            </div>

            {/* Line Limit */}
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-surface-dim border border-border-subtle/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value={50}>Last 50 lines</option>
              <option value={100}>Last 100 lines</option>
              <option value={200}>Last 200 lines</option>
              <option value={500}>Last 500 lines</option>
              <option value={1000}>Last 1000 lines</option>
            </select>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                autoRefresh
                  ? "bg-green-500/10 border-green-500/30 text-green-400 font-bold"
                  : "border-border-subtle/80 text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-green-400 ai-glow" : "bg-on-surface-variant/40"}`}></span>
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(true)}
                className="bg-surface-dim border border-border-subtle/80 text-white p-2 rounded-xl hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center"
                title="Refresh Logs"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
              </button>

              <button
                onClick={handleDownload}
                className="bg-surface-dim border border-border-subtle/80 text-white p-2 rounded-xl hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center"
                title="Download Log File"
              >
                <span className="material-symbols-outlined text-sm">download</span>
              </button>

              <button
                onClick={handleClear}
                className="border border-error/25 bg-error/5 text-error px-3 py-1.5 rounded-xl hover:bg-error/10 active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold"
                title="Clear Logs"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                Clear Logs
              </button>
            </div>
          </div>
        </div>

        {/* Terminal Container */}
        <div 
          ref={terminalRef}
          className="flex-grow p-5 bg-[#0b0c10] border-t border-border-subtle/30 overflow-y-auto max-h-[500px] font-mono custom-scrollbar relative"
        >
          {loading ? (
            <div className="absolute inset-0 bg-[#0b0c10]/70 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-on-surface-variant">Streaming system logs...</span>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="p-4 rounded-xl border border-error/25 bg-error/10 text-error flex items-center gap-3 text-xs font-semibold mb-4">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <div className="space-y-1">
            {filteredLogs.map((line, idx) => (
              <div key={idx} className="hover:bg-white/5 px-2 py-0.5 rounded transition-all">
                {parseLogLine(line)}
              </div>
            ))}

            {filteredLogs.length === 0 && !loading && (
              <div className="text-center py-20 text-on-surface-variant text-xs font-mono">
                No logs recorded or matching your query.
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container border-t border-border-subtle/30 flex items-center justify-between text-[10px] text-on-surface-variant/80 font-mono">
          <span>Active log: backend/logs/app.log</span>
          <span>Showing {filteredLogs.length} of {logs.length} loaded lines</span>
        </div>
      </div>
    </div>
  );
}
