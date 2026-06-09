import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { DataProfiling } from "./pages/DataProfiling";
import { ModelRecommendation } from "./pages/ModelRecommendation";
import { AICopilot } from "./pages/AICopilot";
import { Settings } from "./pages/Settings";
import { NewExperiment } from "./pages/NewExperiment";
import { UploadDataset } from "./pages/UploadDataset";
import { Training } from "./pages/Training";
import { Reports } from "./pages/Reports";
import { SystemLogs } from "./pages/SystemLogs";

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profiling" element={<DataProfiling />} />
          <Route path="/models" element={<ModelRecommendation />} />
          <Route path="/copilot" element={<AICopilot />} />
          
          {/* Real routes replacing under-construction panels */}
          <Route path="/upload" element={<UploadDataset />} />
          <Route path="/training" element={<Training />} />
          <Route path="/reports" element={<Reports />} />
          
          {/* Settings & New Experiment paths */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/under-construction" element={<NewExperiment />} />
          <Route path="/logs" element={<SystemLogs />} />
          
          {/* Redirection fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;

