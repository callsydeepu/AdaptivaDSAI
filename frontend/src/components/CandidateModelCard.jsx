import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export function CandidateModelCard({ name, score, recommended, description, metrics, disabled }) {
  const navigate = useNavigate();
  const { requireAuth } = useContext(AuthContext);

  const handleAction = () => {
    requireAuth(() => {
      navigate('/experiment');
    }, "configure_experiment");
  };

  return (
    <div className={`hover-glass-card rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6 md:gap-8 ${
      recommended ? "border-l-4 border-l-primary-container" : ""
    } ${disabled ? "opacity-70" : ""}`}>
      {/* Score gauge bubble */}
      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex-shrink-0 flex items-center justify-center border ${
        recommended 
          ? "bg-primary-container/10 border-primary-container/20 text-primary-fixed"
          : "bg-surface-container-high border-border-subtle text-on-surface"
      }`}>
        <div className="text-center">
          <p className={`text-2xl font-bold ${recommended ? "text-primary-fixed" : ""}`}>{score}</p>
          <p className={`text-[10px] uppercase ${recommended ? "text-primary-fixed/70" : "text-on-surface-variant"}`}>Score</p>
        </div>
      </div>
      
      {/* Specs details */}
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <h4 className="font-headline-sm text-headline-sm text-primary">{name}</h4>
          {recommended && (
            <span className="bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded font-bold">
              RECOMMENDED
            </span>
          )}
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xl">{description}</p>
        
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
          {metrics.map((m, idx) => (
            <span key={idx} className="text-[11px] bg-surface-container-high px-2 py-1 rounded border border-border-subtle text-on-surface font-mono">
              {m}
            </span>
          ))}
        </div>
      </div>
      
      {/* Action button */}
      <div className="w-full sm:w-auto flex-shrink-0">
        <button 
          onClick={handleAction}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 ${
            recommended 
              ? "bg-primary-container text-on-primary-container hover:bg-accent-hover"
              : "border border-border-subtle text-on-surface hover:bg-surface-container-high"
          }`}
        >
          {recommended ? "Configure" : "Select"}
        </button>
      </div>
    </div>
  );
}
