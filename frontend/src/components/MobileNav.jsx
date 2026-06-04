import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export function MobileNav() {
  const navigate = useNavigate();
  
  const activeClass = "flex flex-col items-center gap-1 text-primary-container";
  const inactiveClass = "flex flex-col items-center gap-1 text-on-surface-variant";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low h-16 flex items-center justify-around z-50 border-t border-border-subtle">
      <NavLink to="/" className={({ isActive }) => isActive ? activeClass : inactiveClass} end>
        <span className="material-symbols-outlined">dashboard</span>
        <span className="text-[10px] font-medium">Home</span>
      </NavLink>

      <NavLink to="/profiling" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined">analytics</span>
        <span className="text-[10px] font-medium">Data</span>
      </NavLink>

      <div 
        onClick={() => navigate("/under-construction")}
        className="-mt-8 bg-primary-container text-on-primary-container w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary-container/20 active:scale-90 transition-transform cursor-pointer"
      >
        <span className="material-symbols-outlined text-2xl font-bold">add</span>
      </div>

      <NavLink to="/models" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined">model_training</span>
        <span className="text-[10px] font-medium">Models</span>
      </NavLink>

      <NavLink to="/copilot" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <span className="material-symbols-outlined">auto_awesome</span>
        <span className="text-[10px] font-medium">Copilot</span>
      </NavLink>
    </nav>
  );
}
