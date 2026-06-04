import React, { useEffect, useState } from "react";

export function QualityScoreGauge({ score = 94 }) {
  const [offset, setOffset] = useState(440); // Start full empty

  useEffect(() => {
    // Animate the arc to the score value after component mount
    const progress = score / 100;
    const targetOffset = 440 - (440 * progress);
    const timer = setTimeout(() => {
      setOffset(targetOffset);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="gauge-container z-10 flex-shrink-0">
      <svg className="gauge-svg w-full h-full" viewBox="0 0 160 160">
        <circle 
          cx="80" 
          cy="80" 
          fill="transparent" 
          r="70" 
          stroke="#2A2A2A" 
          strokeWidth="12"
        />
        <circle 
          className="gauge-path" 
          cx="80" 
          cy="80" 
          fill="transparent" 
          r="70" 
          stroke="#ffdd00" 
          strokeLinecap="round" 
          strokeWidth="12" 
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-primary-container text-3xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
          verified
        </span>
      </div>
    </div>
  );
}
