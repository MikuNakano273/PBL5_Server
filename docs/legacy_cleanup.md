# Legacy Cleanup Notes

The active backend stack is:

- `api/`: FastAPI application
- `worker/`: Python RQ + YOLO worker
- `docker-compose.yml`: Python API, Python worker, MongoDB, Redis, MinIO

The old Node/NestJS implementation under `Server/` and the old `nginx/` reverse-proxy configuration are legacy artifacts from the previous implementation plan. They are not referenced by the active Docker Compose deployment and should not be used as the implementation source for v3 minimal.

Legacy collections remain documented only as excluded scope in `api/app/models/registry.py`:

- `care_links`
- `daily_alert_stats`
- `audit_logs`
- `alert_receivers`
- `notification_tokens`
- `follow_link_requests`

Current notification state is stored through:

- `mobile_installations`
- `installation_accounts`
- `notification_events`
- `installation_notifications`
