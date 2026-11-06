# KaBarangay UI

Frontend for **KaBarangay** — a barangay management system. This repository holds the
UI only: every screen renders from local mock data, so it can be designed, reviewed and
demoed before the Laravel backend is connected.

> Backend: <https://github.com/lewww123/KaBarangay> (latest work on
> `security/secret-containment`).

## Stack

| Concern | Choice |
| --- | --- |
| Build | Vite + React 19 + TypeScript |
| Styling & layout | Tailwind CSS v4 + shadcn/ui |
| Forms & validation | React Hook Form + Zod |
| Routing | React Router v7 |
| Icons | lucide-react |
| Font | Inter (self-hosted via `@fontsource-variable/inter`) |

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Portals & routes

| Portal | Viewport | Routes |
| --- | --- | --- |
| **Auth** | responsive | `/login`, `/resident/login`, `/resident/register`, `/resident/register/submitted`, `/resident/application/access`, `/resident/application/:reference`, `/resident/forgot-password`, `/resident/reset-password/:token` |
| **Admin** | desktop only (≥1024px) | `/admin`, `/admin/residents`, `/admin/announcements/approvals`, `/admin/certificates`, `/admin/sectors`, `/admin/sector-applications`, `/admin/sector-applications/:id`, `/admin/staff`, `/admin/population`, `/admin/reports`, `/admin/org-chart`, `/admin/emergency-numbers`, `/admin/qr-scanner`, `/admin/audit-log`, `/admin/settings` |
| **Clerk desk** | desktop only | `/clerk/dashboard`, `/clerk/certificates`, `/clerk/certificates/:id`, `/clerk/updates`, `/clerk/updates/:id`, `/clerk/programs`, `/clerk/programs/:id`, `/clerk/announcements`, `/clerk/announcements/:id`, `/clerk/announcements/:id/attendance`, `/clerk/disbursements`, `/clerk/disbursements/:id`, `/clerk/citizen-charter`, `/clerk/citizen-charter/:id`, `/clerk/org-chart` |
| **Senior citizens desk** | desktop only | `/senior/dashboard`, `/senior/residents`, `/senior/applications`, `/senior/applications/create`, `/senior/applications/:id`, `/senior/announcements`, `/senior/announcements/:id`, `/senior/announcements/:id/attendance`, `/senior/updates`, `/senior/updates/:id`, `/senior/programs`, `/senior/programs/:id` |
| **PWD desk** | desktop only | `/pwd/dashboard`, `/pwd/residents`, `/pwd/applications`, `/pwd/applications/create`, `/pwd/applications/:id`, `/pwd/announcements`, `/pwd/announcements/:id`, `/pwd/announcements/:id/attendance`, `/pwd/updates`, `/pwd/updates/:id`, `/pwd/programs`, `/pwd/programs/:id` |
| **Lupon tagapamayapa** | desktop only | `/lupon/dashboard`, `/lupon/complaints`, `/lupon/cases`, `/lupon/cases/:id`, `/lupon/hearings` |
| **Resident** | **mobile first** | `/resident`, `/resident/certificates`, `/resident/announcements`, `/resident/announcements/:id`, `/resident/updates`, `/resident/updates/:id`, `/resident/programs`, `/resident/org-chart`, `/resident/sector-applications`, `/resident/sector-applications/:id/edit`, `/resident/lupon`, `/resident/lupon/cases/:id`, `/resident/profile`, `/resident/settings`, `/resident/about`, `/resident/citizen-charter`, `/resident/citizen-charter/:id`, `/resident/disbursement`, `/resident/disbursement/:id`, `/resident/chatbot` |
| **Public** | mobile first | `/verify/resident/:token` (what a resident QR code resolves to), `/resident/email/verify/:token` |

Routes mirror `routes/web.php` of the backend (commit `b6030a08`).

`/admin/org-chart` and `/clerk/org-chart` render one page body —
`src/components/org-chart/OrgChartManagement.tsx` — over a single barangay chart store,
the same way both backend controllers reuse the `ManagesOrgChart` concern.

The admin portal is a read-only oversight layer over the same mock stores the desks
write to: `src/mock/admin/dashboard.ts` derives its tiles, feed and notifications from
the resident registry, the certificate queue and the three sector desks, so approving a
registration as Clerk changes what the administrator sees. Its Data Export section
produces real downloads (`src/mock/admin/exports.ts`) with the backend's column
allowlists, filename dates and spreadsheet formula guard, and `/admin/qr-scanner`
resolves a `KBQR-…` credential and hands off to the public `/verify/resident/:token`
page rather than showing the result inline.

Below 1024px the admin and sector portals intentionally show a "desktop-only" notice
(`src/components/DesktopOnly.tsx`) instead of a broken layout.

## Design system

Tokens live in `src/index.css` — the supplied palette only:

```
#FFFFFF  surface / cards
#EEF1F5  canvas (page background)
#C2CBD4  line (hairline borders, inputs)
#3B6FA8  brand (primary, sidebar, active states)
#444A52  ink (text)
```

Semantic accents (`success`, `warning`, `danger`, `info`) are derived tints used only for
status badges. Type scale and spacing conventions are documented in
[`docs/UI-PATTERNS.md`](docs/UI-PATTERNS.md).

### Shared kit (`src/components/`)

`PageHeader` · `StatCard` · `StatusBadge` · `EmptyState` · `SegmentedTabs` · `Panel`
(`PanelHeader/Title/Description/Content/Footer`) · `TableTools`
(`SearchInput`, `TableToolbar`, `TablePagination`) · `charts` (`BarChart`, `BarList`) ·
`Logo` · `DesktopOnly`

shadcn/ui components live in `src/components/ui/`.

## Connecting the backend later

Everything is already shaped for it:

1. **Data** — `src/mock/data.ts` mirrors the payloads the Laravel controllers return
   (`certificateRequests`, `announcements`, `residents`, `complaints`, `auditLogs`, …).
   Replace an export with a `useEffect` fetch and the markup does not change.
2. **Forms** — schemas in `src/schemas/forms.ts` are Zod, so they can be swapped for the
   server's validation rules one-to-one.
3. **Auth** — submit handlers currently set a local `submitting` flag and simulate a
   success state; replace the body of `onSubmit` with the real request.
4. **Route map** — `routes/web.php` in the backend is the source of truth; the paths in
   `src/App.tsx` mirror it 1:1.
