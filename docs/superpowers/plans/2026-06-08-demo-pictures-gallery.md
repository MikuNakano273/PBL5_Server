# Demo Pictures Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every demo cane frame and provide an admin gallery with selectable images, YOLO bounding boxes, objects, and stored scene context.

**Architecture:** Add a focused filesystem repository that owns JPEG and JSON metadata persistence under `PICTURES_DIR`. The demo frame route uses this repository, while gallery APIs expose persisted records. A React gallery page polls the list endpoint and renders selected-frame overlays from stored bounding boxes.

**Tech Stack:** FastAPI, Pydantic settings, filesystem JSON/JPEG storage, React, TypeScript, Vitest.

---

### Task 1: Filesystem Picture Repository

**Files:**
- Create: `api/app/services/demo_picture_store.py`
- Create: `api/tests/test_demo_picture_store.py`
- Modify: `api/app/core/config.py`

- [ ] Write failing tests for directory creation, persistence, newest-first listing, and retrieval.
- [ ] Run `python -m pytest api/tests/test_demo_picture_store.py -q` and verify failure.
- [ ] Implement `DemoPictureStore` with `save`, `list_pictures`, `get_metadata`, and `get_image_path`.
- [ ] Run the repository tests and verify they pass.

### Task 2: Persist Frame Uploads and Add Gallery API

**Files:**
- Modify: `api/app/api/routers/demo_cane.py`
- Modify: `api/tests/test_demo_cane_api.py`
- Modify: `docker-compose.yml`
- Modify: `.gitignore`

- [ ] Write failing API tests for persisted frame files, gallery listing, metadata detail, and JPEG serving after RAM state is cleared.
- [ ] Run the targeted tests and verify failure.
- [ ] Save frame JPEG and metadata after YOLO processing.
- [ ] Add `GET /api/v1/pictures` and `GET /api/v1/pictures/{frame_id}`.
- [ ] Serve persisted JPEGs from `PICTURES_DIR`.
- [ ] Bind-mount `./pictures:/api/pictures` and ignore `pictures/`.
- [ ] Run targeted backend tests and verify they pass.

### Task 3: Admin Pictures Gallery

**Files:**
- Create: `admin-web/src/pages/PicturesPage.tsx`
- Modify: `admin-web/src/api/demo.ts`
- Modify: `admin-web/src/api/types.ts`
- Modify: `admin-web/src/App.tsx`
- Modify: `admin-web/src/layout/AdminLayout.tsx`
- Modify: `admin-web/src/styles.css`
- Modify: `admin-web/src/AdminPages.test.tsx`

- [ ] Write a failing frontend test for thumbnail listing, selecting an image, context/object detail, and bounding-box overlay.
- [ ] Run `npm test -- --run src/AdminPages.test.tsx` and verify failure.
- [ ] Add gallery API types and loader.
- [ ] Implement the responsive Pictures page with selection and overlays.
- [ ] Add navigation and route.
- [ ] Run frontend tests and verify they pass.

### Task 4: Verification

**Files:**
- Verify all files above.

- [ ] Run `python -m pytest api/tests/test_demo_picture_store.py api/tests/test_demo_cane_api.py api/tests/test_demo_scene_context.py -q`.
- [ ] Run `npm test -- --run src/App.test.tsx src/AdminPages.test.tsx`.
- [ ] Run `npm run build`.
- [ ] Run `docker compose config --quiet`.
