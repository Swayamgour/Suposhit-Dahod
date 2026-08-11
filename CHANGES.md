# Changes made to match icds-backend v2 (Field Workforce Monitoring)

## 1. Role-based access was partial - now enforced everywhere
- `Sidebar.jsx` previously showed all 6 nav links to every role regardless
  of permissions. Rewritten with a `NAV_LINKS` config where each entry
  declares which roles can see it, mirroring the backend's own role checks.
  AWC workers now only see: Dashboard, Workers, Tasks, Performance, Notices,
  Charts, Info - matching the reference app screenshots.
- `App.jsx` routes for `/mukhya-sevika`, `/applications`, `/applications/users`,
  and `/reports` are now wrapped in `RoleGate` (previously only the *form*
  routes were gated, not the listing pages).

## 2. Stale fields removed (backend model changed since this frontend was built)
- `WorkerEntry.jsx` and `MukhyaDevikaDetails.jsx`/`MukhyaDevikaEntry.jsx` used
  boolean flags like `morningDishPhoto`/`visitPhotoTaken` for "was a photo
  taken". The backend's `Record`/`MukhyaSevikaEntry` models now use a real
  `photos[]` array (uploaded files, geo-tagged) - `visitPhotoTaken` doesn't
  exist on the model anymore. Fixed.

## 3. New: GPS check-in + geo-tagged photo proof
- `components/PhotoGpsCapture.jsx` - reusable: captures browser GPS location,
  uploads photos via `POST /api/upload`, tags each photo with that location.
- Wired into `WorkerEntry.jsx` (new "GPS & Photo Proof" tab) and
  `MukhyaDevikaEntry.jsx` (Visit Details section).

## 4. New: Approve/Reject workflow on submissions
- `components/ApprovalStatus.jsx` - `StatusBadge` + `ReviewActions`.
- `WorkerList.jsx` and `MukhyaDevikaDetails.jsx` now show an Approval column;
  reviewers (role must outrank the submitter, per `outranks()` in
  `AuthContext.jsx`) can approve/reject inline with optional remarks.

## 5. New pages (previously had no UI at all)
- `pages/TasksPage.jsx` - assign tasks (individual or role+scope group),
  field staff submit completion with GPS+photo, admins review submissions.
- `pages/GradesPage.jsx` - performance grading table, "Generate/Refresh"
  for a given month, manual score override.
- `pages/NoticesPage.jsx` - auto-generated notices for C/D grades,
  acknowledge action for the recipient.
- `pages/ReportsPage.jsx` - Excel/PDF export by date range
  (`redux/api.jsx` -> `downloadReport()` helper, since these are file
  streams, not JSON, so they bypass RTK Query).

## 6. redux/api.jsx
- Added every new backend endpoint: upload, tasks, task-submissions, grades,
  notices, reports/heatmap, plus review mutations for records and
  mukhya-sevika entries that didn't exist before.
- `uploadPhotos` uses a custom `queryFn` (raw `fetch`) instead of the shared
  `baseQuery`, because the shared one force-sets `Content-Type: application/json`
  which breaks multipart form uploads.

## Not done (flagged, needs a decision)
- Heat map *visualization* (map/graphic) - the API hook (`useGetHeatmapQuery`)
  is wired up but no map UI consumes it yet.
- AI-based headcount-in-photo - tender lists this as an optional add-on
  requiring a computer-vision service, separate scoping conversation.
