import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const loadCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to load user profile", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const savedAction = sessionStorage.getItem("pending_action");
      if (savedAction) {
        if (savedAction === "upload") {
          window.location.hash = "/upload";
        }
        // Note: other actions like "copilot" can be handled in their respective triggers on mount
        setTimeout(() => {
          sessionStorage.removeItem("pending_action");
        }, 1000);
      }
    }
  }, [user]);

  const requireAuth = (actionCallback, actionName = "") => {
    if (user) {
      actionCallback();
    } else {
      if (actionName) {
        sessionStorage.setItem("pending_action", actionName);
      }
      setPendingAction(() => actionCallback);
      setIsAuthModalOpen(true);
    }
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
    sessionStorage.removeItem("pending_action");
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { user: userDetails, access_token, refresh_token } = response.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    setUser(userDetails);
    
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    sessionStorage.removeItem("pending_action");
    setIsAuthModalOpen(false);
    return userDetails;
  };

  const register = async (username, email, password) => {
    const response = await api.post("/auth/register", { username, email, password });
    const { user: userDetails, access_token, refresh_token } = response.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    setUser(userDetails);
    
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    sessionStorage.removeItem("pending_action");
    setIsAuthModalOpen(false);
    return userDetails;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout endpoint error", e);
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const oauthLogin = async (token, refresh) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("refresh_token", refresh);
    setLoading(true);
    await loadCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        oauthLogin,
        isAuthModalOpen,
        setIsAuthModalOpen,
        requireAuth,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
