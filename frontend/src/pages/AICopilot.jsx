import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DatasetPreviewTable } from "../components/DatasetPreviewTable";
import { mockCopilotContext } from "../services/mockDataService";
import { useChat } from "../hooks/useChat";

export function AICopilot() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat"); // 'context' or 'chat'
  const { messages, inputVal, setInputVal, isTyping, sendMessage } = useChat();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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

  return (
    <div className="h-[calc(100vh-80px)] -mx-margin-mobile md:-mx-12 -mt-4 overflow-hidden flex flex-col border border-border-subtle bg-background rounded-2xl">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-border-subtle bg-surface-container-low p-2 gap-2 flex-shrink-0">
        <button 
          onClick={() => setActiveTab("context")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
            activeTab === "context" 
              ? "bg-primary-container text-on-primary-container shadow-md" 
              : "text-on-surface-variant hover:text-white"
          }`}
        >
          Active Context
        </button>
        <button 
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
            activeTab === "chat" 
              ? "bg-primary-container text-on-primary-container shadow-md" 
              : "text-on-surface-variant hover:text-white"
          }`}
        >
          Copilot Assistant
        </button>
      </div>

      {/* Main Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Active Context */}
        <section 
          className={`w-full lg:w-2/5 p-6 border-r border-border-subtle bg-surface-dim flex flex-col gap-6 overflow-y-auto custom-scrollbar ${
            activeTab === "context" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display-lg text-headline-sm text-primary-fixed">Active Context</h2>
            <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant text-[10px] uppercase font-bold tracking-wider border border-border-subtle max-w-[200px] truncate">
              {mockCopilotContext.datasetName}
            </span>
          </div>

          {/* Bento Schema Health */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 glass-panel p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group">
              <div className="ai-shimmer absolute inset-0 opacity-20 pointer-events-none"></div>
              <div className="flex items-center gap-2 text-primary-fixed">
                <span className="material-symbols-outlined text-sm">database</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Schema Health</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-display-lg">{mockCopilotContext.schemaHealth}</p>
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span> {mockCopilotContext.schemaHealthDelta}
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant text-xs">{mockCopilotContext.schemaHealthText}</p>
            </div>

            {mockCopilotContext.stats.map((stat, idx) => (
              <div 
                key={idx} 
                className="glass-panel p-4 rounded-xl flex flex-col gap-2 border border-border-subtle hover:border-primary-fixed/50 transition-all cursor-pointer hover:translate-y-[-2px]"
              >
                <span className="material-symbols-outlined text-primary-fixed text-xl">{stat.icon}</span>
                <p className="text-[10px] text-on-surface-variant font-medium">{stat.title}</p>
                <p className="text-lg font-display-lg text-white">{stat.value}</p>
                <p className="text-[9px] text-on-surface-variant truncate">{stat.desc}</p>
              </div>
            ))}
          </div>

          {/* Sample Table */}
          <DatasetPreviewTable type="copilot" data={mockCopilotContext.sampleRows} />

          {/* Recommended actions suggestions */}
          <div className="space-y-3">
            <p className="font-label-md text-on-surface-variant flex items-center gap-2 text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">cleaning_services</span> 
              Recommended Actions
            </p>
            <div className="flex flex-col gap-2">
              {mockCopilotContext.actions.map((act, idx) => (
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
        </section>

        {/* Right Panel: Chat Interface */}
        <section 
          className={`flex-1 bg-surface-container-lowest flex flex-col relative overflow-hidden ${
            activeTab === "chat" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Chat Header */}
          <div className="h-16 px-6 border-b border-border-subtle flex items-center justify-between glass-panel absolute top-0 w-full z-10">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <h3 className="font-display-lg text-body-lg font-bold text-white text-sm sm:text-base">Copilot Assistant</h3>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-[10px] sm:text-xs uppercase font-bold">
                <span className="material-symbols-outlined text-sm sm:text-base">history</span> History
              </button>
              <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-[10px] sm:text-xs uppercase font-bold">
                <span className="material-symbols-outlined text-sm sm:text-base">share</span> Share
              </button>
            </div>
          </div>

          {/* Chat Messages Scrolling Area */}
          <div className="flex-1 overflow-y-auto p-6 pt-24 pb-36 flex flex-col gap-8 custom-scrollbar">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-4 max-w-[85%] ${
                  msg.isAi ? "self-start" : "self-end flex-row-reverse"
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border ${
                  msg.isAi 
                    ? "bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/20 border-transparent" 
                    : "bg-surface-container border-border-subtle text-on-surface-variant"
                }`}>
                  <span className="material-symbols-outlined text-xl">
                    {msg.isAi ? "auto_awesome" : "person"}
                  </span>
                </div>

                {/* Message Body */}
                <div className="space-y-4 w-full">
                  <div className={`p-4 sm:p-5 rounded-2xl shadow-md border ${
                    msg.isAi 
                      ? "rounded-tl-none bg-surface-container-high border-border-subtle text-on-surface" 
                      : "rounded-tr-none bg-primary text-background font-medium border-transparent shadow-xl"
                  }`}>
                    {/* Render message with markdown formatting support */}
                    <p className="leading-relaxed text-sm whitespace-pre-line">
                      {msg.content}
                    </p>
                    
                    {msg.subContent && (
                      <p className="mt-2 leading-relaxed text-sm font-medium">{msg.subContent}</p>
                    )}

                    {/* Chart / ARPU Comparison layout inside chat bubble */}
                    {msg.chart && (
                      <div className="my-4 space-y-3 bg-surface-container-low/40 p-3 rounded-xl border border-border-subtle/30">
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wide mb-2">{msg.chart.title}</p>
                        {msg.chart.items.map((item, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-4">
                            <div className="flex-1 h-2.5 bg-surface-container rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  item.isAccent ? "bg-primary-container" : "bg-border-subtle"
                                }`} 
                                style={{ width: `${item.percent}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-bold text-on-surface whitespace-nowrap w-32 text-right">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text blocks */}
                    {msg.textBlock && (
                      <p className="text-on-surface-variant text-xs sm:text-sm mt-3 border-t border-border-subtle/40 pt-3">
                        {msg.textBlock}
                      </p>
                    )}

                    {/* Fenced Code response block */}
                    {msg.code && (
                      <div className="mt-4 p-3 bg-surface-container rounded-lg border border-border-subtle font-code-snippet text-xs text-primary-fixed overflow-x-auto custom-scrollbar font-mono">
                        <pre>{msg.code}</pre>
                      </div>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  {msg.isAi && msg.suggestions && (
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button 
                          key={sIdx}
                          onClick={() => sendMessage(sug)}
                          className="px-3 py-1.5 rounded-full border border-border-subtle text-[11px] font-bold text-on-surface-variant hover:border-primary-container hover:text-primary-container hover:bg-primary-container/5 transition-all active:scale-95"
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
              <div className="flex gap-4 max-w-[85%] self-start animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-on-primary-container">auto_awesome</span>
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-surface-container-high border border-border-subtle flex gap-1.5 items-center">
                  <div className="w-2 h-2 rounded-full bg-primary-container animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary-container animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary-container animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Floating Dock Container */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl z-10">
            <div className="glass-panel p-2 rounded-2xl shadow-2xl flex flex-col gap-2 border border-white/5 bg-surface-container-high/90 backdrop-blur-xl">
              <div className="flex items-center gap-2 px-2">
                <button 
                  onClick={() => navigate('/under-construction')}
                  className="p-2 text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <textarea 
                  ref={textareaRef}
                  value={inputVal}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-body-md py-3 resize-none custom-scrollbar max-h-24 text-white text-sm sm:text-base focus:outline-none placeholder-on-surface-variant/75"
                  placeholder="Ask AI Copilot to analyze, clean, or visualize..." 
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputVal.trim() || isTyping}
                  className="p-2.5 bg-primary-container text-on-primary-container rounded-xl hover:bg-accent-hover transition-all disabled:opacity-35 disabled:cursor-not-allowed active:scale-95 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl font-bold">send</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 pb-1 border-t border-border-subtle/30 pt-2 text-[8px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">database</span> 
                  Using Model: <span className="text-primary-fixed">Adaptive-Pro-V2</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">memory</span> 
                  Temp: <span className="text-primary-fixed">0.2 (Logical)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
