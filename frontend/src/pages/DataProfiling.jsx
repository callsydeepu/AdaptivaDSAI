import React from "react";
import { useNavigate } from "react-router-dom";
import { QualityScoreGauge } from "../components/QualityScoreGauge";
import { DatasetPreviewTable } from "../components/DatasetPreviewTable";
import { mockProfileData } from "../services/mockDataService";

export function DataProfiling() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-subtle/30 pb-6">
        <div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-headline-md text-primary-fixed mb-2">
            Data Profiling
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Analyzing <span className="text-primary font-bold">{mockProfileData.datasetName}</span> • Last updated {mockProfileData.lastUpdated}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate('/under-construction')}
            className="bg-surface-container-high border border-border-subtle px-4 py-2.5 rounded-lg text-body-sm font-medium hover:bg-surface-container-highest active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export PDF
          </button>
          <button 
            onClick={() => navigate('/under-construction')}
            className="bg-primary-container text-on-primary-container px-4 py-2.5 rounded-lg text-body-sm font-bold hover:bg-accent-hover active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Re-run Profile
          </button>
        </div>
      </header>

      {/* KPI stats grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {/* Quality Score gauge card */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 flex items-center justify-between overflow-hidden relative border border-border-subtle/55 shadow-md">
          <div className="z-10">
            <p className="font-label-md text-on-surface-variant uppercase tracking-widest mb-1 text-xs">Quality Score</p>
            <h2 className="font-display-lg text-primary-fixed text-display-lg-mobile mb-1">
              {mockProfileData.qualityScore}%
            </h2>
            <p className="text-body-sm text-green-400 flex items-center gap-1 text-xs whitespace-nowrap">
              <span className="material-symbols-outlined text-sm">trending_up</span> +2.4% from last run
            </p>
          </div>
          <QualityScoreGauge score={mockProfileData.qualityScore} />
          <div className="absolute top-0 right-0 w-32 h-full shimmer-ai opacity-30 pointer-events-none"></div>
        </div>

        {/* Row Count */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between border-l-4 border-l-primary-container">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-4">table_rows</span>
          <div>
            <p className="font-label-md text-on-surface-variant uppercase tracking-tighter text-xs">Total Rows</p>
            <h3 className="font-display-lg text-white text-headline-sm">{mockProfileData.totalRows}</h3>
          </div>
        </div>

        {/* Columns Count */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-4">view_column</span>
          <div>
            <p className="font-label-md text-on-surface-variant uppercase tracking-tighter text-xs">Columns</p>
            <h3 className="font-display-lg text-white text-headline-sm">{mockProfileData.columns}</h3>
          </div>
        </div>

        {/* Missing fields */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-4 text-orange-400">warning</span>
          <div>
            <p className="font-label-md text-on-surface-variant uppercase tracking-tighter text-xs">Missing Values</p>
            <h3 className="font-display-lg text-white text-headline-sm">{mockProfileData.missingValues}</h3>
          </div>
        </div>

        {/* Duplicates */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-4 text-primary-container">content_copy</span>
          <div>
            <p className="font-label-md text-on-surface-variant uppercase tracking-tighter text-xs">Duplicates</p>
            <h3 className="font-display-lg text-white text-headline-sm">{mockProfileData.duplicates}</h3>
          </div>
        </div>
      </section>

      {/* Bento Layout section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table preview */}
        <div className="lg:col-span-8 flex flex-col">
          <DatasetPreviewTable type="profiling" data={mockProfileData.sampleRows} />
        </div>

        {/* Sidebar observations and heatmaps */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI observations */}
          <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                <h4 className="font-headline-sm text-white">AI Observations</h4>
              </div>
              <ul className="space-y-4">
                {mockProfileData.observations.map((obs, idx) => {
                  const getIcon = (type) => {
                    if (type === "success") return <span className="material-symbols-outlined text-green-400 mt-0.5">check_circle</span>;
                    if (type === "tip") return <span className="material-symbols-outlined text-primary-container mt-0.5">lightbulb</span>;
                    return <span className="material-symbols-outlined text-orange-400 mt-0.5">info</span>;
                  };

                  return (
                    <li key={idx} className="flex gap-3 items-start text-xs sm:text-sm">
                      {getIcon(obs.type)}
                      <p className="text-body-sm text-on-surface leading-normal">{obs.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Correlation Heatmap */}
          <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h4 className="font-label-md text-on-surface-variant uppercase tracking-widest mb-4 text-xs">
                Correlation Heatmap
              </h4>
              <div className="aspect-square bg-surface-container rounded-lg overflow-hidden relative flex items-center justify-center border border-border-subtle/50 shadow-inner">
                <img 
                  className="w-full h-full object-cover" 
                  alt="A sophisticated dark-themed correlation heatmap visualization."
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvnR063vKMn6KXKb1eUr9qtOBZBb8Fjdgmt8X57FoEiPQdJ3LXFAfsdeuGkesJS3kmph_OFtIVf7XcKmDlZqxsT-l2MFgafJmO3GQcJPtKEYG8ZA5ouR7AZH1wfDXhmtDY6vz11MR06t3o1dwzni41dQWPTH9AiWLkcZb7bWEx6erI2E5zvdpqMRJ5-rtIbO14NE5Ng-YSsf_KEgWjrhRy1ch4-y6YqNuoHXJotyZwLdqmanDMnrk9B7u6EmeD5XPB6jqRYuo-BQU"
                />
                <div 
                  onClick={() => navigate('/under-construction')}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[2px] cursor-pointer"
                >
                  <div className="bg-primary-container text-on-primary-container px-4 py-2 rounded-full font-bold text-label-md flex items-center gap-2">
                    <span className="material-symbols-outlined">zoom_in</span>
                    Expand Heatmap
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Column Breakdowns */}
      <section className="space-y-6">
        <h4 className="font-headline-sm text-white">Column Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProfileData.columnsStats.map((col, idx) => (
            <div 
              key={idx} 
              className={`glass-panel rounded-xl p-5 border-t-2 ${
                col.highlight ? "border-t-primary-container" : "border-t-border-subtle"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h5 className="font-body-md font-bold text-white text-sm sm:text-base">{col.name}</h5>
                  <span className="text-[10px] text-on-surface-variant font-mono uppercase bg-surface-container-highest px-2 py-0.5 rounded mt-1 inline-block">
                    {col.type}
                  </span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-white transition-colors">
                  more_vert
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body-sm text-xs sm:text-sm">
                  <span className="text-on-surface-variant">Min / Count:</span>
                  <span className="text-white font-mono">{col.min}</span>
                </div>
                <div className="flex justify-between text-body-sm text-xs sm:text-sm">
                  <span className="text-on-surface-variant">Max / Modes:</span>
                  <span className="text-white font-mono">{col.max}</span>
                </div>
                <div className="flex justify-between text-body-sm text-xs sm:text-sm">
                  <span className="text-on-surface-variant">Metrics:</span>
                  <span className={`font-mono ${col.highlight ? "text-orange-400" : "text-white"}`}>
                    {col.metric}
                  </span>
                </div>
              </div>
              
              <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-container transition-all duration-1000" 
                  style={{ width: col.width }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
