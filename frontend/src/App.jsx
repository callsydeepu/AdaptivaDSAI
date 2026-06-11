import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { DataProfiling } from "./pages/DataProfiling";
import { ModelRecommendation } from "./pages/ModelRecommendation";

import { DeveloperSettings } from "./pages/DeveloperSettings";
import { NewExperiment } from "./pages/NewExperiment";
import { UploadDataset } from "./pages/UploadDataset";
import { Training } from "./pages/Training";
import { Reports } from "./pages/Reports";
import { SystemLogs } from "./pages/SystemLogs";
import { CopilotProvider } from "./components/copilot/CopilotProvider";

import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { OAuthCallback } from "./pages/OAuthCallback";
import { AuthModal } from "./components/AuthModal";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CopilotProvider>
          <AuthModal />
          <Routes>
            {/* Public Authentication Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />

            {/* Workspace Layout */}
            <Route
              path="/*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/profiling" element={<DataProfiling />} />
                    <Route path="/models" element={<ModelRecommendation />} />
                    
                    {/* Operational panels */}
                    <Route path="/upload" element={<UploadDataset />} />
                    <Route path="/training" element={<Training />} />
                    <Route path="/reports" element={<Reports />} />
                    
                    {/* New Experiment & Admin paths */}
                    <Route path="/admin-settings" element={<DeveloperSettings />} />
                    <Route path="/experiment" element={<NewExperiment />} />
                    <Route path="/logs" element={<SystemLogs />} />
                    
                    {/* Redirection fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              }
            />
          </Routes>
        </CopilotProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

