from pydantic import BaseModel


class DashboardAlertItem(BaseModel):
    id: str
    title: str
    message: str
    risk_level: str
    triggered_at: str | None = None


class DashboardResponse(BaseModel):
    user_id: str
    is_safe: bool
    current_safety_status: str | None = None
    nearest_distance_cm: float | None = None
    today_alert_count: int
    device_count: int
    device_last_seen_at: str | None = None
    last_seen_at: str | None = None
    last_location: dict | None = None
    recent_alerts: list[DashboardAlertItem]
