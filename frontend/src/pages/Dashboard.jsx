import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KPICard } from "../components/KPICard";
import { PerformanceChart } from "../components/PerformanceChart";
import { RecentActivity } from "../components/RecentActivity";
import { mockKpis, mockRecommendations } from "../services/mockDataService";

export function Dashboard() {
  const navigate = useNavigate();
  const [accuracy, setAccuracy] = useState(99.2);

  // Replicate accuracy fluctuation script from dashboard
  useEffect(() => {
    const interval = setInterval(() => {
      const fluctuation = (Math.random() * 0.1).toFixed(2);
      setAccuracy(99.20 + parseFloat(fluctuation));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden min-h-[360px] flex items-center shadow-2xl">
        <img 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.3] contrast-[1.1]" 
          alt="A sophisticated data visualization dashboard showing interconnected neural networks."
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLiLqXrnF8aLVXklKSlSeqAJwYnaaWgJl0C7pDlwFiX0wUpJ8nXzdygqH98wR3Qjo8y1P3jiz5eZmVCJjoDBDRKZg6T9b00tHjxhULh_zc_lcwywWH6UEloxetz__J1FcG9MViR_xgjiyKgpirQ2mt6Og9UT5QdlsXcU7y3nIfM3yCJVbzJ7t2oSjkLrdxb3D6XCwhmciIu18e6foUfPcQY89Dv-DpvrsUVxSlJGufcvUm_ZP31BzE_Xao9OBKnmuAj9cpmyngPgo"
        />
        <div className="relative z-10 p-6 sm:p-10 md:p-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full mb-6">
            <span className="material-symbols-outlined text-primary-container text-sm animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <span className="text-primary-container font-label-md uppercase tracking-wider text-xs font-semibold">
              Next Gen Intelligence
            </span>
          </div>
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-4 leading-tight">
            Transform Raw Data Into <span className="text-primary-container italic">Intelligent Insights</span>
          </h2>
          <p className="text-on-surface-variant font-body-lg mb-10 max-w-xl text-sm sm:text-base">
            Harness the power of adaptive machine learning to profile, analyze, and deploy predictive models with unprecedented precision and speed.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/upload')}
              className="bg-primary-container text-on-primary-container px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold hover:bg-accent-hover active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">cloud_upload</span>
              Upload Dataset
            </button>
            <button 
              onClick={() => navigate('/under-construction')}
              className="bg-transparent border border-on-surface/20 text-on-surface px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold hover:bg-surface-container-high active:scale-95 transition-all"
            >
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {mockKpis.map((kpi) => {
          const isAccuracy = kpi.id === "analysis-accuracy";
          return (
            <KPICard
              key={kpi.id}
              title={kpi.title}
              value={isAccuracy ? `${accuracy.toFixed(1)}%` : kpi.value}
              change={kpi.change}
              icon={kpi.icon}
              status={kpi.status}
            />
          );
        })}
      </section>

      {/* Bento Analytics Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Performance Chart */}
        <PerformanceChart />
        
        {/* Recent Activity Logs */}
        <RecentActivity />
      </section>

      {/* Secondary Insights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {/* AI Recommendations */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between min-h-[220px]">
          <div>
            <h5 className="text-primary font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">psychology</span>
              AI Recommendations
            </h5>
            <ul className="space-y-3">
              {mockRecommendations.map((rec, idx) => (
                <li key={idx} className={`p-3 bg-surface-container rounded-lg border-l-4 ${rec.borderClass}`}>
                  <p className="text-body-sm text-on-surface text-xs sm:text-sm">{rec.title}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Dataset Distribution */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between min-h-[220px]">
          <div>
            <h5 className="text-primary font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">hub</span>
              Dataset Distribution
            </h5>
            <div className="flex items-center gap-4 h-24">
              <div className="relative w-16 h-16 rounded-full border-4 border-primary-container border-t-transparent animate-spin duration-[10s] flex-shrink-0"></div>
              <div className="flex-grow space-y-2">
                <div className="flex justify-between text-label-md">
                  <span className="text-on-surface-variant font-medium text-xs">Structured</span>
                  <span className="text-primary font-mono text-xs">68%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full w-[68%]"></div>
                </div>
                <div className="flex justify-between text-label-md">
                  <span className="text-on-surface-variant font-medium text-xs">Unstructured</span>
                  <span className="text-primary font-mono text-xs">32%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-tertiary-container h-full w-[32%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scale analysis promotion card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center text-center min-h-[220px]">
          <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mb-4 text-primary-container">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              rocket_launch
            </span>
          </div>
          <h5 className="text-primary font-bold mb-1">Scale your Analysis</h5>
          <p className="text-on-surface-variant text-body-sm mb-4 text-xs sm:text-sm">
            Upgrade to Enterprise for unlimited real-time model training.
          </p>
          <button 
            onClick={() => navigate('/under-construction')}
            className="bg-on-surface text-background px-6 py-2 rounded-lg font-bold text-label-md hover:bg-primary active:scale-95 transition-colors text-xs font-semibold"
          >
            Upgrade Now
          </button>
        </div>
      </section>
    </div>
  );
}
