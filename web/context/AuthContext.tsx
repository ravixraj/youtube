"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { User } from "../lib/api";
import { authAPI, userAPI } from "../lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: {
    username: string;
    password: string;
  }) => Promise<{ success: boolean; message: string }>;
  register: (data: {
    username: string;
    fullname: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await authAPI.refreshToken();
      if (response.data.success) {
        return true;
      }
      await logout();
      return false;
    } catch {
      await logout();
      return false;
    }
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await userAPI.getCurrentUser();
        if (response.data.success && response.data.data?.user) {
          setUser(response.data.data.user);
        }
      } catch {
        // not authenticated
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await authAPI.login(credentials);

      if (response.data.success && response.data.data) {
        localStorage.setItem("accessToken", response.data.data.accessToken);
        setUser(response.data.data.user);
        return { success: true, message: response.data.message };
      }

      return {
        success: false,
        message: response.data.message || "Login failed",
      };
    } catch {
      return { success: false, message: "Login failed" };
    }
  };

  const register = async (data: {
    username: string;
    fullname: string;
    email: string;
    password: string;
  }) => {
    try {
      const response = await authAPI.register(data);

      if (response.data.success && response.data.data?.user) {
        localStorage.setItem("accessToken", response.data.data.accessToken);
        setUser(response.data.data.user);
        return { success: true, message: response.data.message };
      }

      return {
        success: false,
        message: response.data.message || "Registration failed",
      };
    } catch {
      return { success: false, message: "Registration failed" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
