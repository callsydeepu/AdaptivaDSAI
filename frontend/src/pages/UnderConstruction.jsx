import React from "react";
import { useNavigate } from "react-router-dom";

export function UnderConstruction() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-6">
      <div className="w-20 h-20 bg-primary-container/10 rounded-full flex items-center justify-center border border-primary-container/20 text-primary-container animate-pulse shadow-lg shadow-primary-container/15">
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          construction
        </span>
      </div>
      
      <div className="space-y-2">
        <h2 className="font-display-lg text-headline-sm text-primary">Feature Under Construction</h2>
        <p className="font-body-md text-on-surface-variant max-w-md mx-auto text-xs sm:text-sm">
          We are currently training our AI models and refining statistics panels for this view. Check back soon for new capabilities!
        </p>
      </div>

      <button 
        onClick={() => navigate("/")}
        className="bg-primary-container hover:bg-accent-hover text-on-primary-container font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all text-xs font-semibold"
      >
        Return to Dashboard
      </button>
    </div>
  );
}
