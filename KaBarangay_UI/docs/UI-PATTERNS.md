# KaBarangay UI — patterns & conventions

Read this before writing any page. Everything below already exists; reuse it instead of
reinventing it.

## Stack

- Vite + React 19 + TypeScript, path alias `@/*` → `src/*`
- Tailwind CSS v4 (tokens live in `src/index.css`, **do not edit that file**)
- shadcn/ui components in `src/components/ui/*` (read the file before using one)
- React Hook Form + Zod (`@hookform/resolvers/zod` → `zodResolver`)
- lucide-react icons only. **No new dependencies.**

Run nothing: no `npm install`, no `npm run build`. The integrator builds once at the end.

## Colour tokens

| Token | Use |
|---|---|
| `bg-surface` | white cards/panels |
| `bg-canvas` | page background (#EEF1F5) |
| `border-line-soft` | the hairline border on everything |
| `border-line` | stronger divider when you need it |
| `text-ink-strong` | headings, emphasised values |
| `text-ink` | default body text |
| `text-ink-muted` | secondary text, table meta |
| `text-ink-faint` | tertiary text, placeholders, timestamps |
| `text-brand` / `bg-brand` | primary blue #3B6FA8 |
| `bg-brand-soft` | tinted icon chips, active backgrounds |
| `bg-brand-muted` | inactive chart bars |
| `text-success` + `bg-success-soft` | approved / active |
| `text-warning` + `bg-warning-soft` | pending / in review |
| `text-destructive` + `bg-danger-soft` | rejected / failed |
| `text-info` + `bg-info-soft` | open / attention |

Never introduce a raw hex colour. The only palette is
`#FFFFFF #EEF1F5 #C2CBD4 #3B6FA8 #444A52` plus the derived tokens above.

## Brand & logo

The logo is a PNG asset — never redraw it, never recolour it by hand.

| Asset | Lives in | Use |
|---|---|---|
| `@/assets/kabarangay-logo.png` | `src/assets` | full lock-up (mark + wordmark) — auth brand block |
| `@/assets/kabarangay-mark.png` | `src/assets` | mark only (three houses over an arc) — tiles |
| `/favicon.png` | `public` | browser tab icon, linked from `index.html` |

- Both PNGs ship **transparent**; the ink is `#3A70A7`, the same blue as `bg-brand`.
  (The source file has an EXIF colour space that misleads GDI+ — regenerate assets
  from the raw bytes, never through `System.Drawing`.)
- `LogoMark` wraps the mark in a rounded tile: `tone="onLight"` = blue tile with the
  mark inverted to white (`brightness-0 invert`), `tone="onBrand"` = white tile with
  the blue mark. One file serves both — do not add a white copy.
- `Logo` = `LogoMark` + the `KaBarangay` wordmark set in Inter + an optional subtitle.

## Typography (Inter, already loaded)

| Role | Classes |
|---|---|
| Page title | `text-xl font-semibold tracking-tight text-ink-strong` |
| Eyebrow above page title | `text-[11px] font-semibold uppercase tracking-wider text-brand` |
| Section title | `text-sm font-semibold tracking-tight text-ink-strong` |
| Body | `text-sm` |
| Secondary / meta | `text-xs text-ink-muted` or `text-ink-faint` |
| Big number | `text-2xl font-semibold tracking-tight text-ink-strong tnum` |
| Table cell | default (`text-sm`) |

`.tnum` = tabular figures — always use for IDs, dates, counts.

## Building blocks

```tsx
import PageHeader from "@/components/PageHeader"     // { title, eyebrow?, description?, actions?, className? }
import StatCard from "@/components/StatCard"         // { icon, label, value, hint?, trend?: "up"|"down", tone?: "brand"|"neutral" }
import StatusBadge, { statusTone } from "@/components/StatusBadge"  // { status, tone? }
import EmptyState from "@/components/EmptyState"     // { icon, title, description?, action? }
import SegmentedTabs from "@/components/SegmentedTabs" // { segments: {label,value,count?}[], value, onChange }
import { Panel, PanelHeader, PanelTitle, PanelDescription, PanelContent, PanelFooter, Meta } from "@/components/Panel"
import { SearchInput, TableToolbar, TablePagination } from "@/components/TableTools"
import { BarChart, BarList } from "@/components/charts"  // { data: {label,value}[] }
```

`Panel` already supplies `rounded-xl border border-line-soft bg-surface shadow-card`.
`PanelContent` already supplies `p-5`. Give a panel `className="p-0"` only when you need to
break that.

shadcn/ui available: `button badge card input label textarea select checkbox switch tabs
dialog dropdown-menu table avatar separator skeleton tooltip radio-group accordion popover
form scroll-area`. Read the component source first — the installed versions use
`data-slot` props and the `cn` package.

## Page skeletons

**Desktop page (admin / sector desks)** — always a `space-y-6` column:

```tsx
<div className="space-y-6">
  <PageHeader eyebrow="Admin" title="…" description="…" actions={<Button size="sm">…</Button>} />
  {/* stats: grid gap-4 sm:grid-cols-2 xl:grid-cols-4 */}
  {/* panels: grid gap-4 xl:grid-cols-3 or a single Panel */}
</div>
```

**List page**: `Panel` → `PanelHeader` (title + `SegmentedTabs` or an action button) →
`TableToolbar` (`SearchInput` + `ml-auto` filter buttons) → `Table` → `TablePagination`.
Table header row: `className="hover:bg-transparent"` on `TableRow`; pad the first/last
column with `pl-5` / `pr-5` so text lines up with the panel padding.

Right-aligned action cells (`pr-5 text-right` under an `Actions` / `Action` head) must hold an
**inline-level** trigger: `<Button variant="ghost" size="icon-sm">` (already `inline-flex`) or a
raw `<button className="inline-grid size-8 …">`. A block-level `grid` button ignores
`text-align` and parks itself at the left of the cell, so the ⋯ ends up ~43px away from the
header — `inline-grid` aligns it to the same right edge with no change to row height (48.8px).

**Boards**: every sector desk has a single **Announcements** queue — notices *and* updates are
the same thing and are listed together (`AnnouncementsView` defaults to
`["announcement", "update"]`). Only `Programs` is a board of its own, so there is no `Updates`
nav item and no `/…/updates` route on the clerk, senior or PWD desks.

**Form page**: React Hook Form + Zod.

```tsx
const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { … } })
<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
  <FormField control={form.control} name="type" render={({ field }) => (
    <FormItem>
      <FormLabel>Certificate</FormLabel>
      <FormControl><Select value={field.value} onValueChange={field.onChange}>…</Select></FormControl>
      <FormMessage />
    </FormItem>
  )} />
</form>
```

Label every input. Never leave a required field unvalidated. On submit: set a local
`submitting` flag, then simulate success (no network). UI-only auth — no real login.

**Auth screens** — two variants of `AuthLayout`, and `variant` is required (no
default): `variant="staff"` (split-screen, `/login`) and `variant="resident"`
(the same split-screen on desktop, collapsing to a compact `Logo` + card column
on phones — resident auth is the only side that must work on mobile).

- **`staff` splits at `lg`** (`grid-cols-[1.05fr_1fr]`). Left = the brand panel:
  `bg-[linear-gradient(160deg,brand,brand-deep)]`, the full logo in white
  (`brightness-0 invert`), tagline, pitch, three bullets, the `©` line, plus
  `bg-white/10` circles and one `border-white/15` ring. Right = the form column
  on `bg-canvas`. Below `lg` the panel is `hidden` and the column shows the
  small `Logo` instead, so the layout still works stacked.
- **The form column is never flat.** It sits under a `FormBackdrop`: a
  `brand-muted → canvas` wash down the top 30rem, a `--color-line` dot grid
  (22px cells, `opacity-60`) and two oversized `border-brand/25` rings cropped by
  the viewport (the arc that runs under the houses in the mark). All layers live
  in one `aria-hidden` + `pointer-events-none` wrapper with `overflow-hidden`, so
  the rings never create page scroll. Order matters: wash first, dots above it,
  rings last. Tokens only — no raw hex, no images.
- **`resident` is the same split without the gate.** At `lg`+ it uses the same
  `grid-cols-[1.05fr_1fr]` brand panel, `FormBackdrop` and form column, with
  resident copy (logo + "Resident Portal", pitch, three bullets). Below `lg` the
  panel is hidden and the small `Logo` sits above the card, so the portal stays
  usable at 320px. It never prints the staff notice and never links to `/login`
  — residents must not see a staff entry point.
- Only the `staff` variant prints `Authorized personnel only` under `children`.

**Two different products, two different auth flows.** The resident portal is the
public sub-domain (website); admin and sector desks are the desktop application
installed for barangay staff — residents must never see a staff/admin entry
point, so the resident pages carry no link to `/login`.

- **Resident site — one page, one form.** `/resident/login` mirrors
  `Resident/Login.tsx`: the barangay `Select`, the identifier, the password,
  Remember me and the approval notice all share the card, so a bookmark or a
  refresh lands on the same complete form. `residentLoginSchema` therefore
  holds `barangayId`, `identifier`, `password`, `remember` (no `location.state`
  hand-off, and no separate picker route).
- **Admin/staff app — one page, one form.** `/login` renders all five fields
  together: **Select Barangay, Department, Position, Full Name, Password**
  (plus Remember me). No select-only screen, no reveal step — the resident
  sign-in is a single page too. Barangay stays in `staffLoginSchema`, so the
  submit payload carries it. Position is `disabled` until Department is picked
  and is cleared whenever Department changes. `/` and every unknown path
  redirect to `/resident/login`, so a staff visit is always deliberate.
  Department is really the **portal picker** — its options are the five portals
  (Admin, Clerk, Senior Citizen Sector, PWD Sector, Lupong Tagapamayapa, the
  `portals` array in `StaffLogin.tsx`) and Position lists the positions inside
  the portal that was picked. Each department carries a `to` route, so a
  successful login lands on **that** portal: Admin → `/admin`, Clerk →
  `/clerk/dashboard`, Senior Citizen Sector → `/senior/dashboard`, PWD Sector →
  `/pwd/dashboard`, Lupong Tagapamayapa → `/lupon/dashboard` (fallback
  `/admin`). Position lists stay provisional until the access matrix is final.

**Desktop-only gate.** Staff/admin screens never show a form below `lg` — they
render `DesktopOnly` instead: `DashboardLayout` does it for every desk route,
and the `staff` variant of `AuthLayout` does it for `/login`. Same pattern in
both places: `hidden … lg:` on the real shell + `<div className="lg:hidden">`
around the notice. Resident routes are never gated — the portal must work at
320–430px.

Submit handlers stay UI-only.

**Mobile page (resident)** — inside `ResidentLayout`, column is `max-w-lg` (512px):

- stack sections with `space-y-4`, each a `Panel className="p-4"` or a bare
  `rounded-xl border border-line-soft bg-surface p-4 shadow-card`
- tap targets ≥ `h-10` (40px); no horizontal scroll at 320px
- no sidebars, no hover-only affordances
- keep copy short and left-aligned; it must read at 375px

**Resident shell navigation** (`src/layouts/ResidentLayout.tsx` +
`residentNav` / `residentMoreNav` in `src/config/navigation.ts`):

- the fixed bottom bar carries the five tabs the resident uses most — Home,
  Certificates, Announcements, Lupon, Profile;
- the app bar's `More` button opens a bottom sheet (`Dialog` pinned to the
  bottom edge, `max-h-[75vh]`, closes on route change) that lists every other
  surface, grouped like the reference drawer: Main Services, Information,
  Account;
- labels are the reference's own (`Request Certificate`, `File a Complaint`,
  `Citizen's Charter`, `Kabarangay AI`, `My Profile`), so no route is
  reachable only by typing its URL.

## Mock data

`src/mock/data.ts` exports: `barangay`, `residents`, `registrations`, `certificateTypes`,
`certificateRequests`, `myCertificateRequests`, `announcements`, `staff`, `sectors`,
`populationSummary`, `populationByPurok`, `populationByAge`, `populationBySector`,
`complaints`, `myComplaints`, `auditLogs`, `monthlyRequests`, `requestsByType`,
`currentResident`, `barangayOptions`.

Area-specific mock files: `src/mock/sectors.ts` (sector desks, announcements, rosters),
`src/mock/resident.ts` (resident portal copy and records), plus
`adminExtras.ts`, `sectorExtras.ts`, `luponExtras.ts`, `residentExtras.ts` for the
boards added later.

Read the relevant file first. Add page-specific mock arrays **inside your own page file**
(or a new file under `src/mock/` you own) — never edit `src/mock/data.ts` or `src/mock/sectors.ts`.

## Resident auth map (latest backend)

Mirrors `resources/js/pages/Resident` on the `b6030a08` backend commit. Do not
reintroduce the old claim flow or the standalone barangay picker — both were
removed upstream and replaced by registration + application access.

| UI route | Screen |
|---|---|
| `/resident/login` | Resident sign in (barangay + identifier + password) |
| `/resident/register` | Registration wizard |
| `/resident/register/submitted` | Pending screen + application reference |
| `/resident/application/access` | Open an application with reference + registration password |
| `/resident/application/:reference` | Status and correction resubmission, read-only once approved or rejected |
| `/resident/forgot-password` | Request a reset link |
| `/resident/reset-password/:token` | Choose a new password |
| `/resident/email/verify/:token` | Verified / expired / email-changed / invalid |

Staff sign in stays at `/login` (one page, desktop only). The backend serves the same form
at the staff subdomain root with the same fields: barangay, department, position, full name,
password.

Desktop additions that mirror the same backend commit: `/admin/announcements/approvals`
(approve/reject queue), `/admin/sector-applications/:id` (full application record) and
`/lupon/cases/create` (walk-in case page, replacing the old inline dialog).

## Checks

| Command | What it does |
|---|---|
| `npx tsc --noEmit` | type check only |
| `npm run build` | type check + production bundle |
| `npm run smoke` | renders all 119 routes through the real `<App />` in Node and fails on any render crash — run this after adding or renaming a route |

`src/smoke.tsx` holds the route list; add new routes there when you add them to `src/App.tsx`.

## Hard rules

1. Only create/modify files inside the directories you were assigned.
2. Do not touch: `src/App.tsx`, `src/main.tsx`, `src/index.css`, `src/layouts/*`,
   `src/components/Panel.tsx`, `PageHeader.tsx`, `StatCard.tsx`, `StatusBadge.tsx`,
   `EmptyState.tsx`, `SegmentedTabs.tsx`, `TableTools.tsx`, `charts.tsx`, `Logo.tsx`,
   `DesktopOnly.tsx`, `src/config/navigation.ts`, `src/mock/data.ts`, `vite.config.ts`,
   `package.json`, `components.json`.
3. Every page is a **default export** from `src/pages/<area>/<Name>.tsx`.
4. No `any`, no `@ts-ignore`, no unused imports — `tsc --noEmit` must pass.
5. Consistent naming: `PascalCase.tsx` components, sentences in Title case for headings.
6. Dates read like `Oct 9, 2026`. Currency like `₱8,500`.
