/**
 * API Client for Spellit Analytics Backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface ApiError {
  detail: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("access_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("access_token", token);
      } else {
        localStorage.removeItem("access_token");
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: "An error occurred",
      }));
      throw new Error(error.detail);
    }

    return response.json();
  }

  // Generic HTTP methods for useApi hooks
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers: HeadersInit = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{
      access_token: string;
      refresh_token: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return data;
  }

  async logout() {
    this.setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("refresh_token");
    }
  }

  async getMe() {
    return this.request<{
      id: number;
      email: string;
      name: string;
      role: string;
      is_active: boolean;
    }>("/auth/me");
  }

  // Analytics
  async getExecutiveSummary(projectId: number, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams({ project_id: String(projectId) });
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    
    return this.request<{
      kpis: {
        avg_score: number;
        total_calls: number;
        total_duration_minutes: number;
        total_managers: number;
        score_change: number;
        calls_change: number;
      };
      top_managers: Array<{
        id: number;
        name: string;
        avg_score: number;
        total_calls: number;
        trend: number;
      }>;
      problem_criteria: Array<{
        id: number;
        name: string;
        group_name: string;
        avg_score: number;
      }>;
      trend: Array<{
        period: string;
        value: number;
        label: string;
      }>;
    }>(`/analytics/executive/summary?${params}`);
  }

  async getTeamLeaderboard(projectId: number, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams({ project_id: String(projectId) });
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    
    return this.request<{
      managers: Array<{
        id: number;
        name: string;
        avg_score: number;
        total_calls: number;
        trend: number;
      }>;
      team_avg: number;
      period: string;
    }>(`/analytics/team/leaderboard?${params}`);
  }

  async getManagerSummary(managerId: number, projectId: number) {
    return this.request<{
      avg_score: number;
      total_calls: number;
      rank: number;
      total_managers: number;
      vs_team: number;
      trend: Array<{
        period: string;
        value: number;
      }>;
    }>(`/analytics/manager/${managerId}/summary?project_id=${projectId}`);
  }

  // Calls
  async getCalls(
    projectId: number,
    options?: {
      managerId?: number;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      size?: number;
    }
  ) {
    const params = new URLSearchParams({ project_id: String(projectId) });
    if (options?.managerId) params.append("manager_id", String(options.managerId));
    if (options?.dateFrom) params.append("date_from", options.dateFrom);
    if (options?.dateTo) params.append("date_to", options.dateTo);
    if (options?.page) params.append("page", String(options.page));
    if (options?.size) params.append("size", String(options.size));
    
    return this.request<{
      items: Array<{
        id: number;
        external_id: string;
        call_date: string;
        duration_seconds: number;
        final_percent: number;
      }>;
      total: number;
      page: number;
      size: number;
      pages: number;
    }>(`/calls?${params}`);
  }

  async getCall(callId: number) {
    return this.request<{
      id: number;
      external_id: string;
      call_date: string;
      duration_seconds: number;
      final_percent: number;
      manager: { id: number; name: string } | null;
      scores: Array<{
        id: number;
        score: string;
        reason: string | null;
        quote: string | null;
        criteria: {
          id: number;
          name: string;
          number: number;
        };
      }>;
    }>(`/calls/${callId}`);
  }

  // Admin
  async getProjects() {
    return this.request<{
      items: Array<{
        id: number;
        name: string;
        client_name: string;
        created_at: string;
      }>;
      total: number;
    }>("/admin/projects");
  }

  async createProject(data: { name: string; client_name: string }) {
    return this.request<{
      id: number;
      name: string;
      client_name: string;
    }>("/admin/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async uploadExcel(projectId: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}/admin/upload/${projectId}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail);
    }

    return response.json();
  }
}

export const api = new ApiClient();

// Auth-specific API for auth.tsx
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      user: {
        id: string;
        email: string;
        name: string;
        role: 'ceo' | 'rop' | 'manager' | 'admin';
        avatar?: string;
        createdAt: string;
      };
    }>('/auth/login', { email, password });
    api.setToken(response.access_token);
    return response;
  },
  
  me: async () => {
    return api.get<{
      id: string;
      email: string;
      name: string;
      role: 'ceo' | 'rop' | 'manager' | 'admin';
      avatar?: string;
      createdAt: string;
    }>('/auth/me');
  },
  
  logout: () => {
    api.logout();
  },
};
