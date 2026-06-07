import type { DemoState } from "./types";

export async function getDemoState(deviceId = "pbl5-01"): Promise<DemoState> {
  const response = await fetch(`/api/v1/state?device_id=${encodeURIComponent(deviceId)}`);
  if (!response.ok) {
    throw new Error("Unable to load demo state");
  }
  return response.json() as Promise<DemoState>;
}
