/**
 * Admin Sector Applications — the read model of
 * `Admin/SectorApplicationController`.
 *
 * The controller only ever answers with a list and a detail page: sector staff
 * review and decide applications, so the administrator monitors the recorded
 * decision and its trail. There is no admin decision route at all.
 */

import {
  sectorApplications,
  type SectorAppOrigin,
  type SectorAppStatus,
  type SectorKind,
} from "@/mock/adminExtras"

/** The five queue states, addressed the way the backend query string does. */
export type SectorApplicationStatusSlug =
  | "under_admin_review"
  | "pending_staff_review"
  | "approved"
  | "rejected"
  | "requires_correction"

export const sectorApplicationStatuses: { value: SectorApplicationStatusSlug; label: string }[] = [
  { value: "under_admin_review", label: "Awaiting Admin Decision" },
  { value: "pending_staff_review", label: "Pending Staff Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "requires_correction", label: "Needs Correction" },
]

/** The sector selector only offers the two desks with their own portals. */
export const sectorOptions: { value: "senior" | "pwd"; label: string }[] = [
  { value: "senior", label: "Senior Citizens" },
  { value: "pwd", label: "PWD Sector" },
]

const slugToStatus: Record<SectorApplicationStatusSlug, SectorAppStatus> = {
  under_admin_review: "Under Admin Review",
  pending_staff_review: "Pending Staff Review",
  approved: "Approved",
  rejected: "Rejected",
  requires_correction: "Needs Correction",
}

export const SECTOR_APPLICATIONS_PAGE_SIZE = 25

export type AdminSectorApplicationDocument = {
  id: number
  title: string
  fileName: string
  verification: "Received" | "Missing"
}

export type AdminSectorApplication = {
  id: number
  trackingNumber: string
  applicantName: string
  residentNumber: string
  purok: string
  sector: SectorKind
  sectorName: string
  submissionType: SectorAppOrigin
  submittedByName: string
  status: SectorAppStatus
  submittedAt: string
  reviewedByStaffName: string
  staffReviewNotes: string
  staffChecklistCompleted: boolean
  documents: AdminSectorApplicationDocument[]
}

/** One row of the queue, shaped the way the controller formats it. */
function toItem(
  application: (typeof sectorApplications)[number],
  includeDocuments: boolean,
): AdminSectorApplication {
  return {
    id: application.id,
    trackingNumber: application.tracking,
    applicantName: application.applicant,
    residentNumber: application.residentNo,
    purok: application.purok,
    sector: application.sector,
    sectorName: application.sectorName,
    submissionType: application.origin,
    submittedByName:
      application.originBy ?? (application.origin === "self_service" ? "Resident Self-Service" : "Staff"),
    status: application.status,
    submittedAt: application.submitted,
    reviewedByStaffName: application.recommendation.by,
    staffReviewNotes: application.recommendation.note,
    staffChecklistCompleted: application.recommendation.recommended,
    documents: includeDocuments
      ? application.documents.map((document, index) => ({
          id: index + 1,
          title: document.name,
          fileName: document.file,
          verification: document.state,
        }))
      : [],
  }
}

export type SectorApplicationFilters = {
  search: string
  sector: string
  status: string
}

export const emptySectorApplicationFilters: SectorApplicationFilters = {
  search: "",
  sector: "all",
  status: "all",
}

/** An unknown filter value reads as "all", never as a query. */
function statusOf(value: string): SectorAppStatus | null {
  const slug = value as SectorApplicationStatusSlug
  return Object.prototype.hasOwnProperty.call(slugToStatus, slug) ? slugToStatus[slug] : null
}

function matchesSearch(application: AdminSectorApplication, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (needle === "") return true
  return [application.trackingNumber, application.applicantName, application.residentNumber]
    .map((field) => field.toLowerCase())
    .some((field) => field.includes(needle))
}

export type SectorApplicationPage = {
  data: AdminSectorApplication[]
  total: number
  currentPage: number
  lastPage: number
  from: number | null
  to: number | null
}

/**
 * The detail route only needs the one record, and a foreign or missing id
 * resolves to nothing — the same 404 the binding produces.
 */
export function sectorApplicationById(id: number): AdminSectorApplication | null {
  const found = sectorApplications.find((application) => application.id === id)
  return found ? toItem(found, true) : null
}

export function sectorApplicationPage(
  filters: SectorApplicationFilters,
  page: number,
): SectorApplicationPage {
  const sector = filters.sector === "senior" || filters.sector === "pwd" ? filters.sector : null
  const status = statusOf(filters.status)

  const rows = sectorApplications
    .map((application) => toItem(application, false))
    .filter((application) => {
      if (sector !== null && application.sector !== sector) return false
      if (status !== null && application.status !== status) return false
      return matchesSearch(application, filters.search)
    })
    .sort((a, b) => b.id - a.id)

  const total = rows.length
  if (total === 0) {
    return { data: [], total: 0, currentPage: 1, lastPage: 1, from: null, to: null }
  }

  const lastPage = Math.max(1, Math.ceil(total / SECTOR_APPLICATIONS_PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * SECTOR_APPLICATIONS_PAGE_SIZE
  const slice = rows.slice(start, start + SECTOR_APPLICATIONS_PAGE_SIZE)

  return {
    data: slice,
    total,
    currentPage,
    lastPage,
    from: start + 1,
    to: start + slice.length,
  }
}

export type SectorApplicationStats = {
  total: number
  pending: number
  approved: number
  staff_review: number
  returned: number
}

/** One grouped count over the whole queue; the tiles ignore the filters. */
export function sectorApplicationStats(): SectorApplicationStats {
  const count = (predicate: (status: SectorAppStatus) => boolean) =>
    sectorApplications.filter((application) => predicate(application.status)).length

  return {
    total: sectorApplications.length,
    pending: count((status) => status === "Under Admin Review"),
    approved: count((status) => status === "Approved"),
    staff_review: count((status) => status === "Pending Staff Review"),
    returned: count((status) => status === "Rejected" || status === "Needs Correction"),
  }
}

/** The two halves of the sentence the oversight page prints above everything. */
export const sectorApplicationOversightLead = "Read-only oversight:"

export const sectorApplicationOversightBody =
  "Sector staff review and decide PWD and Senior Citizens applications. Administrators monitor the recorded decision and audit trail here."

export function submissionOrigin(application: AdminSectorApplication): string {
  return application.submissionType === "staff_assisted"
    ? `Staff-Assisted by ${application.submittedByName || "Desk Staff"}`
    : "Resident Portal Self-Service"
}
