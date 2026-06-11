import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export function Sidebar() {
  const navigate = useNavigate();
  
  const activeClass = "flex items-center gap-3 bg-primary-container text-on-primary-container rounded-lg px-4 py-2 mx-2 transition-all cursor-pointer";
  const inactiveClass = "flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg px-4 py-2 mx-2 transition-all group cursor-pointer";

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface-container-lowest border-r border-border-subtle py-6 space-y-2 z-40">
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-container-low/40 border border-border-subtle/50">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-container ai-glow"></div>
          <div>
            <p className="text-primary-fixed font-bold text-label-md leading-none">V2.4 Active</p>
            <p className="text-on-surface-variant text-body-sm mt-1">System Ready</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/experiment')}
          className="w-full mt-6 bg-primary-container hover:bg-accent-hover text-on-primary-container font-bold py-3 rounded-xl active:scale-95 transition-transform duration-150 shadow-lg shadow-primary-container/10"
        >
          New Experiment
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        <NavLink to="/" className={({ isActive }) => isActive ? activeClass : inactiveClass} end>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-md text-label-md">Dashboard</span>
        </NavLink>
        
        <NavLink to="/upload" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <span className="material-symbols-outlined group-hover:text-primary-fixed transition-colors">cloud_upload</span>
          <span className="font-label-md text-label-md">Upload</span>
        </NavLink>
        
        <NavLink to="/profiling" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <span className="material-symbols-outlined group-hover:text-primary-fixed transition-colors">analytics</span>
          <span className="font-label-md text-label-md">Data Profiling</span>
        </NavLink>

        <NavLink to="/models" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <span className="material-symbols-outlined group-hover:text-primary-fixed transition-colors">model_training</span>
          <span className="font-label-md text-label-md">Model specs</span>
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <span className="material-symbols-outlined group-hover:text-primary-fixed transition-colors">description</span>
          <span className="font-label-md text-label-md">Reports</span>
        </NavLink>
      </nav>
    </aside>
  );
}
