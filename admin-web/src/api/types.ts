export type Document = Record<string, unknown> & { id: string };

export type User = Document & {
  email?: string;
  full_name?: string;
  phone?: string;
  status?: string;
};

export type Device = Document & {
  device_code?: string;
  owner_user_id?: string;
  status?: string;
};

export type ImageRequest = Document & {
  device_id?: string;
  user_id?: string;
  status?: string;
  created_at?: string;
  image_url?: string;
};

export type AlertSceneContext = {
  type?: string;
  confidence?: number;
  objects?: Array<{ label?: string; class?: string; confidence?: number }>;
  risk_level?: string;
  nearest_obstacle_cm?: number | null;
  summary_text?: string;
};

export type Alert = Document & {
  alert_type?: string;
  risk_level?: string;
  triggered_at?: string;
  scene_context?: AlertSceneContext;
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
