# Admin/User Auth and Domain Rename Design

## Purpose

The server will use only two primary actors:

- `admin`: manages users, devices, image requests, and alerts through admin APIs.
- `user`: the app account that manages one cane.

The old `blind` and `family` user types are removed. The system keeps phone installation account switching because one physical phone can contain multiple logged-in accounts, and all accounts on the same phone share the same notification inbox.

## Scope

This change updates the FastAPI API, MongoDB document schemas, repositories, services, worker payloads, tests, seed data, and docs so the active domain language no longer uses `user_type`, `blind_user_id`, or `owner_blind_user_id`.

The MongoDB database remains the backing database. The existing Docker MongoDB service and `MONGODB_URI` configuration remain valid.

## Data Model

`users` contains account and role information only:

- `email`
- `password_hash`
- `full_name`
- `phone`
- `role`: `admin` or `user`
- `status`
- timestamps

Remove `user_type` from the user model, schema responses, token claims, seed data, and tests.

Rename internal fields:

- `blind_user_id` becomes `user_id`.
- `owner_blind_user_id` becomes `owner_user_id`.

Affected collections include devices, GPS logs, distance telemetry, image requests, alerts, notification events, live status, and any worker/API payload that currently carries the old field names.

Remove `care_links` from the active server model because there is no longer a family/blind relationship. If historical files remain temporarily, they must not be wired into active routing or authorization.

## Auth and Installation Flow

Mobile login continues to authenticate by `email` and `password`. Because account switching and shared notification inboxes are tied to a physical phone, the login request also keeps installation metadata:

- `device_fingerprint`
- `device_name`
- `platform`

On login, the API:

1. Verifies `email` and `password`.
2. Creates or updates the phone's `mobile_installations` document.
3. Attaches the authenticated user to that installation through `installation_accounts`.
4. Issues an access token and refresh token with `role`, `user_id`, and `installation_id`.

Access tokens no longer include `user_type`.

Refresh and logout continue to use refresh tokens. Refresh tokens may still store `installation_id` so switch-account and installation-scoped notification behavior remains consistent.

## Switch Account

Switch account remains supported.

`installation_accounts` links a phone installation to every account that has logged in on that phone. Switching account marks exactly one account active for that installation and returns a new token pair for the selected user.

This is independent of user type. Any attached `user` account can be selected.

## Notifications

Notification inbox sharing remains installation-scoped.

When an event is created for a `user_id`, the notification service resolves every installation containing that account and creates one `installation_notifications` record per installation. Because the inbox is tied to `installation_id`, every account on the same phone sees the same inbox rows.

Push tokens remain stored on `mobile_installations`, not on users.

## API Shape

Rename mobile paths and request fields that expose the old domain language:

- `/api/mobile/v1/dashboard/{blind_user_id}` becomes `/api/mobile/v1/dashboard/{user_id}`.
- `/api/mobile/v1/blind-users/{blind_user_id}/...` becomes `/api/mobile/v1/users/{user_id}/...`.
- Admin device assignment request field `blind_user_id` becomes `user_id`.

The old route names should be removed from active routers unless compatibility is explicitly requested later.

## Authorization

Admin-only routes continue to require `role = admin`.

Mobile user routes require `role = user`. A user can access data for their own `user_id`. Admin routes remain responsible for broader management actions.

There is no family-care authorization rule after this change because `care_links` and `user_type` are removed from active behavior.

## Error Handling

Existing error semantics remain:

- invalid credentials return `401`.
- invalid refresh tokens return `401`.
- missing or unknown users/devices return `404`.
- forbidden access returns `403`.

Error codes and messages should use the new domain names where applicable, for example `user_not_found` rather than blind/family-specific language.

## Testing

Update API unit tests and worker tests to use the new field names.

Required verification:

- Auth login/refresh/logout tests pass without `user_type`.
- Admin user/device tests use `user_id` and `owner_user_id`.
- Dashboard, telemetry, image request, alert, notification, and worker tests pass with renamed payload fields.
- Seed data creates admin and user accounts only.

## Migration

For existing MongoDB data, add a separate migration script if needed:

- copy `blind_user_id` to `user_id`.
- copy `owner_blind_user_id` to `owner_user_id`.
- remove `user_type` from `users`.
- optionally drop old indexes and create replacement indexes.

The code implementation should target the new schema. Data migration can be run separately before using the refactored server with old databases.
