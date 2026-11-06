/**
 * Admin portal — audit trail and security log.
 *
 * Mirrors `Admin/AuditLogController` and `Admin/AuditLog.tsx`: the trail stores
 * `{ id, event, actor, created_at }` only, the single filter is an `event`
 * dropdown constrained to a server allowlist, the sector column is derived from
 * the event's domain prefix, and every one of the three datasets on the page is
 * paginated at 15. Nothing here is fetched, and no IP address or account
 * identifier is ever exposed to the administrator.
 *
 * The trail is a session store, so actions taken anywhere in the admin portal —
 * approving a registration, assigning staff, editing an emergency hotline —
 * appear here the way they would once persisted to the database.
 */

/* ------------------------------------------------------------------ */
/* Event allowlist                                                     */
/* ------------------------------------------------------------------ */

/**
 * The five approved categories (logins, staff, residents, certificates,
 * announcements). The allowlist exists so the filter can never be widened by
 * client-supplied input.
 */
export const supportedEvents = [
  "announcement.approved",
  "announcement.created",
  "announcement.deleted",
  "announcement.rejected",
  "announcement.resubmitted",
  "certificate_request.created",
  "certificate_request.status_changed",
  "login.failed",
  "login.success",
  "resident.account_status_changed",
  "resident.status_changed",
  "resident_registration.approved",
  "resident_registration.rejected",
  "resident_registration.submitted",
  "staff.created",
  "staff.role_changed",
  "staff.status_changed",
  "staff.updated",
] as const

export const auditPageSize = 15

/**
 * Anything outside the allowlist normalises to "no event restriction" — the
 * same convention the certificate and staff listings use for unknown status
 * values, so a stray value can never widen or error the listing.
 */
export function auditEventFilter(value: string): string {
  return (supportedEvents as readonly string[]).includes(value) ? value : ""
}

/** Sector labels derived from the event name's domain prefix. */
const sectorLabels: Record<string, string> = {
  announcement: "Announcements",
  certificate_request: "Certificates",
  login: "Authentication",
  resident: "Residents",
  resident_registration: "Resident Registration",
  staff: "Staff",
}

/** `snake_case` → `Snake Case`, exactly as the backend humanises a fallback. */
export function formatLabel(value: string): string {
  return value
    .replace(/[_.]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

/** `announcement.approved` → `Announcement · Approved`. */
export function formatEventLabel(event: string): string {
  return event
    .split(".")
    .map((part) => formatLabel(part))
    .join(" · ")
}

export function sectorForEvent(event: string): string {
  const domain = event.split(".")[0] ?? ""
  return sectorLabels[domain] ?? formatLabel(domain)
}

/** Whole hours read as hours; anything else is rounded to minutes. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—"
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600
    return `${hours} hour${hours === 1 ? "" : "s"}`
  }
  const minutes = Math.round(seconds / 60)
  return `${minutes} minute${minutes === 1 ? "" : "s"}`
}

/* ------------------------------------------------------------------ */
/* Records                                                             */
/* ------------------------------------------------------------------ */

export type AuditActor = {
  name: string
  position: string | null
  departmentLabel: string | null
}

export type AuditEntry = {
  id: number
  event: string
  /** `null` renders as "System" in the staff column. */
  actor: AuditActor | null
  /** Rendered `Y-m-d H:i:s PHT` in Asia/Manila. */
  createdAt: string
}

export type LoginAttemptStatus = "success" | "failed" | "rate_limited"

/**
 * The row the controller's `through()` builds. An actor is described only by
 * their staff position or the word "Resident" — no email, username or IP
 * address ever reaches the listing.
 */
export type LoginAttempt = {
  id: number
  actorType: string
  actorLabel: string
  channel: string
  status: LoginAttemptStatus
  attemptedAt: string
}

export type SuspiciousAlert = {
  id: number
  channel: string
  alertType: string
  attemptCount: number
  windowSeconds: number
  createdAt: string
}

/** `actor_type === 'staff'` keeps the position; every other actor is "Resident". */
export function attemptActorLabel(actorType: string, position: string): string {
  if (actorType !== "staff") return "Resident"
  return position.trim() !== "" ? position : "Unidentified staff"
}

/** The `LengthAwarePaginator` shape each of the three sections is read through. */
export type AuditPaginator<T> = {
  data: T[]
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number | null
  to: number | null
}

function paginate<T>(rows: T[], page: number): AuditPaginator<T> {
  const total = rows.length
  const lastPage = Math.max(1, Math.ceil(total / auditPageSize))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * auditPageSize
  const slice = rows.slice(start, start + auditPageSize)

  return {
    data: slice,
    currentPage,
    lastPage,
    perPage: auditPageSize,
    total,
    from: slice.length === 0 ? null : start + 1,
    to: slice.length === 0 ? null : start + slice.length,
  }
}

/* ------------------------------------------------------------------ */
/* Manila clock                                                        */
/* ------------------------------------------------------------------ */

/** Fixed offset: the portal documents Philippine Time, which has no DST. */
const manilaOffsetMinutes = 8 * 60

const pad = (value: number) => String(value).padStart(2, "0")

/**
 * A seeded action timestamp, stamped 27 seconds apart so the trail reads as a
 * real sequence of events rather than one instant.
 */
function manilaStamp(minutesAgo: number, seconds = 0): string {
  const shifted = new Date(Date.now() - minutesAgo * 60_000 + seconds * 1000)
  const manila = new Date(shifted.getTime() + (manilaOffsetMinutes + shifted.getTimezoneOffset()) * 60_000)
  return [
    `${manila.getFullYear()}-${pad(manila.getMonth() + 1)}-${pad(manila.getDate())}`,
    `${pad(manila.getHours())}:${pad(manila.getMinutes())}:${pad(manila.getSeconds())}`,
    "PHT",
  ].join(" ")
}

/** The clock an action taken right now writes. */
export function auditNow(): string {
  return manilaStamp(0)
}


/* ------------------------------------------------------------------ */
/* Actors                                                              */
/* ------------------------------------------------------------------ */

/**
 * The same people the Staff listing assigns, described the way the controller
 * resolves an actor: the active assignment's position, then its department
 * label from `StaffDepartments::LABELS`.
 */
const staffActors = {
  admin: {
    name: "Roberto M. Villanueva",
    position: "Barangay Administrator",
    departmentLabel: "Barangay Administration",
  },
  clerk: {
    name: "Elena R. Villamor",
    position: "Barangay Clerk",
    departmentLabel: "Records and Certificates",
  },
  senior: {
    name: "Rogelio S. Panganiban",
    position: "Senior Citizens Officer",
    departmentLabel: "Senior Citizens Affairs",
  },
  pwd: {
    name: "Armando V. Ledesma",
    position: "PWD Officer",
    departmentLabel: "Persons with Disability Affairs",
  },
  lupon: {
    name: "Felix M. Aquino",
    position: "Lupon Officer",
    departmentLabel: "Lupon Tagapamayapa",
  },
} satisfies Record<string, { name: string; position: string; departmentLabel: string }>

const actorOf = (key: keyof typeof staffActors): AuditActor => staffActors[key]

/** The administrator whose actions the portal records by default. */
const adminActor: AuditActor = staffActors.admin

/* ------------------------------------------------------------------ */
/* Seeds                                                               */
/* ------------------------------------------------------------------ */

type TrailSeed = {
  event: string
  actor: AuditActor | null
  minutesAgo: number
}

/**
 * Written newest-first here and re-sorted on read, the same way the controller
 * orders the query by `created_at desc, id desc`.
 */
const seededTrail: TrailSeed[] = [
  { event: "resident_registration.submitted", actor: null, minutesAgo: 12 },
  { event: "announcement.created", actor: actorOf("clerk"), minutesAgo: 38 },
  { event: "login.success", actor: actorOf("senior"), minutesAgo: 55 },
  { event: "certificate_request.created", actor: null, minutesAgo: 91 },
  { event: "staff.created", actor: adminActor, minutesAgo: 150 },
  { event: "resident_registration.rejected", actor: adminActor, minutesAgo: 176 },
  { event: "announcement.rejected", actor: adminActor, minutesAgo: 240 },
  { event: "certificate_request.status_changed", actor: actorOf("clerk"), minutesAgo: 268 },
  { event: "login.failed", actor: null, minutesAgo: 310 },
  { event: "resident.status_changed", actor: adminActor, minutesAgo: 402 },
  { event: "announcement.approved", actor: adminActor, minutesAgo: 455 },
  { event: "staff.updated", actor: adminActor, minutesAgo: 520 },
  { event: "resident.account_status_changed", actor: adminActor, minutesAgo: 588 },
  { event: "login.success", actor: actorOf("lupon"), minutesAgo: 1_180 },
  { event: "announcement.resubmitted", actor: actorOf("pwd"), minutesAgo: 1_340 },
  { event: "resident_registration.approved", actor: adminActor, minutesAgo: 1_495 },
  { event: "certificate_request.created", actor: null, minutesAgo: 1_620 },
  { event: "staff.status_changed", actor: adminActor, minutesAgo: 1_775 },
  { event: "announcement.created", actor: actorOf("senior"), minutesAgo: 2_410 },
  { event: "resident_registration.submitted", actor: null, minutesAgo: 2_880 },
  { event: "login.failed", actor: null, minutesAgo: 3_105 },
  { event: "announcement.deleted", actor: adminActor, minutesAgo: 4_260 },
  { event: "staff.role_changed", actor: adminActor, minutesAgo: 4_980 },
  { event: "certificate_request.status_changed", actor: actorOf("clerk"), minutesAgo: 5_720 },
  { event: "resident_registration.approved", actor: adminActor, minutesAgo: 6_310 },
  { event: "announcement.approved", actor: adminActor, minutesAgo: 7_020 },
]

type AttemptSeed = {
  actorType: "staff" | "resident"
  /** Only staff rows carry a position; an empty one reads "Unidentified staff". */
  position?: string
  channel: "staff_portal" | "resident_portal"
  status: LoginAttemptStatus
  minutesAgo: number
}

const seededAttempts: AttemptSeed[] = [
  { actorType: "resident", channel: "resident_portal", status: "success", minutesAgo: 8 },
  { actorType: "staff", position: staffActors.clerk.position, channel: "staff_portal", status: "success", minutesAgo: 21 },
  { actorType: "resident", channel: "resident_portal", status: "failed", minutesAgo: 34 },
  { actorType: "resident", channel: "resident_portal", status: "failed", minutesAgo: 36 },
  { actorType: "staff", position: staffActors.pwd.position, channel: "staff_portal", status: "failed", minutesAgo: 58 },
  { actorType: "staff", position: staffActors.pwd.position, channel: "staff_portal", status: "rate_limited", minutesAgo: 60 },
  { actorType: "resident", channel: "resident_portal", status: "success", minutesAgo: 92 },
  { actorType: "resident", channel: "resident_portal", status: "rate_limited", minutesAgo: 130 },
  { actorType: "staff", position: staffActors.lupon.position, channel: "staff_portal", status: "success", minutesAgo: 175 },
  { actorType: "staff", position: "", channel: "staff_portal", status: "failed", minutesAgo: 240 },
  { actorType: "resident", channel: "resident_portal", status: "failed", minutesAgo: 305 },
  { actorType: "staff", position: staffActors.senior.position, channel: "staff_portal", status: "success", minutesAgo: 420 },
  { actorType: "resident", channel: "resident_portal", status: "success", minutesAgo: 640 },
  { actorType: "staff", position: staffActors.admin.position, channel: "staff_portal", status: "success", minutesAgo: 890 },
  { actorType: "resident", channel: "resident_portal", status: "failed", minutesAgo: 1_150 },
  { actorType: "staff", position: staffActors.clerk.position, channel: "staff_portal", status: "failed", minutesAgo: 1_560 },
  { actorType: "resident", channel: "resident_portal", status: "success", minutesAgo: 2_040 },
  { actorType: "staff", position: staffActors.pwd.position, channel: "staff_portal", status: "success", minutesAgo: 2_760 },
]

type AlertSeed = {
  channel: "staff_portal" | "resident_portal"
  alertType: string
  attemptCount: number
  windowSeconds: number
  minutesAgo: number
}

const seededAlerts: AlertSeed[] = [
  { channel: "resident_portal", alertType: "repeated_failed_login", attemptCount: 6, windowSeconds: 900, minutesAgo: 55 },
  { channel: "staff_portal", alertType: "repeated_failed_login", attemptCount: 4, windowSeconds: 600, minutesAgo: 62 },
  { channel: "resident_portal", alertType: "password_guessing", attemptCount: 11, windowSeconds: 3_600, minutesAgo: 300 },
  { channel: "staff_portal", alertType: "repeated_failed_login", attemptCount: 3, windowSeconds: 1_800, minutesAgo: 1_560 },
]

/* ------------------------------------------------------------------ */
/* Session store                                                       */
/* ------------------------------------------------------------------ */

function createAuditTrailStore() {
  let sequence = 0
  const nextId = () => ++sequence

  let entries: AuditEntry[] = seededTrail
    .map((seed) => ({
      id: nextId(),
      event: seed.event,
      actor: seed.actor,
      createdAt: manilaStamp(seed.minutesAgo, sequence),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)

  const attempts: LoginAttempt[] = seededAttempts.map((seed) => ({
    id: nextId(),
    actorType: seed.actorType,
    actorLabel: attemptActorLabel(seed.actorType, seed.position ?? ""),
    channel: seed.channel,
    status: seed.status,
    attemptedAt: manilaStamp(seed.minutesAgo),
  }))

  const alerts: SuspiciousAlert[] = seededAlerts.map((seed) => ({
    id: nextId(),
    channel: seed.channel,
    alertType: seed.alertType,
    attemptCount: seed.attemptCount,
    windowSeconds: seed.windowSeconds,
    createdAt: manilaStamp(seed.minutesAgo),
  }))

  return {
    /** Newest first, the order the controller queries in. */
    entries(): AuditEntry[] {
      return entries
    },

    events(): string[] {
      return [...supportedEvents]
    },

    /**
     * The controller records only the event and the acting user; the subject of
     * the action lives in the row the event points at, never in the trail.
     */
    record(event: string, actor: AuditActor | null = adminActor): void {
      entries = [{ id: nextId(), event, actor, createdAt: auditNow() }, ...entries]
    },

    /*
     * Each section paginates on its own: the event filter narrows only the
     * audit trail, never the security datasets.
     */
    auditPage(event: string, page: number): AuditPaginator<AuditEntry> {
      const filter = auditEventFilter(event)
      return paginate(filter === "" ? entries : entries.filter((entry) => entry.event === filter), page)
    },

    loginAttemptPage(page: number): AuditPaginator<LoginAttempt> {
      return paginate(attempts, page)
    },

    suspiciousAlertPage(page: number): AuditPaginator<SuspiciousAlert> {
      return paginate(alerts, page)
    },
  }
}

/** One trail for the whole session, shared by every admin surface. */
export const auditTrail = createAuditTrailStore()
