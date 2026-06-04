import React from "react";
import { mockActivities } from "../services/mockDataService";
import { useNavigate } from "react-router-dom";

export function RecentActivity() {
  const navigate = useNavigate();

  return (
    <div className="lg:col-span-1 glass-card rounded-3xl flex flex-col min-h-[400px]">
      <div className="p-6 md:p-8 border-b border-border-subtle">
        <h4 className="text-headline-sm font-display-lg text-primary">Recent Activity</h4>
        <p className="text-on-surface-variant text-body-sm">Real-time system event logs</p>
      </div>
      
      <div className="flex-grow p-4 custom-scrollbar overflow-y-auto max-h-[300px] lg:max-h-[320px]">
        <div className="space-y-4">
          {mockActivities.map((act) => (
            <div 
              key={act.id} 
              className="flex gap-4 p-3 hover:bg-surface-container-high rounded-xl transition-all cursor-pointer border border-transparent hover:border-border-subtle"
            >
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${act.color}`}>
                <span className="material-symbols-outlined text-[20px]">{act.icon}</span>
              </div>
              <div>
                <p className="text-on-surface font-medium text-body-sm">{act.title}</p>
                <p className="text-on-surface-variant text-label-md mt-0.5">{act.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6 border-t border-border-subtle/30 mt-auto">
        <button 
          onClick={() => navigate('/under-construction')}
          className="w-full py-3 text-primary-container font-label-md border border-primary-container/20 rounded-xl hover:bg-primary-container/10 transition-all font-semibold active:scale-95"
        >
          View Full System Log
        </button>
      </div>
    </div>
  );
}
