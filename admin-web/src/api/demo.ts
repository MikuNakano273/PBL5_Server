import type { DemoPicture, DemoState } from "./types";

export async function getDemoState(deviceId?: string): Promise<DemoState> {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  const response = await fetch(`/api/v1/state${query}`);
  if (!response.ok) {
    throw new Error("Unable to load demo state");
  }
  return response.json() as Promise<DemoState>;
}

export async function listDemoPictures(): Promise<DemoPicture[]> {
  const response = await fetch("/api/v1/pictures");
  if (!response.ok) {
    throw new Error("Unable to load pictures");
  }
  return response.json() as Promise<DemoPicture[]>;
}
