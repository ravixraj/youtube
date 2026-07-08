"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../lib/api";
import { authAPI, userAPI } from "../lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    credentials: { username: string; password: string },
  ) => Promise<{ success: boolean; message: string }>;
  register: (
    data: FormData,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        try {
          const response = await userAPI.getCurrentUser();

          if (response.success && response.data?.user) {
            setUser(response.data.user);
          } else if (!response.success) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
            }
          }
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await authAPI.login(credentials);

      if (response.success && response.data) {
        localStorage.setItem("accessToken", response.data.tokens.accessToken);
        localStorage.setItem(
          "refreshToken",
          response.data.tokens.refreshToken,
        );
        setUser(response.data.user);
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message || "Login failed" };
    } catch {
      return { success: false, message: "Login failed" };
    }
  };

  const register = async (data: FormData) => {
    try {
      const response = await authAPI.register(data);

      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true, message: response.message };
      }

      return {
        success: false,
        message: response.message || "Registration failed",
      };
    } catch {
      return { success: false, message: "Registration failed" };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  const refreshToken = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) {
      return false;
    }

    try {
      const response = await authAPI.refreshToken(storedRefreshToken);
      if (response.success && response.data) {
        localStorage.setItem(
          "accessToken",
          response.data.tokens.accessToken,
        );
        localStorage.setItem(
          "refreshToken",
          response.data.tokens.refreshToken,
        );
        return true;
      } else {
        logout();
        return false;
      }
    } catch {
      logout();
      return false;
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
