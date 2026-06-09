import React, { useState, useEffect } from "react";
import api from "../services/api";

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [settings, setSettings] = useState({
    MONGODB_URL: "",
    DATABASE_NAME: "",
    GROQ_MODEL: "",
    LLM_PROVIDER: "",
    GROQ_API_KEY_CONFIGURED: false,
    MONGODB_CONNECTED: false,
  });

  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        setSettings(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Failed to fetch settings from server.");
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    const payload = {
      mongodb_url: settings.MONGODB_URL,
      database_name: settings.DATABASE_NAME,
      groq_model: settings.GROQ_MODEL,
      llm_provider: settings.LLM_PROVIDER,
    };

    if (apiKey.trim()) {
      payload.groq_api_key = apiKey;
    }

    try {
      const res = await api.post("/settings", payload);
      setSuccess(true);
      setSettings((prev) => ({
        ...prev,
        MONGODB_CONNECTED: res.data.mongodb_connected,
        GROQ_API_KEY_CONFIGURED: apiKey.trim() ? true : prev.GROQ_API_KEY_CONFIGURED,
      }));
      setApiKey("");
      setSaving(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(err.response?.data?.detail || "Failed to save settings. Check your connections.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline-sm text-headline-sm text-primary-fixed">System Settings</h1>
        <p className="text-body-sm text-on-surface-variant">
          Configure backend database connection details, fallback parameters, and custom AI completions models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Status cards */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 border border-border-subtle bg-surface-dim">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">settings_ethernet</span>
              Connection Status
            </h3>

            {/* MongoDB Connection Status */}
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between border border-border-subtle/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white">MongoDB Status</span>
                <span className="text-[10px] text-on-surface-variant">Database cluster</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${settings.MONGODB_CONNECTED ? "bg-green-500 ai-glow" : "bg-red-500 animate-pulse"}`}></span>
                <span className="text-xs font-semibold text-white">
                  {settings.MONGODB_CONNECTED ? "Connected" : "Offline fallback"}
                </span>
              </div>
            </div>

            {/* Groq API Configured */}
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between border border-border-subtle/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white">Groq API Key</span>
                <span className="text-[10px] text-on-surface-variant">AI Insights completions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${settings.GROQ_API_KEY_CONFIGURED ? "bg-green-500 ai-glow" : "bg-amber-500 animate-pulse"}`}></span>
                <span className="text-xs font-semibold text-white">
                  {settings.GROQ_API_KEY_CONFIGURED ? "Configured" : "Not set (Mock)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Settings inputs form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-dim space-y-6">
            {success && (
              <div className="p-4 rounded-xl border border-green-500/25 bg-green-500/10 text-green-400 flex items-center gap-3 text-xs font-semibold animate-fade-in">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Settings updated and database connection refreshed successfully!
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl border border-error/25 bg-error/10 text-error flex items-center gap-3 text-xs font-semibold animate-fade-in">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-label-md text-xs uppercase tracking-wider text-primary-fixed">Database Configuration</h3>
              <hr className="border-border-subtle/40" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">MongoDB Connection URL</label>
                  <input
                    type="text"
                    name="MONGODB_URL"
                    value={settings.MONGODB_URL || ""}
                    onChange={handleInputChange}
                    placeholder="mongodb://localhost:27017"
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Database Name</label>
                  <input
                    type="text"
                    name="DATABASE_NAME"
                    value={settings.DATABASE_NAME || ""}
                    onChange={handleInputChange}
                    placeholder="adsa"
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-label-md text-xs uppercase tracking-wider text-primary-fixed">LLM & AI Configuration</h3>
              <hr className="border-border-subtle/40" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">LLM Provider</label>
                  <select
                    name="LLM_PROVIDER"
                    value={settings.LLM_PROVIDER || ""}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  >
                    <option value="mock">Offline Mock Provider</option>
                    <option value="groq">Groq Cloud API</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Groq Model Identifier</label>
                  <input
                    type="text"
                    name="GROQ_MODEL"
                    value={settings.GROQ_MODEL || ""}
                    onChange={handleInputChange}
                    placeholder="llama-3.1-8b-instant"
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">
                    Groq API Key {settings.GROQ_API_KEY_CONFIGURED && "(Currently Configured)"}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={settings.GROQ_API_KEY_CONFIGURED ? "••••••••••••••••••••••••••••••••" : "Enter Groq API Key gsk_..."}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">save</span>
                    Save Configurations
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
