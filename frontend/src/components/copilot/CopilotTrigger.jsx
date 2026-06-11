import React, { useContext } from "react";
import { useCopilot } from "./CopilotContext";
import { useDataset } from "../../contexts/DatasetContext";
import { AuthContext } from "../../contexts/AuthContext";

export function CopilotTrigger({ variant = "navbar", className = "" }) {
  const { isCopilotOpen, setIsCopilotOpen } = useCopilot();
  const { currentDatasetId } = useDataset();
  const { requireAuth } = useContext(AuthContext);

  // Disable triggers if no active dataset is selected
  if (!currentDatasetId) return null;

  if (variant === "floating") {
    if (isCopilotOpen) return null;
    return (
      <button
        onClick={() => requireAuth(() => setIsCopilotOpen(true), "copilot")}
        className={`fixed bottom-24 md:bottom-8 right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 bg-primary text-background rounded-full shadow-2xl flex items-center justify-center hover:bg-accent-hover hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(255,221,0,0.4)] ${className} cursor-pointer`}
        title="Open AI Assistant"
      >
        <span className="material-symbols-outlined text-xl sm:text-2xl font-bold">smart_toy</span>
      </button>
    );
  }

  // Navbar variant
  return (
    <button
      onClick={() => requireAuth(() => setIsCopilotOpen(!isCopilotOpen), "copilot")}
      className={`relative group flex items-center justify-center p-1.5 rounded-lg border transition-all duration-300 cursor-pointer ${
        isCopilotOpen
          ? "bg-primary-container text-on-primary-container border-primary shadow-[0_0_10px_rgba(255,221,0,0.2)]"
          : "bg-surface-container border-border-subtle/50 text-primary-fixed hover:border-primary-container"
      } ${className}`}
      title="Open AI Assistant"
    >
      <span className="material-symbols-outlined text-[24px]">smart_toy</span>
      <span className="sr-only">Toggle AI Assistant</span>
    </button>
  );
}
