export type Document = Record<string, unknown> & { id: string };

export type User = Document & {
  email?: string;
  full_name?: string;
  phone?: string;
  status?: string;
};

export type Device = Document & {
  device_code?: string;
  user_id?: string;
  status?: string;
};

export type UserUpdate = Pick<User, "full_name" | "phone" | "status">;

export type DemoSceneContext = {
  type: string;
  risk_level: string;
  confidence: number;
  age_ms: number;
  fresh: boolean;
};

export type DemoState = {
  device_id: string;
  latest_sensor: {
    seq: number | null;
    distance_cm: number | null;
    obstacle_in_1m: boolean;
    alert_level: string;
    gps: {
      fix: boolean;
      lat: number;
      lng: number;
      sats?: number;
    } | null;
  };
  latest_frame: {
    frame_id: string | null;
    image_url: string | null;
  };
  scene_context: DemoSceneContext;
};

export type DemoDetectedObject = {
  label: string;
  confidence: number;
  bbox?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
};

export type DemoPicture = {
  frame_id: string;
  device_id: string;
  created_at: string;
  image_url: string;
  scene_context: DemoSceneContext;
  objects: DemoDetectedObject[];
  matched_sensor?: DemoState["latest_sensor"];
  image_width?: number;
  image_height?: number;
};
