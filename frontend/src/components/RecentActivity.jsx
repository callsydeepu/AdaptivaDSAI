import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useDataset } from "../contexts/DatasetContext";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

export function RecentActivity() {
  const navigate = useNavigate();
  const { datasets } = useDataset();
  const { user } = useContext(AuthContext);

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await api.get("/jobs");
      return response.data;
    },
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["all-sessions"],
    queryFn: async () => {
      const response = await api.get("/copilot/sessions");
      return response.data;
    },
    enabled: !!user,
  });

  // Build dynamic activities from datasets, jobs and sessions
  const activities = [];

  datasets.forEach((d) => {
    activities.push({
      id: `ds-${d.dataset_id}`,
      title: `Dataset "${d.filename}" uploaded`,
      meta: `${d.rows.toLocaleString()} rows • ${d.columns} cols`,
      time: new Date(d.uploaded_at || Date.now()),
      icon: "upload_file",
      color: "text-primary-container bg-primary-container/10",
    });
  });

  jobs.forEach((j) => {
    let statusColor = "text-on-surface-variant bg-surface-container-highest";
    let icon = "info";
    if (j.status === "COMPLETED") {
      statusColor = "text-tertiary-fixed bg-tertiary-container/20";
      icon = "check_circle";
    } else if (j.status === "FAILED") {
      statusColor = "text-error bg-error/20";
      icon = "warning";
    } else if (j.status === "RUNNING") {
      statusColor = "text-primary bg-primary/20";
      icon = "autorenew";
    }

    const typeStr = j.job_type === "training" ? "Model training" : "PDF Report generation";

    activities.push({
      id: `job-${j.job_id}`,
      title: `${typeStr} ${j.status.toLowerCase()}`,
      meta: `Job ID: ${j.job_id.substring(0, 8)}...`,
      time: new Date(j.updated_at || Date.now()),
      icon: icon,
      color: statusColor,
    });
  });

  sessions.forEach((s) => {
    const dataset = datasets.find((d) => d.dataset_id === s.dataset_id);
    const filename = dataset ? dataset.filename : "Unknown Dataset";
    activities.push({
      id: `session-${s.session_id}`,
      title: "Copilot Session Started",
      meta: `Dataset: "${filename}"`,
      time: new Date(s.created_at || Date.now()),
      icon: "chat",
      color: "text-warning bg-warning/10",
    });
  });

  // Sort activities by time descending
  activities.sort((a, b) => b.time - a.time);

  // Take top 4
  const displayActivities = activities.slice(0, 4);

  return (
    <div className="lg:col-span-1 glass-card rounded-3xl flex flex-col min-h-[400px]">
      <div className="p-6 md:p-8 border-b border-border-subtle">
        <h4 className="text-headline-sm font-display-lg text-primary">Recent Activity</h4>
        <p className="text-on-surface-variant text-body-sm">Real-time system event logs</p>
      </div>
      
      <div className="flex-grow p-4 custom-scrollbar overflow-y-auto max-h-[300px] lg:max-h-[320px]">
        <div className="space-y-4">
          {displayActivities.map((act) => (
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
          {displayActivities.length === 0 && (
            <div className="text-center py-10 text-on-surface-variant text-body-sm">
              No recent activity recorded
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 border-t border-border-subtle/30 mt-auto">
        <button 
          onClick={() => navigate('/logs')}
          className="w-full py-3 text-primary-container font-label-md border border-primary-container/20 rounded-xl hover:bg-primary-container/10 transition-all font-semibold active:scale-95"
        >
          View Full System Log
        </button>
      </div>
    </div>
  );
}
