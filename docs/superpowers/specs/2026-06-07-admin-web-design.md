# Admin Web Design

## Goal

Add a bilingual Vietnamese/English web administration interface for the
existing PBL5 FastAPI server. The interface must expose the management
capabilities already provided by `/api/admin/v1` without introducing new
domain behavior.

The built application is available from the same server at:

`http://localhost:8000/admin`

## Scope

The first version includes:

- Admin login and logout
- Vietnamese/English language switching
- Dashboard totals for users, devices, image requests, and alerts
- User listing, detail viewing, and editing of `full_name`, `phone`, and
  `status`
- Device listing and assignment to a user
- Read-only image request and alert listings
- Pagination and manual refresh for list pages
- Loading, empty, and API error states
- Desktop and tablet responsive layouts

The first version does not add user creation, deletion, device creation,
alert mutation, image request mutation, or new analytics endpoints.

## Architecture

Create a React and Vite single-page application in `admin-web`.

During development, Vite runs the frontend and proxies API requests to the
FastAPI server. For normal server use, Vite builds static assets into
`admin-web/dist`, and FastAPI serves the built application under `/admin`.
FastAPI provides an SPA fallback under that prefix so browser refreshes on
client-side routes do not return `404`.

The frontend calls relative URLs under `/api/admin/v1`. This keeps the
application independent of the server host and avoids additional CORS
configuration when served by FastAPI.

## Authentication

The login page posts email and password to `/api/admin/v1/auth/login`.
The returned admin access token is stored in `sessionStorage`, so it survives
page refreshes but is removed when the browser session ends.

Authenticated API requests include `Authorization: Bearer <token>`. A
`401` or `403` response clears the token and redirects to the login page.
Logout also clears the token and redirects to login.

No refresh-token behavior is added because the current admin API issues only
an admin-scoped access token.

## Frontend Structure

The application uses these main units:

- `api`: a small HTTP client and typed admin API functions
- `auth`: session token handling and protected-route behavior
- `i18n`: Vietnamese and English translation dictionaries plus persisted
  language selection
- `layout`: sidebar navigation, top bar, language switch, and logout
- `pages`: login, dashboard, users, devices, image requests, and alerts
- `components`: reusable tables, pagination, status badges, loading states,
  error messages, and dialogs

The top bar contains a `VI/EN` language switch and logout action. The selected
language is stored in `localStorage`.

## Pages And Behavior

### Login

The login page contains email and password inputs. It displays validation and
API authentication errors in the selected language. Successful login opens
the dashboard.

### Dashboard

The dashboard requests the first page of users, devices, image requests, and
alerts. Because the current list APIs do not return total counts, the cards
show the number of records loaded from those requests and label them as the
current loaded totals. No misleading global total is claimed.

### Users

The users page lists records from `GET /api/admin/v1/users`. Selecting a user
loads its detail from `GET /api/admin/v1/users/{user_id}`. An edit dialog
allows updates only to:

- `full_name`
- `phone`
- `status`

Saving sends `PATCH /api/admin/v1/users/{user_id}` and refreshes the displayed
record.

### Devices

The devices page lists records from `GET /api/admin/v1/devices`. An assignment
dialog lets an admin select a loaded user and sends
`POST /api/admin/v1/devices/{device_id}/assign`.

### Image Requests And Alerts

These pages are read-only tables backed by:

- `GET /api/admin/v1/image-requests`
- `GET /api/admin/v1/alerts`

Unknown or optional document fields are rendered with a neutral fallback
instead of causing a page failure.

## Data And Error Handling

List pages request `page` and `limit` query parameters and provide previous,
next, and refresh actions. Because list endpoints currently return arrays
without total counts, the next action remains available when a full page is
returned and is disabled when fewer than `limit` records are returned.

The API client parses the server error format when possible and otherwise
shows a localized generic message. Mutations disable their submit controls
while pending and show success or failure feedback.

## Styling And Accessibility

Use a clean administration layout with a dark sidebar and light content area.
Controls and tables use semantic HTML, visible focus states, associated form
labels, keyboard-operable dialogs, and sufficient contrast. The sidebar
collapses for tablet-width screens.

## Server Integration

FastAPI mounts the built assets at `/admin/assets` and serves the SPA entry
file for `/admin` and `/admin/{path}`. API routes remain registered normally
and are not intercepted by the admin SPA.

If `admin-web/dist` does not exist, the server still starts. Requests to
`/admin` return a clear response indicating that the frontend must be built.
This keeps backend development and tests usable before installing frontend
dependencies.

## Testing

Frontend tests cover:

- Successful and failed login
- Protected-route redirect without a token
- Logout and unauthorized API handling
- Vietnamese/English switching and persistence
- User edit request and updated display
- Device assignment request
- List loading, empty, error, and pagination behavior

Backend tests cover:

- `/admin` serves the built SPA when assets exist
- A nested `/admin` route falls back to the SPA entry
- Missing frontend build returns the expected informative response
- Existing `/api/admin/v1` routes remain unaffected

The implementation is complete when the frontend tests, backend tests, and
production frontend build pass, and the built interface is reachable at
`http://localhost:8000/admin`.
