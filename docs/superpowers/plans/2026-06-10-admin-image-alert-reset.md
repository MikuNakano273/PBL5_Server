# Admin Image, Alert, and Data Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display uploaded images and scene context in admin pages, then reset runtime data and create the requested user/device.

**Architecture:** Enrich admin image-request responses with presigned MinIO GET URLs and persist a scene-context snapshot when vision alerts are created. Replace the two generic read-only pages with focused React tables, then run a one-time runtime reset against the active Docker services.

**Tech Stack:** FastAPI, PyMongo, MinIO, React, TypeScript, Vitest, Docker Compose

---

### Task 1: Backend image URLs and alert scene context

**Files:**
- Modify: `api/app/services/storage_service.py`
- Modify: `api/app/services/admin_service.py`
- Modify: `api/app/services/alert_service.py`
- Test: `api/tests/test_admin_service.py`
- Test: `api/tests/test_alert_service.py`

- [ ] Add failing tests proving image requests receive `image_url` and vision alerts persist `scene_context`.
- [ ] Run focused tests and confirm the new assertions fail.
- [ ] Add presigned download URL support, enrich admin image requests, and persist scene context.
- [ ] Run focused tests and confirm they pass.

### Task 2: Admin image-request and alert pages

**Files:**
- Modify: `admin-web/src/api/types.ts`
- Modify: `admin-web/src/api/admin.ts`
- Modify: `admin-web/src/pages/ImageRequestsPage.tsx`
- Modify: `admin-web/src/pages/AlertsPage.tsx`
- Modify: `admin-web/src/styles.css`
- Test: `admin-web/src/AdminPages.test.tsx`

- [ ] Add failing page tests proving uploaded images and scene context render.
- [ ] Run focused tests and confirm the assertions fail.
- [ ] Add typed resource models and focused table renderers.
- [ ] Run admin-web tests and build.

### Task 3: Runtime reset

**Files:**
- Create: `scripts/reset_runtime_data.py`

- [ ] Add a reset script that preserves the seed admin, clears operational data, and creates the requested user/device.
- [ ] Run the reset script against the active MongoDB service.
- [ ] Clear MinIO objects and Redis data.
- [ ] Query MongoDB and verify exactly two users, one assigned device, and empty operational collections.

### Task 4: Full verification

- [ ] Run the complete API test suite.
- [ ] Run the complete admin-web test suite and production build.
- [ ] Rebuild/restart changed Docker services.
- [ ] Verify service health and runtime records.
