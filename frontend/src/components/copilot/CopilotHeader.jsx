import React from "react";
import { useCopilot } from "./CopilotContext";
import { useDataset } from "../../contexts/DatasetContext";

export function CopilotHeader() {
  const { currentDataset } = useDataset();
  const {
    setIsCopilotOpen,
    sessions,
    activeSessionId,
    createNewSession,
    selectSession,
    currentPage
  } = useCopilot();

  return (
    <div className="h-20 px-4 border-b border-border-subtle flex flex-col justify-center flex-shrink-0 bg-surface-container-low gap-1 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="material-symbols-outlined text-primary-fixed text-lg animate-pulse">auto_awesome</span>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
              <span>🤖</span> Adaptive AI Assistant
            </h3>
            <p className="text-[9px] text-on-surface-variant truncate">
              Context: <span className="text-primary-fixed uppercase tracking-wider">{currentPage}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Session selector */}
          {sessions.length > 0 && (
            <select
              value={activeSessionId || ""}
              onChange={(e) => selectSession(e.target.value)}
              className="bg-surface-container border border-border-subtle text-white text-[10px] rounded px-2 py-1 focus:outline-none max-w-[120px] truncate"
            >
              {sessions.map((s) => (
                <option key={s.session_id} value={s.session_id}>
                  {new Date(s.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </option>
              ))}
            </select>
          )}

          {/* New Session Action */}
          <button
            onClick={createNewSession}
            className="p-1 rounded bg-surface-container border border-border-subtle text-white hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center"
            title="New Session"
          >
            <span className="material-symbols-outlined text-xs">add</span>
          </button>

          {/* Close drawer button */}
          <button 
            onClick={() => setIsCopilotOpen(false)}
            className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-white"
            title="Close Drawer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>

      {/* Dataset & Session details */}
      <div className="flex justify-between items-center text-[9px] text-on-surface-variant px-1 font-semibold uppercase tracking-wider">
        <div className="truncate max-w-[65%]">
          Dataset: <span className="text-primary-fixed font-bold">{currentDataset?.name || "None Selected"}</span>
        </div>
        <div>
          Session: <span className={activeSessionId ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>
            {activeSessionId ? "Active" : "None"}
          </span>
        </div>
      </div>
    </div>
  );
}
