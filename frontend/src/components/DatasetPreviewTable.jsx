import React, { useState } from "react";

export function DatasetPreviewTable({ type = "profiling", data = [] }) {
  const [selectedRow, setSelectedRow] = useState(null);

  if (type === "copilot") {
    return (
      <div className="flex-1 glass-panel rounded-xl flex flex-col border border-border-subtle overflow-hidden">
        <div className="p-4 border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
          <p className="font-label-md text-on-surface">Sample Preview</p>
          <span className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer hover:text-white transition-colors">
            open_in_full
          </span>
        </div>
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-xs font-code-snippet min-w-[400px]">
            <thead className="bg-surface-container-lowest text-on-surface-variant border-b border-border-subtle">
              <tr>
                <th className="px-4 py-2 font-medium">user_id</th>
                <th className="px-4 py-2 font-medium">signup_date</th>
                <th className="px-4 py-2 font-medium">revenue</th>
                <th className="px-4 py-2 font-medium">region</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.map((row, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedRow(idx)}
                  className={`hover:bg-surface-container-high transition-colors cursor-pointer ${
                    selectedRow === idx ? "bg-primary-container/10" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-primary-fixed">{row.userId}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                  <td className="px-4 py-3">{row.revenue}</td>
                  <td className="px-4 py-3">{row.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Default profiling table
  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h4 className="font-headline-sm text-white">Dataset Preview</h4>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-surface-container rounded-md cursor-pointer text-body-sm text-on-surface-variant w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span className="font-medium">Head (First 10)</span>
            </div>
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-border-subtle">
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase">Row ID</th>
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase">TIMESTAMP</th>
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase">USER_ID</th>
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase">REGION</th>
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase">INTERACTION</th>
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase">VALUE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {data.map((row) => {
              // Color badges for interactions
              const getBadgeClass = (act) => {
                if (act === "PURCHASE") return "bg-blue-900/40 text-blue-300 border-blue-700/50";
                if (act === "VIEW") return "bg-green-900/40 text-green-300 border-green-700/50";
                if (act === "CLICK") return "bg-purple-900/40 text-purple-300 border-purple-700/50";
                return "bg-yellow-900/40 text-yellow-300 border-yellow-700/50";
              };

              return (
                <tr 
                  key={row.id}
                  onClick={() => setSelectedRow(row.id)}
                  className={`hover:bg-white/5 transition-colors group cursor-pointer ${
                    selectedRow === row.id ? "bg-primary-container/10" : ""
                  }`}
                >
                  <td className="px-6 py-4 font-code-snippet text-white">{row.id}</td>
                  <td className="px-6 py-4 font-body-sm text-on-surface-variant whitespace-nowrap">{row.timestamp}</td>
                  <td className="px-6 py-4 font-body-sm text-primary-fixed">{row.userId}</td>
                  <td className="px-6 py-4 font-body-sm text-on-surface-variant">{row.region}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap ${getBadgeClass(row.interaction)}`}>
                      {row.interaction}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-code-snippet text-white">{row.value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-surface-container-low border-t border-border-subtle flex items-center justify-center text-body-sm text-on-surface-variant">
        Showing 5 of 1,240,442 rows
      </div>
    </div>
  );
}
