import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CopilotTrigger } from "./copilot/CopilotTrigger";
import { useDataset } from "../contexts/DatasetContext";
import { useQuery } from "@tanstack/react-query";
import { datasetService } from "../services/datasetService";
import { AuthContext } from "../contexts/AuthContext";

export function Navbar() {
  const activeClass = "text-primary-fixed font-bold border-b-2 border-primary-fixed pb-1 font-body-md";
  const inactiveClass = "text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-body-md";

  const { currentDatasetId, selectDataset } = useDataset();
  const { user, logout, setIsAuthModalOpen } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: datasetService.getDatasets,
    refetchOnWindowFocus: true,
    enabled: !!user,
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/login");
  };

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
            to="/reports" 
            className={({ isActive }) => isActive ? activeClass : inactiveClass}
          >
            Reports
          </NavLink>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Global Dataset Selector */}
        {user && datasets.length > 0 && (
          <div className="flex items-center gap-1.5 bg-surface-container-low border border-border-subtle rounded-lg px-2 py-1 focus-within:border-primary-fixed transition-colors">
            <span className="material-symbols-outlined text-primary-fixed text-sm">
              database
            </span>
            <select
              value={currentDatasetId || ""}
              onChange={(e) => selectDataset(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer max-w-[120px] md:max-w-[180px] truncate"
            >
              {datasets.map((d) => (
                <option 
                  key={d.dataset_id} 
                  value={d.dataset_id} 
                  className="bg-surface-dim text-white text-xs"
                >
                  {d.filename}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search bar - hidden on mobile, displayed on larger screens */}
        {user && (
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
        )}
        
        {/* User Dropdown / Sign In Button */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center focus:outline-none hover:scale-105 transition-transform"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username || "User avatar"}
                  className="w-8 h-8 rounded-full border border-primary-fixed object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-fixed text-background flex items-center justify-center font-bold text-sm border border-primary-fixed uppercase">
                  {user.username ? user.username[0] : (user.email ? user.email[0] : "U")}
                </div>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-container-high border border-border-subtle shadow-2xl p-2 z-50 backdrop-blur-xl">
                <div className="px-3 py-2 border-b border-border-subtle mb-1">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Logged in as</p>
                  <p className="text-sm font-semibold text-white truncate">{user.username || "User"}</p>
                  <p className="text-xs text-[#ffe251] truncate font-medium">{user.email}</p>
                </div>

                <Link
                  to="/admin-settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  Admin Settings
                </Link>
                
                <div className="border-t border-border-subtle my-1"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-[#ffe251] hover:bg-[#ebd048] text-[#0A0A0A] font-semibold px-4 py-1.5 rounded-lg text-xs md:text-sm transition-all cursor-pointer hover:shadow-lg hover:shadow-[#ffe251]/10 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm font-bold">login</span>
            Sign In
          </button>
        )}

        <CopilotTrigger variant="navbar" />
      </div>
    </header>
  );
}
