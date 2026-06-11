import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";
import { useDataset } from "../../contexts/DatasetContext";
import { CopilotContext } from "./CopilotContext";

export function CopilotProvider({ children }) {
  const { currentDatasetId } = useDataset();
  const location = useLocation();

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  // Detect current page to customize context awareness
  const currentPage = useMemo(() => {
    const path = location.pathname;
    if (path === "/") return "dashboard";
    if (path === "/profiling") return "profiling";
    if (path === "/models") return "models";
    if (path === "/reports") return "reports";
    if (path === "/settings") return "settings";
    return "general";
  }, [location.pathname]);

  // Load suggestions for the last AI message
  const loadSuggestions = useCallback(async () => {
    if (!currentDatasetId) return;
    try {
      const response = await api.get(`/copilot/suggestions/${currentDatasetId}`);
      const suggestionsList = response.data || [];
      
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        
        const newMsgs = [...prev];
        for (let i = newMsgs.length - 1; i >= 0; i--) {
          if (newMsgs[i].isAi) {
            newMsgs[i] = {
              ...newMsgs[i],
              suggestions: suggestionsList,
            };
            break;
          }
        }
        return newMsgs;
      });
    } catch (err) {
      console.error("Failed to load suggested questions:", err);
    }
  }, [currentDatasetId]);

  // Create a new session
  const createNewSession = useCallback(async () => {
    if (!currentDatasetId) return null;
    try {
      const response = await api.post("/copilot/session", { dataset_id: currentDatasetId });
      const newSession = response.data;
      if (newSession && newSession.session_id) {
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.session_id);
        return newSession.session_id;
      }
    } catch (err) {
      console.error("Failed to create new chat session:", err);
      setError("Failed to create a new session.");
    }
    return null;
  }, [currentDatasetId]);

  // Load sessions list on dataset change
  useEffect(() => {
    if (!currentDatasetId) {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
      return;
    }

    const loadSessions = async () => {
      setError(null);
      try {
        const response = await api.get(`/copilot/sessions/${currentDatasetId}`);
        const sessionsList = response.data || [];
        setSessions(sessionsList);
        
        if (sessionsList.length > 0) {
          setActiveSessionId(sessionsList[0].session_id);
        } else {
          await createNewSession();
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        setError("Failed to load sessions. Please try again.");
      }
    };

    loadSessions();
  }, [currentDatasetId, createNewSession]);

  // Load chat history when activeSessionId changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const loadHistory = async () => {
      setIsTyping(true);
      setError(null);
      try {
        const response = await api.get(`/copilot/session/${activeSessionId}/history`);
        const historyData = response.data || [];
        
        const chatMessages = [
          {
            id: "init",
            isAi: true,
            content: "Hello! I am your AI Copilot assistant. Ask me anything about this dataset's distribution, correlations, outliers, or modeling metrics!"
          }
        ];

        historyData.forEach((chat) => {
          // Clean the hidden backend suffix from the UI question bubble
          const cleanedQuestion = chat.question.replace(/\s*\(context:.*?\)\s*$/, "");
          chatMessages.push({
            id: `${chat.chat_id}-q`,
            isAi: false,
            content: cleanedQuestion,
          });
          chatMessages.push({
            id: `${chat.chat_id}-a`,
            isAi: true,
            content: chat.answer,
          });
        });

        setMessages(chatMessages);
        setIsTyping(false);
        await loadSuggestions();
      } catch (err) {
        console.error("Failed to load conversation history:", err);
        setError("Failed to load chat history. Please try again.");
        setIsTyping(false);
      }
    };

    loadHistory();
  }, [activeSessionId, loadSuggestions]);

  // Send message with page-aware context enrichment
  const sendMessage = async (text) => {
    if (!text.trim() || !currentDatasetId) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = await createNewSession();
      if (!currentSessionId) return;
    }

    // Append user message locally in raw UI form
    const userMsgId = `user-${Date.now()}`;
    const updatedMsgs = [
      ...messages,
      {
        id: userMsgId,
        isAi: false,
        content: text,
      },
    ];
    
    setMessages(updatedMsgs);
    setInputVal("");
    setIsTyping(true);
    setError(null);

    // Append page context keywords to trigger ContextRankingService inside the backend
    let enrichedQuestion = text;
    if (currentPage === "profiling") {
      enrichedQuestion += " (context: profiling quality health missing duplicates rows columns statistics mean median outliers)";
    } else if (currentPage === "models") {
      enrichedQuestion += " (context: problem target label task classification regression predict evaluation accuracy f1 precision recall r2 rmse mae best model metrics)";
    } else if (currentPage === "reports") {
      enrichedQuestion += " (context: insights summary observation report findings)";
    } else if (currentPage === "settings") {
      enrichedQuestion += " (context: database models credentials settings configuration env)";
    } else {
      enrichedQuestion += " (context: insights summary profiling quality)";
    }

    try {
      const response = await api.post("/copilot/chat", {
        dataset_id: currentDatasetId,
        session_id: currentSessionId,
        question: enrichedQuestion,
      });

      const aiAnswer = response.data?.answer || "I could not formulate an answer based on this context.";
      
      const newMsgs = [
        ...updatedMsgs,
        {
          id: `ai-${Date.now()}`,
          isAi: true,
          content: aiAnswer,
        },
      ];

      setMessages(newMsgs);
      setIsTyping(false);
      await loadSuggestions();
    } catch (err) {
      console.error("Copilot chat request failed:", err);
      const errorText = err.response?.data?.detail || "I encountered an error communicating with the AI service. Please try again.";
      
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          isAi: true,
          content: errorText,
        },
      ]);
      setIsTyping(false);
    }
  };

  const selectSession = (sessionId) => {
    setActiveSessionId(sessionId);
  };

  const value = {
    isCopilotOpen,
    setIsCopilotOpen,
    messages,
    inputVal,
    setInputVal,
    isTyping,
    sendMessage,
    error,
    sessions,
    activeSessionId,
    createNewSession,
    selectSession,
    currentPage
  };

  return (
    <CopilotContext.Provider value={value}>
      {children}
    </CopilotContext.Provider>
  );
}
