import React from "react";
import { Link, NavLink } from "react-router-dom";

export function Navbar() {
  const activeClass = "text-primary-fixed font-bold border-b-2 border-primary-fixed pb-1 font-body-md";
  const inactiveClass = "text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-body-md";

  return (
    <header className="fixed top-0 z-50 w-full h-16 flex justify-between items-center px-margin-mobile md:px-margin-desktop bg-background/80 backdrop-blur-xl border-b border-border-subtle shadow-lg shadow-black/40">
      <div className="flex items-center gap-4 lg:gap-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display-lg text-headline-sm text-primary-fixed tracking-tight whitespace-nowrap">
            Adaptive AI
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? activeClass : inactiveClass}
            end
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/profiling" 
            className={({ isActive }) => isActive ? activeClass : inactiveClass}
          >
            Data Profiling
          </NavLink>
          <NavLink 
            to="/models" 
            className={({ isActive }) => isActive ? activeClass : inactiveClass}
          >
            Models
          </NavLink>
          <NavLink 
            to="/copilot" 
            className={({ isActive }) => isActive ? activeClass : inactiveClass}
          >
            AI Copilot
          </NavLink>
          <NavLink 
            to="/reports" 
            className={({ isActive }) => isActive ? activeClass : inactiveClass}
          >
            Reports
          </NavLink>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Search bar - hidden on mobile, displayed on larger screens */}
        <div className="relative group hidden sm:block md:w-48 lg:w-64">
          <input 
            className="bg-surface-container-lowest border border-border-subtle text-on-surface text-body-sm rounded-lg pl-10 pr-4 py-1.5 w-full focus:outline-none focus:border-primary-container transition-all" 
            placeholder="Search insights..." 
            type="text"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
        </div>
        
        <Link 
          to="/settings"
          className="material-symbols-outlined text-primary-fixed text-[28px] hover:scale-110 transition-transform cursor-pointer"
        >
          account_circle
        </Link>
      </div>
    </header>
  );
}
