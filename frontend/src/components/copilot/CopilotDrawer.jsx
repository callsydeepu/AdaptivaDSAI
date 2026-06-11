import React, { useRef, useEffect } from "react";
import { useCopilot } from "./CopilotContext";
import { useDataset } from "../../contexts/DatasetContext";
import { CopilotHeader } from "./CopilotHeader";

// Custom lightweight React markdown renderer
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-xs text-on-surface leading-relaxed break-words" style={{ overflowWrap: "anywhere" }}>
      {lines.map((line, idx) => {
        let content = line;
        
        const isListItem = content.trim().startsWith("- ") || content.trim().startsWith("* ");
        if (isListItem) {
          content = content.trim().substring(2);
        }
        
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
            <div key={idx} className="flex gap-1.5 items-start pl-2">
              <span className="text-primary-fixed select-none mt-0.5">•</span>
              <span className="text-on-surface">{renderedContent}</span>
            </div>
          );
        }

        if (!content.trim()) {
          return <div key={idx} className="h-2" />;
        }

        return <p key={idx} className="text-on-surface">{renderedContent}</p>;
      })}
    </div>
  );
}

export function CopilotDrawer() {
  const { currentDatasetId } = useDataset();
  const {
    isCopilotOpen,
    setIsCopilotOpen,
    messages,
    inputVal,
    setInputVal,
    isTyping,
    sendMessage,
    error
  } = useCopilot();

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isCopilotOpen]);

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

  // Define Quick Actions
  const quickActions = [
    { label: "Explain Dataset", query: "Explain the overall characteristics and properties of this dataset" },
    { label: "Detect Outliers", query: "Are there any outliers in this dataset and which columns have them?" },
    { label: "Recommend Best Model", query: "Which machine learning model is recommended for this dataset and why?" },
    { label: "Explain Correlations", query: "Explain the correlations and patterns found in this dataset" },
    { label: "Summarize Report", query: "Summarize the findings and insights of the report for this dataset" },
    { label: "Why Was This Model Selected?", query: "Why was the best performing model selected for this dataset?" }
  ];

  return (
    <>
      {/* Backdrop overlay */}
      {isCopilotOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsCopilotOpen(false)}
        />
      )}

      {/* Slide-over assistant drawer panel */}
      {/* w-full on mobile, 80vw on tablet, 480px on desktop */}
      <div 
        className={`fixed top-0 right-0 h-screen z-50 bg-background border-l border-border-subtle flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isCopilotOpen ? "translate-x-0" : "translate-x-full"
        } w-full md:w-[80vw] lg:w-[480px]`}
      >
        {/* Drawer Header */}
        <CopilotHeader />

        {/* Message Log & Suggestions */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-6 custom-scrollbar min-h-0">
          
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex gap-2.5 items-center text-error mx-auto max-w-full">
              <span className="material-symbols-outlined text-lg">error</span>
              <p className="text-[11px]">{error}</p>
            </div>
          )}

          {/* Quick Actions (only visible when message log has only welcome message) */}
          {messages.length <= 1 && currentDatasetId && (
            <div className="space-y-2.5 animate-fadeIn">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Quick Actions</p>
              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action.query)}
                    className="w-full text-left p-3 rounded-lg border border-border-subtle bg-surface-container-low hover:border-primary-fixed hover:bg-surface-container-high transition-all text-xs font-medium text-white flex items-center justify-between group"
                  >
                    <span>{action.label}</span>
                    <span className="material-symbols-outlined text-primary-fixed opacity-0 group-hover:opacity-100 transition-all text-xs">
                      arrow_forward_ios
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex gap-3 max-w-[92%] ${
                msg.isAi ? "self-start" : "self-end flex-row-reverse"
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
                msg.isAi 
                  ? "bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/20 border-transparent" 
                  : "bg-surface-container border-border-subtle text-on-surface-variant"
              }`}>
                <span className="material-symbols-outlined text-sm">
                  {msg.isAi ? "auto_awesome" : "person"}
                </span>
              </div>

              {/* Message Body */}
              <div className="space-y-3 w-full min-w-0">
                <div className={`p-3.5 rounded-2xl shadow-md border break-words ${
                  msg.isAi 
                    ? "rounded-tl-none bg-surface-container-high border-border-subtle text-on-surface" 
                    : "rounded-tr-none bg-primary text-background font-medium border-transparent shadow-xl"
                }`}>
                  {msg.isAi ? renderMarkdown(msg.content) : (
                    <p className="leading-relaxed text-xs sm:text-sm whitespace-pre-line break-words" style={{ overflowWrap: "anywhere" }}>
                      {msg.content}
                    </p>
                  )}
                </div>

                {/* Suggestion Chips */}
                {msg.isAi && msg.suggestions && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, sIdx) => (
                      <button 
                        key={sIdx}
                        onClick={() => sendMessage(sug)}
                        className="px-2.5 py-1 rounded-full border border-border-subtle text-[9px] sm:text-[10px] font-bold text-on-surface-variant hover:border-primary-container hover:text-primary-container hover:bg-primary-container/5 transition-all active:scale-95"
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
            <div className="flex gap-3 max-w-[85%] self-start animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-on-primary-container text-xs">auto_awesome</span>
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-surface-container-high border border-border-subtle flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-container animate-bounce"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary-container animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary-container animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area footer container */}
        <div className="p-4 border-t border-border-subtle bg-surface-container-low flex flex-col gap-2 flex-shrink-0">
          <div className="w-full glass-panel p-2 rounded-xl border border-white/5 bg-surface-container-high flex items-center gap-2">
            <textarea 
              ref={textareaRef}
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="flex-grow bg-transparent border-none focus:ring-0 text-white text-xs sm:text-sm py-1.5 resize-none custom-scrollbar max-h-24 focus:outline-none placeholder-on-surface-variant/75"
              placeholder={currentDatasetId ? "Ask AI Assistant to analyze, clean, or explain dataset trends..." : "Please select a dataset to start chatting..."}
              disabled={!currentDatasetId}
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!inputVal.trim() || isTyping || !currentDatasetId}
              className="p-2 bg-primary-container text-on-primary-container rounded-lg hover:bg-accent-hover transition-all disabled:opacity-35 disabled:cursor-not-allowed active:scale-95 flex-shrink-0 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm font-bold">send</span>
            </button>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-1 px-1 text-[8px] sm:text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
            <div className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[10px]">database</span> 
              <span>Model: Llama-3.1</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[10px]">lock</span> 
              <span>Secure Session</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
