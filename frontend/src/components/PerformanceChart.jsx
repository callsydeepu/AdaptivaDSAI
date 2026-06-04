import React, { useState } from "react";

export function PerformanceChart() {
  const [activeTab, setActiveTab] = useState("1W");
  const [hoverIndex, setHoverIndex] = useState(null);

  // Mock bar heights for each tab
  const barData = {
    "1D": [40, 55, 30, 85, 90, 75, 60, 45, 80, 70],
    "1W": [60, 45, 80, 65, 95, 70, 55, 85, 60, 75],
    "1M": [75, 85, 90, 60, 80, 65, 85, 95, 70, 80]
  };

  const currentBars = barData[activeTab];

  return (
    <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-3xl min-h-[400px] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h4 className="text-headline-sm font-display-lg text-primary">Model Performance</h4>
          <p className="text-on-surface-variant text-body-sm">Inference speed and accuracy trends</p>
        </div>
        <div className="flex gap-2 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
          {["1D", "1W", "1M"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-label-md transition-all font-semibold ${
                activeTab === tab
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* SVG Chart Mockup */}
      <div className="flex-grow flex items-end gap-2 px-2 md:px-4 py-4 relative min-h-[220px]">
        {/* Horizontal grid lines */}
        <div className="absolute inset-x-0 top-1/4 border-t border-white/5 pointer-events-none"></div>
        <div className="absolute inset-x-0 top-1/2 border-t border-white/5 pointer-events-none"></div>
        <div className="absolute inset-x-0 top-3/4 border-t border-white/5 pointer-events-none"></div>
        
        <div className="flex-grow flex items-end justify-around h-full">
          {currentBars.map((height, idx) => {
            const isTarget = height === 95 || height === 90;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{ height: `${height}%` }}
                className={`w-2 md:w-3.5 rounded-full cursor-pointer transition-all relative group ${
                  isTarget || hoverIndex === idx
                    ? "bg-primary-container"
                    : "bg-primary-container/20"
                }`}
              >
                {/* Accuracy Tooltip */}
                {hoverIndex === idx && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-bright text-white px-2 py-1 rounded text-[10px] font-bold z-10 whitespace-nowrap shadow-lg border border-border-subtle">
                    {(90.0 + (height * 0.1)).toFixed(1)}% Acc.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
