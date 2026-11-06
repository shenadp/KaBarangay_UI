/**
 * Resident applications — the applicant's side of the registration queue.
 *
 * A submission writes into the same store the Admin Residents desk works
 * through, so an application the resident files at home appears in the review
 * queue immediately, and a correction the admin requests is what the applicant
 * sees when they open `Resident/RegistrationApplication`.
 */

import { barangay } from "@/mock/data"
import {
  puroks,
  residentRegistry,
  sectorCatalog,
  fullNameOf,
  correctionDocumentLabels,
  correctionFieldLabels,
  purokName,
  type CorrectionUpload,
  type RegistrationStatus,
  type ResidentRegistration,
} from "@/mock/admin/residents"

/** The wizard's own failure banner; the message never says which field matched. */
export const REGISTRATION_FAILED = "We could not complete your registration. Please try again."

/** `ResidentRegistrationAccessController::CREDENTIALS_ERROR`. */
export const APPLICATION_CREDENTIALS_ERROR = "The application reference or password is incorrect."

/** `STATUS_LABELS` in `Resident/RegistrationApplication.tsx`. */
export const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: "Pending review",
  needs_correction: "Needs correction",
  rejected: "Decision recorded",
  approved: "Decision recorded",
}

/**
 * The application the correction screen can be opened for without filing a new
 * registration first — the admin already asked this applicant for a correction.
 */
export const DEMO_APPLICATION = { reference: "REG-2026-0314", password: "resident1234" }

/** The password is only ever compared here; the store keeps no credential column. */
const passwords = new Map<string, string>([[DEMO_APPLICATION.reference, DEMO_APPLICATION.password]])

export type SubmitResult = { ok: true; reference: string } | { ok: false; message: string }

/** `POST /resident/register` for the six-step wizard. */
export function submitRegistration(input: {
  barangay: string
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  birthdate: string
  sex: string
  civilStatus: string
  purok: string
  addressLine: string
  qrToken?: string
  sectors: string[]
  validId: File | null
  livePhoto: File | null
  seniorProof: File | null
  pwdProof: File | null
  mobile: string
  email: string
  password: string
}): SubmitResult {
  const uploads: CorrectionUpload[] = [
    { key: "valid_id", file: input.validId },
    { key: "senior_proof", file: input.sectors.includes("senior") ? input.seniorProof : null },
    { key: "pwd_proof", file: input.sectors.includes("pwd") ? input.pwdProof : null },
    { key: "live_identity_photo", file: input.livePhoto },
  ]
    .filter((entry): entry is { key: string; file: File } => entry.file instanceof File)
    .map(({ key, file }) => ({
      type: key,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      isImage: file.type.startsWith("image/"),
    }))

  const result = residentRegistry.submitRegistration({
    firstName: input.firstName.trim(),
    middleName: input.middleName?.trim() || null,
    lastName: input.lastName.trim(),
    suffix: input.suffix?.trim() || null,
    birthdate: input.birthdate,
    sex: input.sex,
    civilStatus: input.civilStatus,
    addressLine: input.addressLine.trim(),
    mobile: input.mobile.replace(/\D/g, ""),
    email: input.email.trim().toLowerCase() || null,
    purokId: puroks.find((purok) => purok.name === input.purok)?.id ?? null,
    sectors: sectorCatalog.filter((sector) => input.sectors.includes(sector.slug)),
    submittedAt: new Date().toISOString().slice(0, 10),
    qrReference: input.qrToken?.trim() || null,
    documents: uploads,
  })

  if (!result.ok) return { ok: false, message: result.message }

  passwords.set(result.reference, input.password)

  return { ok: true, reference: result.reference }
}

/* ------------------------------------------------------------------ */
/* Application status                                                  */
/* ------------------------------------------------------------------ */

export type CorrectionField = {
  key: string
  label: string
  type: string
  value: string
  options: string[]
  /** `middle_name`, `suffix` and `email` are the only optional targets. */
  required: boolean
}

export type ApplicationView = {
  reference: string
  applicantName: string
  status: RegistrationStatus
  statusLabel: string
  submittedAt: string
  barangay: string
  purok: string
  /** `null` when the request was withdrawn or already answered. */
  correction: { instructions: string; fields: CorrectionField[]; documents: string[] } | null
  /** Resubmitting is open only while the latest cycle is still unanswered. */
  canResubmit: boolean
}

const fieldType: Record<string, string> = {
  birthdate: "date",
  email: "email",
  mobile: "tel",
  purok_id: "select",
}

const OPTIONAL_TARGETS = ["middle_name", "suffix", "email"]

function fieldTargetOf(registration: ResidentRegistration, key: string): CorrectionField {
  const columns: Record<string, unknown> = {
    first_name: registration.firstName,
    middle_name: registration.middleName,
    last_name: registration.lastName,
    suffix: registration.suffix,
    birthdate: registration.birthdate,
    sex: registration.sex,
    civil_status: registration.civilStatus,
    address_line: registration.addressLine,
    mobile: registration.mobile,
    email: registration.email,
    purok_id: registration.purokId,
  }

  const raw = columns[key]

  return {
    key,
    label: correctionFieldLabels[key] ?? key,
    type: fieldType[key] ?? "text",
    value: key === "purok_id" ? (purokName(Number(raw)) ?? "") : String(raw ?? ""),
    options: key === "purok_id" ? puroks.map((purok) => purok.name) : [],
    required: !OPTIONAL_TARGETS.includes(key),
  }
}

export function applicationView(registration: ResidentRegistration): ApplicationView {
  const cycle = registration.correctionCycles.at(-1) ?? null
  const open = registration.status === "needs_correction" && cycle !== null && cycle.resubmittedAt === null

  return {
    reference: registration.reference,
    applicantName: fullNameOf(registration),
    status: registration.status,
    statusLabel: STATUS_LABELS[registration.status] ?? "Status unavailable",
    submittedAt: registration.submittedAt ?? "—",
    barangay: barangay.name,
    purok: registration.purokId ? purokName(registration.purokId) : "—",
    correction:
      cycle === null
        ? null
        : {
            instructions: cycle.instructions,
            fields: open ? cycle.fieldTargets.map((key) => fieldTargetOf(registration, key)) : [],
            documents: open ? cycle.documentTargets : [],
          },
    canResubmit: open,
  }
}

/** `POST /resident/application/access` — one answer for every kind of miss. */
export function authenticateApplication(
  reference: string,
  password: string,
): { ok: true; view: ApplicationView } | { ok: false; message: string } {
  const trimmed = reference.trim()
  const registration = trimmed.length <= 64 ? residentRegistry.registrationByReference(trimmed) : null
  const stored = registration === null ? "invalid" : (passwords.get(registration.reference) ?? "")

  if (registration === null || password !== stored)
    return { ok: false, message: APPLICATION_CREDENTIALS_ERROR }

  grantApplicationAccess(trimmed)

  return { ok: true, view: applicationView(registration) }
}

/**
 * `EnsureResidentRegistrationAccess` — the applicant session. It only ever
 * holds one application, and opening a reference the session was not issued
 * for fails the same way a stale session would.
 */
let accessedReference: string | null = null

function grantApplicationAccess(reference: string) {
  accessedReference = reference
}

export function revokeApplicationAccess(reference: string) {
  if (accessedReference === reference.trim()) accessedReference = null
}

/** `GET /resident/application/{reference}` — only with the session from `POST …/access`. */
export function applicationByReference(reference: string): ApplicationView | null {
  if (accessedReference === null || accessedReference !== reference.trim()) return null

  const registration = residentRegistry.registrationByReference(reference.trim())
  return registration === null ? null : applicationView(registration)
}

/** The reference the applicant last opened, used to sign them back out. */
export const currentApplicationReference = () => accessedReference

export type ResubmitResult = { ok: true } | { ok: false; message: string }

/**
 * `ResidentRegistrationCorrectionController::resubmit()` — exactly the
 * authorized targets, or nothing moves.
 */
export function resubmitApplication(
  reference: string,
  fields: Record<string, string>,
  documents: Record<string, File>,
): ResubmitResult {
  const view = applicationByReference(reference)
  if (!view || !view.canResubmit || view.correction === null)
    return { ok: false, message: "The correction request changed. Refresh the application and review the latest instructions." }

  const authorizedFields = view.correction.fields.map((field) => field.key)
  if (
    Object.keys(fields).length !== authorizedFields.length ||
    !authorizedFields.every((key) => key in fields)
  )
    return { ok: false, message: "Submit exactly the fields authorized for this correction." }

  const authorizedDocuments = view.correction.documents
  if (
    Object.keys(documents).length !== authorizedDocuments.length ||
    !authorizedDocuments.every((key) => key in documents)
  )
    return { ok: false, message: "Upload a replacement for each document authorized for this correction." }

  const mobile = fields.mobile
  if (
    mobile &&
    residentRegistry
      .registrationsIn("pending", "needs_correction", "approved")
      .some(
        (item) =>
          item.reference !== reference && item.mobile.replace(/\D/g, "") === mobile.replace(/\D/g, ""),
      )
  )
    return { ok: false, message: "A registration using this mobile number already exists." }

  const email = fields.email?.trim().toLowerCase()
  if (
    email &&
    residentRegistry
      .registrationsIn("pending", "needs_correction", "approved")
      .some((item) => item.reference !== reference && (item.email ?? "").toLowerCase() === email)
  )
    return { ok: false, message: "A registration using this email address already exists." }

  residentRegistry.resubmit(
    residentRegistry.registrationByReference(reference)!.id,
    fields,
    Object.entries(documents).map(([type, file]) => ({
      type,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      isImage: file.type.startsWith("image/"),
    })),
  )

  return { ok: true }
}

export const CORRECTION_SUBMITTED = "Your correction was submitted for Admin review."

/** The document label the correction form prints above each upload. */
export const documentLabelOf = (type: string): string =>
  correctionDocumentLabels[type] ?? type
