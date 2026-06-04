import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { DataProfiling } from "./pages/DataProfiling";
import { ModelRecommendation } from "./pages/ModelRecommendation";
import { AICopilot } from "./pages/AICopilot";
import { UnderConstruction } from "./pages/UnderConstruction";

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profiling" element={<DataProfiling />} />
          <Route path="/models" element={<ModelRecommendation />} />
          <Route path="/copilot" element={<AICopilot />} />
          
          {/* Fallback construction paths */}
          <Route path="/upload" element={<UnderConstruction />} />
          <Route path="/reports" element={<UnderConstruction />} />
          <Route path="/settings" element={<UnderConstruction />} />
          <Route path="/under-construction" element={<UnderConstruction />} />
          
          {/* Redirection fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
