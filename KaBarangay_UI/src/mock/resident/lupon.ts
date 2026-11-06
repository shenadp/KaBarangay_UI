/**
 * Resident portal — Lupon assistance.
 *
 * `Resident\LuponComplaintController::index()` and `::show()`, plus
 * `Resident\LuponCaseController::show()`, cut down to the props the pages render.
 * The rows themselves live in `@/mock/luponIntake`, which the Lupon desk also
 * reads and writes, so a staff review, an assessment or a docketed hearing moves
 * what this portal shows without a second copy of the record.
 */

import {
  caseForViewer,
  caseOfComplaint,
  caseStatusLabel,
  casesAgainstResident,
  complaintsOfResident,
  complaintOfCase,
  evidenceOfComplaint,
  nextHearingOf,
  phaseOf,
  primaryComplainantOf,
  primaryRespondentOf,
  timelineOf,
  trackingOf,
  visibleDocumentsOf,
  visibleEvidenceOf,
  type LuponCaseRow,
  type LuponComplaintRow,
  type LuponComplaintStatus,
} from "@/mock/luponIntake"
import { formatLongDate } from "@/mock/resident/session"

export type { LuponComplaintStatus } from "@/mock/luponIntake"

/** `->paginate(10, ['*'], 'complaints_page')`. */
export const COMPLAINTS_PER_PAGE = 10

/** `case ? […] : match ($complaint->status)` — the intake label before a docket exists. */
export function complaintTrackingLabel(
  row: LuponComplaintRow,
  record: LuponCaseRow | null,
): string {
  if (record) return trackingOf(record)
  if (row.status === "For Payment") return "For Payment"
  if (row.status === "Rejected") return "Rejected"

  return "For Review"
}

/** One card on My Complaints. */
export type ResidentComplaint = {
  id: number
  reference: string
  respondent: string
  respondentResidentStatus: string
  respondentAddress: string | null
  respondentContact: string | null
  complaintType: string
  incidentDate: string
  incidentTime: string | null
  incidentLocation: string
  narrative: string
  requestedAction: string
  status: LuponComplaintStatus
  trackingStatus: string
  luponNote: string | null
  assessedFee: string | null
  submittedDate: string
  evidence: { id: number; name: string; size: number; shared: boolean }[]
  case: {
    id: number
    caseNumber: string
    phase: string
    status: string
    statusLabel: string
    paymentStatus: string
    orNumber: string | null
    feeAmount: string | null
  } | null
}

function toComplaint(row: LuponComplaintRow): ResidentComplaint {
  const record = caseOfComplaint(row.id)

  return {
    id: row.id,
    reference: row.reference,
    respondent: row.respondentName,
    respondentResidentStatus: row.respondentResidentStatus,
    respondentAddress: row.respondentAddress,
    respondentContact: row.respondentContact,
    complaintType: row.complaintType,
    incidentDate: formatLongDate(row.incidentDate),
    incidentTime: row.incidentTime || null,
    incidentLocation: row.incidentLocation,
    narrative: row.narrative,
    requestedAction: row.requestedAction,
    status: row.status,
    trackingStatus: complaintTrackingLabel(row, record),
    luponNote: row.luponNote,
    assessedFee: row.assessedFee,
    submittedDate: formatLongDate(row.submittedAt),
    evidence: evidenceOfComplaint(row.id).map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      shared: file.shared,
    })),
    case: record
      ? {
          id: record.id,
          caseNumber: record.caseNumber,
          phase: phaseOf(record.status),
          status: record.status,
          statusLabel: caseStatusLabel(record.status),
          paymentStatus: record.paymentStatus,
          orNumber: record.orNumber,
          feeAmount: record.feeAmount,
        }
      : null,
  }
}

/** Newest filing first — `->latest('created_at')`. */
export function myComplaints(): ResidentComplaint[] {
  return complaintsOfResident().map(toComplaint)
}

/** One card on Complaints Against Me. */
export type ResidentCaseAgainstMe = {
  id: number
  caseNumber: string
  caseType: string
  phase: string
  status: string
  statusLabel: string
  trackingStatus: string
  filedDate: string
  complainantName: string
  nextHearing: { date: string; time: string | null; venue: string } | null
}

export function complaintsAgainstMe(): ResidentCaseAgainstMe[] {
  return casesAgainstResident().map((record) => {
    const hearing = nextHearingOf(record)

    return {
      id: record.id,
      caseNumber: record.caseNumber,
      caseType: record.caseType,
      phase: phaseOf(record.status),
      status: record.status,
      statusLabel: caseStatusLabel(record.status),
      trackingStatus: trackingOf(record),
      filedDate: formatLongDate(record.filedDate),
      complainantName: primaryComplainantOf(record),
      nextHearing: hearing ? { date: formatLongDate(hearing.date), time: hearing.time, venue: hearing.venue } : null,
    }
  })
}

/* ------------------------------------------------------------------ */
/* Progress steps                                                      */
/* ------------------------------------------------------------------ */

export type TrackingState = "completed" | "current" | "future"

export type TrackingStep = {
  label: string
  description: string
  state: TrackingState
}

const BASE_STEPS = [
  {
    label: "Complaint Submitted",
    description: "Your complaint was successfully submitted to the barangay.",
  },
  {
    label: "Under Review",
    description: "Lupon staff is reviewing the information in your complaint.",
  },
  {
    label: "Barangay Payment",
    description:
      "After review, pay the assessed filing fee at the barangay and obtain an official receipt.",
  },
  {
    label: "Case and Kapitan Hearing #1",
    description:
      "Staff records the OR number and first schedule. The case then starts in the Kapitan phase.",
  },
]

/** `getTrackingSteps()` — review, then payment, then docketing. */
export function trackingSteps(
  status: LuponComplaintStatus,
  hasCase: boolean,
): TrackingStep[] {
  if (status === "Rejected") {
    return [
      { ...BASE_STEPS[0], state: "completed" },
      {
        label: "Complaint rejected",
        description: "Read the note from Lupon for the reason.",
        state: "current",
      },
    ]
  }

  const currentIndex = hasCase ? 3 : status === "For Payment" ? 2 : 1

  return BASE_STEPS.map((step, index) => ({
    ...step,
    state: index < currentIndex ? "completed" : index === currentIndex ? "current" : "future",
  }))
}

/** `getStatusDescription()`. */
export function statusDescription(status: LuponComplaintStatus): string {
  const descriptions: Record<LuponComplaintStatus, string> = {
    Submitted:
      "Your complaint has been submitted and is waiting for Lupon review.",
    "Under Review":
      "Lupon staff is currently reviewing the information in your complaint.",
    "For Payment":
      "Your complaint has been reviewed. Pay the assessed filing fee at the barangay office and obtain an official receipt. Staff must record the OR before your case and first hearing are created.",
    Accepted:
      "Lupon staff accepted your complaint for docketing. Open the linked case when available to see hearing schedules and proceedings.",
    Rejected:
      "Lupon staff rejected the complaint. See the note from Lupon for the reason.",
  }

  return descriptions[status]
}

/** `Submitted` is what the resident filed; `For Review` is what the board reads. */
export function complaintStatusLabel(status: LuponComplaintStatus): string {
  return status === "Submitted" ? "For Review" : status
}

/* ------------------------------------------------------------------ */
/* Case show                                                           */
/* ------------------------------------------------------------------ */

export type ResidentCaseDetail = {
  id: number
  caseNumber: string
  title: string
  caseType: string
  phase: string
  status: string
  statusLabel: string
  trackingStatus: string
  filedDate: string
  complaintReference: string | null
  /** `LuponAccess::isComplainant()` — respondents never receive the intake narrative. */
  narrative: string | null
  respondentName: string
  complainantName: string
  deadlines: { label: string; date: string; active: boolean; daysRemaining: number }[]
  events: { id: number; to: string; label: string; date: string }[]
  documents: { id: number; label: string; servedAt: string | null }[]
  evidence: { id: number; name: string; size: number; shared: boolean }[]
  hearings: {
    id: number
    number: number
    phase: string
    date: string
    time: string | null
    venue: string
    status: string
    outcome: string | null
  }[]
  settlement: { type: string; date: string; terms: string; status: string } | null
}

/**
 * `viewerRole` and `caseData` from `LuponCaseController::show()`. A docket the
 * viewer is not a party to comes back `null`, which the page reports the same way
 * the 403 reads on the server.
 */
export function caseDetail(
  id: string | undefined,
): { viewerRole: "complainant" | "respondent"; caseData: ResidentCaseDetail } | null {
  const viewer = caseForViewer(id)
  if (!viewer) return null

  const { record, viewerRole } = viewer
  const complaint = complaintOfCase(record)
  const timeline = timelineOf(record)

  return {
    viewerRole,
    caseData: {
      id: record.id,
      caseNumber: record.caseNumber,
      title: record.title,
      caseType: record.caseType,
      phase: phaseOf(record.status),
      status: record.status,
      statusLabel: caseStatusLabel(record.status),
      trackingStatus: trackingOf(record),
      filedDate: formatLongDate(record.filedDate),
      complaintReference: complaint ? complaint.reference : null,
      narrative:
        viewerRole === "complainant"
          ? (record.intakeNarrative ?? complaint?.narrative ?? null)
          : null,
      respondentName: primaryRespondentOf(record),
      complainantName: primaryComplainantOf(record),
      deadlines: timeline.deadlines.map((deadline) => ({
        ...deadline,
        date: formatLongDate(deadline.date),
      })),
      events: timeline.events
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
        .map((event) => ({
          id: event.id,
          to: event.to,
          label: caseStatusLabel(event.to),
          date: formatLongDate(event.date),
        })),
      documents: visibleDocumentsOf(record).map((document) => ({
        id: document.id,
        label: document.label,
        servedAt: document.servedAt ? formatLongDate(document.servedAt) : null,
      })),
      evidence: visibleEvidenceOf(record).map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        shared: file.shared,
      })),
      hearings: record.hearings.map((hearing) => ({
        id: hearing.id,
        number: hearing.number,
        phase: hearing.phase,
        date: formatLongDate(hearing.date),
        time: hearing.time,
        venue: hearing.venue,
        status: hearing.status,
        outcome: hearing.outcome,
      })),
      settlement: record.settlement
        ? { ...record.settlement, date: formatLongDate(record.settlement.date) }
        : null,
    },
  }
}

