import React from "react";

export function KPICard({ title, value, change, icon, status }) {
  // Map icons and status colors
  const statusColor = status === "error" ? "text-error" : "text-primary-container";

  return (
    <div className="glass-card p-6 rounded-2xl group hover:border-primary-container/30 transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-surface-container-high rounded-xl text-primary-container group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`${statusColor} text-body-sm font-bold`}>{change}</span>
      </div>
      <p className="text-on-surface-variant text-label-md uppercase tracking-wider">{title}</p>
      <h3 className="text-headline-md font-display-lg text-primary mt-1">{value}</h3>
    </div>
  );
}
