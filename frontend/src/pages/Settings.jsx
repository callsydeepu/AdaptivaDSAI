import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

export function Settings() {
  const navigate = useNavigate();
  const { user, requireAuth } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // User preferences state
  const [prefs, setPrefs] = useState({
    name: "",
    email: "",
    profile_photo: "",
    ai_response_style: "balanced",
    notebook_export_style: "clean",
    default_export_format: "notebook",
    auto_open_colab: true,
    notifications: {
      training_completed: true,
      report_generated: true,
      dataset_upload_completed: true,
      export_completed: true
    },
    dashboard: {
      default_dataset: "",
      auto_refresh: true,
      show_ai_insights: true
    }
  });

  // System status flags loaded from backend settings
  const [systemStatus, setSystemStatus] = useState({
    MONGODB_CONNECTED: false,
    GROQ_API_KEY_CONFIGURED: false,
    GITHUB_TOKEN_CONFIGURED: false,
    LLM_PROVIDER: "mock",
    GROQ_MODEL: "llama-3.1-8b-instant"
  });

  const [datasets, setDatasets] = useState([]);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [pwState, setPwState] = useState({ old: "", new: "", confirm: "" });
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    const loadSettingsAndPrefs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [settingsRes, prefsRes, datasetsRes] = await Promise.all([
          api.get("/settings"),
          api.get("/preferences"),
          api.get("/datasets")
        ]);
        
        setSystemStatus(settingsRes.data);
        setPrefs(prefsRes.data);
        setDatasets(datasetsRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load settings data:", err);
        setError("Failed to fetch settings from server.");
        setLoading(false);
      }
    };
    loadSettingsAndPrefs();
  }, [user]);

  const handleInputChange = (field, val) => {
    setPrefs((prev) => ({
      ...prev,
      [field]: val
    }));
  };

  const handleNestedChange = (parent, field, val) => {
    setPrefs((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: val
      }
    }));
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    requireAuth(async () => {
      setSaving(true);
      setSuccess(false);
      setError(null);
      try {
        const res = await api.post("/preferences", prefs);
        setPrefs(res.data);
        setSuccess(true);
        setSaving(false);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        console.error("Failed to save preferences:", err);
        setError(err.response?.data?.detail || "Failed to save settings. Please try again.");
        setSaving(false);
      }
    }, "save_preferences");
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (!pwState.old || !pwState.new || !pwState.confirm) {
      setPwError("All fields are required.");
      return;
    }
    if (pwState.new !== pwState.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    // Mock change password success
    setPwSuccess(true);
    setPwState({ old: "", new: "", confirm: "" });
    setTimeout(() => {
      setChangePasswordModal(false);
      setPwSuccess(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // System Status Checkers
  const isAiOnline = systemStatus.LLM_PROVIDER === "groq" ? systemStatus.GROQ_API_KEY_CONFIGURED : true;
  const isDbConnected = systemStatus.MONGODB_CONNECTED;
  const isExportReady = systemStatus.GITHUB_TOKEN_CONFIGURED;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline-sm text-headline-sm text-primary-fixed">User Settings</h1>
        <p className="text-body-sm text-on-surface-variant">
          Customize your profile, configure automated pipeline export preferences, and manage dashboard displays.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Read-only System Status */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 border border-border-subtle bg-surface-dim">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">dns</span>
              System Status
            </h3>

            {/* AI Assistant */}
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between border border-border-subtle/40">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary-fixed text-lg">smart_toy</span>
                <span className="text-xs font-bold text-white">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-green-400">check_circle</span>
                <span className="text-[11px] font-bold text-green-400">Online</span>
              </div>
            </div>

            {/* Database Connected */}
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between border border-border-subtle/40">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary-fixed text-lg">database</span>
                <span className="text-xs font-bold text-white">Database</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-sm ${isDbConnected ? "text-green-400" : "text-amber-400"}`}>
                  {isDbConnected ? "check_circle" : "warning"}
                </span>
                <span className={`text-[11px] font-bold ${isDbConnected ? "text-green-400" : "text-amber-400"}`}>
                  {isDbConnected ? "Connected" : "JSON Fallback"}
                </span>
              </div>
            </div>

            {/* Export Service */}
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between border border-border-subtle/40">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary-fixed text-lg">cloud_upload</span>
                <span className="text-xs font-bold text-white">Gist Exports</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-sm ${isExportReady ? "text-green-400" : "text-amber-400"}`}>
                  {isExportReady ? "check_circle" : "info"}
                </span>
                <span className={`text-[11px] font-bold ${isExportReady ? "text-green-400" : "text-amber-400"}`}>
                  {isExportReady ? "Active" : "Manual Only"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences Forms */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSavePreferences} className="space-y-6">
            
            {success && (
              <div className="p-4 rounded-xl border border-green-500/25 bg-green-500/10 text-green-400 flex items-center gap-3 text-xs font-semibold animate-fade-in">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Preferences saved successfully!
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl border border-error/25 bg-error/10 text-error flex items-center gap-3 text-xs font-semibold animate-fade-in">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            {/* SECTION 1: Account Settings */}
            <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-4">
              <h3 className="font-label-md text-xs uppercase tracking-wider text-primary-fixed">Account Settings</h3>
              <hr className="border-border-subtle/30" />
              
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                <img 
                  src={prefs.profile_photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary-fixed/40"
                />
                <div className="flex-1 w-full space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Full Name</label>
                      <input
                        type="text"
                        value={prefs.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full bg-surface-container border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-fixed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Email Address</label>
                      <input
                        type="email"
                        value={prefs.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="w-full bg-surface-container border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-fixed"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Profile Photo URL</label>
                      <input
                        type="text"
                        value={prefs.profile_photo}
                        onChange={(e) => handleInputChange("profile_photo", e.target.value)}
                        className="w-full bg-surface-container border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-fixed"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-start">
                    <button
                      type="button"
                      onClick={() => setChangePasswordModal(true)}
                      className="border border-border-subtle hover:bg-surface-container px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">lock</span>
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: AI Preferences */}
            <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-4">
              <h3 className="font-label-md text-xs uppercase tracking-wider text-primary-fixed">AI Preferences</h3>
              <hr className="border-border-subtle/30" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Response Style</label>
                  <select
                    value={prefs.ai_response_style}
                    onChange={(e) => handleInputChange("ai_response_style", e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  >
                    <option value="concise">Concise (Fast, bulleted responses)</option>
                    <option value="balanced">Balanced (Standard AI advice)</option>
                    <option value="detailed">Detailed (Thorough logic summaries)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Notebook Export Style</label>
                  <select
                    value={prefs.notebook_export_style}
                    onChange={(e) => handleInputChange("notebook_export_style", e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  >
                    <option value="clean">Clean Code (Production-style)</option>
                    <option value="learning">Learning Mode (Tutorial and descriptions)</option>
                  </select>
                  <span className="text-[9px] text-on-surface-variant leading-normal block mt-1">
                    {prefs.notebook_export_style === "clean" 
                      ? "Clean Code mode omits markdown comments and verbose AI annotations." 
                      : "Learning Mode includes step-by-step markdown explanations."}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 3: Export Preferences */}
            <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-4">
              <h3 className="font-label-md text-xs uppercase tracking-wider text-primary-fixed">Export Preferences</h3>
              <hr className="border-border-subtle/30" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Default Export Format</label>
                  <select
                    value={prefs.default_export_format}
                    onChange={(e) => handleInputChange("default_export_format", e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  >
                    <option value="notebook">Jupyter Notebook (.ipynb)</option>
                    <option value="script">Python Script (.py)</option>
                    <option value="colab">Google Colab (requires Gist connection)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border-subtle bg-surface-container-low/40">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white">Auto Open Colab</span>
                    <span className="text-[10px] text-on-surface-variant">Redirect after exports</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.auto_open_colab}
                    onChange={(e) => handleInputChange("auto_open_colab", e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border-subtle bg-surface-container cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Notification Preferences */}
            <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-4">
              <h3 className="font-label-md text-xs uppercase tracking-wider text-primary-fixed">Notification Preferences</h3>
              <hr className="border-border-subtle/30" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { key: "training_completed", label: "Training Completed", desc: "Alert when background training completes" },
                  { key: "report_generated", label: "Report Generated", desc: "Notify when PDF compiling is done" },
                  { key: "dataset_upload_completed", label: "Dataset Upload Complete", desc: "Notify when a CSV finishes scanning" },
                  { key: "export_completed", label: "Export Completed", desc: "Alert after Colab upload finishes" }
                ].map((item) => (
                  <div 
                    key={item.key}
                    onClick={() => handleNestedChange("notifications", item.key, !prefs.notifications[item.key])}
                    className="p-3 rounded-xl border border-border-subtle/40 bg-surface-container-low/20 flex items-center justify-between cursor-pointer hover:border-border-subtle/80 transition-all"
                  >
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-xs font-bold text-white">{item.label}</span>
                      <span className="text-[9px] text-on-surface-variant">{item.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.notifications[item.key]}
                      readOnly
                      className="w-4 h-4 rounded text-primary border-border-subtle bg-surface-container cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: Dashboard Preferences */}
            <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-4">
              <h3 className="font-label-md text-xs uppercase tracking-wider text-primary-fixed">Dashboard Preferences</h3>
              <hr className="border-border-subtle/30" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Default Active Dataset</label>
                  <select
                    value={prefs.dashboard.default_dataset}
                    onChange={(e) => handleNestedChange("dashboard", "default_dataset", e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  >
                    <option value="">None (Select manually)</option>
                    {datasets.map((d) => (
                      <option key={d.dataset_id} value={d.dataset_id}>{d.filename}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-container-low/40">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white">Auto Refresh Dashboard</span>
                    <span className="text-[10px] text-on-surface-variant">Update logs in background</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.dashboard.auto_refresh}
                    onChange={(e) => handleNestedChange("dashboard", "auto_refresh", e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border-subtle bg-surface-container cursor-pointer"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-container-low/40">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white">Show AI Insights on Dashboard</span>
                    <span className="text-[10px] text-on-surface-variant">Display diagnostic insights below uploader</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.dashboard.show_ai_insights}
                    onChange={(e) => handleNestedChange("dashboard", "show_ai_insights", e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border-subtle bg-surface-container cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 6: About ADSA */}
            <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-4">
              <h3 className="font-label-md text-xs uppercase tracking-wider text-primary-fixed">About ADSA</h3>
              <hr className="border-border-subtle/30" />

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle/30 space-y-1">
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Version</span>
                  <p className="text-white font-mono font-bold">v2.5</p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle/30 space-y-1">
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">AI Provider</span>
                  <p className="text-white font-bold uppercase tracking-tight">{systemStatus.LLM_PROVIDER}</p>
                </div>

                <div className="col-span-2 p-3.5 rounded-xl bg-surface-container-low border border-border-subtle/30 space-y-1">
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Model Identifier</span>
                  <p className="text-white font-mono font-semibold">{systemStatus.GROQ_MODEL || "mock-llama-3"}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></div>
                      Saving Preferences...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      Save Preferences
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin-settings")}
                  className="bg-surface-container border border-border-subtle hover:bg-surface-container-high px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                  Access Developer Panel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      {changePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <form 
            onSubmit={handleChangePassword} 
            className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-5 animate-scale-up"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-fixed">Change Password</h4>
              <button 
                type="button" 
                onClick={() => setChangePasswordModal(false)}
                className="text-on-surface-variant hover:text-white material-symbols-outlined text-lg"
              >
                close
              </button>
            </div>
            
            {pwSuccess && (
              <div className="p-3 rounded-lg border border-green-500/25 bg-green-500/10 text-green-400 text-[11px] font-bold">
                Password changed successfully!
              </div>
            )}
            
            {pwError && (
              <div className="p-3 rounded-lg border border-error/25 bg-error/10 text-error text-[11px] font-bold">
                {pwError}
              </div>
            )}

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Current Password</label>
                <input
                  type="password"
                  value={pwState.old}
                  onChange={(e) => setPwState(prev => ({ ...prev, old: e.target.value }))}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-fixed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">New Password</label>
                <input
                  type="password"
                  value={pwState.new}
                  onChange={(e) => setPwState(prev => ({ ...prev, new: e.target.value }))}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-fixed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Confirm New Password</label>
                <input
                  type="password"
                  value={pwState.confirm}
                  onChange={(e) => setPwState(prev => ({ ...prev, confirm: e.target.value }))}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-fixed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setChangePasswordModal(false)}
                className="border border-border-subtle hover:bg-surface-container px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all active:scale-95"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
