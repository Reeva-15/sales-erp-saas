const API_BASE = '/api';

export class ApiService {
  private static getToken(): string | null {
    return localStorage.getItem('marronex_token');
  }

  static setToken(token: string) {
    localStorage.setItem('marronex_token', token);
  }

  static clearToken() {
    localStorage.removeItem('marronex_token');
    localStorage.removeItem('marronex_user');
  }

  static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (response.status === 401) {
        this.clearToken();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
      throw new Error(data.error || 'An unexpected server error occurred.');
    }

    return data.data;
  }

  static get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T = any>(endpoint: string, body: any) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  static put<T = any>(endpoint: string, body: any) {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  static delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
