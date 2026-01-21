"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, createContext, useContext, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

// Auth Context
interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  manager_id?: number;
  project_id?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = api.getToken();
    if (token) {
      api
        .getMe()
        .then(setUser)
        .catch(() => {
          api.logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    const userData = await api.getMe();
    setUser(userData);
    // Set default project from user
    if (userData.project_id) {
      setProjectId(userData.project_id);
    }
    return userData; // Return user data for role-based redirect
  };
  
  // Expose setProjectId function
  const setProjectId = (id: number | null) => {
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("selected_project_id", String(id));
      } else {
        localStorage.removeItem("selected_project_id");
      }
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Project Context
interface ProjectContextType {
  projectId: number | null;
  setProjectId: (id: number | null) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
}

function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<number | null>(null);

  useEffect(() => {
    // Load from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selected_project_id");
      if (saved) {
        setProjectId(Number(saved));
      }
    }
  }, []);

  const handleSetProjectId = (id: number | null) => {
    setProjectId(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("selected_project_id", String(id));
      } else {
        localStorage.removeItem("selected_project_id");
      }
    }
  };

  return (
    <ProjectContext.Provider value={{ projectId, setProjectId: handleSetProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
}

// Main Providers
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <ProjectProvider>{children}</ProjectProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
