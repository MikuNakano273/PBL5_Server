# PBL5 Server v3 Workflows

## Installation Account Switching

`mobile_installations` represents one app installation on one physical phone.

1. Mobile app calls `POST /api/mobile/v1/auth/login` with email/password plus device fingerprint metadata.
2. API creates or updates one `mobile_installations` document for the fingerprint.
3. API attaches the user to that installation in `installation_accounts`.
4. Multiple users can be attached to the same installation.
5. `POST /api/mobile/v1/installations/me/switch-account` sets all other accounts on the installation inactive and activates the target account.
6. API issues a new token pair for the target user with the same `installation_id`.

Only one account is active at a time for mobile auth, but notification inbox rows are shared by installation.

## Notification Inbox

Alerts produce notification events and fanout rows:

1. `AlertService` creates an `alerts` document unless a recent duplicate exists.
2. `NotificationService` creates one `notification_events` document.
3. It resolves related users:
   - the blind user who owns the device
   - family users with active `care_links`
4. It resolves every installation containing those users through `installation_accounts`.
5. It creates one `installation_notifications` row per installation.
6. If `mobile_installations.push_token` is present, the push sender is invoked for that installation.

Mobile reads the shared inbox with:

- `GET /api/mobile/v1/installations/me/notifications`
- `POST /api/mobile/v1/installations/me/notifications/{notification_id}/read`
- `POST /api/mobile/v1/installations/me/push-token`

## Cane To Worker To Alert

1. Cane authenticates with `X-Device-Code` and `X-Device-Secret`.
2. Cane sends image metadata to `POST /api/cane/v1/requests`.
3. Cane uploads or registers the image through `POST /api/cane/v1/requests/{request_id}/image`.
4. API stores the object key and enqueues an RQ job on `vision-jobs`.
5. Worker downloads the image from MinIO and runs YOLO.
6. Worker calls `POST /api/internal/v1/vision/results` using `Authorization: Bearer <INTERNAL_WORKER_TOKEN>`.
7. API stores `vision_results`, marks `image_requests` done, derives risk/summary, creates alerts when risk is not low, and fans out notifications.

## Admin

Admin auth is separate from mobile auth.

- `POST /api/admin/v1/auth/login` only accepts users with `role=admin`
- Admin JWTs include `token_use=admin`
- Admin resource endpoints require the admin guard

Admin endpoints currently cover:

- users list/detail/update
- devices list/assign
- image requests list
- alerts list
