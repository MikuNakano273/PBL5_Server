export enum UserRole {
  BLIND_USER = 'blind_user',
  GUARDIAN = 'guardian',
  ADMIN = 'admin',
}

export enum DeviceStatus {
  ACTIVE = 'active',
  OFFLINE = 'offline',
  DISABLED = 'disabled',
  MAINTENANCE = 'maintenance',
}

export enum ImageRequestStatus {
  CREATED = 'created',
  UPLOADED = 'uploaded',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

export enum AlertRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum AlertType {
  OBSTACLE_DANGER = 'obstacle_danger',
  LOW_BATTERY = 'low_battery',
  DEVICE_OFFLINE = 'device_offline',
  NO_SIGNAL = 'no_signal',
  AI_DETECTION_WARNING = 'ai_detection_warning',
}
