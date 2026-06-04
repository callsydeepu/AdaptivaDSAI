import React from "react";
import { useNavigate } from "react-router-dom";
import { CandidateModelCard } from "../components/CandidateModelCard";
import { mockCandidates } from "../services/mockDataService";

export function ModelRecommendation() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 pb-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-subtle/30 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary-fixed">
            <span className="material-symbols-outlined text-body-md">verified_user</span>
            <span className="font-label-md text-label-md tracking-widest uppercase text-xs">
              AI Engine Diagnostics
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-tight">
            Model Recommendation
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm sm:text-base">
            Adaptive Intelligence has analyzed your dataset and objective function. Below are the architectural recommendations tailored for your data profile.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => navigate('/under-construction')}
            className="bg-surface-container px-6 py-2.5 rounded-lg border border-border-subtle hover:bg-surface-container-high transition-all font-label-md flex items-center gap-2 active:scale-95 text-sm"
          >
            <span className="material-symbols-outlined text-sm">file_download</span>
            Export Specs
          </button>
          <button 
            onClick={() => navigate('/under-construction')}
            className="bg-primary-container text-on-primary-container px-8 py-2.5 rounded-lg hover:bg-accent-hover transition-all font-bold shadow-lg shadow-primary-container/10 active:scale-95 text-sm"
          >
            Launch Training
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Left Column: Constraints */}
        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          {/* Problem Detection */}
          <section className="glass-card rounded-xl p-6 md:p-8 ai-glow relative overflow-hidden">
            <div className="shimmer absolute inset-0 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6 z-10 relative">
              <span className="font-label-md text-label-md text-primary-fixed text-xs uppercase tracking-wider">
                Problem Detection
              </span>
              <span className="bg-primary-fixed/10 text-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold border border-primary-fixed/20">
                99.8% CERTAINTY
              </span>
            </div>
            
            <div className="space-y-4 z-10 relative">
              <h2 className="font-headline-md text-headline-md text-primary">Binary Classification</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs sm:text-sm">
                The system identified high-cardinality target variables with non-linear distribution patterns across 48 features.
              </p>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4 z-10 relative">
              <div className="bg-background/40 p-4 rounded-lg border border-border-subtle">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Target</p>
                <p className="text-body-md font-code-snippet font-mono text-xs sm:text-sm">churn_label</p>
              </div>
              <div className="bg-background/40 p-4 rounded-lg border border-border-subtle">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Imbalance</p>
                <p className="text-body-md font-code-snippet font-mono text-xs sm:text-sm">1:8.4 (Moderate)</p>
              </div>
            </div>
          </section>

          {/* Constraints */}
          <section className="glass-card rounded-xl p-6 md:p-8">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-6">Optimization Constraints</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-fixed">speed</span>
                  <span className="text-body-md text-xs sm:text-sm">Inference Latency</span>
                </div>
                <span className="text-body-sm font-code-snippet text-primary-fixed font-mono text-xs">&lt; 15ms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-fixed">memory</span>
                  <span className="text-body-md text-xs sm:text-sm">Memory Footprint</span>
                </div>
                <span className="text-body-sm font-code-snippet text-primary-fixed font-mono text-xs">Lightweight</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-fixed">visibility</span>
                  <span className="text-body-md text-xs sm:text-sm">Explainability</span>
                </div>
                <span className="text-body-sm font-code-snippet text-primary-fixed font-mono text-xs">High (SHAP/LIME)</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Model Candidates */}
        <div className="col-span-12 lg:col-span-8 space-y-gutter">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-headline-sm text-headline-sm text-primary">Candidate Models</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/under-construction')}
                className="p-2 bg-surface-container rounded border border-border-subtle hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-sm">filter_list</span>
              </button>
              <button 
                onClick={() => navigate('/under-construction')}
                className="p-2 bg-surface-container rounded border border-border-subtle hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-sm">sort</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {mockCandidates.map((cand, idx) => (
              <CandidateModelCard
                key={idx}
                name={cand.name}
                score={cand.score}
                recommended={cand.recommended}
                description={cand.description}
                metrics={cand.metrics}
                disabled={cand.disabled}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Rationalization */}
      <section className="space-y-6">
        <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-fixed">psychology</span>
          Strategic Rationalization
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="glass-card rounded-xl p-6 space-y-4 hover:border-primary-fixed/30 transition-all cursor-pointer">
            <div className="w-10 h-10 bg-primary-fixed/10 flex items-center justify-center rounded-lg border border-primary-fixed/20 text-primary-fixed">
              <span className="material-symbols-outlined">hub</span>
            </div>
            <h5 className="font-headline-sm text-headline-sm text-primary text-body-lg">Feature Distribution</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-xs sm:text-sm">
              System detected a power-law distribution in 'transaction_volume'. XGBoost was favored due to its native handling of monotonic constraints.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 space-y-4 hover:border-primary-fixed/30 transition-all cursor-pointer">
            <div className="w-10 h-10 bg-primary-fixed/10 flex items-center justify-center rounded-lg border border-primary-fixed/20 text-primary-fixed">
              <span className="material-symbols-outlined">balance</span>
            </div>
            <h5 className="font-headline-sm text-headline-sm text-primary text-body-lg">Imbalance Handling</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-xs sm:text-sm">
              Scale_pos_weight parameter set to 8.4 automatically. SMOTE was rejected due to risk of synthetic noise in high-dimensional space.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 space-y-4 relative overflow-hidden hover:border-primary-fixed/30 transition-all cursor-pointer">
            <img 
              alt="Strategic Insight" 
              className="absolute -right-12 -bottom-12 w-48 h-48 object-contain opacity-10 rotate-12 pointer-events-none" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMM_D1w96VaMnGwXaU-O_3yUozHpmqLNIKwAy3d4LGF7S3G5H5AozFGvJ-GpXVzco0m6VyDWG3Yw4uMSjgtNE0bt6eRJXFKsAOupn2U7OUW7kzFNSfRCFpoEdz2ZSE7BfwTKMnsvBnU9peJp4hS48wYMlcDGpWH9HJNRFSJp33cV8_LE-04iWETa_kqhp4LTTnyuh0Xm9zmofarEd75gfMfas0zX-olOnXfjXJKWZHKJuR9e-yiNN-6iEukBpNzI4GraKDlmV3Ms0"
            />
            <div className="w-10 h-10 bg-primary-fixed/10 flex items-center justify-center rounded-lg border border-primary-fixed/20 text-primary-fixed">
              <span className="material-symbols-outlined">insights</span>
            </div>
            <h5 className="font-headline-sm text-headline-sm text-primary text-body-lg">Cardinality Management</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-xs sm:text-sm z-10 relative">
              CatBoost-style encoding applied to the 'region' and 'merchant_id' features, preventing dimensionality explosion in the recommended trees.
            </p>
          </div>
        </div>
      </section>

      {/* Accuracy lift footer */}
      <footer className="glass-card rounded-xl p-6 md:p-8 border-t-2 border-t-primary-container/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-high" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-primary-fixed" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="176" stroke-dashoffset="18" strokeWidth="4"></circle>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-xs text-primary-fixed">90%</span>
            </div>
            <div>
              <p className="font-headline-sm text-headline-sm text-primary text-body-lg">Estimated Accuracy Lift</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs sm:text-sm">Projected vs. Baseline logistic regression model (+12.4%)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex -space-x-3 overflow-hidden">
              <img 
                alt="Scientist male" 
                className="inline-block h-10 w-10 rounded-full ring-2 ring-background object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhXTwFaSckHNApwWYf1jRJTdaN97mlMKcJWcMPz4NRu3lDfdJDtJ5mp2Ugcc989C_GZpEwBiMhZePOOw3YFNJJemoR6tA-9MT-R58YcY7Kql0cChShjQfG2o6VNcSCn09rREwqSLuNszOGy7V-vqQ1c6zU42lyUg5ZbH2p7rqQtMPo8QBuTkgQphZXuaYK0SBjZTdmSMrFSHeDuSW1kmSPR5j9Ff1XFEcH28aWTXSgJ60rVWv0Y9DQXka1-tSor095YlKQySLlYwQ"
              />
              <img 
                alt="Scientist female" 
                className="inline-block h-10 w-10 rounded-full ring-2 ring-background object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbc2zgRuQbeLXuPI98cVFrObGBu4s5lNFIzEJKMpv0g_lpo679WrzOajc1EfB4dTY66-l-III2Zru_kPJSrpkhBi9unrFR_9OGYSJDYK26Riu75_rPV6MeyDrsTxutNCvIBTs008CPNRhxJvDqWTne84CQ2GazRDsw91xxqPBpoIxiGLprOghWd4c5X4hMAD32iEspth64Sx6zPWjL35-AeMDrZ__SBkks1E3V_anvSkMez-zaFEaKKc3mnGcVgFknjGlDUVb36Ao"
              />
              <div className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-white">
                +12
              </div>
            </div>
            <span className="text-body-sm text-on-surface-variant ml-2 font-medium text-xs sm:text-sm">Collaborators active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
