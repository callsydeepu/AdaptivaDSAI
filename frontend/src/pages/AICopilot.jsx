import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DatasetPreviewTable } from "../components/DatasetPreviewTable";
import { useDataset } from "../contexts/DatasetContext";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "../hooks/useChat";
import api from "../services/api";

// Custom lightweight React markdown renderer
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-xs sm:text-sm text-on-surface leading-relaxed break-words" style={{ overflowWrap: "anywhere" }}>
      {lines.map((line, idx) => {
        let content = line;
        
        // Match list bullet item
        const isListItem = content.trim().startsWith("- ") || content.trim().startsWith("* ");
        if (isListItem) {
          content = content.trim().substring(2);
        }
        
        // Parse bold markdown (e.g. **text**)
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = boldRegex.exec(content)) !== null) {
          if (match.index > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
          }
          parts.push(
            <strong key={match.index} className="text-primary-fixed font-bold">
              {match[1]}
            </strong>
          );
          lastIndex = boldRegex.lastIndex;
        }
        
        if (lastIndex < content.length) {
          parts.push(content.substring(lastIndex));
        }

        const renderedContent = parts.length > 0 ? parts : content;

        if (isListItem) {
          return (
            <div key={idx} className="flex gap-2 items-start pl-2">
              <span className="text-primary-fixed select-none mt-0.5">•</span>
              <span className="text-on-surface">{renderedContent}</span>
            </div>
          );
        }

        // Spacer for blank lines
        if (!content.trim()) {
          return <div key={idx} className="h-2" />;
        }

        return <p key={idx} className="text-on-surface">{renderedContent}</p>;
      })}
    </div>
  );
}

export function AICopilot() {
  const navigate = useNavigate();
  const { currentDatasetId, currentDataset } = useDataset();
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  
  const { 
    messages, 
    inputVal, 
    setInputVal, 
    isTyping, 
    sendMessage, 
    error,
    sessions,
    activeSessionId,
    createNewSession,
    selectSession
  } = useChat(currentDatasetId);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize sessions view based on screen width
  useEffect(() => {
    setIsSessionsOpen(window.innerWidth >= 1440);
  }, []);

  // Read prefilled question from query parameters (handles HashRouter path syntax)
  useEffect(() => {
    const hash = window.location.hash;
    const queryIdx = hash.indexOf("?");
    if (queryIdx !== -1) {
      const searchParams = new URLSearchParams(hash.substring(queryIdx));
      const question = searchParams.get("question");
      if (question) {
        setInputVal(question);
        
        // Clean URL parameter so it doesn't repeat on reload
        const newHash = hash.substring(0, queryIdx);
        navigate(newHash, { replace: true });
      }
    }
  }, [navigate, setInputVal]);

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Queries for real dataset context details
  const { data: insights } = useQuery({
    queryKey: ["insights", currentDatasetId],
    queryFn: async () => {
      const res = await api.get(`/datasets/${currentDatasetId}/insights`);
      return res.data;
    },
    enabled: !!currentDatasetId,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", currentDatasetId],
    queryFn: async () => {
      const res = await api.get(`/datasets/${currentDatasetId}/profile`);
      return res.data;
    },
    enabled: !!currentDatasetId,
  });

  const { data: eda } = useQuery({
    queryKey: ["eda", currentDatasetId],
    queryFn: async () => {
      const res = await api.get(`/datasets/${currentDatasetId}/eda`);
      return res.data;
    },
    enabled: !!currentDatasetId,
  });

  const { data: previewData = [] } = useQuery({
    queryKey: ["preview", currentDatasetId],
    queryFn: async () => {
      const res = await api.get(`/datasets/${currentDatasetId}/preview`);
      return res.data;
    },
    enabled: !!currentDatasetId,
  });

  // Calculate dynamic outliers count
  const totalOutliers = useMemo(() => {
    if (!eda || !eda.outliers) return 0;
    return Object.values(eda.outliers).reduce((a, b) => a + b, 0);
  }, [eda]);

  // Formulate dynamic recommended actions based on quality scores
  const dynamicActions = useMemo(() => {
    const list = [];
    if (profile) {
      if (profile.missing_values > 0) {
        list.push({
          title: "Impute Missing Values",
          desc: `Found ${profile.missing_values} missing items. Suggesting mode/median imputation scaling.`
        });
      }
      if (profile.duplicate_rows > 0) {
        list.push({
          title: "Remove Duplicate Rows",
          desc: `Found ${profile.duplicate_rows} duplicate entries. Suggesting immediate cleanup.`
        });
      }
    }
    if (totalOutliers > 0) {
      list.push({
        title: "Scale Extreme Outliers",
        desc: `Found ${totalOutliers} outliers. Normalization or Z-score bounds clamping recommended.`
      });
    }
    // Default fallback action
    list.push({
      title: "Analyze Correlations",
      desc: "Perform relationship mapping on numeric features to scan colinearity."
    });
    return list.slice(0, 2);
  }, [profile, totalOutliers]);

  // Handle auto-resizing textarea
  const handleInputChange = (e) => {
    setInputVal(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (inputVal.trim()) {
      sendMessage(inputVal);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Reusable component layout for Dataset Context panel
  const renderDatasetContext = (isMobileOrTablet = false) => {
    return (
      <div className={`flex flex-col gap-6 ${isMobileOrTablet ? "p-1" : ""}`}>
        {!isMobileOrTablet && (
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-headline-sm text-headline-sm text-primary-fixed">Active Context</h2>
            <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant text-[10px] uppercase font-bold tracking-wider border border-border-subtle max-w-[200px] truncate">
              {currentDataset?.filename}
            </span>
          </div>
        )}

        {/* Bento Quality Rating */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2 glass-panel p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group">
            <div className="ai-shimmer absolute inset-0 opacity-20 pointer-events-none"></div>
            <div className="flex items-center gap-2 text-primary-fixed">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Quality Report</span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-display-lg text-white">
                {insights ? `${insights.data_quality_score}%` : "Calculating..."}
              </p>
              <span className="text-xs text-green-400 font-bold">
                {insights?.quality_rating || "Computing"}
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant text-xs truncate">
              {insights?.insights?.[0] || "Data health is being processed."}
            </p>
          </div>

          {/* Metrics cards */}
          <div className="glass-panel p-4 rounded-xl flex flex-col gap-2 border border-border-subtle hover:border-primary-fixed/50 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-primary-fixed text-xl">view_column</span>
            <p className="text-[10px] text-on-surface-variant font-medium">Dimension</p>
            <p className="text-lg font-display-lg text-white">
              {profile ? `${profile.columns} Cols` : "Calculating..."}
            </p>
            <p className="text-[9px] text-on-surface-variant truncate">
              {profile ? `${profile.rows} total records` : ""}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-xl flex flex-col gap-2 border border-border-subtle hover:border-primary-fixed/50 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-primary-fixed text-xl">warning</span>
            <p className="text-[10px] text-on-surface-variant font-medium">Outliers</p>
            <p className="text-lg font-display-lg text-white">
              {totalOutliers} Found
            </p>
            <p className="text-[9px] text-on-surface-variant truncate">
              Across numeric indexes
            </p>
          </div>
        </div>

        {/* Sample Table */}
        <div className="space-y-2 max-w-full overflow-hidden">
          <p className="font-label-md text-on-surface-variant flex items-center gap-2 text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">table_chart</span> 
            Dataset Preview
          </p>
          <div className="max-w-full overflow-x-auto">
            <DatasetPreviewTable type="copilot" data={previewData} />
          </div>
        </div>

        {/* Recommended actions suggestions */}
        <div className="space-y-3">
          <p className="font-label-md text-on-surface-variant flex items-center gap-2 text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">cleaning_services</span> 
            Recommended Actions
          </p>
          <div className="flex flex-col gap-2">
            {dynamicActions.map((act, idx) => (
              <div 
                key={idx}
                onClick={() => sendMessage(act.title)}
                className="p-3 rounded-lg border border-border-subtle bg-surface-container-low hover:border-primary-container group transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <p className="text-body-sm font-bold text-xs sm:text-sm text-white group-hover:text-primary-container transition-colors">
                    {act.title}
                  </p>
                  <span className="material-symbols-outlined text-primary-container opacity-0 group-hover:opacity-100 transition-all text-sm">
                    auto_fix
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">{act.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!currentDatasetId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 glass-card rounded-2xl p-8">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">psychology</span>
        <h2 className="font-headline-sm text-white">No Dataset Selected</h2>
        <p className="text-on-surface-variant max-w-sm text-sm">
          Please upload or select a dataset on the Dashboard to chat with the AI Copilot.
        </p>
        <button 
          onClick={() => navigate("/upload")}
          className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg text-body-sm font-bold hover:bg-accent-hover active:scale-95 transition-all text-xs"
        >
          Upload Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] -mx-margin-mobile md:-mx-12 -mt-4 overflow-hidden flex flex-col border border-border-subtle bg-background rounded-2xl relative min-h-0">
      
      {/* Backdrop overlay for Sessions drawer (Mobile/Tablet) */}
      {isSessionsOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsSessionsOpen(false)}
        />
      )}

      {/* Drawer slide-over for Sessions (Mobile/Tablet) */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-surface-container-low border-r border-border-subtle z-50 transform transition-transform duration-300 flex flex-col lg:hidden ${
        isSessionsOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-4 border-b border-border-subtle flex items-center justify-between flex-shrink-0">
          <span className="text-sm font-bold text-white">Chat Sessions</span>
          <button 
            onClick={() => setIsSessionsOpen(false)}
            className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-white"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        <div className="p-3 border-b border-border-subtle flex-shrink-0">
          <button 
            onClick={() => {
              createNewSession();
              setIsSessionsOpen(false);
            }}
            className="w-full bg-primary-container text-on-primary-container py-2 px-3 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {sessions.map((session) => (
            <button 
              key={session.session_id}
              onClick={() => {
                selectSession(session.session_id);
                setIsSessionsOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-lg text-[11px] transition-all flex items-center justify-between group ${
                activeSessionId === session.session_id 
                  ? "bg-surface-container-high border border-border-subtle text-primary-fixed font-bold" 
                  : "text-on-surface-variant hover:bg-surface-container hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-xs">chat_bubble</span>
                <span className="truncate">
                  {new Date(session.created_at).toLocaleString([], { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Panels Layout */}
      <div className="flex-grow flex overflow-hidden min-h-0 relative">
        
        {/* Left Panel: Active Context (Visible on Desktop/Laptop) */}
        <section className="hidden lg:flex w-full lg:w-[32%] xl:w-[28%] max-w-[400px] p-6 border-r border-border-subtle bg-surface-dim flex-col gap-6 overflow-y-auto custom-scrollbar flex-shrink-0">
          {renderDatasetContext(false)}
        </section>

        {/* Right Panel: Chat Interface */}
        <section className="flex-grow bg-surface-container-lowest flex flex-row relative overflow-hidden h-full min-h-0">
          
          {/* Chat Sessions Sidebar (Desktop/Laptop toggleable) */}
          {isSessionsOpen && (
            <div className="w-56 border-r border-border-subtle bg-surface-container-low flex flex-col flex-shrink-0 h-full hidden lg:flex">
              {/* New Session Button */}
              <div className="p-3 border-b border-border-subtle flex-shrink-0">
                <button 
                  onClick={createNewSession}
                  className="w-full bg-primary-container text-on-primary-container py-2 px-3 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  New Session
                </button>
              </div>
              
              {/* Sessions List */}
              <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {sessions.map((session) => (
                  <button 
                    key={session.session_id}
                    onClick={() => selectSession(session.session_id)}
                    className={`w-full text-left p-2.5 rounded-lg text-[11px] transition-all flex items-center justify-between group ${
                      activeSessionId === session.session_id 
                        ? "bg-surface-container-high border border-border-subtle text-primary-fixed font-bold" 
                        : "text-on-surface-variant hover:bg-surface-container hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-xs">chat_bubble</span>
                      <span className="truncate">
                        {new Date(session.created_at).toLocaleString([], { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Conversational Board */}
          <div className="flex-grow flex flex-col relative h-full overflow-hidden min-w-0">
            
            {/* Chat Header */}
            <div className="h-16 px-4 sm:px-6 border-b border-border-subtle flex items-center justify-between glass-panel flex-shrink-0 bg-surface-container-lowest/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-3 min-w-0">
                {/* Toggle History Button (visible on smaller screens to open drawer, on larger screen to toggle sidebar) */}
                <button
                  onClick={() => setIsSessionsOpen(!isSessionsOpen)}
                  className="p-2 rounded bg-surface-container border border-border-subtle text-white hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
                  title="Chat History"
                >
                  <span className="material-symbols-outlined text-base">history</span>
                </button>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
                <h3 className="font-display-lg text-body-lg font-bold text-white text-xs sm:text-sm truncate">Copilot Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant text-[9px] sm:text-xs uppercase font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span> Secure Chat
                </span>
              </div>
            </div>

            {/* Chat Messages Scrolling Area */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 flex flex-col gap-8 custom-scrollbar min-h-0">
              
              {/* Collapsible Dataset Context at the top of messages on Tablet and Mobile */}
              <div className="lg:hidden w-full flex-shrink-0 space-y-4">
                <div 
                  className="glass-panel p-4 rounded-xl border border-border-subtle flex items-center justify-between cursor-pointer hover:border-primary-fixed/50 transition-all bg-surface-dim"
                  onClick={() => setIsContextExpanded(!isContextExpanded)}
                >
                  <div className="flex items-center gap-2 text-primary-fixed">
                    <span className="material-symbols-outlined text-sm">analytics</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Dataset Context</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {insights ? `Quality: ${insights.data_quality_score}%` : "..."} | {profile ? `${profile.columns} Cols` : "..."}
                    </span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">
                      {isContextExpanded ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                </div>
                
                {isContextExpanded && (
                  <div className="p-3 border border-border-subtle/50 rounded-xl bg-surface-container-lowest/30 animate-fadeIn">
                    {renderDatasetContext(true)}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex gap-3 items-center text-error mx-auto max-w-lg">
                  <span className="material-symbols-outlined text-xl">error</span>
                  <p className="text-xs">{error}</p>
                </div>
              )}

              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[85%] ${
                    msg.isAi ? "self-start" : "self-end flex-row-reverse"
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center border ${
                    msg.isAi 
                      ? "bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/20 border-transparent" 
                      : "bg-surface-container border-border-subtle text-on-surface-variant"
                  }`}>
                    <span className="material-symbols-outlined text-base sm:text-xl">
                      {msg.isAi ? "auto_awesome" : "person"}
                    </span>
                  </div>

                  {/* Message Body */}
                  <div className="space-y-4 w-full min-w-0">
                    <div className={`p-4 sm:p-5 rounded-2xl shadow-md border break-words ${
                      msg.isAi 
                        ? "rounded-tl-none bg-surface-container-high border-border-subtle text-on-surface" 
                        : "rounded-tr-none bg-primary text-background font-medium border-transparent shadow-xl"
                    }`}>
                      {/* Render message with markdown formatting support */}
                      {msg.isAi ? renderMarkdown(msg.content) : (
                        <p className="leading-relaxed text-xs sm:text-sm whitespace-pre-line break-words" style={{ overflowWrap: "anywhere" }}>
                          {msg.content}
                        </p>
                      )}
                    </div>

                    {/* Suggestion Chips */}
                    {msg.isAi && msg.suggestions && (
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button 
                            key={sIdx}
                            onClick={() => sendMessage(sug)}
                            className="px-3 py-1.5 rounded-full border border-border-subtle text-[10px] sm:text-[11px] font-bold text-on-surface-variant hover:border-primary-container hover:text-primary-container hover:bg-primary-container/5 transition-all active:scale-95"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* AI thinking shim */}
              {isTyping && (
                <div className="flex gap-3 sm:gap-4 max-w-[85%] self-start animate-fade-in">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-on-primary-container text-base sm:text-xl">auto_awesome</span>
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none bg-surface-container-high border border-border-subtle flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary-container animate-bounce"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary-container animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary-container animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Floating Dock Container (Standard flex flow to prevent overlaps) */}
            <div className="w-full p-4 border-t border-border-subtle/30 bg-surface-container-lowest/80 backdrop-blur-xl flex justify-center flex-shrink-0">
              <div className="w-full max-w-3xl glass-panel p-2 rounded-2xl shadow-2xl flex flex-col gap-2 border border-white/5 bg-surface-container-high/90">
                <div className="flex items-center gap-2 px-2">
                  <textarea 
                    ref={textareaRef}
                    value={inputVal}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    className="flex-grow bg-transparent border-none focus:ring-0 text-white text-xs sm:text-sm py-2 resize-none custom-scrollbar max-h-24 focus:outline-none placeholder-on-surface-variant/75"
                    placeholder="Ask AI Copilot to analyze, clean, or explain dataset trends..." 
                    rows={1}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!inputVal.trim() || isTyping}
                    className="p-2 sm:p-2.5 bg-primary-container text-on-primary-container rounded-xl hover:bg-accent-hover transition-all disabled:opacity-35 disabled:cursor-not-allowed active:scale-95 flex-shrink-0 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base font-bold">send</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 pb-1 border-t border-border-subtle/30 pt-2 text-[8px] sm:text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">database</span> 
                    Using Model: <span className="text-primary-fixed font-mono">Llama-3.1-Instant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">memory</span> 
                    Context: <span className="text-primary-fixed">Aggregated Schema</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
