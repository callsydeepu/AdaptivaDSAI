import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export function DeveloperSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Sensitive values are write-only (never loaded into state from backend)
  const [mongodbUrl, setMongodbUrl] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const [llmProvider, setLlmProvider] = useState("mock");
  const [groqModel, setGroqModel] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [githubToken, setGithubToken] = useState("");

  // Configured flags loaded from backend
  const [configuredFlags, setConfiguredFlags] = useState({
    MONGODB_URL_CONFIGURED: false,
    MONGODB_CONNECTED: false,
    GROQ_API_KEY_CONFIGURED: false,
    GITHUB_TOKEN_CONFIGURED: false,
  });

  const [testingToken, setTestingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(null);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings");
      setDatabaseName(res.data.DATABASE_NAME || "");
      setLlmProvider(res.data.LLM_PROVIDER || "mock");
      setGroqModel(res.data.GROQ_MODEL || "");
      setConfiguredFlags({
        MONGODB_URL_CONFIGURED: res.data.MONGODB_URL_CONFIGURED,
        MONGODB_CONNECTED: res.data.MONGODB_CONNECTED,
        GROQ_API_KEY_CONFIGURED: res.data.GROQ_API_KEY_CONFIGURED,
        GITHUB_TOKEN_CONFIGURED: res.data.GITHUB_TOKEN_CONFIGURED,
      });
      setLoading(false);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Failed to fetch developer settings from server.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTestToken = async () => {
    if (!githubToken.trim()) {
      setTokenStatus({ valid: false, message: "Please enter a token first." });
      return;
    }
    setTestingToken(true);
    setTokenStatus(null);
    try {
      const res = await api.post("/settings/test-github", { github_token: githubToken });
      if (res.data.valid) {
        if (res.data.has_gist_scope) {
          setTokenStatus({
            valid: true,
            message: `Connected! Valid token for user '${res.data.username}' with gist scope.`
          });
        } else {
          setTokenStatus({
            valid: false,
            message: `Connected as '${res.data.username}', but 'gist' scope is missing. Scopes: ${res.data.scopes || "none"}`
          });
        }
      } else {
        setTokenStatus({
          valid: false,
          message: res.data.detail || "Connection failed. Please check the token."
        });
      }
    } catch (err) {
      setTokenStatus({
        valid: false,
        message: err.response?.data?.detail || "Failed to contact verification server."
      });
    } finally {
      setTestingToken(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    const payload = {};
    if (mongodbUrl.trim()) payload.mongodb_url = mongodbUrl;
    if (databaseName.trim()) payload.database_name = databaseName;
    if (groqModel.trim()) payload.groq_model = groqModel;
    if (llmProvider.trim()) payload.llm_provider = llmProvider;
    if (groqApiKey.trim()) payload.groq_api_key = groqApiKey;
    if (githubToken.trim()) payload.github_token = githubToken;

    try {
      await api.post("/settings", payload);
      setSuccess(true);
      setMongodbUrl("");
      setGroqApiKey("");
      setGithubToken("");
      await fetchSettings();
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-headline-sm text-headline-sm text-primary-fixed">Developer Settings</h1>
          <p className="text-body-sm text-on-surface-variant">
            Configure backend database connection details, environment parameters, and custom AI completions models.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="border border-border-subtle hover:bg-surface-container-high px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Status cards */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 border border-border-subtle bg-surface-dim">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">settings_ethernet</span>
              Infrastructure Status
            </h3>

            {/* MongoDB Connection Status */}
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between border border-border-subtle/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white">MongoDB Link</span>
                <span className="text-[10px] text-on-surface-variant">
                  {configuredFlags.MONGODB_URL_CONFIGURED ? "Configured" : "Not Configured"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${configuredFlags.MONGODB_CONNECTED ? "bg-green-500 ai-glow" : "bg-red-500 animate-pulse"}`}></span>
                <span className="text-xs font-semibold text-white">
                  {configuredFlags.MONGODB_CONNECTED ? "Connected" : "Offline fallback"}
                </span>
              </div>
            </div>

            {/* Groq API Configured */}
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between border border-border-subtle/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white">Groq Cloud API</span>
                <span className="text-[10px] text-on-surface-variant">Completions provider</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${configuredFlags.GROQ_API_KEY_CONFIGURED ? "bg-green-500 ai-glow" : "bg-amber-500 animate-pulse"}`}></span>
                <span className="text-xs font-semibold text-white">
                  {configuredFlags.GROQ_API_KEY_CONFIGURED ? "Configured" : "Not set (Mock)"}
                </span>
              </div>
            </div>

            {/* GitHub Token Configured */}
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between border border-border-subtle/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white">GitHub Integration</span>
                <span className="text-[10px] text-on-surface-variant">Notebook Gist exports</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${configuredFlags.GITHUB_TOKEN_CONFIGURED ? "bg-green-500 ai-glow" : "bg-amber-500 animate-pulse"}`}></span>
                <span className="text-xs font-semibold text-white">
                  {configuredFlags.GITHUB_TOKEN_CONFIGURED ? "Configured" : "Not set (Manual)"}
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
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase">MongoDB Connection URL</label>
                    {configuredFlags.MONGODB_URL_CONFIGURED ? (
                      <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Currently Configured</span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Not Configured</span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={mongodbUrl}
                    onChange={(e) => setMongodbUrl(e.target.value)}
                    placeholder={configuredFlags.MONGODB_URL_CONFIGURED ? "••••••••••••••••••••••••••••••••" : "mongodb://username:password@host:port"}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  />
                  <p className="text-[9px] text-on-surface-variant leading-normal">
                    Write-only field. Exposes no secrets. Leave blank to preserve the currently saved MongoDB URL connection string.
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Database Name</label>
                  <input
                    type="text"
                    value={databaseName}
                    onChange={(e) => setDatabaseName(e.target.value)}
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
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value)}
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
                    value={groqModel}
                    onChange={(e) => setGroqModel(e.target.value)}
                    placeholder="llama-3.1-8b-instant"
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase">Groq API Key</label>
                    {configuredFlags.GROQ_API_KEY_CONFIGURED ? (
                      <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Currently Configured</span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Not Configured</span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder={configuredFlags.GROQ_API_KEY_CONFIGURED ? "••••••••••••••••••••••••••••••••" : "Enter Groq API Key gsk_..."}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                  />
                  <p className="text-[9px] text-on-surface-variant leading-normal">
                    Write-only field. Leave blank to preserve the currently saved API key.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-label-md text-xs uppercase tracking-wider text-primary-fixed">GitHub Configuration</h3>
              <hr className="border-border-subtle/40" />

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase">GitHub Personal Access Token (PAT)</label>
                    {configuredFlags.GITHUB_TOKEN_CONFIGURED ? (
                      <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Currently Configured</span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Not Configured</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder={configuredFlags.GITHUB_TOKEN_CONFIGURED ? "••••••••••••••••••••••••••••••••" : "Enter GitHub PAT for Google Colab export..."}
                      className="flex-grow bg-surface-container border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-fixed transition-all"
                    />
                    <button
                      type="button"
                      disabled={testingToken || !githubToken}
                      onClick={handleTestToken}
                      className="bg-surface-container border border-border-subtle hover:bg-surface-container-high px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {testingToken ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Testing...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">swap_calls</span>
                          Test Connection
                        </>
                      )}
                    </button>
                  </div>
                  {tokenStatus && (
                    <div className={`text-[11px] font-semibold flex items-center gap-1.5 p-2 rounded-lg border mt-2 ${
                      tokenStatus.valid
                        ? "border-green-500/20 bg-green-500/5 text-green-400"
                        : "border-error/20 bg-error/5 text-error"
                    }`}>
                      <span className="material-symbols-outlined text-xs">
                        {tokenStatus.valid ? "check_circle" : "error"}
                      </span>
                      <span>{tokenStatus.message}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">
                    Required to automatically upload and host generated Jupyter notebooks as a public Gist, enabling a 1-click launch in Google Colab. Needs the `gist` scope.
                  </p>
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
