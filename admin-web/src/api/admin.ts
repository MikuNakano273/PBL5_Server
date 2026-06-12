import { request } from "./client";
import type { Alert, Device, ImageRequest, User, UserUpdate } from "./types";

const pageQuery = (page: number, limit: number) => `?page=${page}&limit=${limit}`;

export const login = (email: string, password: string) =>
  request<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
export const listUsers = (page = 1, limit = 20) => request<User[]>(`/users${pageQuery(page, limit)}`);
export const getUser = (id: string) => request<User>(`/users/${id}`);
export const updateUser = (id: string, update: UserUpdate) =>
  request<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(update) });
export const listDevices = (page = 1, limit = 20) => request<Device[]>(`/devices${pageQuery(page, limit)}`);
export const assignDevice = (id: string, userId: string) =>
  request<Device>(`/devices/${id}/assign`, { method: "POST", body: JSON.stringify({ user_id: userId }) });
export const listImageRequests = (page = 1, limit = 20) =>
  request<ImageRequest[]>(`/image-requests${pageQuery(page, limit)}`);
export const listAlerts = (page = 1, limit = 20) => request<Alert[]>(`/alerts${pageQuery(page, limit)}`);
