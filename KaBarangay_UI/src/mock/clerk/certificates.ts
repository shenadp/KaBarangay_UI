/**
 * Clerk desk — certificate issuance data and session store.
 *
 * Shapes mirror the Laravel backend's `Clerk/Certificates` page props and the
 * `ClerkCertificateRequestController` / `CertificateController` responses
 * (commit 4d31cb1), so the desk only has to supply data and wording.
 * Nothing here is fetched at runtime: the control number, the preview and the
 * download are all produced from these records and the form state.
 */

import { formatIsoDate } from "@/mock/sectorDesks"
import { clerkOfficer, clerkResidents, clerkTodayIso } from "@/mock/clerkDesk"

export { formatIsoDate }

/** `Oct 28, 2026 · 09:20 AM` — the desk renders dates with the kit formatter. */
export function issuedStamp(issuance: { issuedAt: string; issuedTime: string }): string {
  return `${formatIsoDate(issuance.issuedAt)} · ${issuance.issuedTime}`
}

/* ------------------------------------------------------------------ */
/* Statuses and the workflow the backend enforces                      */
/* ------------------------------------------------------------------ */

export type CertificateStatus =
  | "Pending"
  | "Needs Action"
  | "For Payment"
  | "Processing"
  | "Ready for Claim"
  | "Released"
  | "Rejected"

export const certificateStatuses: CertificateStatus[] = [
  "Pending",
  "Needs Action",
  "For Payment",
  "Processing",
  "Ready for Claim",
  "Released",
  "Rejected",
]

/**
 * The three statuses a clerk may never reach by hand: `For Payment` and
 * `Ready for Claim` fall out of the generation step, `Released` only from the
 * physical-handover confirmation.
 */
export const protectedStatuses: CertificateStatus[] = [
  "For Payment",
  "Ready for Claim",
  "Released",
]

/**
 * Statuses the manual "Processing Status" select may offer, straight from the
 * backend transition graph. Released and Rejected end the workflow, and the
 * current status stays selectable so a clerk can re-apply it to update the note.
 */
const transitions: Record<CertificateStatus, CertificateStatus[]> = {
  Pending: ["Needs Action", "For Payment", "Processing", "Ready for Claim", "Rejected"],
  "Needs Action": ["For Payment", "Processing", "Ready for Claim", "Rejected"],
  "For Payment": ["Needs Action", "Ready for Claim", "Processing", "Rejected"],
  Processing: ["For Payment", "Needs Action", "Ready for Claim", "Rejected"],
  "Ready for Claim": ["Needs Action", "Released", "Rejected"],
  Released: [],
  Rejected: [],
}

const terminalStatuses: CertificateStatus[] = ["Released", "Rejected"]

export type CertificateTab = "requests" | "issued" | "all"

export const certificateTabs: { value: CertificateTab; label: string }[] = [
  { value: "requests", label: "Requests" },
  { value: "issued", label: "Issued / Completed" },
  { value: "all", label: "All Records" },
]

/** Every workflow copy the desk shows, quoted from the backend. */
export const certificateCopy = {
  generatedWithFee: "Certificate generated. Payment required before claiming.",
  generatedNoFee: "Certificate generated and ready for claiming.",
  releaseQuestion: "Confirm that the physical certificate was handed over to the resident?",
  pendingReview:
    "This request is pending review. Start processing to review details and issue the certificate.",
  processingReady:
    "Review certificate details below, then generate and issue the official certificate.",
  paymentHint: "Confirm payment once collected from resident to mark ready for claim.",
  readyForClaim: "Certificate has been issued and is ready for physical release to resident.",
  released: "Certificate released and handed over to resident. Lifecycle is complete.",
  rejected: "This certificate request was rejected.",
  noRequests: "No certificate requests yet.",
  noIssuances: "No certificates have been issued yet.",
  noRecords: "No certificate records yet.",
  filteredRequests: "No requests match your search or filters.",
  filteredIssuances: "No issued certificates match your search or filters.",
  filteredRecords: "No records match your search or filters.",
  allBanner:
    "Combined view of requests and issued certificates. Each row shows its record type.",
  readOnlyIssuance: "Read-only archival record. Editing is disabled.",
  reprintNote: "Re-printing never creates a new issuance or changes the stored record.",
  alreadyIssued: "This certificate request has already been issued.",
  paymentNeedsIssuance: "Payment cannot be confirmed before certificate issuance.",
  releaseNeedsIssuance: "Cannot release a certificate that has not been issued yet.",
  wrongPaymentStatus: "Only requests in For Payment status can have payment confirmed.",
  wrongReleaseStatus: "Only requests in Ready for Claim status can be released.",
  protectedForPayment: "The For Payment status is set automatically upon certificate issuance.",
  protectedReady:
    "The Ready for Claim status requires payment confirmation or certificate issuance.",
  protectedReleased:
    "Dedicated physical handover confirmation is required to release a certificate.",
  rejectionNoteRequired: "A reason note is required before a request can be rejected.",
  controlInUse:
    "This control number is already in use in your barangay. Generate a new number and try again.",
  startedProcessing: "Request is now in processing.",
  statusSaved: "Certificate request status updated.",
  detailsSaved: "Certificate request details updated.",
  paymentSaved: "Payment confirmed. Certificate is ready for claim.",
  releaseSaved: "Certificate released successfully.",
  noTemplate:
    "This service does not yet have a supported certificate layout. The request remains available for review.",
}

/* ------------------------------------------------------------------ */
/* Certificate catalog and fees                                        */
/* ------------------------------------------------------------------ */

export type CertificateTypeOption = {
  /** Template type key — the value the backend posts as `certificate_type`. */
  value: string
  /** Catalog name shown in the list's Certificate column. */
  certificate: string
  /** A type without a PDF template is labelled "(Coming Soon)" and cannot be issued. */
  available: boolean
  /** Fee in pesos — taken from the certificate type alone, never per copy. */
  fee: number
  /** Templates that state their own purpose collect no generic purpose input. */
  fixedPurpose?: string
}

export const certificateTypes: CertificateTypeOption[] = [
  {
    value: "Residency",
    certificate: "Certificate of Residency",
    available: true,
    fee: 100,
    fixedPurpose: "PROOF OF RESIDENCY.",
  },
  {
    value: "Indigency",
    certificate: "Certificate of Indigency",
    available: true,
    fee: 50,
  },
  {
    value: "Delayed PSA Registration",
    certificate: "Certificate of Delayed PSA Registration",
    available: true,
    fee: 50,
    fixedPurpose: "DELAYED REGISTRATION OF BIRTH",
  },
  {
    value: "Marriage Cohabitation",
    certificate: "Certificate of Marriage / Cohabitation",
    available: true,
    fee: 100,
    fixedPurpose: "Marriage Purposes",
  },
  {
    value: "Scholarship Certificate",
    certificate: "Scholarship Endorsement",
    available: true,
    fee: 50,
  },
  {
    value: "Tricycle",
    certificate: "Barangay Tricycle Operator's Certification",
    available: true,
    fee: 300,
  },
  {
    value: "Sari-sari Store",
    certificate: "Sari-sari Store Permit",
    available: true,
    fee: 100,
  },
  // Catalog services the barangay advertises but cannot generate yet.
  {
    value: "Barangay Clearance",
    certificate: "Barangay Clearance",
    available: false,
    fee: 0,
  },
  {
    value: "Good Moral Character",
    certificate: "Certificate of Good Moral Character",
    available: false,
    fee: 0,
  },
]

export function certificateTypeOption(type: string | null | undefined): CertificateTypeOption | null {
  return certificateTypes.find((option) => option.value === type) ?? null
}

/** Fee comes from the certificate type only — no per-copy multiplier. */
export function feeForType(type: string | null | undefined): number {
  return certificateTypeOption(type)?.fee ?? 0
}

export function certificateNameFor(type: string | null | undefined): string {
  return certificateTypeOption(type)?.certificate ?? "Certificate"
}

/** The purpose a template states for itself, when it states one. */
export function purposeForType(type: string | null | undefined): string {
  return certificateTypeOption(type)?.fixedPurpose ?? ""
}

/* ------------------------------------------------------------------ */
/* Signatories from the published organizational chart                 */
/* ------------------------------------------------------------------ */

export type CertificateSignatory = { name: string; title: string }

export const certificateSignatories: CertificateSignatory[] = [
  { name: "Hon. Roberto M. Villanueva", title: "Punong Barangay" },
  { name: "Hon. Elmer T. Ramos", title: "Kagawad — Peace and Order" },
  { name: "Hon. Cecilia D. Padilla", title: "Kagawad — Health and Sanitation" },
  { name: "Hon. Kyle Andrei M. Panganiban", title: "SK Chairperson" },
  { name: "Ms. Lourdes A. Manalo", title: "Barangay Treasurer" },
  { name: clerkOfficer, title: "Barangay Clerk" },
]

export const defaultPunongBarangay: CertificateSignatory = certificateSignatories[0]!

/** Kagawads who may sign as OIC while the Punong Barangay is on leave. */
export const actingCaptainOptions: CertificateSignatory[] = certificateSignatories.slice(1, 4)

export function signatoryLabel(signatory: CertificateSignatory): string {
  return `${signatory.name} - ${signatory.title}`
}

/* ------------------------------------------------------------------ */
/* Per-type detail fields                                              */
/* ------------------------------------------------------------------ */

export type CertificateDetailField = {
  key: string
  label: string
  type: "text" | "number" | "date" | "select"
  kind: "text" | "integer" | "numeric" | "date"
  required: boolean
  min?: number
  max?: number
  default?: string
  options?: string[]
  placeholder?: string
  help?: string
}

export const delayedPsaType = "Delayed PSA Registration"
export const marriageType = "Marriage Cohabitation"
export const residencyType = "Residency"

const sexOptions = ["MALE", "FEMALE"]

/** The values the certificate body needs beyond name, purpose and signatory. */
const detailFieldsByType: Record<string, CertificateDetailField[]> = {
  [delayedPsaType]: [
    { key: "date_of_birth", label: "Date of Birth", type: "date", kind: "date", required: true },
    { key: "sex", label: "Sex", type: "select", kind: "text", required: true, options: sexOptions },
    { key: "nationality", label: "Nationality", type: "text", kind: "text", required: true, default: "FILIPINO" },
    { key: "birth_place", label: "Birth Place", type: "text", kind: "text", required: true, default: "PUERTO PRINCESA CITY" },
    { key: "purok", label: "Purok", type: "text", kind: "text", required: true, placeholder: "e.g. Purok Bagong Pag-asa" },
    { key: "residency_start_year", label: "Residency Start Year", type: "number", kind: "integer", required: true, min: 1583, max: Number(clerkTodayIso.slice(0, 4)) },
    { key: "father_name", label: "Full Name of the Father", type: "text", kind: "text", required: true },
    { key: "mother_maiden_name", label: "Maiden Name of the Mother", type: "text", kind: "text", required: true },
    {
      key: "parents_marriage_details",
      label: "Date and Place of Marriage of Parents",
      type: "text",
      kind: "text",
      required: true,
      placeholder: "e.g. 12 June 1985, Puerto Princesa City; or Not married",
      help: "Enter the marriage date and place, or alternative text such as Not married or Unknown.",
    },
  ],
  [marriageType]: [
    { key: "partner_full_name", label: "Partner Full Name", type: "text", kind: "text", required: true },
    { key: "partner_age", label: "Partner Age (1-120)", type: "number", kind: "integer", required: true, min: 1, max: 120 },
    { key: "years_living_together", label: "Years Living Together (0-120)", type: "number", kind: "integer", required: true, min: 0, max: 120 },
  ],
  [residencyType]: [
    { key: "years_of_residency", label: "Years of Residency (0-120)", type: "number", kind: "integer", required: true, min: 0, max: 120 },
  ],
  Tricycle: [
    { key: "franchise_no", label: "Franchise No.", type: "text", kind: "text", required: true },
    { key: "business_name", label: "Business Name", type: "text", kind: "text", required: true },
    { key: "business_address", label: "Business Address", type: "text", kind: "text", required: true },
    { key: "plate_no", label: "Plate No. (optional)", type: "text", kind: "text", required: false },
    { key: "or_number", label: "OR Number (optional)", type: "text", kind: "text", required: false },
    { key: "receipt_date", label: "Receipt Date (optional)", type: "date", kind: "date", required: false },
    { key: "amount_paid", label: "Amount Paid (₱, optional)", type: "number", kind: "numeric", required: false, min: 0 },
  ],
  "Sari-sari Store": [
    {
      key: "business_type",
      label: "Type of Business",
      type: "text",
      kind: "text",
      required: true,
      placeholder: "e.g. Sari-sari Store or Retailer – Fruits & Vegetables",
    },
    { key: "business_name", label: "Business Name", type: "text", kind: "text", required: true },
    { key: "business_address", label: "Business Address", type: "text", kind: "text", required: true },
    { key: "or_number", label: "OR Number (optional)", type: "text", kind: "text", required: false },
    { key: "receipt_date", label: "Receipt Date (optional)", type: "date", kind: "date", required: false },
    { key: "amount_paid", label: "Amount Paid (₱, optional)", type: "number", kind: "numeric", required: false, min: 0 },
  ],
  "Scholarship Certificate": [
    { key: "school_institution", label: "School / Institution", type: "text", kind: "text", required: true },
  ],
  Indigency: [],
}

export function detailFieldsForType(type: string | null | undefined): CertificateDetailField[] {
  if (!type) return []
  return detailFieldsByType[type] ?? []
}

/** The blank reviewed-detail payload for a certificate type. */
export function blankDetailValues(type: string | null | undefined): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of detailFieldsForType(type)) values[field.key] = field.default ?? ""
  return values
}

export type CertificateDetailRow = { label: string; value: string }

/** Labelled rows for the read-only detail blocks, in field order. */
export function detailRowsFor(
  type: string | null | undefined,
  values: Record<string, string>,
): CertificateDetailRow[] {
  return detailFieldsForType(type)
    .map((field) => ({ label: field.label, value: (values[field.key] ?? "").trim() }))
    .filter((row) => row.value !== "")
}

/* ------------------------------------------------------------------ */
/* Records                                                             */
/* ------------------------------------------------------------------ */

export type CertificateRequestRecord = {
  id: number
  reference: string
  /** Catalog name, kept separate from the template type exactly as the backend does. */
  certificate: string
  certificateType: string | null
  residentId: number | null
  residentName: string
  residentNumber: string | null
  purok: string
  purpose: string
  fee: number
  businessName: string | null
  businessAddress: string | null
  notes: string | null
  status: CertificateStatus
  adminNote: string | null
  submittedAt: string
  reviewedAt: string | null
  detailValues: Record<string, string>
  originalDetailValues: Record<string, string>
  /** Set once a certificate has been generated against this request. */
  issuanceId: number | null
}

export type CertificateIssuanceRecord = {
  id: number
  /** `ISSUE-2026-XXXXXXXX`. */
  reference: string
  controlNo: string
  certificateType: string
  certificate: string
  status: "Issued"
  /** Snapshot of the request fee; a walk-in issuance has no trusted fee. */
  fee: number | null
  residentId: number | null
  residentName: string
  residentNumber: string | null
  purok: string | null
  purpose: string
  businessName: string | null
  businessAddress: string | null
  notes: string | null
  signatoryName: string
  signatoryTitle: string
  detailValues: Record<string, string>
  issuedAt: string
  issuedTime: string
  issuedBy: string
  requestId: number | null
}

export type CertificateAllRecordRow = {
  recordType: "request" | "issuance"
  id: number
  reference: string
  certificate: string
  certificateType: string | null
  residentName: string
  residentNumber: string | null
  purok: string | null
  status: string
  occurredAt: string
}

/* ------------------------------------------------------------------ */
/* Resident lookup for the QR / manual attach step                     */
/* ------------------------------------------------------------------ */

export type CertificateResident = {
  id: number
  residentNumber: string
  fullName: string
  purok: string
  sex: string
  birthdate: string | null
}

export const certificateResidents: CertificateResident[] = clerkResidents.map((resident) => ({
  id: resident.id,
  residentNumber: resident.residentNumber,
  fullName: resident.fullName,
  purok: resident.purok,
  sex: resident.sex,
  birthdate: resident.birthdate ?? null,
}))

/** The resident values the certificate form may trust only from the register. */
export function residentById(id: number | null | undefined): CertificateResident | null {
  if (id === null || id === undefined) return null
  return certificateResidents.find((resident) => resident.id === id) ?? null
}

/**
 * A KaBarangay QR token carries the register number; the desk reads it locally
 * instead of calling the token-verification endpoint.
 */
export function residentByQrToken(token: string): CertificateResident | null {
  const match = /BSI-RES-\d{6}/.exec(token.toUpperCase())
  if (!match) return null
  return certificateResidents.find((resident) => resident.residentNumber === match[0]) ?? null
}

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

function seedRequest(
  id: number,
  reference: string,
  certificateType: string,
  residentNumber: string,
  overrides: Partial<CertificateRequestRecord> = {},
): CertificateRequestRecord {
  const resident = certificateResidents.find((entry) => entry.residentNumber === residentNumber)!
  const option = certificateTypeOption(certificateType)!
  const detailValues = overrides.detailValues ?? { ...blankDetailValues(certificateType) }

  return {
    id,
    reference,
    certificate: option.certificate,
    certificateType: option.value,
    residentId: resident.id,
    residentName: resident.fullName,
    residentNumber: resident.residentNumber,
    purok: resident.purok,
    purpose: option.fixedPurpose ?? purposePlaceholderFor(option.value),
    fee: option.fee,
    businessName: null,
    businessAddress: null,
    notes: null,
    status: "Pending",
    adminNote: null,
    submittedAt: clerkTodayIso,
    reviewedAt: null,
    detailValues,
    originalDetailValues: { ...detailValues },
    issuanceId: null,
    ...overrides,
  }
}

/** Purpose text the resident typed on the portal form. */
function purposePlaceholderFor(type: string): string {
  switch (type) {
    case "Indigency":
      return "Medical assistance"
    case "Scholarship Certificate":
      return "College scholarship requirement"
    case "Tricycle":
      return "Franchise renewal"
    case "Sari-sari Store":
      return "Store registration"
    case "Marriage Cohabitation":
      return "Marriage Purposes"
    default:
      return "General certification"
  }
}

export const certificateRequestSeed: CertificateRequestRecord[] = [
  seedRequest(1, "CR-2026-0158", "Delayed PSA Registration", "BSI-RES-000036", {
    submittedAt: "2026-10-27",
    notes: "Child was born at home in 2019; the PSA record was filed only last year.",
    detailValues: {
      ...blankDetailValues("Delayed PSA Registration"),
      date_of_birth: "2019-02-11",
      sex: "FEMALE",
      purok: "Purok 1",
      residency_start_year: "2009",
      father_name: "Ricardo T. Santos",
      mother_maiden_name: "Divina L. Bautista",
      parents_marriage_details: "Not married",
    },
  }),
  seedRequest(2, "CR-2026-0157", "Indigency", "BSI-RES-000001", {
    submittedAt: "2026-10-26",
    status: "Needs Action",
    adminNote: "Bring the barangay health worker's assessment before we can issue this.",
    purpose: "Financial assistance for hospital bills",
    reviewedAt: "2026-10-27",
  }),
  seedRequest(3, "CR-2026-0156", "Tricycle", "BSI-RES-000002", {
    submittedAt: "2026-10-25",
    status: "Processing",
    purpose: "Franchise renewal for unit 12",
    businessName: "Dela Cruz Transport",
    businessAddress: "Rizal Avenue Terminal, Purok 2",
    reviewedAt: "2026-10-26",
    detailValues: {
      franchise_no: "FR-2019-0448",
      business_name: "Dela Cruz Transport",
      business_address: "Rizal Avenue Terminal, Purok 2",
      plate_no: "NHT 4412",
      or_number: "OR-2026-1187",
      receipt_date: "2026-10-24",
      amount_paid: "300",
    },
  }),
  seedRequest(4, "CR-2026-0155", "Marriage Cohabitation", "BSI-RES-000039", {
    submittedAt: "2026-10-25",
    status: "Processing",
    purpose: "Marriage Purposes",
    reviewedAt: "2026-10-26",
    detailValues: {
      partner_full_name: "Rafael O. Villanueva",
      partner_age: "37",
      years_living_together: "9",
    },
  }),
  seedRequest(5, "CR-2026-0154", "Residency", "BSI-RES-000021", {
    submittedAt: "2026-10-27",
    status: "For Payment",
    purpose: "PROOF OF RESIDENCY.",
    reviewedAt: "2026-10-27",
    issuanceId: 1,
    adminNote: certificateCopy.generatedWithFee,
    detailValues: { years_of_residency: "12" },
  }),
  seedRequest(6, "CR-2026-0153", "Sari-sari Store", "BSI-RES-000024", {
    submittedAt: "2026-10-26",
    status: "Ready for Claim",
    businessName: "Ferdinand's Sari-sari",
    businessAddress: "55 Narra Road, Purok 4",
    reviewedAt: "2026-10-26",
    issuanceId: 2,
    adminNote: certificateCopy.generatedNoFee,
    detailValues: {
      business_type: "Sari-sari Store",
      business_name: "Ferdinand's Sari-sari",
      business_address: "55 Narra Road, Purok 4",
      or_number: "OR-2026-1153",
      receipt_date: "2026-10-26",
      amount_paid: "100",
    },
  }),
  seedRequest(7, "CR-2026-0152", "Indigency", "BSI-RES-000007", {
    submittedAt: "2026-10-23",
    status: "Released",
    purpose: "Burial assistance",
    reviewedAt: "2026-10-24",
    issuanceId: 3,
    adminNote: "Certificate physically handed over and released.",
  }),
  seedRequest(8, "CR-2026-0151", "Scholarship Certificate", "BSI-RES-000026", {
    submittedAt: "2026-10-22",
    status: "Rejected",
    purpose: "College scholarship requirement",
    reviewedAt: "2026-10-23",
    adminNote: "No certificate of enrolment attached; resubmit with the school document.",
    detailValues: { school_institution: "Santa Rosa College" },
  }),
  seedRequest(9, "CR-2026-0150", "Residency", "BSI-RES-000031", {
    submittedAt: "2026-10-22",
    purpose: "PROOF OF RESIDENCY.",
  }),
  seedRequest(10, "CR-2026-0149", "Delayed PSA Registration", "BSI-RES-000040", {
    submittedAt: "2026-10-21",
    status: "For Payment",
    purpose: "DELAYED REGISTRATION OF BIRTH",
    reviewedAt: "2026-10-27",
    issuanceId: 4,
    adminNote: certificateCopy.generatedWithFee,
    detailValues: {
      ...blankDetailValues("Delayed PSA Registration"),
      date_of_birth: "2016-08-30",
      sex: "MALE",
      purok: "Purok 6",
      residency_start_year: "2011",
      father_name: "Antonio G. Ferrer",
      mother_maiden_name: "Marisol C. Reyes",
      parents_marriage_details: "12 June 2010, Puerto Princesa City",
    },
  }),
]

function seedIssuance(
  id: number,
  reference: string,
  controlNo: string,
  certificateType: string,
  residentNumber: string,
  overrides: Partial<CertificateIssuanceRecord> = {},
): CertificateIssuanceRecord {
  const option = certificateTypeOption(certificateType)!
  const resident = certificateResidents.find((entry) => entry.residentNumber === residentNumber) ?? null

  return {
    id,
    reference,
    controlNo,
    certificateType: option.value,
    certificate: option.certificate,
    status: "Issued",
    fee: option.fee,
    residentId: resident?.id ?? null,
    residentName: resident?.fullName ?? "Unknown resident",
    residentNumber: resident?.residentNumber ?? null,
    purok: resident?.purok ?? null,
    purpose: option.fixedPurpose ?? purposePlaceholderFor(option.value),
    businessName: null,
    businessAddress: null,
    notes: null,
    signatoryName: defaultPunongBarangay.name,
    signatoryTitle: defaultPunongBarangay.title,
    detailValues: blankDetailValues(certificateType),
    issuedAt: clerkTodayIso,
    issuedTime: "09:00 AM",
    issuedBy: clerkOfficer,
    requestId: null,
    ...overrides,
  }
}

export const certificateIssuanceSeed: CertificateIssuanceRecord[] = [
  seedIssuance(1, "ISSUE-2026-KQ3F8T2M", "CTRL-2026-0001", "Residency", "BSI-RES-000021", {
    issuedAt: "2026-10-27",
    issuedTime: "09:20 AM",
    requestId: 5,
    purpose: "PROOF OF RESIDENCY.",
    detailValues: { years_of_residency: "12" },
  }),
  seedIssuance(2, "ISSUE-2026-B7W1N9XM", "CTRL-2026-0002", "Sari-sari Store", "BSI-RES-000024", {
    issuedAt: "2026-10-26",
    issuedTime: "03:05 PM",
    requestId: 6,
    businessName: "Ferdinand's Sari-sari",
    businessAddress: "55 Narra Road, Purok 4",
    detailValues: {
      business_type: "Sari-sari Store",
      business_name: "Ferdinand's Sari-sari",
      business_address: "55 Narra Road, Purok 4",
      or_number: "OR-2026-1153",
      receipt_date: "2026-10-26",
      amount_paid: "100",
    },
  }),
  seedIssuance(3, "ISSUE-2026-J4H6R2QT", "CTRL-2026-0003", "Indigency", "BSI-RES-000007", {
    issuedAt: "2026-10-24",
    issuedTime: "10:12 AM",
    requestId: 7,
    purpose: "Burial assistance",
    signatoryName: "Hon. Elmer T. Ramos",
    signatoryTitle: "Kagawad — Peace and Order",
  }),
  seedIssuance(4, "ISSUE-2026-P8L5D0VC", "CTRL-2026-0004", "Delayed PSA Registration", "BSI-RES-000040", {
    issuedAt: "2026-10-27",
    issuedTime: "04:40 PM",
    requestId: 10,
    purpose: "DELAYED REGISTRATION OF BIRTH",
    detailValues: {
      ...blankDetailValues("Delayed PSA Registration"),
      date_of_birth: "2016-08-30",
      sex: "MALE",
      purok: "Purok 6",
      residency_start_year: "2011",
      father_name: "Antonio G. Ferrer",
      mother_maiden_name: "Marisol C. Reyes",
      parents_marriage_details: "12 June 2010, Puerto Princesa City",
    },
  }),
  // Walk-in issuances have no linked request, so no trusted fee snapshot exists.
  seedIssuance(5, "ISSUE-2026-Z2K9M4TR", "CTRL-2026-0005", "Scholarship Certificate", "BSI-RES-000011", {
    issuedAt: "2026-10-25",
    issuedTime: "11:02 AM",
    fee: null,
    purpose: "Senior high school scholarship requirement",
    detailValues: { school_institution: "Santa Rosa Senior High School" },
  }),
  seedIssuance(6, "ISSUE-2026-G6T3W8NB", "CTRL-2026-0006", "Marriage Cohabitation", "BSI-RES-000004", {
    issuedAt: "2026-10-20",
    issuedTime: "08:45 AM",
    fee: null,
    purpose: "Marriage Purposes",
    detailValues: {
      partner_full_name: "Edna F. Villareal",
      partner_age: "61",
      years_living_together: "28",
    },
  }),
]

/* ------------------------------------------------------------------ */
/* Session store                                                       */
/* ------------------------------------------------------------------ */

/** The reference a new issuance gets: `ISSUE-{year}-{8 random uppercase}`. */
export function makeIssuanceReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let suffix = ""
  for (let index = 0; index < 8; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `ISSUE-${clerkTodayIso.slice(0, 4)}-${suffix}`
}

/** `CERT-{year}-{8 uppercase random}`, retried until unique, as `Str::random(8)` does. */
export function makeRequestReference(taken: string[] = []): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let reference = ""
  do {
    let suffix = ""
    for (let index = 0; index < 8; index += 1) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    reference = `CERT-${clerkTodayIso.slice(0, 4)}-${suffix}`
  } while (taken.includes(reference))

  return reference
}

/** Everything a resident submission commits — the portal form's payload. */
export type CertificateSubmissionDraft = {
  certificateType: string | null
  certificate: string
  residentId: number
  residentName: string
  residentNumber: string
  purok: string
  purpose: string
  businessName?: string | null
  businessAddress?: string | null
  notes?: string | null
  detailValues?: Record<string, string>
}

/**
 * Where a backfilled record sits in the workflow. The resident portal seeds its
 * demo history with these; a live submission never supplies them.
 */
export type CertificateSubmissionOverrides = Partial<
  Pick<
    CertificateRequestRecord,
    "reference" | "status" | "adminNote" | "submittedAt" | "reviewedAt" | "issuanceId"
  >
>

export type CertificateAction = {
  ok: boolean
  message: string
  status?: CertificateStatus
  allowedStatuses?: CertificateStatus[]
}

/** Everything the generation step commits in one call — the backend's `persistIssuance`. */
export type CertificateIssuanceDraft = {
  certificateType: string
  controlNo: string
  residentId: number | null
  residentName: string
  purok: string | null
  purpose: string
  signatory: CertificateSignatory
  detailValues: Record<string, string>
  businessName?: string | null
  businessAddress?: string | null
  /** The request being issued; a walk-in issuance leaves this null. */
  requestId?: number | null
}

/**
 * One store for the whole certificates surface. The backend persists desk work
 * to the database; this UI keeps it in memory so the queue, the dialogs and the
 * deep-linked detail page all show the same decision.
 */
export function createClerkCertificateStore(seed: {
  requests: CertificateRequestRecord[]
  issuances: CertificateIssuanceRecord[]
}) {
  let requests = [...seed.requests]
  let issuances = [...seed.issuances]

  /** Newest first — the order both listing queries apply. */
  const byDateDesc = (a: { occurredAt: string }, b: { occurredAt: string }) =>
    b.occurredAt.localeCompare(a.occurredAt)

  function findRequest(id: number): CertificateRequestRecord | undefined {
    return requests.find((request) => request.id === id)
  }

  function patchRequest(id: number, patch: Partial<CertificateRequestRecord>): void {
    requests = requests.map((request) =>
      request.id === id ? { ...request, ...patch } : request,
    )
  }

  return {
    /* Reading -------------------------------------------------------- */
    queue(): CertificateRequestRecord[] {
      return [...requests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    },

    issuanceQueue(): CertificateIssuanceRecord[] {
      return [...issuances].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
    },

    allRecords(): CertificateAllRecordRow[] {
      const rows: CertificateAllRecordRow[] = [
        ...requests.map((request) => ({
          recordType: "request" as const,
          id: request.id,
          reference: request.reference,
          certificate: request.certificate,
          certificateType: request.certificateType,
          residentName: request.residentName,
          residentNumber: request.residentNumber,
          purok: request.purok,
          status: request.status as string,
          occurredAt: request.submittedAt,
        })),
        ...issuances.map((issuance) => ({
          recordType: "issuance" as const,
          id: issuance.id,
          reference: issuance.reference,
          certificate: issuance.certificate,
          certificateType: issuance.certificateType,
          residentName: issuance.residentName,
          residentNumber: issuance.residentNumber,
          purok: issuance.purok,
          status: "Issued",
          occurredAt: issuance.issuedAt,
        })),
      ]
      return rows.sort(byDateDesc)
    },

    requestById(id: number): CertificateRequestRecord | null {
      return findRequest(id) ?? null
    },

    issuanceById(id: number): CertificateIssuanceRecord | null {
      return issuances.find((issuance) => issuance.id === id) ?? null
    },

    issuanceForRequest(requestId: number): CertificateIssuanceRecord | null {
      return issuances.find((issuance) => issuance.requestId === requestId) ?? null
    },

    /** A walk-in issuance is addressed as `iss-3` so ids never collide with requests. */
    recordByRouteId(raw: string | undefined):
      | { kind: "request"; request: CertificateRequestRecord }
      | { kind: "issuance"; issuance: CertificateIssuanceRecord }
      | null {
      if (!raw) return null
      const issuanceMatch = /^iss-(\d+)$/.exec(raw)
      if (issuanceMatch) {
        const issuance = issuances.find((entry) => entry.id === Number(issuanceMatch[1]))
        return issuance ? { kind: "issuance", issuance } : null
      }
      const id = Number(raw)
      if (!Number.isInteger(id) || id <= 0) return null
      const request = findRequest(id)
      if (request) return { kind: "request", request }
      const issuance = issuances.find((entry) => entry.id === id)
      return issuance ? { kind: "issuance", issuance } : null
    },

    /* Writing -------------------------------------------------------- */
    /**
     * A request submitted from the resident portal. Mirrors
     * `CertificateRequestController::createValidatedRequest`: the fee is copied
     * from the catalog entry, the status starts at `Pending`, and the reference
     * is minted here because no server does it.
     */
    submitRequest(
      draft: CertificateSubmissionDraft,
      overrides: CertificateSubmissionOverrides = {},
    ): CertificateRequestRecord {
      const detailValues = { ...(draft.detailValues ?? {}) }
      const status = overrides.status ?? "Pending"
      const submittedAt = overrides.submittedAt ?? clerkTodayIso
      const request: CertificateRequestRecord = {
        id: requests.reduce((max, entry) => Math.max(max, entry.id), 0) + 1,
        reference:
          overrides.reference ?? makeRequestReference(requests.map((entry) => entry.reference)),
        certificate: draft.certificate,
        certificateType: draft.certificateType,
        residentId: draft.residentId,
        residentName: draft.residentName,
        residentNumber: draft.residentNumber,
        purok: draft.purok,
        purpose: draft.purpose,
        fee: feeForType(draft.certificateType),
        businessName: draft.businessName ?? null,
        businessAddress: draft.businessAddress ?? null,
        notes: draft.notes ?? null,
        status,
        adminNote: overrides.adminNote ?? null,
        submittedAt,
        // Any status other than Pending means the desk has already looked at it.
        reviewedAt: overrides.reviewedAt ?? (status === "Pending" ? null : submittedAt),
        detailValues,
        originalDetailValues: { ...detailValues },
        issuanceId: overrides.issuanceId ?? null,
      }

      requests = [request, ...requests]

      return request
    },

    /* Control numbers ------------------------------------------------ */
    /** Derived from the store, not a server round-trip: `CTRL-{year}-{seq}`. */
    nextControlNumber(): string {
      const year = clerkTodayIso.slice(0, 4)
      const highest = issuances.reduce((max, issuance) => {
        const parts = /^CTRL-(\d{4})-(\d{4})$/.exec(issuance.controlNo)
        if (!parts || parts[1] !== year) return max
        return Math.max(max, Number(parts[2]))
      }, 0)
      return `CTRL-${year}-${String(highest + 1).padStart(4, "0")}`
    },

    controlNumberTaken(controlNo: string): boolean {
      return issuances.some((issuance) => issuance.controlNo === controlNo)
    },

    /* Workflow ------------------------------------------------------- */
    /** The manual select's options: protected statuses are never offered as targets. */
    allowedStatuses(status: CertificateStatus): CertificateStatus[] {
      return [status, ...(transitions[status] ?? [])].filter(
        (entry) => entry === status || !protectedStatuses.includes(entry),
      )
    },

    setStatus(
      id: number,
      status: CertificateStatus,
      adminNote: string | null,
    ): CertificateAction {
      const request = findRequest(id)
      if (!request) return { ok: false, message: "Certificate request not found." }

      const note = adminNote?.trim() ? adminNote.trim() : null

      if (status !== request.status && protectedStatuses.includes(status)) {
        return {
          ok: false,
          message:
            status === "For Payment"
              ? certificateCopy.protectedForPayment
              : status === "Ready for Claim"
                ? certificateCopy.protectedReady
                : certificateCopy.protectedReleased,
        }
      }

      if (status !== request.status && terminalStatuses.includes(request.status)) {
        return {
          ok: false,
          message: `A ${request.status} request is final and cannot change status.`,
        }
      }

      if (status !== request.status && !(transitions[request.status] ?? []).includes(status)) {
        return {
          ok: false,
          message: `A request cannot move from "${request.status}" to "${status}".`,
        }
      }

      if (status === "Rejected" && !note) {
        return { ok: false, message: certificateCopy.rejectionNoteRequired }
      }

      patchRequest(id, {
        status,
        adminNote: note ?? request.adminNote,
        reviewedAt: status === "Pending" ? request.reviewedAt : (request.reviewedAt ?? clerkTodayIso),
      })

      return {
        ok: true,
        message: certificateCopy.statusSaved,
        status,
        allowedStatuses: this.allowedStatuses(status),
      }
    },

    startProcessing(id: number, adminNote?: string | null): CertificateAction {
      const request = findRequest(id)
      if (!request) return { ok: false, message: "Certificate request not found." }
      if (request.status !== "Pending") {
        return { ok: false, message: "Only a Pending request can start processing." }
      }

      patchRequest(id, {
        status: "Processing",
        adminNote: adminNote?.trim() ? adminNote.trim() : request.adminNote,
        reviewedAt: clerkTodayIso,
      })

      return {
        ok: true,
        message: certificateCopy.startedProcessing,
        status: "Processing",
        allowedStatuses: this.allowedStatuses("Processing"),
      }
    },

    /** Generation commits the issuance and moves the linked request in one step. */
    attachIssuance(draft: CertificateIssuanceDraft): CertificateAction & {
      issuance?: CertificateIssuanceRecord
    } {
      const option = certificateTypeOption(draft.certificateType)
      if (!option || !option.available) {
        return { ok: false, message: "The chosen certificate is not available yet." }
      }
      if (this.controlNumberTaken(draft.controlNo)) {
        return { ok: false, message: certificateCopy.controlInUse }
      }

      const linked = draft.requestId === null || draft.requestId === undefined
        ? null
        : findRequest(draft.requestId)

      if (linked && linked.issuanceId !== null) {
        return { ok: false, message: certificateCopy.alreadyIssued }
      }

      const resident = residentById(draft.residentId)
      const issuance: CertificateIssuanceRecord = {
        id: issuances.reduce((max, entry) => Math.max(max, entry.id), 0) + 1,
        reference: makeIssuanceReference(),
        controlNo: draft.controlNo,
        certificateType: option.value,
        certificate: option.certificate,
        status: "Issued",
        // Only a linked request supplies a trusted fee; a walk-in has none.
        fee: linked ? linked.fee : null,
        residentId: resident?.id ?? null,
        residentName: resident?.fullName ?? draft.residentName,
        residentNumber: resident?.residentNumber ?? null,
        purok: draft.purok ?? resident?.purok ?? null,
        purpose: option.fixedPurpose ?? draft.purpose,
        businessName: draft.businessName ?? linked?.businessName ?? null,
        businessAddress: draft.businessAddress ?? linked?.businessAddress ?? null,
        notes: linked?.notes ?? null,
        signatoryName: draft.signatory.name,
        signatoryTitle: draft.signatory.title,
        detailValues: { ...draft.detailValues },
        issuedAt: clerkTodayIso,
        issuedTime: "04:15 PM",
        issuedBy: clerkOfficer,
        requestId: linked?.id ?? null,
      }

      issuances = [issuance, ...issuances]

      if (linked) {
        const fee = feeForType(linked.certificateType)
        const nextStatus: CertificateStatus = fee > 0 ? "For Payment" : "Ready for Claim"
        patchRequest(linked.id, {
          status: nextStatus,
          issuanceId: issuance.id,
          adminNote:
            fee > 0 ? certificateCopy.generatedWithFee : certificateCopy.generatedNoFee,
          reviewedAt: linked.reviewedAt ?? clerkTodayIso,
        })
        return {
          ok: true,
          message:
            fee > 0 ? certificateCopy.generatedWithFee : certificateCopy.generatedNoFee,
          status: nextStatus,
          allowedStatuses: this.allowedStatuses(nextStatus),
          issuance,
        }
      }

      return { ok: true, message: certificateCopy.generatedNoFee, issuance }
    },

    confirmPayment(id: number, adminNote?: string | null): CertificateAction {
      const request = findRequest(id)
      if (!request) return { ok: false, message: "Certificate request not found." }
      if (request.status !== "For Payment") {
        return { ok: false, message: certificateCopy.wrongPaymentStatus }
      }
      if (request.issuanceId === null) {
        return { ok: false, message: certificateCopy.paymentNeedsIssuance }
      }

      patchRequest(id, {
        status: "Ready for Claim",
        adminNote: adminNote?.trim()
          ? adminNote.trim()
          : "Payment confirmed by clerk. Certificate is ready for claim.",
      })

      return {
        ok: true,
        message: certificateCopy.paymentSaved,
        status: "Ready for Claim",
        allowedStatuses: this.allowedStatuses("Ready for Claim"),
      }
    },

    confirmRelease(id: number, adminNote?: string | null): CertificateAction {
      const request = findRequest(id)
      if (!request) return { ok: false, message: "Certificate request not found." }
      if (request.status !== "Ready for Claim") {
        return { ok: false, message: certificateCopy.wrongReleaseStatus }
      }
      if (request.issuanceId === null) {
        return { ok: false, message: certificateCopy.releaseNeedsIssuance }
      }

      patchRequest(id, {
        status: "Released",
        adminNote: adminNote?.trim()
          ? adminNote.trim()
          : "Certificate physically handed over and released.",
      })

      return {
        ok: true,
        message: certificateCopy.releaseSaved,
        status: "Released",
        allowedStatuses: this.allowedStatuses("Released"),
      }
    },

    /** Reviewed details are saved separately from the status, exactly as the backend does. */
    patchReviewedDetails(
      id: number,
      values: Record<string, string>,
    ): CertificateAction {
      const request = findRequest(id)
      if (!request) return { ok: false, message: "Certificate request not found." }

      const merged = { ...request.detailValues, ...values }
      const revised: Partial<CertificateRequestRecord> = { detailValues: merged }

      if (request.certificateType === "Tricycle" || request.certificateType === "Sari-sari Store") {
        revised.businessName = merged.business_name ?? request.businessName
        revised.businessAddress = merged.business_address ?? request.businessAddress
      }

      patchRequest(id, revised)

      return { ok: true, message: certificateCopy.detailsSaved }
    },

    /** A reprint returns the stored record; it never writes a new issuance. */
    reprint(id: number): CertificateIssuanceRecord | null {
      return this.issuanceById(id)
    },
  }
}

export type ClerkCertificateStore = ReturnType<typeof createClerkCertificateStore>

export const clerkCertificateStore: ClerkCertificateStore = createClerkCertificateStore({
  requests: certificateRequestSeed,
  issuances: certificateIssuanceSeed,
})
