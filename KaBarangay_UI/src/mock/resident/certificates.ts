/**
 * Resident portal — certificate catalog, submission and tracking.
 *
 * This is the read model of `Resident\CertificateRequestController::index`
 * plus the field table of `App\Support\CertificateRequestDetails` and the
 * step builder the `Resident/Certificates` page uses (commit b6030a08).
 *
 * Nothing is fetched: the catalog answers from the clerk desk's certificate
 * list, and every submission is written through to `clerkCertificateStore`, so
 * a request filed here is the Pending row the Clerk desk has to process.
 */

import {
  certificateTypes,
  clerkCertificateStore,
  type CertificateRequestRecord,
  type CertificateStatus,
} from "@/mock/clerk/certificates"
import {
  formatLongDate,
  residentIdentity,
  sessionBirthdate,
  SESSION_RESIDENT_ID,
} from "./session"

/* ------------------------------------------------------------------ */
/* Purpose options                                                     */
/* ------------------------------------------------------------------ */

/** The `Purpose / Requirement For` select, in the order the page lists them. */
export const purposeOptions = [
  "Employment",
  "School Requirement",
  "Government Requirement",
  "Financial Assistance",
  "DSWD Assistance",
  "Medical Assistance",
  "Scholarship",
  "Business",
  "Personal",
  "Other",
] as const

export const OTHER_PURPOSE = "Other"

/** The flash the controller sets after a successful store. */
export const SUBMITTED_MESSAGE = "Certificate request submitted successfully."

/* ------------------------------------------------------------------ */
/* Per-type detail fields (CertificateRequestDetails::fieldsForType)    */
/* ------------------------------------------------------------------ */

export type ResidentDetailField = {
  key: string
  label: string
  type: "text" | "number"
  kind: "text" | "integer" | "numeric"
  required: boolean
  min?: number
  max?: number
  default?: string
}

/** `date('Y')` — the ceiling on the residency start year moves with the year. */
export function currentYear(): number {
  return new Date().getFullYear()
}

const detailFieldsByType: Record<string, ResidentDetailField[]> = {
  Residency: [
    { key: "years_of_residency", label: "Years of Residency", type: "number", kind: "integer", required: true, min: 0, max: 120 },
  ],
  "Delayed PSA Registration": [
    { key: "nationality", label: "Nationality", type: "text", kind: "text", required: true, max: 120, default: "FILIPINO" },
    { key: "birth_place", label: "Birth Place", type: "text", kind: "text", required: true, max: 120, default: "PUERTO PRINCESA CITY" },
    { key: "father_name", label: "Father's Name", type: "text", kind: "text", required: true, max: 255 },
    { key: "mother_maiden_name", label: "Mother's Maiden Name", type: "text", kind: "text", required: true, max: 255 },
    { key: "parents_marriage_details", label: "Parents' Marriage Details", type: "text", kind: "text", required: true, max: 255 },
    { key: "residency_start_year", label: "Residency Start Year", type: "number", kind: "integer", required: true, min: 1583, max: currentYear() },
  ],
  "Marriage Cohabitation": [
    { key: "partner_full_name", label: "Partner's Full Name", type: "text", kind: "text", required: true, max: 255 },
    { key: "partner_age", label: "Partner's Age", type: "number", kind: "integer", required: true, min: 1, max: 120 },
    { key: "years_living_together", label: "Years Living Together", type: "number", kind: "integer", required: true, min: 0, max: 120 },
  ],
  "Scholarship Certificate": [
    { key: "school_institution", label: "School / Institution", type: "text", kind: "text", required: true, max: 255 },
    { key: "father_name", label: "Father's Name", type: "text", kind: "text", required: false, max: 255 },
    { key: "father_occupation", label: "Father's Occupation", type: "text", kind: "text", required: false, max: 255 },
    { key: "father_monthly_income", label: "Father's Monthly Income", type: "number", kind: "numeric", required: false, min: 0 },
    { key: "mother_name", label: "Mother's Name", type: "text", kind: "text", required: false, max: 255 },
    { key: "mother_occupation", label: "Mother's Occupation", type: "text", kind: "text", required: false, max: 255 },
    { key: "mother_monthly_income", label: "Mother's Monthly Income", type: "number", kind: "numeric", required: false, min: 0 },
  ],
  Tricycle: [
    { key: "franchise_no", label: "Franchise No.", type: "text", kind: "text", required: true, max: 255 },
  ],
  "Sari-sari Store": [
    { key: "business_type", label: "Type of Business", type: "text", kind: "text", required: true, max: 255 },
  ],
}

/** `CertificateRequestDetails::fieldsForCertificate` — unknown types ask nothing extra. */
export function detailFieldsFor(certificateType: string | null): ResidentDetailField[] {
  if (!certificateType) return []

  return detailFieldsByType[certificateType]?.map((field) =>
    field.key === "residency_start_year" ? { ...field, max: currentYear() } : field,
  ) ?? []
}

/** `defaultDetails(certificate)` — the form opens on each field's default. */
export function defaultDetails(certificateType: string | null): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of detailFieldsFor(certificateType)) values[field.key] = field.default ?? ""
  return values
}

/**
 * `CertificateRequestDetails::displayRows` — field order, and a row is skipped
 * entirely when its value is empty rather than answered with a placeholder.
 */
export function displayRows(
  certificateType: string | null,
  values: Record<string, string>,
): { label: string; value: string }[] {
  return detailFieldsFor(certificateType)
    .map((field) => ({ label: field.label, value: (values[field.key] ?? "").trim() }))
    .filter((row) => row.value !== "")
}

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

/** The `Certificate` row's own description and requirement checklist. */
const catalogContent: Record<string, { description: string; requirements: string[]; business?: boolean }> = {
  Residency: {
    description:
      "Certifies that you are a bona fide resident of this barangay for the stated number of years.",
    requirements: [
      "Valid Barangay ID or government ID",
      "Proof of residency, such as a utility bill under your name",
    ],
  },
  Indigency: {
    description:
      "Attests that you or a family member is financially unable to pay for a stated obligation.",
    requirements: [
      "Valid government ID of the requesting member",
      "Barangay health worker's certification, when required by the requesting agency",
    ],
  },
  "Delayed PSA Registration": {
    description:
      "Supports a late registration of birth with the Philippine Statistics Authority.",
    requirements: [
      "PSA Form 102, Delayed Registration of Birth",
      "Any supporting proof of birth, such as a baptismal or school record",
      "Valid IDs of both parents, when available",
    ],
  },
  "Marriage Cohabitation": {
    description:
      "Certifies that two persons are living together as a couple, for marriage or sponsorship purposes.",
    requirements: [
      "Valid government IDs of both partners",
      "Proof of address of the common residence",
    ],
  },
  "Scholarship Certificate": {
    description:
      "Endorses a resident student for a scholarship or educational assistance program.",
    requirements: [
      "Certificate of good moral character or school recommendation",
      "Report card or latest grades",
      "Valid ID of a parent or guardian",
    ],
  },
  Tricycle: {
    description:
      "Certifies a barangay tricycle operator for franchise, registration or ordinance purposes.",
    requirements: [
      "Franchise document or operator's license",
      "Vehicle registration and plate number",
      "Official receipt of the fee paid to the barangay",
    ],
    business: true,
  },
  "Sari-sari Store": {
    description: "Permits a household store to operate within this barangay.",
    requirements: [
      "Sketch or proof of the store location",
      "Valid government ID of the store owner",
      "Latest community tax certificate",
    ],
    business: true,
  },
  "Barangay Clearance": {
    description:
      "Clears a resident for a general purpose such as a local employment or permit application.",
    requirements: ["Valid government ID", "Proof of residency", "Latest community tax certificate"],
  },
  "Good Moral Character": {
    description:
      "Attests that a resident is of good moral character within this barangay.",
    requirements: ["Valid government ID", "Two barangay witnesses, if requested"],
  },
}

export type ResidentCertificate = {
  /** Catalog id as a string, exactly as the controller casts it. */
  id: string
  name: string
  fee: number
  description: string
  requirements: string[]
  /** `Tricycle` is always true; the rest follow the catalog flag. */
  requiresBusinessDetails: boolean
  certificateType: string | null
  fixedPurpose: string | null
  detailsFields: ResidentDetailField[]
  /** Every active catalog entry can accept a request. */
  available: boolean
  /** Generation is not provisioned yet, so the office completes it manually. */
  templateAvailable: boolean
}

/** `Certificate::where(barangay_id, is_active)->orderBy('name')`, mapped for the page. */
export function certificateCatalog(): ResidentCertificate[] {
  return certificateTypes
    .map((option) => {
      const content = catalogContent[option.value] ?? { description: "", requirements: [] }

      return {
        id: String(certificateTypes.indexOf(option) + 1),
        name: option.certificate,
        fee: option.fee,
        description: content.description,
        requirements: content.requirements,
        requiresBusinessDetails:
          option.value === "Tricycle" ? true : Boolean(content.business),
        certificateType: option.value,
        fixedPurpose: option.fixedPurpose ?? null,
        detailsFields: detailFieldsFor(option.value),
        available: true,
        templateAvailable: option.available,
      } satisfies ResidentCertificate
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function findCertificate(id: string): ResidentCertificate | null {
  return certificateCatalog().find((certificate) => certificate.id === id) ?? null
}

/* ------------------------------------------------------------------ */
/* Validation (CertificateRequestDetails::validationRules)             */
/* ------------------------------------------------------------------ */

export type CertificateFormState = {
  certificateId: string
  purpose: string
  otherPurpose: string
  businessName: string
  businessAddress: string
  additionalDetails: string
  details: Record<string, string>
}

/** Laravel derives the message wording from the field key, so we do too. */
function humanize(key: string): string {
  return key.replace(/_/g, " ")
}

/** `RESIDENCY_BEFORE_BIRTH` — the only message the controller writes itself. */
export const RESIDENCY_YEAR_MESSAGE =
  "The residency start year cannot be earlier than the resident's birth year."

/** `DelayedPsaCertificate::earliestResidencyYear` — no birthdate floors at 1583. */
export function earliestResidencyYear(birthdate: string | null): number {
  const year = birthdate ? Number(birthdate.slice(0, 4)) : Number.NaN
  return Math.max(1583, Number.isFinite(year) ? year : 1583)
}

/**
 * The rules the store would run, keyed the way Inertia returns them:
 * `purpose`, `business_name`, `details.<key>`, `additional_details`.
 */
export function validateForm(
  state: CertificateFormState,
  certificate: ResidentCertificate | null,
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!certificate) return { certificate_id: "The selected certificate is invalid." }

  const effectivePurpose =
    certificate.fixedPurpose ?? (state.purpose === OTHER_PURPOSE ? state.otherPurpose : state.purpose)

  // A fixed-purpose certificate never asks for a purpose, so it is never required.
  if (!certificate.fixedPurpose) {
    if (!state.purpose.trim()) {
      errors.purpose = "The purpose field is required."
    } else if (state.purpose === OTHER_PURPOSE && !state.otherPurpose.trim()) {
      errors.other_purpose = "The specified purpose field is required."
    } else if (effectivePurpose.trim().length > 500) {
      errors.purpose = "The purpose field must not be greater than 500 characters."
    }
  }

  if (certificate.requiresBusinessDetails && !state.businessName.trim()) {
    errors.business_name = "The business name field is required."
  }
  if (certificate.requiresBusinessDetails && !state.businessAddress.trim()) {
    errors.business_address = "The business address field is required."
  }

  for (const field of certificate.detailsFields) {
    const value = (state.details[field.key] ?? "").trim()
    const key = `details.${field.key}`

    if (value === "") {
      if (field.required) errors[key] = `The ${humanize(field.key)} field is required.`
      continue
    }

    if (field.kind === "text") {
      if (field.max && value.length > field.max) {
        errors[key] = `The ${humanize(field.key)} field must not be greater than ${field.max} characters.`
      }
      continue
    }

    if (field.kind === "integer" && !/^-?\d+$/.test(value)) {
      errors[key] = `The ${humanize(field.key)} field must be an integer.`
      continue
    }
    if (field.kind === "numeric" && !/^-?\d+(\.\d+)?$/.test(value)) {
      errors[key] = `The ${humanize(field.key)} field must be a number.`
      continue
    }

    const number = Number(value)
    const min = field.min ?? 0
    if (number < min) {
      errors[key] = `The ${humanize(field.key)} field must be at least ${min}.`
    } else if (field.max !== undefined && number > field.max) {
      errors[key] = `The ${humanize(field.key)} field must not be greater than ${field.max}.`
    }
  }

  // The one cross-field rule the controller raises by hand.
  if (
    certificate.certificateType === "Delayed PSA Registration" &&
    !errors["details.residency_start_year"]
  ) {
    const year = Number((state.details.residency_start_year ?? "").trim())
    if (Number.isFinite(year) && year < earliestResidencyYear(sessionBirthdate())) {
      errors["details.residency_start_year"] = RESIDENCY_YEAR_MESSAGE
    }
  }

  if (state.additionalDetails.trim().length > 2000) {
    errors.additional_details =
      "The additional details field must not be greater than 2000 characters."
  }

  return errors
}

/* ------------------------------------------------------------------ */
/* Submission                                                          */
/* ------------------------------------------------------------------ */

export type SubmitOutcome = {
  ok: boolean
  message: string
  errors: Record<string, string>
  /** The row the success step prints — the record just committed. */
  request: ResidentRequestRow | null
}

/** `createValidatedRequest` — the catalog fee is copied, never typed. */
export function submitCertificateRequest(state: CertificateFormState): SubmitOutcome {
  const certificate = findCertificate(state.certificateId)
  const errors = validateForm(state, certificate)

  if (!certificate || Object.keys(errors).length > 0) {
    return { ok: false, message: "", errors, request: null }
  }

  const identity = residentIdentity()
  const detailValues: Record<string, string> = {}
  for (const field of certificate.detailsFields) {
    detailValues[field.key] = (state.details[field.key] ?? "").trim()
  }

  // The clerk's review form reads the business block from the same payload.
  if (certificate.requiresBusinessDetails) {
    detailValues.business_name = state.businessName.trim()
    detailValues.business_address = state.businessAddress.trim()
  }

  const request = clerkCertificateStore.submitRequest({
    certificateType: certificate.certificateType,
    certificate: certificate.name,
    residentId: SESSION_RESIDENT_ID,
    residentName: identity.fullName,
    residentNumber: identity.residentNumber,
    purok: identity.purok,
    purpose:
      certificate.fixedPurpose ??
      (state.purpose === OTHER_PURPOSE ? state.otherPurpose : state.purpose).trim(),
    businessName: certificate.requiresBusinessDetails ? state.businessName.trim() : null,
    businessAddress: certificate.requiresBusinessDetails ? state.businessAddress.trim() : null,
    notes: state.additionalDetails.trim() === "" ? null : state.additionalDetails.trim(),
    detailValues,
  })

  return { ok: true, message: SUBMITTED_MESSAGE, errors: {}, request: toRow(request) }
}

/* ------------------------------------------------------------------ */
/* My Requests                                                         */
/* ------------------------------------------------------------------ */

export const REQUESTS_PER_PAGE = 10

export type ResidentRequestRow = {
  id: number
  reference: string
  certificate: string
  certificateType: string | null
  purpose: string
  fee: number
  status: CertificateStatus
  /** `submitted_at ?? created_at`, formatted `F j, Y`. */
  date: string
  businessName: string | null
  businessAddress: string | null
  additionalDetails: string | null
  details: { label: string; value: string }[]
  adminNote: string | null
}

function toRow(record: {
  id: number
  reference: string
  certificate: string
  certificateType: string | null
  purpose: string
  fee: number
  status: CertificateStatus
  submittedAt: string
  businessName: string | null
  businessAddress: string | null
  notes: string | null
  adminNote: string | null
  detailValues: Record<string, string>
}): ResidentRequestRow {
  return {
    id: record.id,
    reference: record.reference,
    certificate: record.certificate || "Certificate",
    certificateType: record.certificateType,
    purpose: record.purpose,
    fee: record.fee,
    status: record.status,
    date: formatLongDate(record.submittedAt),
    businessName: record.businessName,
    businessAddress: record.businessAddress,
    additionalDetails: record.notes,
    details: displayRows(record.certificateType, record.detailValues),
    adminNote: record.adminNote,
  }
}

/** Every request the signed-in resident filed, newest first. */
export function myRequestRows(): ResidentRequestRow[] {
  return clerkCertificateStore
    .queue()
    .filter((record) => record.residentId === SESSION_RESIDENT_ID)
    .map(toRow)
}

/** `paginate(10, ['*'], 'requests_page')->withQueryString()`. */
export function myRequests(page = 1) {
  const rows = myRequestRows()
  const lastPage = Math.max(1, Math.ceil(rows.length / REQUESTS_PER_PAGE))
  const current = Math.min(Math.max(1, page), lastPage)
  const from = (current - 1) * REQUESTS_PER_PAGE

  return {
    rows: rows.slice(from, from + REQUESTS_PER_PAGE),
    page: current,
    total: rows.length,
  }
}

/* ------------------------------------------------------------------ */
/* Tracker                                                             */
/* ------------------------------------------------------------------ */

/** The steps already walked, in the order the tracker prints them. */
export function trackerSteps(status: CertificateStatus): string[] {
  if (status === "Rejected") return []
  if (status === "Needs Action") return []

  const steps = ["Submitted"]

  if (status === "For Payment") steps.push("For Payment")
  if (status === "Processing") steps.push("Processing")
  if (status === "Ready for Claim") steps.push("Processing", "Ready for Claim")
  if (status === "Released") steps.push("Processing", "Ready for Claim", "Released")

  return steps
}

/** The heading the tracker gives the status the request actually holds. */
export function friendlyStatusTitle(status: CertificateStatus): string {
  const titles: Record<CertificateStatus, string> = {
    Pending: "Request Submitted",
    "Needs Action": "Action Required",
    "For Payment": "Payment Required",
    Processing: "Certificate Processing",
    "Ready for Claim": "Ready for Claim",
    Released: "Certificate Released",
    Rejected: "Request Rejected",
  }
  return titles[status]
}

export function statusMessage(status: CertificateStatus): string {
  switch (status) {
    case "Pending":
      return "Your request has been received and is waiting for review."
    case "For Payment":
      return "Please complete the required payment before processing can continue."
    case "Processing":
      return "Your certificate is currently being prepared."
    case "Ready for Claim":
      return "Your certificate is ready. Please proceed to the barangay office to claim it."
    case "Released":
      return "Your certificate has been successfully released."
    case "Needs Action":
      return "Additional or corrected information is needed before processing can continue."
    case "Rejected":
      return "Your request could not be processed. Please check the provided reason or contact the barangay office."
  }
}

/** The step labels: `Completed`, `Current status`, then the step names. */
export function trackerLabel(index: number, current: number): string {
  if (index < current) return "Completed"
  if (index === current) return "Current status"
  return ""
}

/* ------------------------------------------------------------------ */
/* Offline drafts                                                      */
/* ------------------------------------------------------------------ */

/** What the KaBarangay Assistant writes before it hands a resident to this page. */
export const CERTIFICATE_FLOW_KEY = "kabarangay_certificate_flow"
export const DRAFT_SAVED_MESSAGE =
  "Draft saved on this device. Open Offline drafts & requests to review and queue it. It is not officially submitted yet."
export const DRAFT_FAILED_MESSAGE = "Unable to save this draft."

export type OfflineDraft = {
  id: string
  savedAt: string
  certificateId: string
  certificateName: string
  form: CertificateFormState
}

const DRAFT_KEY = "kabarangay_certificate_drafts"

function deviceStore(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** The assistant's hand-off, or null when nothing was selected by it. */
export function readCertificateFlow(): { certificateId: string } | null {
  const raw = deviceStore()?.getItem(CERTIFICATE_FLOW_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as { certificateId?: string; source?: string }
    if (parsed.source !== "chatbot" || !parsed.certificateId) return null
    return { certificateId: parsed.certificateId }
  } catch {
    return null
  }
}

export function clearCertificateFlow(): void {
  deviceStore()?.removeItem(CERTIFICATE_FLOW_KEY)
}

export function listDrafts(): OfflineDraft[] {
  const raw = deviceStore()?.getItem(DRAFT_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as OfflineDraft[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeDrafts(drafts: OfflineDraft[]): void {
  try {
    deviceStore()?.setItem(DRAFT_KEY, JSON.stringify(drafts))
  } catch {
    /* the device refused; the message below tells the resident */
  }
}

/** A draft is written only once a certificate is chosen, exactly as the page guards it. */
export function saveDraft(state: CertificateFormState): string {
  const certificate = findCertificate(state.certificateId)
  if (!certificate) return DRAFT_FAILED_MESSAGE

  const draft: OfflineDraft = {
    id: `${certificate.id}-${Date.now()}`,
    savedAt: formatLongDate(new Date().toISOString()),
    certificateId: certificate.id,
    certificateName: certificate.name,
    form: { ...state, details: { ...state.details } },
  }

  const others = listDrafts().filter((entry) => entry.certificateId !== certificate.id)
  writeDrafts([draft, ...others])

  return listDrafts().some((entry) => entry.id === draft.id)
    ? DRAFT_SAVED_MESSAGE
    : DRAFT_FAILED_MESSAGE
}

export function removeDraft(id: string): void {
  writeDrafts(listDrafts().filter((draft) => draft.id !== id))
}

/* ------------------------------------------------------------------ */
/* Demo history                                                        */
/* ------------------------------------------------------------------ */

/**
 * The requests this resident already filed, committed through the same path a
 * submission uses. Their statuses span the workflow so every tracker step and
 * the barangay-note block are visible without inventing a second data source.
 */
function seedResidentHistory(): void {
  if (myRequestRows().length > 0) return

  const profile = residentIdentity()
  const identity = {
    residentId: SESSION_RESIDENT_ID,
    residentName: profile.fullName,
    residentNumber: profile.residentNumber,
    purok: profile.purok,
  }

  const entries: {
    reference: string
    type: string
    purpose?: string
    notes?: string
    details?: Record<string, string>
    status: CertificateStatus
    adminNote?: string
    submittedAt: string
  }[] = [
    {
      reference: "CERT-2026-P4K7Q2XM",
      type: "Residency",
      details: { years_of_residency: "14" },
      status: "Released",
      adminNote: "Certificate released and handed over to resident. Lifecycle is complete.",
      submittedAt: "2026-10-19",
    },
    {
      reference: "CERT-2026-M2R8V5TN",
      type: "Scholarship Certificate",
      purpose: "Scholarship",
      notes: "Endorsement for the city college scholarship programme.",
      details: {
        school_institution: "Puerto Princesa National High School",
        father_name: "Ernesto D. Santos",
        father_occupation: "Tricycle operator",
        father_monthly_income: "8500",
        mother_name: "Rowena B. Santos",
        mother_occupation: "Seamstress",
        mother_monthly_income: "6000",
      },
      status: "Ready for Claim",
      adminNote: "Payment confirmed by clerk. Certificate is ready for claim.",
      submittedAt: "2026-10-24",
    },
    {
      reference: "CERT-2026-B7D3K9WQ",
      type: "Indigency",
      purpose: "Medical Assistance",
      status: "For Payment",
      adminNote: "Certificate generated. Payment required before claiming.",
      submittedAt: "2026-10-26",
    },
    {
      reference: "CERT-2026-H6N2C4RT",
      type: "Delayed PSA Registration",
      notes: "My brother was born at home in 2004; the record was never filed with PSA.",
      details: {
        nationality: "FILIPINO",
        birth_place: "PUERTO PRINCESA CITY",
        father_name: "Ernesto D. Santos",
        mother_maiden_name: "Rowena B. Bautista",
        parents_marriage_details: "12 June 1998, Puerto Princesa City",
        residency_start_year: "1998",
      },
      status: "Needs Action",
      adminNote: "Bring the parents' marriage contract before we can continue processing this.",
      submittedAt: "2026-10-27",
    },
    {
      reference: "CERT-2026-T9S5L3KV",
      type: "Barangay Clearance",
      purpose: "Employment",
      status: "Pending",
      submittedAt: "2026-10-28",
    },
  ]

  for (const entry of entries) {
    const certificate = certificateCatalog().find((item) => item.certificateType === entry.type)!

    clerkCertificateStore.submitRequest(
      {
        ...identity,
        certificateType: certificate.certificateType,
        certificate: certificate.name,
        purpose: certificate.fixedPurpose ?? entry.purpose ?? "General certification",
        notes: entry.notes ?? null,
        detailValues: entry.details ?? {},
      },
      {
        reference: entry.reference,
        status: entry.status,
        adminNote: entry.adminNote ?? null,
        submittedAt: entry.submittedAt,
      },
    )
  }
}

seedResidentHistory()
