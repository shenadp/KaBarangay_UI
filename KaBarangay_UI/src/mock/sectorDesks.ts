/**
 * Shared shapes for the sector desks (Senior Citizens, PWD).
 *
 * The payloads mirror the Laravel backend's `SectorApplication*` and
 * `Announcement` props — the same field names appear in the `Senior/*` and
 * `Pwd/*` Inertia pages — so a desk only has to supply data and wording.
 * Nothing here is fetched at runtime.
 */

import { formatIsoDate } from "@/mock/sectors"

export { formatIsoDate }

export type SectorDeskKey = "senior" | "pwd"

/** The six puroks both desks filter their rosters by. */
export const purokList = [
  "Purok 1",
  "Purok 2",
  "Purok 3",
  "Purok 4",
  "Purok 5",
  "Purok 6",
]

/* ------------------------------------------------------------------ */
/* Residents / members                                                 */
/* ------------------------------------------------------------------ */

export type SectorResident = {
  id: number
  /** Register number shown on the directory, e.g. BSI-RES-000001. */
  residentNumber: string
  fullName: string
  sex: "Male" | "Female"
  purok: string
  /** Membership standing on this desk. */
  status: "Active" | "Pending" | "Inactive"
  hasQr: boolean
  /** Sector classifications the resident carries. */
  sectors: string[]
  /** Sector registration number on file — OSCA ID, PWD ID… */
  registrationNo?: string
  birthdate?: string
  address?: string
  mobile?: string
}

/* ------------------------------------------------------------------ */
/* Sector applications                                                 */
/* ------------------------------------------------------------------ */

export type SectorApplicationStatus =
  | "pending_staff_review"
  | "under_admin_review"
  | "approved"
  | "rejected"
  | "needs_correction"

export type SectorDocument = {
  id: number
  title: string
  type: "sector_proof" | "valid_id" | "other"
  fileName: string
  fileSize: string
  verificationStatus: "Verified" | "Pending" | "Rejected"
}

export type SectorApplication = {
  id: number
  trackingNumber: string
  residentId: number
  residentNumber: string
  applicantName: string
  purok: string
  submissionType: "staff_assisted" | "self_service"
  submittedByName: string
  status: SectorApplicationStatus
  /** ISO date the application was filed. */
  submittedAt: string
  reviewedByStaffName?: string
  staffReviewNotes?: string
  staffChecklistCompleted: boolean
  adminDecisionByName?: string
  adminDecisionNotes?: string
  adminDecidedAt?: string
  /** Set once the desk approves the filing. */
  registrationNo?: string
  emergencyContact?: string
  documents: SectorDocument[]
}

export function applicationStatusLabel(status: SectorApplicationStatus): string {
  switch (status) {
    case "pending_staff_review":
      return "Pending Staff Review"
    case "under_admin_review":
      return "Legacy Forwarded"
    case "approved":
      return "Approved"
    case "rejected":
      return "Rejected"
    case "needs_correction":
      return "Needs Correction"
  }
}

export function submissionTypeLabel(submissionType: SectorApplication["submissionType"]): string {
  return submissionType === "staff_assisted" ? "Staff-Assisted" : "Self-Service"
}

/** The four counters shown on the applications queue. */
export function applicationCounters(applications: SectorApplication[]) {
  return {
    all: applications.length,
    staffReviewNeeded: applications.filter((a) => a.status === "pending_staff_review").length,
    legacyForwarded: applications.filter((a) => a.status === "under_admin_review").length,
    approved: applications.filter((a) => a.status === "approved").length,
  }
}

/* ------------------------------------------------------------------ */
/* Announcements, updates and programs                                 */
/* ------------------------------------------------------------------ */

/**
 * Backend board a record lives on: `auto` is the merged Announcements board,
 * `update` and `program` are the desk's own boards.
 */
export type SectorPostKind = "auto" | "update" | "program"

export type SectorPostType = "informational" | "event"

export type SectorImportance = "low" | "normal" | "high" | "urgent"

export type SectorApprovalStatus = "pending" | "approved" | "rejected"

export type SectorProgramStatus = "draft" | "ongoing"

export type SectorPost = {
  id: number
  kind: SectorPostKind
  title: string
  content: string
  type: SectorPostType
  /** Desk-specific — the descriptor supplies the options and their labels. */
  category: string
  importance: SectorImportance
  audience: string
  approvalStatus: SectorApprovalStatus
  rejectionReason?: string
  /** Events only — the lifecycle of the program itself. */
  programStatus?: SectorProgramStatus
  /** ISO date of the event or the posting. */
  eventDate?: string
  eventTime?: string
  location?: string
  requiresAttendance: boolean
  /** ISO date once the activity is closed. */
  completedAt?: string
  /** ISO date the notice was posted. */
  createdAt: string
  author: string
}

export const sectorImportanceLabels: Record<SectorImportance, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
}

export function isSectorEvent(item: SectorPost): boolean {
  return item.type === "event" || item.requiresAttendance
}

/** Lifecycle bucket used by the All/Ongoing/Draft/Done tabs. */
export function sectorLifecycleBucket(item: SectorPost): "ongoing" | "draft" | "done" {
  if (isSectorEvent(item)) {
    if (item.completedAt) return "done"
    return item.programStatus === "draft" ? "draft" : "ongoing"
  }
  return item.approvalStatus === "pending" ? "draft" : "ongoing"
}

/**
 * Status label as the backend renders it: events show their program lifecycle,
 * everything else shows the approval stage.
 */
export function sectorStatusLabel(item: SectorPost): string {
  if (isSectorEvent(item)) {
    if (item.completedAt) return "Done"
    return item.programStatus === "draft" ? "Draft" : "Ongoing"
  }
  return item.approvalStatus === "approved"
    ? "Published"
    : item.approvalStatus === "pending"
      ? "Pending Approval"
      : "Rejected"
}

/** The QR attendance sheet opens for approved, non-draft activities. */
export function isSectorAttendanceAvailable(item: SectorPost): boolean {
  return (
    isSectorEvent(item) &&
    item.approvalStatus === "approved" &&
    item.programStatus !== "draft" &&
    item.requiresAttendance
  )
}

/** Only finished activities may be closed, and only once. */
export function canMarkSectorDone(item: SectorPost): boolean {
  return (
    isSectorEvent(item) &&
    !item.completedAt &&
    item.programStatus !== "draft" &&
    item.approvalStatus === "approved"
  )
}

/** Approved, published informational updates can be closed once. */
export function canMarkSectorUpdateCompleted(item: SectorPost): boolean {
  return !isSectorEvent(item) && !item.completedAt && item.approvalStatus === "approved"
}

/* ------------------------------------------------------------------ */
/* Attendance sheet                                                    */
/* ------------------------------------------------------------------ */

export type SectorAttendanceStatus = "present" | "claimed"

export type SectorAttendanceMethod = "qr_scanner" | "manual"

export type SectorAttendanceRecord = {
  id: number
  residentId: number
  residentNumber: string
  fullName: string
  status: SectorAttendanceStatus
  method: SectorAttendanceMethod
  loggedAt: string
}

/* ------------------------------------------------------------------ */
/* Session store                                                       */
/* ------------------------------------------------------------------ */

/**
 * One store per desk. The backend persists desk work to the database; this UI
 * keeps it in memory so a filing, post or attendance entry made on one page is
 * still visible on the queue, the board, the detail view and the sheet.
 */
export function createSectorDeskStore(seed: {
  applications: SectorApplication[]
  posts: SectorPost[]
  attendance: Record<number, SectorAttendanceRecord[]>
  /** e.g. `SC-APP-2026` — the tracking prefix for filings at this desk. */
  trackingPrefix: string
}) {
  let applications = [...seed.applications]
  let posts = [...seed.posts]
  const attendance = new Map<number, SectorAttendanceRecord[]>()

  return {
    /* Applications ------------------------------------------------- */
    applicationQueue(): SectorApplication[] {
      return applications
    },

    nextApplicationId(): number {
      return applications.reduce((max, item) => Math.max(max, item.id), 0) + 1
    },

    nextTrackingNumber(): string {
      const highest = applications.reduce((max, item) => {
        const suffix = Number(item.trackingNumber.split("-").pop() ?? 0)
        return Number.isNaN(suffix) ? max : Math.max(max, suffix)
      }, 0)
      return `${seed.trackingPrefix}-${String(highest + 1).padStart(4, "0")}`
    },

    recordIntake(application: SectorApplication): void {
      applications = [application, ...applications]
    },

    /** Desk decisions move the filing and refresh every reader of the queue. */
    decideApplication(id: number, patch: Partial<SectorApplication>): void {
      applications = applications.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      )
    },

    /* Posts -------------------------------------------------------- */
    postsFor(kinds: SectorPostKind | SectorPostKind[]): SectorPost[] {
      const wanted = Array.isArray(kinds) ? kinds : [kinds]
      return posts.filter((item) => wanted.includes(item.kind))
    },

    postById(id: number): SectorPost | undefined {
      return posts.find((item) => item.id === id)
    },

    nextPostId(): number {
      return posts.reduce((max, item) => Math.max(max, item.id), 0) + 1
    },

    addPost(post: SectorPost): void {
      posts = [post, ...posts]
    },

    patchPost(id: number, patch: Partial<SectorPost>): void {
      posts = posts.map((item) => (item.id === id ? { ...item, ...patch } : item))
    },

    removePost(id: number): void {
      posts = posts.filter((item) => item.id !== id)
    },

    /* Attendance --------------------------------------------------- */
    attendanceFor(activityId: number): SectorAttendanceRecord[] {
      return attendance.get(activityId) ?? seed.attendance[activityId] ?? []
    },

    addAttendance(activityId: number, record: SectorAttendanceRecord): void {
      const current = attendance.get(activityId) ?? seed.attendance[activityId] ?? []
      attendance.set(activityId, [record, ...current])
    },
  }
}

export type SectorDeskStore = ReturnType<typeof createSectorDeskStore>
