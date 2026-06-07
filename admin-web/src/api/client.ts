import { clearToken, getToken } from "../auth/session";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`/api/admin/v1${path}`, { ...init, headers });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearToken();
      window.dispatchEvent(new Event("admin-unauthorized"));
    }
    let message = "";
    try {
      const body = await response.json();
      message = body?.error?.message ?? body?.detail ?? "";
    } catch {
      // Use the generic fallback below.
    }
    throw new ApiError(message || "Request failed", response.status);
  }
  return response.json() as Promise<T>;
}
