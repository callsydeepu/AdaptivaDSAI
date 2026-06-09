import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

export function useChat(datasetId) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  // Helper to load suggestions and attach them to the last AI message
  const loadSuggestions = useCallback(async () => {
    if (!datasetId) return;
    try {
      const response = await api.get(`/copilot/suggestions/${datasetId}`);
      const suggestionsList = response.data || [];
      
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        
        // Find the last AI message and attach suggestions to it
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
  }, [datasetId]);

  // Create a new session
  const createNewSession = useCallback(async () => {
    if (!datasetId) return null;
    try {
      const response = await api.post("/copilot/session", { dataset_id: datasetId });
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
  }, [datasetId]);

  // Load session list on mount or dataset change
  useEffect(() => {
    if (!datasetId) {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
      return;
    }

    const loadSessions = async () => {
      setError(null);
      try {
        const response = await api.get(`/copilot/sessions/${datasetId}`);
        const sessionsList = response.data || [];
        setSessions(sessionsList);
        
        if (sessionsList.length > 0) {
          // Default to the most recent session
          setActiveSessionId(sessionsList[0].session_id);
        } else {
          // If no sessions exist, create one automatically
          await createNewSession();
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        setError("Failed to load sessions. Please try again.");
      }
    };

    loadSessions();
  }, [datasetId, createNewSession]);

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
        
        const chatMessages = [];
        
        // Push initial welcome message
        chatMessages.push({
          id: "init",
          isAi: true,
          content: "Hello! I am your AI Copilot assistant. Ask me anything about this dataset's distribution, correlations, outliers, or modeling metrics!"
        });

        // Convert backend history tuples to bubbles
        historyData.forEach((chat) => {
          chatMessages.push({
            id: `${chat.chat_id}-q`,
            isAi: false,
            content: chat.question,
          });
          chatMessages.push({
            id: `${chat.chat_id}-a`,
            isAi: true,
            content: chat.answer,
          });
        });

        setMessages(chatMessages);
        setIsTyping(false);
        
        // Load suggestions for the last message
        await loadSuggestions();
      } catch (err) {
        console.error("Failed to load conversation history:", err);
        setError("Failed to load chat history. Please try again.");
        setIsTyping(false);
      }
    };

    loadHistory();
  }, [activeSessionId, loadSuggestions]);

  // Send message trigger
  const sendMessage = async (text) => {
    if (!text.trim() || !datasetId) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = await createNewSession();
      if (!currentSessionId) return;
    }

    // Append user message locally
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

    try {
      const response = await api.post("/copilot/chat", {
        dataset_id: datasetId,
        session_id: currentSessionId,
        question: text,
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
      
      // Fetch new suggestions based on the updated dialogue
      await loadSuggestions();
    } catch (err) {
      console.error("Copilot chat request failed:", err);
      
      const errorText = err.response?.data?.detail || "I'm sorry, I encountered an error communicating with the AI service. Please try again.";
      
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

  return {
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
  };
}
