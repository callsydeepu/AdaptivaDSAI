import React, { useState } from "react";

export function DatasetPreviewTable({ type = "profiling", data = [] }) {
  const [selectedRow, setSelectedRow] = useState(null);

  if (data.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-6 text-center text-on-surface-variant text-body-sm">
        No preview data available
      </div>
    );
  }

  // Get keys from first object
  const columns = Object.keys(data[0]);

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
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 font-medium">{col}</th>
                ))}
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
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 whitespace-nowrap">
                      {String(row[col])}
                    </td>
                  ))}
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
              <span className="font-medium">Head (First 5)</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-border-subtle">
              {columns.map((col) => (
                <th key={col} className="px-6 py-4 font-label-md text-on-surface-variant uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {data.map((row, idx) => (
              <tr 
                key={idx}
                onClick={() => setSelectedRow(idx)}
                className={`hover:bg-white/5 transition-colors group cursor-pointer ${
                  selectedRow === idx ? "bg-primary-container/10" : ""
                }`}
              >
                {columns.map((col) => {
                  const val = row[col];
                  // If column is ID-like, color it
                  const isId = col.toLowerCase().includes("id") || col.toLowerCase() === "index" || col.toLowerCase() === "row_id";
                  
                  return (
                    <td 
                      key={col} 
                      className={`px-6 py-4 font-body-sm whitespace-nowrap ${
                        isId ? "font-code-snippet text-primary-fixed" : "text-on-surface-variant"
                      }`}
                    >
                      {typeof val === "number" && !Number.isInteger(val) ? val.toFixed(4) : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-surface-container-low border-t border-border-subtle flex items-center justify-center text-body-sm text-on-surface-variant">
        Showing preview of the dataset
      </div>
    </div>
  );
}
