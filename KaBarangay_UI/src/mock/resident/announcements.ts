/**
 * Resident portal — announcements, updates and programs.
 *
 * The read model of `Resident\AnnouncementController`. One table of notices is
 * cut three ways:
 *
 *   • **announcements** — every event plus the informational notices that are
 *     still open.
 *   • **updates** — the informational notices only, split into `current`
 *     (no `completed_at`) and `past`.
 *   • **programs** — the events whose own lifecycle is not a draft, oldest
 *     scheduled first.
 *
 * `approval_status = approved`, `is_published`, this barangay, and an audience
 * the resident belongs to narrow every one of those cuts. A regular resident
 * therefore never sees a senior-citizen-only notice, while an OSCA or PWD
 * member sees their own desk's notices on top of the general ones.
 */

import { clerkStore } from "@/mock/clerkDesk"
import { pwdStore } from "@/mock/pwd"
import { seniorStore } from "@/mock/senior"
import type { SectorImportance, SectorPost } from "@/mock/sectorDesks"

import { sectorSlugsOf, sessionResident, type SectorSlug } from "./session"

const desks = [
  { key: "clerk", store: clerkStore },
  { key: "senior", store: seniorStore },
  { key: "pwd", store: pwdStore },
] as const

export type ResidentDeskKey = (typeof desks)[number]["key"]

/** `AnnouncementType::EVENT` / `INFORMATIONAL`. */
export type ResidentPostType = "event" | "informational"

/** The three boards the controller renders, keyed as the routes key them. */
export type ResidentBoard = "announcements" | "updates" | "programs"

export type ResidentPeriod = "current" | "past"

/** `Announcement::target_audience`. */
export type ResidentAudience = "all" | "senior_citizens" | "pwd" | "other"

export type ResidentAnnouncement = {
  /** Announcement ids repeat per desk, so the desk travels with the id. */
  id: string
  desk: ResidentDeskKey
  title: string
  content: string
  category: string
  importance: SectorImportance
  type: ResidentPostType
  audience: string
  location: string | null
  /** `event_start_at`, ISO to the minute; `null` for a notice with no date. */
  eventStartAt: string | null
  requiresAttendance: boolean
  /** Set once the notice is closed — this is what moves an update to `past`. */
  completedAt: string | null
  /** Program lifecycle; informational notices have none. */
  programStatus: string | null
  createdAt: string
  author: string
}

/* ------------------------------------------------------------------ */
/* Audience                                                            */
/* ------------------------------------------------------------------ */

/** `target_audience` for the free-text audience a desk posts. */
export function targetAudienceOf(audience: string): ResidentAudience {
  switch (audience.trim().toLowerCase()) {
    case "all":
    case "all residents":
      return "all"
    case "senior citizens":
      return "senior_citizens"
    case "pwd":
    case "persons with disability":
    case "persons with disabilities":
      return "pwd"
    default:
      return "other"
  }
}

function audienceMatches(audience: ResidentAudience, slugs: SectorSlug[]) {
  switch (audience) {
    case "all":
      return true
    case "senior_citizens":
      return slugs.includes("senior")
    case "pwd":
      return slugs.includes("pwd")
    // Anything else is targeted at a group this portal cannot belong to.
    case "other":
      return false
  }
}

/* ------------------------------------------------------------------ */
/* Event clock                                                         */
/* ------------------------------------------------------------------ */

/** The desks record `09:00` and `09:00 AM` interchangeably; both parse. */
function clockParts(time: string | undefined): { hour: number; minute: number } | null {
  if (!time) return null

  const match = /^(\d{1,2})(?::(\d{2}))?(?:\s*([AP]M))?$/i.exec(time.trim())
  if (!match) return null

  let hour = Number(match[1])
  const minute = Number(match[2] ?? 0)
  if (hour > 23 || minute > 59) return null

  const suffix = match[3]?.toUpperCase()
  if (suffix === "PM" && hour < 12) hour += 12
  if (suffix === "AM" && hour === 12) hour = 0

  return { hour, minute }
}

/** `event_start_at` as an ISO stamp, or `null` when the notice carries no date. */
function eventStartOf(post: SectorPost): string | null {
  if (!post.eventDate) return null

  const clock = clockParts(post.eventTime)
  if (!clock) return `${post.eventDate}T00:00`

  return `${post.eventDate}T${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")}`
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

/** `approval_status = approved` and `is_published`. */
function isPublished(post: SectorPost): boolean {
  return post.approvalStatus === "approved" && post.programStatus !== "draft"
}

/** `AnnouncementType::isEvent()` — the `Event` category or an attendance sheet. */
export function isEventType(post: SectorPost): boolean {
  return post.category.trim().toLowerCase() === "event" || post.requiresAttendance
}

function toRow(desk: ResidentDeskKey, post: SectorPost): ResidentAnnouncement {
  return {
    id: `${desk}-${post.id}`,
    desk,
    title: post.title,
    content: post.content,
    category: post.category,
    importance: post.importance,
    type: isEventType(post) ? "event" : "informational",
    audience: post.audience,
    location: post.location ?? null,
    eventStartAt: eventStartOf(post),
    requiresAttendance: post.requiresAttendance,
    completedAt: post.completedAt ?? null,
    programStatus: post.programStatus ?? null,
    createdAt: post.createdAt,
    author: post.author,
  }
}

/** The rows the signed-in resident is allowed to see, before any board cut. */
export function visibleAnnouncementRows(): ResidentAnnouncement[] {
  const slugs = sectorSlugsOf(sessionResident())

  return desks.flatMap(({ key, store }) =>
    store
      .postsFor(["auto", "update", "program"])
      .filter((post) => isPublished(post) && audienceMatches(targetAudienceOf(post.audience), slugs))
      .map((post) => toRow(key, post)),
  )
}

/** `applyUpdateFilter` / `applyProgramFilter` for a row. */
function isUpdateRow(row: ResidentAnnouncement): boolean {
  return row.type === "informational"
}

export function boardRows(board: ResidentBoard, period: ResidentPeriod): ResidentAnnouncement[] {
  const rows = visibleAnnouncementRows()

  if (board === "updates")
    return rows.filter((row) => isUpdateRow(row) && (period === "past" ? row.completedAt !== null : row.completedAt === null))

  if (board === "programs")
    return rows.filter((row) => row.type === "event" && (row.programStatus === null || row.programStatus === "ongoing"))

  // Announcements: every event, plus the updates that are still open.
  return rows.filter((row) => row.type === "event" || row.completedAt === null)
}

/** `->latest()->orderByDesc('id')` — newest posted first. */
export function byNewest(rows: ResidentAnnouncement[]): ResidentAnnouncement[] {
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || numericId(b) - numericId(a))
}

/** `orderByRaw('event_start_at is null')->orderBy('event_start_at')->orderByDesc('id')`. */
export function byEventStart(rows: ResidentAnnouncement[]): ResidentAnnouncement[] {
  return [...rows].sort((a, b) => {
    if (a.eventStartAt === null && b.eventStartAt !== null) return 1
    if (a.eventStartAt !== null && b.eventStartAt === null) return -1
    if (a.eventStartAt !== null && b.eventStartAt !== null && a.eventStartAt !== b.eventStartAt)
      return a.eventStartAt.localeCompare(b.eventStartAt)

    return numericId(b) - numericId(a)
  })
}

function numericId(row: ResidentAnnouncement): number {
  return Number(row.id.split("-").pop() ?? 0)
}

/**
 * The distinct `category` values of the board's own visible rows, alphabetically.
 * The controller builds this from the query it is about to page through, so an
 * updates board never offers `Event`.
 */
export function announcementCategories(
  board: ResidentBoard = "announcements",
  period: ResidentPeriod = "current",
): string[] {
  return [...new Set(boardRows(board, period).map((row) => row.category).filter(Boolean))].sort()
}

/* ------------------------------------------------------------------ */
/* Search and filters                                                  */
/* ------------------------------------------------------------------ */

/** The query parameters the board validates. */
export type BoardFilters = {
  q: string
  category: string
  importance: string
}

export const emptyBoardFilters: BoardFilters = { q: "", category: "", importance: "" }

/** `Announcement::IMPORTANCE_LEVELS`, in the order the filter offers them. */
export const importanceOptions = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
] as const

export function hasActiveFilters(filters: BoardFilters): boolean {
  return Boolean(filters.q || filters.category || filters.importance)
}

/** `title like %q% or content like %q%`, then the two exact matches. */
function filterRows(rows: ResidentAnnouncement[], filters: BoardFilters): ResidentAnnouncement[] {
  const term = filters.q.trim().toLowerCase()

  return rows.filter((row) => {
    if (term && !`${row.title}\n${row.content}`.toLowerCase().includes(term)) return false
    if (filters.category && row.category !== filters.category) return false
    if (filters.importance && row.importance !== filters.importance) return false

    return true
  })
}

export type BoardPage = {
  rows: ResidentAnnouncement[]
  page: number
  lastPage: number
  total: number
  from: number
  to: number
}

/** `->paginate(10)->withQueryString()` over the filtered board. */
export function boardPage(
  board: ResidentBoard,
  period: ResidentPeriod,
  filters: BoardFilters,
  page = 1,
): BoardPage {
  const rows = byNewest(filterRows(boardRows(board, period), filters))
  const lastPage = Math.max(1, Math.ceil(rows.length / ANNOUNCEMENTS_PER_PAGE))
  const current = Math.min(Math.max(1, page), lastPage)
  const from = (current - 1) * ANNOUNCEMENTS_PER_PAGE

  return {
    rows: rows.slice(from, from + ANNOUNCEMENTS_PER_PAGE),
    page: current,
    lastPage,
    total: rows.length,
    from: rows.length === 0 ? 0 : from + 1,
    to: Math.min(from + ANNOUNCEMENTS_PER_PAGE, rows.length),
  }
}

/** The programs board keeps the controller's own order and is never paginated. */
export function programRows(): ResidentAnnouncement[] {
  return byEventStart(boardRows("programs", "current"))
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

/**
 * The dashboard's `latestAnnouncement`: the newest visible notice of any kind,
 * with `created_at` rendered `"F j, Y"`.
 */
export function latestAnnouncement(): { id: string; title: string; createdAt: string } | null {
  // The dashboard query has no board cut at all — every published notice counts.
  const [newest] = byNewest(visibleAnnouncementRows())

  return newest
    ? {
        id: newest.id,
        title: newest.title,
        createdAt: formatLongDate(newest.createdAt),
      }
    : null
}

const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/** Carbon's `F j, Y`. */
export function formatLongDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return iso

  return `${LONG_MONTHS[month - 1]} ${day}, ${year}`
}

/** `M j, Y g:i A` for a scheduled notice, from the ISO stamp the controller sends. */
export function formatEventStart(iso: string | null): string {
  if (!iso) return ""

  const [date, time] = iso.split("T")
  if (!time) return formatLongDate(date)

  const [hourText, minuteText] = time.split(":")
  const hour = Number(hourText)
  const minute = Number(minuteText ?? 0)
  if (!Number.isFinite(hour)) return formatLongDate(date)

  const suffix = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12

  return `${formatLongDate(date)} ${hour12}:${String(minute).padStart(2, "0")} ${suffix}`
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

/** `"M j, Y"` — what `toLocaleDateString('en-US', { month: 'short' … })` answers. */
export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return iso

  return `${SHORT_MONTHS[month - 1]} ${day}, ${year}`
}

/** `"M j, Y g:i A"` for the posted and scheduled stamps both boards print. */
export function formatShortDateTime(iso: string | null): string {
  if (!iso) return ""

  const [date, time] = iso.split("T")
  // A notice posted without a clock time reads as a date, not as midnight.
  if (!time) return formatShortDate(date)

  const [hourText, minuteText] = time.split(":")
  const hour = Number(hourText)
  if (!Number.isFinite(hour)) return iso

  const suffix = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12

  return `${formatShortDate(date)}, ${hour12}:${String(Number(minuteText ?? 0)).padStart(2, "0")} ${suffix}`
}

/* ------------------------------------------------------------------ */
/* Detail                                                              */
/* ------------------------------------------------------------------ */

/** `show()` re-runs the board's own visibility query, so a row only opens on the board it belongs to. */
export function findAnnouncement(
  board: ResidentBoard,
  period: ResidentPeriod,
  id: string,
): ResidentAnnouncement | null {
  return boardRows(board, period).find((row) => row.id === id) ?? null
}

/** `formatCategoryLabel` — underscores read as spaces, nothing as General. */
export function categoryLabel(category: string): string {
  return category ? category.replace(/_/g, " ") : "General"
}

/** `formatAudienceLabel` for the board the row belongs to. */
export function audienceLabel(row: ResidentAnnouncement): string {
  switch (targetAudienceOf(row.audience)) {
    case "all":
      return "All Residents"
    case "senior_citizens":
      return "Senior Citizens"
    case "pwd":
      return "PWD"
    default:
      return row.audience.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

/** `formatImportanceLabel`. */
export function importanceLabel(importance: string): string {
  return importance.charAt(0).toUpperCase() + importance.slice(1)
}

/** `eligibility_label` on the programs board. */
export function eligibilityLabel(row: ResidentAnnouncement): string {
  switch (targetAudienceOf(row.audience)) {
    case "senior_citizens":
      return "Senior Citizens"
    case "pwd":
      return "Persons with Disabilities"
    default:
      return "All Residents"
  }
}

/** `PER_PAGE`. */
export const ANNOUNCEMENTS_PER_PAGE = 10
