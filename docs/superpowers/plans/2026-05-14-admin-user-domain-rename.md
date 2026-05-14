# Admin/User Domain Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `user_type` and rename the old blind-user domain to the new admin/user model while preserving installation-based account switching and shared notification inboxes.

**Architecture:** Keep the existing FastAPI + repository + service structure. Update MongoDB document field names from `blind_user_id` to `user_id` and `owner_blind_user_id` to `owner_user_id` across API, worker, tests, and seed data. Keep `mobile_installations`, `installation_accounts`, and `installation_notifications` because they implement switch account and shared inbox by phone installation.

**Tech Stack:** Python 3.11, FastAPI, Pydantic, PyMongo, unittest, MongoDB, Redis/RQ worker.

---

## File Structure

Modify these files:

- `api/app/common/enums/user_type.py`: delete after imports are removed.
- `api/app/common/schemas/auth.py`: remove `UserType` and `AuthContext.user_type`.
- `api/app/common/schemas/user.py`: remove `user_type` from `UserResponse`.
- `api/app/common/schemas/admin.py`: rename admin assign field to `user_id`.
- `api/app/common/schemas/cane.py`: rename cane context and request/response fields from `blind_user_id` to `user_id`.
- `api/app/common/schemas/dashboard.py`: rename response field from `blind_user_id` to `user_id`.
- `api/app/models/user.py`: remove `user_type` field and role/user_type index.
- `api/app/models/device.py`: rename `owner_blind_user_id` to `owner_user_id`.
- `api/app/models/alert.py`, `distance_telemetry.py`, `gps_log.py`, `image_request.py`, `notification_event.py`, `user_live_status.py`, `vision_result.py`: rename `blind_user_id` fields and indexes to `user_id`.
- `api/app/models/registry.py`: remove care link model registration from active indexes.
- `api/app/api/deps.py`: remove `CareLinkService` dependency and `user_type` auth context claim.
- `api/app/api/router.py`: remove care-links router from active routes.
- `api/app/api/routers/admin.py`: use `body.user_id` for device assignment.
- `api/app/api/routers/cane.py`, `dashboard.py`, `internal.py`: rename path variables and payload fields.
- `api/app/repositories/*.py`: rename query fields and method names around user/device ownership.
- `api/app/services/*.py`: remove care-link authorization and rename domain fields.
- `scripts/seed_demo_data.py`: seed only admin and user accounts; use new field names.
- `api/tests/*.py`, `worker/tests/*.py`: update fixtures and assertions.
- `worker/app/services/repositories.py`, `worker/app/services/result_callback_service.py`, `worker/app/services/vision_worker.py`, `worker/app/tasks/vision_jobs.py`: rename worker job payload fields.
- `README.md`, `docs/workflows.md`, `docs/to_do.md`, `docs/checklist.md`, `docs/legacy_cleanup.md`: update active docs after code passes.

Create this optional file:

- `scripts/migrate_admin_user_domain.py`: migration helper for existing MongoDB data.

---

### Task 1: Auth/User Schema Cleanup

**Files:**
- Modify: `api/app/common/schemas/auth.py`
- Modify: `api/app/common/schemas/user.py`
- Modify: `api/app/models/user.py`
- Modify: `api/app/api/deps.py`
- Modify: `api/app/services/auth_service.py`
- Delete: `api/app/common/enums/user_type.py`
- Test: `api/tests/test_admin_auth.py`
- Test: `api/tests/test_config.py`

- [ ] **Step 1: Write/update failing auth schema tests**

In `api/tests/test_admin_auth.py`, update user fixtures so they do not contain `user_type`. Add an assertion that decoded mobile access tokens do not contain `user_type`:

```python
payload = decode_token(response.access_token)
self.assertEqual(payload["role"], "user")
self.assertNotIn("user_type", payload)
```

- [ ] **Step 2: Run focused auth tests and verify failure**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest api.tests.test_admin_auth
```

Expected before implementation: failures referencing `user_type` in schemas, token claims, or fixtures.

- [ ] **Step 3: Remove `user_type` from auth/user code**

Apply these code-level changes:

```python
# api/app/common/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field

from app.common.enums.user_role import UserRole


class AuthContext(BaseModel):
    user_id: str
    role: UserRole
    installation_id: str | None = None
```

```python
# api/app/common/schemas/user.py
from pydantic import BaseModel, Field

from app.common.enums.user_role import UserRole


class UserResponse(BaseModel):
    id: str = Field(alias='_id')
    email: str
    full_name: str
    phone: str | None = None
    role: UserRole
    status: str

    model_config = {'populate_by_name': True}
```

```python
# api/app/models/user.py
INDEXES = [
    IndexModel([("email", ASCENDING)], unique=True),
    IndexModel([("role", ASCENDING), ("status", ASCENDING)]),
]


class UserDocument(TimestampedDocument):
    email: str
    password_hash: str
    full_name: str
    phone: str | None = None
    role: str
    status: str = Field(default="active")
```

```python
# api/app/api/deps.py
return AuthContext(
    user_id=payload["sub"],
    role=payload["role"],
    installation_id=payload.get("installation_id"),
)
```

```python
# api/app/services/auth_service.py
claims = {
    "role": user["role"],
    "installation_id": installation_id,
}
```

Delete `api/app/common/enums/user_type.py` after all imports are removed.

- [ ] **Step 4: Run focused auth tests**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest api.tests.test_admin_auth
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add api/app/common/schemas/auth.py api/app/common/schemas/user.py api/app/models/user.py api/app/api/deps.py api/app/services/auth_service.py api/app/common/enums/user_type.py api/tests/test_admin_auth.py
git commit -m "Remove user type from auth model"
```

### Task 2: Rename Device and Cane Ownership Fields

**Files:**
- Modify: `api/app/common/schemas/admin.py`
- Modify: `api/app/common/schemas/cane.py`
- Modify: `api/app/models/device.py`
- Modify: `api/app/repositories/device_repository.py`
- Modify: `api/app/services/cane_auth_service.py`
- Modify: `api/app/services/admin_service.py`
- Modify: `api/app/api/routers/admin.py`
- Modify: `api/app/api/routers/cane.py`
- Test: `api/tests/test_cane_auth.py`
- Test: `api/tests/test_storage_and_device_config.py`
- Test: `api/tests/test_admin_service.py`

- [ ] **Step 1: Update tests to expect `owner_user_id` and `user_id`**

Replace fixture keys:

```python
"owner_blind_user_id": "user-1"
```

with:

```python
"owner_user_id": "user-1"
```

Replace admin assignment bodies:

```python
{"blind_user_id": "user-1"}
```

with:

```python
{"user_id": "user-1"}
```

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest api.tests.test_cane_auth api.tests.test_storage_and_device_config api.tests.test_admin_service
```

Expected before implementation: failures from missing old field names.

- [ ] **Step 3: Rename device ownership in code**

Use these target signatures:

```python
# api/app/common/schemas/admin.py
class AdminAssignDeviceRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=100)
```

```python
# api/app/models/device.py
INDEXES = [
    IndexModel([("device_code", ASCENDING)], unique=True),
    IndexModel([("owner_user_id", ASCENDING), ("status", ASCENDING)]),
]


class DeviceDocument(TimestampedDocument):
    serial_number: str
    device_code: str
    device_secret_hash: str
    owner_user_id: str | None = None
```

```python
# api/app/repositories/device_repository.py
def get_by_id_and_owner(self, device_id: str, user_id: str) -> dict[str, Any] | None:
    return self.find_one({'_id': device_key, 'owner_user_id': user_id})

def list_by_user(self, user_id: str) -> list[dict[str, Any]]:
    return list(self.collection.find({'owner_user_id': user_id}).sort('created_at', 1))

def assign_device(self, device_id: str, user_id: str) -> int:
    return self.update_one({'_id': device_key}, {'owner_user_id': user_id, 'updated_at': datetime.now(UTC)})
```

```python
# api/app/services/cane_auth_service.py
return CaneAuthContext(
    device_id=str(device["_id"]),
    device_code=device["device_code"],
    user_id=device["owner_user_id"],
)
```

```python
# api/app/api/routers/admin.py
return admin_service.assign_device(device_id, body.user_id)
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest api.tests.test_cane_auth api.tests.test_storage_and_device_config api.tests.test_admin_service
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add api/app/common/schemas/admin.py api/app/common/schemas/cane.py api/app/models/device.py api/app/repositories/device_repository.py api/app/services/cane_auth_service.py api/app/services/admin_service.py api/app/api/routers/admin.py api/app/api/routers/cane.py api/tests/test_cane_auth.py api/tests/test_storage_and_device_config.py api/tests/test_admin_service.py
git commit -m "Rename device owner user fields"
```

### Task 3: Rename Telemetry, Alert, Image, and Live Status Fields

**Files:**
- Modify: `api/app/models/alert.py`
- Modify: `api/app/models/distance_telemetry.py`
- Modify: `api/app/models/gps_log.py`
- Modify: `api/app/models/image_request.py`
- Modify: `api/app/models/notification_event.py`
- Modify: `api/app/models/user_live_status.py`
- Modify: `api/app/models/vision_result.py`
- Modify: `api/app/repositories/alert_repository.py`
- Modify: `api/app/repositories/distance_repository.py`
- Modify: `api/app/repositories/gps_repository.py`
- Modify: `api/app/repositories/image_request_repository.py`
- Modify: `api/app/repositories/notification_event_repository.py`
- Modify: `api/app/repositories/user_live_status_repository.py`
- Modify: `api/app/repositories/vision_result_repository.py`
- Modify: `api/app/services/distance_service.py`
- Modify: `api/app/services/gps_service.py`
- Modify: `api/app/services/heartbeat_service.py`
- Modify: `api/app/services/image_request_service.py`
- Modify: `api/app/services/internal_vision_service.py`
- Modify: `api/app/services/vision_result_service.py`
- Test: related API tests for distance, GPS, heartbeat, image requests, vision results, notifications.

- [ ] **Step 1: Update tests and fixtures**

Replace old keys and assertions:

```python
"blind_user_id": "user-1"
```

with:

```python
"user_id": "user-1"
```

Replace method calls named `*_blind_user` with `*_user` in tests after code is renamed.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest api.tests.test_distance_service api.tests.test_gps_service api.tests.test_heartbeat_service api.tests.test_image_request_service api.tests.test_vision_result_service api.tests.test_notification_service api.tests.test_device_to_alert_notification_flow
```

Expected before implementation: failures from old field names.

- [ ] **Step 3: Rename model fields and repository filters**

Apply the same transformation in every listed model and repository:

```python
IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)])
```

```python
class AlertDocument(TimestampedDocument):
    user_id: str
```

```python
def list_for_user(self, user_id: str, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
    skip = max(page - 1, 0) * limit
    return list(self.collection.find({'user_id': user_id}).sort('triggered_at', -1).skip(skip).limit(limit))
```

For services, read from `context.user_id` and write payloads with `user_id`:

```python
payload = {
    "device_id": context.device_id,
    "user_id": context.user_id,
    "recorded_at": recorded_at,
}
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest api.tests.test_distance_service api.tests.test_gps_service api.tests.test_heartbeat_service api.tests.test_image_request_service api.tests.test_vision_result_service api.tests.test_notification_service api.tests.test_device_to_alert_notification_flow
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add api/app/models api/app/repositories api/app/services api/tests
git commit -m "Rename user telemetry and alert fields"
```

### Task 4: Dashboard Routes and Authorization

**Files:**
- Modify: `api/app/common/schemas/dashboard.py`
- Modify: `api/app/api/routers/dashboard.py`
- Modify: `api/app/services/dashboard_service.py`
- Modify: `api/app/api/router.py`
- Modify: `api/app/api/deps.py`
- Test: `api/tests/test_dashboard_service.py`

- [ ] **Step 1: Update dashboard tests**

Use `/api/mobile/v1/users/{user_id}/...` paths and assert response key `user_id`:

```python
self.assertEqual(result["user_id"], "user-1")
```

Forbidden test should verify one user cannot access another user's dashboard:

```python
auth_context = AuthContext(user_id="user-2", role=UserRole.USER, installation_id="inst-1")
with self.assertRaises(AppError):
    service.get_dashboard("user-1", auth_context)
```

- [ ] **Step 2: Run focused dashboard tests and verify failure**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest api.tests.test_dashboard_service
```

Expected before implementation: failures from `blind_user_id`, care-link authorization, or old method names.

- [ ] **Step 3: Implement user-only dashboard authorization**

Use this authorization rule:

```python
def _assert_can_access_user(self, auth_context: AuthContext, user_id: str) -> None:
    if auth_context.role == 'admin':
        return
    if auth_context.role == 'user' and auth_context.user_id == user_id:
        return
    raise AppError(code='dashboard_forbidden', message='You cannot access this user data.', status_code=403)
```

Remove `CareLinkRepository` from `DashboardService`.

Rename router paths:

```python
@router.get('/dashboard/{user_id}', response_model=DashboardResponse)
@router.get('/users/{user_id}/devices')
@router.get('/users/{user_id}/locations')
@router.get('/users/{user_id}/alerts/today')
@router.get('/users/{user_id}/alerts')
@router.get('/users/{user_id}/alerts/recent')
```

Remove care-links routing from `api/app/api/router.py` and remove `get_care_link_service` from `api/app/api/deps.py`.

- [ ] **Step 4: Run focused dashboard tests**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest api.tests.test_dashboard_service
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add api/app/common/schemas/dashboard.py api/app/api/routers/dashboard.py api/app/services/dashboard_service.py api/app/api/router.py api/app/api/deps.py api/tests/test_dashboard_service.py
git commit -m "Rename dashboard user routes"
```

### Task 5: Notification Fanout Without Care Links

**Files:**
- Modify: `api/app/services/notification_service.py`
- Modify: `api/app/models/registry.py`
- Test: `api/tests/test_notification_service.py`
- Test: `api/tests/test_device_to_alert_notification_flow.py`

- [ ] **Step 1: Update notification tests**

Remove family/care-link setup. Use one event user and multiple installations/accounts:

```python
event = {"_id": "event-1", "user_id": "user-1", "title": "Alert", "message": "Obstacle"}
```

Assert fanout only resolves installations that contain `user-1`:

```python
self.assertEqual(result["installation_count"], 2)
```

- [ ] **Step 2: Run focused notification tests and verify failure**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest api.tests.test_notification_service api.tests.test_device_to_alert_notification_flow
```

Expected before implementation: failures from care-link dependency and old event field.

- [ ] **Step 3: Remove care-link fanout**

Use this target code shape:

```python
class NotificationService:
    def __init__(self, database=None, push_sender: PushNotificationService | None = None) -> None:
        database = database if database is not None else get_database()
        self.notification_event_repository = NotificationEventRepository(database)
        self.installation_notification_repository = InstallationNotificationRepository(database)
        self.installation_account_repository = InstallationAccountRepository(database)
        self.installation_repository = MobileInstallationRepository(database)
        self.push_sender = push_sender or PushNotificationService()

    def create_notification_event_from_alert(self, alert: dict[str, Any]) -> dict[str, Any]:
        event_payload = {
            "event_type": "alert_created",
            "alert_id": str(alert["_id"]),
            "user_id": alert["user_id"],
            "device_id": alert.get("device_id"),
            "title": alert["title"],
            "message": alert["message"],
            "risk_level": alert["risk_level"],
            "created_at": alert.get("triggered_at") or datetime.now(UTC),
        }
        event_id = self.notification_event_repository.create_event(event_payload)
        return {"event_id": event_id, **self.fanout_notification_to_installations({"_id": event_id, **event_payload})}

    def _related_installation_ids(self, user_id: str) -> list[str]:
        installation_ids = self.installation_account_repository.list_installation_ids_for_users([user_id])
        return list(dict.fromkeys(installation_ids))
```

Remove care-link indexes from `api/app/models/registry.py`.

- [ ] **Step 4: Run focused notification tests**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest api.tests.test_notification_service api.tests.test_device_to_alert_notification_flow
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add api/app/services/notification_service.py api/app/models/registry.py api/tests/test_notification_service.py api/tests/test_device_to_alert_notification_flow.py
git commit -m "Remove care link notification fanout"
```

### Task 6: Worker Payload Rename

**Files:**
- Modify: `worker/app/services/repositories.py`
- Modify: `worker/app/services/result_callback_service.py`
- Modify: `worker/app/services/vision_worker.py`
- Modify: `worker/app/tasks/vision_jobs.py`
- Test: `worker/tests/test_vision_worker.py`
- Modify API worker callback handling if still using `blind_user_id`: `api/app/api/routers/internal.py`, `api/app/services/internal_vision_service.py`

- [ ] **Step 1: Update worker tests**

Replace job payloads:

```python
{"request_id": "req-1", "device_id": "device-1", "user_id": "user-1"}
```

Expected callback payload:

```python
self.assertEqual(callback_payload["user_id"], "user-1")
```

- [ ] **Step 2: Run worker tests and verify failure**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\worker'
python -m unittest worker.tests.test_vision_worker
```

Expected before implementation: failures from old payload field names.

- [ ] **Step 3: Rename worker job fields**

Use `user_id` in all worker payloads:

```python
job_payload = {
    "request_id": str(image_request["_id"]),
    "device_id": device_id,
    "user_id": user_id,
    "object_key": object_key,
    "captured_at": captured_at.isoformat(),
}
```

Callback payload:

```python
payload = {
    "request_id": job["request_id"],
    "device_id": job["device_id"],
    "user_id": job["user_id"],
    "detections": detections,
    "processed_at": processed_at.isoformat(),
}
```

- [ ] **Step 4: Run worker tests**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\worker'
python -m unittest worker.tests.test_vision_worker
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add worker/app worker/tests/test_vision_worker.py api/app/api/routers/internal.py api/app/services/internal_vision_service.py
git commit -m "Rename worker vision user payloads"
```

### Task 7: Seed Data, Docs, and Migration Helper

**Files:**
- Modify: `scripts/seed_demo_data.py`
- Create: `scripts/migrate_admin_user_domain.py`
- Modify: `README.md`
- Modify: `docs/workflows.md`
- Modify: `docs/to_do.md`
- Modify: `docs/checklist.md`
- Modify: `docs/legacy_cleanup.md`

- [ ] **Step 1: Update seed data**

Seed one admin and one user:

```python
USER_ID = "u_user_1"

users = [
    {
        "_id": USER_ID,
        "email": "user@example.com",
        "password_hash": hash_password("password123"),
        "full_name": "Demo User",
        "phone": "0900000001",
        "role": "user",
        "status": "active",
    },
    {
        "_id": ADMIN_ID,
        "email": "admin@example.com",
        "password_hash": hash_password("password123"),
        "full_name": "Demo Admin",
        "role": "admin",
        "status": "active",
    },
]
```

Use `user_id` and `owner_user_id` everywhere else in the seed script.

- [ ] **Step 2: Create migration helper**

Create `scripts/migrate_admin_user_domain.py`:

```python
from pymongo import MongoClient

from api.app.core.config import get_settings


def rename_field(collection, old_name: str, new_name: str) -> int:
    result = collection.update_many({old_name: {"$exists": True}}, {"$rename": {old_name: new_name}})
    return result.modified_count


def main() -> None:
    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    database = client.get_default_database()

    database.users.update_many({"user_type": {"$exists": True}}, {"$unset": {"user_type": ""}})

    for name in [
        "alerts",
        "distance_telemetry",
        "gps_logs",
        "image_requests",
        "notification_events",
        "user_live_status",
        "vision_results",
    ]:
        print(f"{name}: renamed {rename_field(database[name], 'blind_user_id', 'user_id')} documents")

    print(f"devices: renamed {rename_field(database.devices, 'owner_blind_user_id', 'owner_user_id')} documents")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Update docs**

Replace active documentation wording:

```markdown
- Actors: `admin` and `user`.
- `user` manages one cane.
- Phone installations can contain multiple accounts and share one notification inbox.
```

Document new endpoints:

```markdown
- `GET /api/mobile/v1/dashboard/{user_id}`
- `GET /api/mobile/v1/users/{user_id}/devices`
- `GET /api/mobile/v1/users/{user_id}/locations`
- `GET /api/mobile/v1/users/{user_id}/alerts/today`
- `GET /api/mobile/v1/users/{user_id}/alerts`
- `GET /api/mobile/v1/users/{user_id}/alerts/recent`
```

- [ ] **Step 4: Commit**

```powershell
git add scripts/seed_demo_data.py scripts/migrate_admin_user_domain.py README.md docs/workflows.md docs/to_do.md docs/checklist.md docs/legacy_cleanup.md
git commit -m "Update admin user seed data and docs"
```

### Task 8: Full Verification

**Files:**
- No code edits unless tests expose missed references.

- [ ] **Step 1: Search for forbidden active names**

Run:

```powershell
Get-ChildItem -Recurse -File api,worker,scripts | Select-String -Pattern "user_type|UserType|blind_user_id|owner_blind_user_id|family_user_id|care_link|care-links"
```

Expected: no matches in active code. Matches in archived docs are acceptable only outside `api`, `worker`, and `scripts`.

- [ ] **Step 2: Run full API tests**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\api'
python -m unittest discover api/tests
```

Expected: PASS.

- [ ] **Step 3: Run full worker tests**

Run:

```powershell
$env:PYTHONPATH='C:\Users\Admin\OneDrive\Tài liệu\PBL5_Server\worker'
python -m unittest discover worker/tests
```

Expected: PASS.

- [ ] **Step 4: Inspect git diff**

Run:

```powershell
git status --short
git diff --stat HEAD
```

Expected: either clean after commits or only intentional uncommitted final fixes.

- [ ] **Step 5: Final commit if needed**

```powershell
git add api worker scripts README.md docs
git commit -m "Complete admin user domain rename"
```

