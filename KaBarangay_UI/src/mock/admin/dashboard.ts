/**
 * Admin Dashboard — the read model of `Admin/DashboardController`.
 *
 * The controller hands the page five things: the KPI stats, the purok list, the
 * five newest published announcements, a short notification feed and the
 * active-staff count. Every figure is derived from the stores the detailed
 * pages already use, so the dashboard can never disagree with them.
 */

import { clerkStore } from "@/mock/clerkDesk"
import { pwdStore } from "@/mock/pwd"
import { seniorStore } from "@/mock/senior"
import { formatIsoDate } from "@/mock/sectors"
import type { SectorDeskStore, SectorPost } from "@/mock/sectorDesks"
import { clerkCertificateStore, type CertificateStatus } from "@/mock/clerk/certificates"

import { luponCaseSummary } from "./sectors"
import { puroks, residentRegistry, type AdminPurok } from "./residents"
import { adminPrograms } from "./programs"
import { staffAssignments } from "./staff"

const desks: { key: string; store: SectorDeskStore }[] = [
  { key: "clerk", store: clerkStore },
  { key: "senior", store: seniorStore },
  { key: "pwd", store: pwdStore },
]

/** Announcement ids repeat between desks, so the desk travels with the key. */
export type DashboardAnnouncement = {
  id: string
  title: string
  content: string
  category: string
  /** `event_start_at` rendered as `M j, Y g:i A`, exactly as the controller formats it. */
  eventStartAt: string | null
  location: string | null
}

export type DashboardNotification = {
  id: string
  icon: string
  title: string
  description: string
  time: string
  href: string
}

export type DashboardStats = {
  residents: number
  totalPrograms: number
  totalAnnouncements: number
  puroks: number
  cases: number
}

/** `latest('event_start_at')->latest('created_at')->limit(5)`. */
const ANNOUNCEMENT_LIMIT = 5

/** Three registrations, then three requests — and the merged feed is capped at five. */
const REGISTRATION_NOTIFICATIONS = 3
const CERTIFICATE_NOTIFICATIONS = 3
const NOTIFICATION_LIMIT = 5

/**
 * A request that still needs somebody to act on it: the controller excludes
 * only Released and Rejected, so everything else surfaces as a notification.
 */
const awaitingProcessing: CertificateStatus[] = [
  "Pending",
  "Needs Action",
  "For Payment",
  "Processing",
  "Ready for Claim",
]

/**
 * `is_published` and `approval_status = approved` in one rule: a rejected or
 * still-pending notice never reaches the feed, and an approved activity that
 * staff have not taken out of draft is not live yet.
 */
function isLive(post: SectorPost): boolean {
  return post.approvalStatus === "approved" && post.programStatus !== "draft"
}

/**
 * The desks record the clock two ways — `09:00` and `09:00 AM` — so both parse
 * to the same 24-hour parts before anything is formatted or ordered.
 */
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

/** Sortable stamp for the ordering; a notice without an event date has no key. */
function eventKey(post: SectorPost): string | null {
  if (!post.eventDate) return null

  const clock = clockParts(post.eventTime)
  const hh = String(clock?.hour ?? 0).padStart(2, "0")
  const mm = String(clock?.minute ?? 0).padStart(2, "0")

  return `${post.eventDate}T${hh}:${mm}`
}

/** `M j, Y g:i A`, the controller's `event_start_at` format. */
function formatEventStart(post: SectorPost): string | null {
  if (!post.eventDate) return null

  const clock = clockParts(post.eventTime)
  if (!clock) return formatIsoDate(post.eventDate)

  const suffix = clock.hour >= 12 ? "PM" : "AM"
  const hour12 = clock.hour % 12 === 0 ? 12 : clock.hour % 12

  return `${formatIsoDate(post.eventDate)} ${hour12}:${String(clock.minute).padStart(2, "0")} ${suffix}`
}

/** `Carbon::diffForHumans()` for a date-only value, e.g. "9 days ago". */
export function timeAgo(iso: string | null): string {
  if (!iso) return ""

  const then = new Date(`${iso.slice(0, 10)}T00:00:00`).getTime()
  const days = Math.round((Date.now() - then) / 86_400_000)

  if (days <= 0) return "1 day ago"
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`

  const months = Math.round(days / 30)
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`

  const years = Math.round(months / 12)
  return `${years} year${years === 1 ? "" : "s"} ago`
}

function announcementRows(): DashboardAnnouncement[] {
  const rows = desks.flatMap(({ key, store }) =>
    store
      .postsFor(["auto", "update", "program"])
      .filter(isLive)
      .map((post) => ({
        announcement: {
          id: `${key}-${post.id}`,
          title: post.title,
          content: post.content,
          category: post.category,
          eventStartAt: formatEventStart(post),
          location: post.location ?? null,
        } satisfies DashboardAnnouncement,
        eventKey: eventKey(post),
        createdAt: post.createdAt,
      })),
  )

  // MySQL sorts DESC with NULLs last, so a dated event outranks a plain notice.
  rows.sort((a, b) => {
    if (a.eventKey !== null && b.eventKey !== null && a.eventKey !== b.eventKey)
      return b.eventKey.localeCompare(a.eventKey)
    if (a.eventKey === null && b.eventKey !== null) return 1
    if (a.eventKey !== null && b.eventKey === null) return -1
    return b.createdAt.localeCompare(a.createdAt)
  })

  return rows.slice(0, ANNOUNCEMENT_LIMIT).map((row) => row.announcement)
}

/**
 * The applicant's name as the controller builds it: every part joined by a
 * space, including the full middle name — not the initial the rosters show.
 */
function applicantName(parts: {
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
}): string {
  return [parts.firstName, parts.middleName, parts.lastName, parts.suffix].filter(Boolean).join(" ")
}

function notificationRows(): DashboardNotification[] {
  const notifications: DashboardNotification[] = []

  residentRegistry.registrationsIn("pending", "needs_correction")
    .slice()
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))
    .slice(0, REGISTRATION_NOTIFICATIONS)
    .forEach((registration) => {
      notifications.push({
        id: `reg-${registration.id}`,
        icon: "♙",
        title: "Resident registration to review",
        description: applicantName(registration) || "New application",
        time: timeAgo(registration.submittedAt),
        href: "/admin/residents",
      })
    })

  const requests = clerkCertificateStore
    .queue()
    .filter((request) => awaitingProcessing.includes(request.status))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt) || b.id - a.id)
    .slice(0, CERTIFICATE_NOTIFICATIONS)

  requests.forEach((request) => {
    notifications.push({
      id: `cert-${request.id}`,
      icon: "!",
      title: "Certificate request awaiting processing",
      description: request.certificate || "Certificate request",
      time: timeAgo(request.submittedAt),
      // The controller points at the certificates roster on the Sectors page.
      href: "/admin/sectors",
    })
  })

  return notifications.slice(0, NOTIFICATION_LIMIT)
}

export function dashboardStats(): DashboardStats {
  const posts = desks.flatMap(({ store }) => store.postsFor(["auto", "update", "program"]))

  return {
    // The directory's approved-account scope, same figure the Residents page heads with.
    residents: residentRegistry.stats().totalResidents,
    totalPrograms: adminPrograms().length,
    totalAnnouncements: posts.length,
    puroks: puroks.length,
    cases: luponCaseSummary().open,
  }
}

export function dashboardPuroks(): AdminPurok[] {
  return puroks
}

export const dashboardAnnouncements = announcementRows

export const dashboardNotifications = notificationRows

export function dashboardActiveStaff(): number {
  return staffAssignments.activeCount()
}
