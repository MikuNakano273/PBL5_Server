# Demo Pictures Gallery Design

## Goal

Persist every image uploaded by the demo cane and provide an admin gallery where an administrator can select any image and inspect the image, YOLO bounding boxes, detected objects, and the `scene_context` produced for that frame.

## Storage

- The API uses a pictures directory configured by `PICTURES_DIR`, defaulting to `/api/pictures`.
- Docker Compose bind-mounts the host directory `./pictures` to `/api/pictures`.
- The API creates the directory during application startup or before the first write.
- Each frame produces:
  - `<frame_id>.jpg`: original uploaded JPEG.
  - `<frame_id>.json`: metadata captured at processing time.
- Metadata contains the frame ID, device ID, camera sequence, client millis, server timestamp, matched sensor snapshot, raw YOLO objects, and final `scene_context`.
- Files remain available across API restarts and Docker rebuilds.

## API

- `POST /api/v1/frame` continues returning the existing response and additionally persists the JPEG and metadata.
- `GET /api/v1/pictures` returns all persisted image metadata, newest first.
- `GET /api/v1/pictures/{frame_id}` returns metadata for one frame.
- `GET /api/v1/uploads/{frame_id}.jpg` serves the persisted JPEG from disk.
- Missing or invalid files return `404` without breaking the rest of the gallery.

## Admin Gallery

- Add a `Pictures` navigation item and `/admin/pictures` route.
- The page loads `GET /api/v1/pictures`.
- A responsive thumbnail grid shows every persisted image.
- Selecting a thumbnail displays:
  - a larger image;
  - bounding-box overlays based on YOLO `bbox` coordinates;
  - the selected frame's stored `scene_context`;
  - a list of detected objects and confidence values;
  - frame and sensor metadata.
- The page refreshes automatically so newly uploaded frames appear without reloading.

## Error Handling

- An invalid image upload is still saved only if frame processing reaches the persistence step.
- YOLO failure produces a clear/unknown fallback context and saves the failure-compatible metadata.
- Corrupt metadata JSON is skipped by the list endpoint.
- The gallery shows empty and request-error states.

## Testing

- Backend tests verify directory creation, JPEG/JSON persistence, newest-first listing, metadata retrieval, and serving JPEG bytes after in-memory state is cleared.
- Frontend tests verify the gallery route, thumbnail list, image selection, context display, object list, and bounding-box overlay.
- Build and targeted API/admin tests must pass.
