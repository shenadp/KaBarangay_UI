/**
 * Resident portal — sector membership applications.
 *
 * The read model of `Resident\SectorApplicationController::index()` and
 * `::edit()`, with the submission rules of `App\Services\SectorApplicationService`
 * and the status constants of `App\Models\SectorApplication` (commit b6030a08).
 *
 * UI-only: filings land in this module's in-memory table and never leave the
 * browser. The desk stores keep their own shape, so nothing is written through.
 */

import { residentRegistry } from "@/mock/admin/residents"
import { sessionResident, SESSION_RESIDENT_ID, type SectorSlug } from "./session"

/* ------------------------------------------------------------------ */
/* Statuses                                                            */
/* ------------------------------------------------------------------ */

export type SectorApplicationStatus =
  | "pending_staff_review"
  | "under_admin_review"
  | "requires_correction"
  | "approved"
  | "rejected"

export type SubmissionType = "staff_assisted" | "self_service"

/** `SectorApplication::ACTIVE_STATUSES` — one of these per sector blocks a new filing. */
const ACTIVE_STATUSES: SectorApplicationStatus[] = [
  "pending_staff_review",
  "under_admin_review",
  "requires_correction",
]

/** `SectorSeeder` — the two slugs the resident may self-service into. */
export const applyableSectors: { slug: SectorSlug; name: string; prefix: string }[] = [
  { slug: "senior", name: "Senior Citizen", prefix: "SNR" },
  { slug: "pwd", name: "Person with Disability (PWD)", prefix: "PWD" },
]

export function sectorNameOf(slug: SectorSlug): string {
  return applyableSectors.find((sector) => sector.slug === slug)?.name ?? slug
}

/** The page prints `status.replace(/_/g, ' ')` in uppercase — the same words, title-cased. */
export function statusLabelOf(status: SectorApplicationStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function submissionLabelOf(submissionType: SubmissionType): string {
  return submissionType === "staff_assisted" ? "Staff-Assisted" : "Self-Service"
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

type DocumentRow = {
  id: number
  title: string
  type: string
  fileName: string
  /** Bytes, the unit `file_size` is stored in. */
  fileSize: number
  verificationStatus: "pending" | "verified" | "rejected"
}

type ApplicationRow = {
  id: number
  trackingNumber: string
  sectorSlug: SectorSlug
  submissionType: SubmissionType
  status: SectorApplicationStatus
  /** `created_at` — the queue is ordered by it. */
  submittedAt: string
  staffReviewNotes: string | null
  adminDecisionNotes: string | null
  correctionNotes: string | null
  details: { notes?: string }
  documents: DocumentRow[]
}

const seed: ApplicationRow[] = [
  {
    id: 61,
    trackingNumber: "APP-PWD-2026-K7Q2M",
    sectorSlug: "pwd",
    submissionType: "self_service",
    status: "requires_correction",
    submittedAt: "2026-11-02T09:14:00",
    staffReviewNotes:
      "Na-binigkas po ang inyong OMR ngunit hindi mabasa ang lakad ng disability at ang nakalagay na physician. Kailangan po ng medical certificate o PWD ID na malinaw.",
    adminDecisionNotes: null,
    correctionNotes:
      "Upload a readable copy of the medical certificate or the PWD ID showing the issuing physician and diagnosis, then resubmit this application.",
    details: {
      notes:
        "Ako po siya at hindi nakakapaglakad nang mag-isa mula noong nasaktan ang aking binti sa aksidente.",
    },
    documents: [
      {
        id: 501,
        title: "Pwd Proof Document #1",
        type: "pwd_proof",
        fileName: "omr-scan-blurry.jpg",
        fileSize: 486_300,
        verificationStatus: "pending",
      },
    ],
  },
  {
    id: 54,
    trackingNumber: "APP-SNR-2026-B4XRD",
    sectorSlug: "senior",
    submissionType: "self_service",
    status: "rejected",
    submittedAt: "2026-10-03T13:40:00",
    staffReviewNotes:
      "Applicants must be 60 years old and above. The birthdate on your resident record shows you are under 60.",
    adminDecisionNotes: "Rejection confirmed by the barangay admin after the desk review.",
    correctionNotes: null,
    details: { notes: "Para po sa pension at discount ko." },
    documents: [
      {
        id: 502,
        title: "Senior Proof Document #1",
        type: "senior_proof",
        fileName: "ocap-id-front.jpg",
        fileSize: 231_008,
        verificationStatus: "rejected",
      },
    ],
  },
  {
    id: 47,
    trackingNumber: "APP-PWD-2026-L9T3V",
    sectorSlug: "pwd",
    submissionType: "staff_assisted",
    status: "rejected",
    submittedAt: "2026-08-12T10:05:00",
    staffReviewNotes:
      "Ang larawan ng ID na isinampa ay hindi tumugma sa inyong resident record, kaya isinara po ang filing na ito.",
    adminDecisionNotes: null,
    correctionNotes: null,
    details: {},
    documents: [
      {
        id: 503,
        title: "Pwd Proof Document #1",
        type: "pwd_proof",
        fileName: "id-photo.png",
        fileSize: 118_784,
        verificationStatus: "rejected",
      },
    ],
  },
]

let rows = [...seed]

let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
let nextDocumentId = 600

/* ------------------------------------------------------------------ */
/* Dates and sizes                                                     */
/* ------------------------------------------------------------------ */

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

/** `format('M d, Y')` — the stamp both the queue and the receipts print. */
export function formatApplicationDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return iso

  return `${SHORT_MONTHS[month - 1]} ${String(day).padStart(2, "0")}, ${year}`
}

/** `round($doc->file_size / 1024) . ' KB'`. */
export function formatFileSize(fileSize: number): string {
  return `${Math.round(fileSize / 1024)} KB`
}

/* ------------------------------------------------------------------ */
/* Index props                                                         */
/* ------------------------------------------------------------------ */

export type AccreditationView = {
  slug: SectorSlug
  /** The card title, which the reference page shortens from the sector name. */
  label: string
  accredited: boolean
  /** The caption printed under the title. */
  caption: string
}

const ACCREDITED_CAPTIONS: Record<SectorSlug, string> = {
  senior: "Accredited member • Eligible for social pension and senior benefits.",
  pwd: "Accredited member • Eligible for assistive welfare and PWD programs.",
}

const NOT_REGISTERED_CAPTION = "Not registered in this sector."

const ACCREDITATION_LABELS: Record<SectorSlug, string> = {
  senior: "Senior Citizen",
  pwd: "Person with Disability",
}

export function accreditations(): AccreditationView[] {
  return applyableSectors.map((sector) => {
    const accredited = isAccredited(sector.slug)

    return {
      slug: sector.slug,
      label: ACCREDITATION_LABELS[sector.slug],
      accredited,
      caption: accredited ? ACCREDITED_CAPTIONS[sector.slug] : NOT_REGISTERED_CAPTION,
    }
  })
}

export function isAccredited(slug: SectorSlug): boolean {
  return sessionResident().sectors.some((sector) => sector.slug === slug)
}

export type SectorApplicationItem = {
  id: number
  trackingNumber: string
  sectorName: string
  status: SectorApplicationStatus
  statusLabel: string
  submissionLabel: string
  submittedAt: string
  staffReviewNotes: string | null
  /** `SectorApplicationController::edit()` is reachable only from this flag. */
  canCorrect: boolean
}

/** `applications` — newest filing first, the way `latest()` orders them. */
export function applications(): SectorApplicationItem[] {
  return rows
    .slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt) || b.id - a.id)
    .map((row) => ({
      id: row.id,
      trackingNumber: row.trackingNumber,
      sectorName: sectorNameOf(row.sectorSlug),
      status: row.status,
      statusLabel: statusLabelOf(row.status),
      submissionLabel: submissionLabelOf(row.submissionType),
      submittedAt: formatApplicationDate(row.submittedAt),
      staffReviewNotes: row.staffReviewNotes,
      canCorrect: row.status === "requires_correction",
    }))
}

/* ------------------------------------------------------------------ */
/* Edit props                                                          */
/* ------------------------------------------------------------------ */

export type CorrectionDocument = {
  id: number
  title: string
  type: string
}

export type ApplicationForCorrection = {
  id: number
  trackingNumber: string
  sectorSlug: SectorSlug
  sectorName: string
  notes: string
  correctionNotes: string | null
  documents: CorrectionDocument[]
}

/** `::edit()` reads through `where('resident_id', …)->firstOrFail()`. */
export function applicationForCorrection(id: number): ApplicationForCorrection | null {
  const row = rows.find((item) => item.id === id)
  if (!row) return null

  return {
    id: row.id,
    trackingNumber: row.trackingNumber,
    sectorSlug: row.sectorSlug,
    sectorName: sectorNameOf(row.sectorSlug),
    notes: row.details.notes ?? "",
    correctionNotes: row.correctionNotes,
    documents: row.documents.map((doc) => ({ id: doc.id, title: doc.title, type: doc.type })),
  }
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export const MAX_DOCUMENT_KB = 10240

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"]

export type PickedFile = { name: string; size: number }

/** `mimes:pdf,jpg,jpeg,png|max:10240`, one message per offending file. */
export function documentErrors(files: PickedFile[]): string[] {
  const messages: string[] = []

  files.forEach((file, index) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_EXTENSIONS.includes(extension))
      messages.push(`The documents.${index} file must be a pdf, jpg, jpeg, png.`)

    if (file.size / 1024 > MAX_DOCUMENT_KB)
      messages.push(`The documents.${index} file may not be greater than ${MAX_DOCUMENT_KB} kilobytes.`)
  })

  return messages
}

/* ------------------------------------------------------------------ */
/* Filing                                                              */
/* ------------------------------------------------------------------ */

const TRACKING_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

/** `APP-{SNR|PWD}-{Y}-{5 random uppercase characters}`. */
function makeTrackingNumber(slug: SectorSlug): string {
  const prefix = applyableSectors.find((sector) => sector.slug === slug)?.prefix ?? "SEC"
  let suffix = ""
  for (let index = 0; index < 5; index += 1)
    suffix += TRACKING_ALPHABET.charAt(Math.floor(Math.random() * TRACKING_ALPHABET.length))

  return `APP-${prefix}-${new Date().getFullYear()}-${suffix}`
}

function residentIsActive(): boolean {
  return residentRegistry.residentById(SESSION_RESIDENT_ID)?.status === "active"
}

export type FilingInput = {
  sector: SectorSlug
  notes: string
  files: PickedFile[]
}

export type FilingOutcome = { ok: true; trackingNumber: string } | { ok: false; message: string }

/** `SectorApplicationService::submitSelfService()` plus the controller's rules. */
export function submitSelfService(input: FilingInput): FilingOutcome {
  if (!residentIsActive())
    return { ok: false, message: "Only active residents may apply for sector membership." }

  const sector = applyableSectors.find((item) => item.slug === input.sector)
  if (!sector) return { ok: false, message: "The requested sector does not exist." }

  if (isAccredited(sector.slug))
    return { ok: false, message: `This resident is already an active member of the ${sector.name} sector.` }

  const inProgress = rows.some(
    (row) => row.sectorSlug === sector.slug && ACTIVE_STATUSES.includes(row.status),
  )
  if (inProgress)
    return {
      ok: false,
      message: `An active application for the ${sector.name} sector is already in progress for this resident.`,
    }

  const files = documentErrors(input.files)
  if (files.length > 0) return { ok: false, message: files.join("\n") }

  const trackingNumber = makeTrackingNumber(sector.slug)

  rows = [
    {
      id: nextId++,
      trackingNumber,
      sectorSlug: sector.slug,
      submissionType: "self_service",
      status: "pending_staff_review",
      submittedAt: new Date().toISOString(),
      staffReviewNotes: null,
      adminDecisionNotes: null,
      correctionNotes: null,
      details: input.notes.trim() ? { notes: input.notes.trim() } : {},
      documents: input.files.map((file, index) => ({
        id: nextDocumentId++,
        title: `${sector.slug === "senior" ? "Senior" : "Pwd"} Proof Document #${index + 1}`,
        type: sector.slug === "senior" ? "senior_proof" : "pwd_proof",
        fileName: file.name,
        fileSize: file.size,
        verificationStatus: "pending" as const,
      })),
    },
    ...rows,
  ]

  return { ok: true, trackingNumber }
}

export type CorrectionInput = { notes: string; files: PickedFile[] }

/** `residentResubmitCorrection()` — only a `requires_correction` filing may be resubmitted. */
export function resubmitCorrection(id: number, input: CorrectionInput): FilingOutcome {
  const row = rows.find((item) => item.id === id)
  if (!row) return { ok: false, message: "This application is not part of your record." }

  if (row.status !== "requires_correction")
    return { ok: false, message: "Application is not awaiting correction." }

  const files = documentErrors(input.files)
  if (files.length > 0) return { ok: false, message: files.join("\n") }

  const added: DocumentRow[] = input.files.map((file, index) => ({
    id: nextDocumentId++,
    title: `Correction Document #${index + 1}`,
    type: row.sectorSlug === "senior" ? "senior_proof" : "pwd_proof",
    fileName: file.name,
    fileSize: file.size,
    verificationStatus: "pending" as const,
  }))

  const trimmed = input.notes.trim()

  rows = rows.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "pending_staff_review",
          correctionNotes: null,
          details: trimmed ? { notes: trimmed } : item.details,
          documents: [...item.documents, ...added],
        }
      : item,
  )

  return { ok: true, trackingNumber: row.trackingNumber }
}

/** The controller flashes this after a successful store. */
export function submittedFlash(trackingNumber: string): string {
  return `Your application ${trackingNumber} has been submitted.`
}

/** …and this after a resubmission. */
export function resubmittedFlash(trackingNumber: string): string {
  return `Your corrected application ${trackingNumber} has been resubmitted.`
}
