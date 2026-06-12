# Admin Image, Alert, and Data Reset Design

## Goal

Show uploaded server images on the admin image-request page, show persisted
`scene_context` on the admin alert page, and reset runtime data to one admin,
one mobile user, and one assigned device.

## Backend

- `AdminService.list_image_requests` adds a short-lived `image_url` when an
  image request has an `image_path`.
- `StorageService` creates presigned GET URLs without exposing MinIO
  credentials.
- Vision alerts persist a `scene_context` snapshot containing detected
  objects, risk level, nearest obstacle distance, and summary text.
- Existing generic document serialization remains unchanged for all other
  admin resources.

## Admin Web

- The image-request page renders a thumbnail from `image_url` plus request,
  device, user, status, and creation information.
- The alert page renders alert type, risk, time, and a readable
  `scene_context` summary.
- Empty, loading, error, and pagination behavior remain consistent with other
  admin pages.

## Runtime Reset

- Keep only `seed-admin@example.com` in `users`.
- Clear all non-user MongoDB collections, all MinIO objects, and Redis data.
- Create user `Đặng Quốc Nam` (`namqd2000@gmail.com`) with role `user` and
  password `namdq`.
- Create device `pbl5-01`, assign it to the new user, and set its device secret
  to `pbl5-01`.

## Verification

- Backend and admin-web tests cover the new response and rendering behavior.
- Admin web builds successfully.
- Runtime queries confirm exactly two users, one device, and empty operational
  collections after reset.
