/**
 * Admin certificate-request monitoring — the read model of
 * `Admin/CertificateRequestController`.
 *
 * The administrator only ever reads this queue: search, filter by status, page
 * through, and watch the aggregate counts. There is no status route for the
 * Admin at all, which is what keeps processing inside the Clerk portal.
 */

import type { Tone } from "@/components/StatusBadge"
import { formatIsoDate } from "@/mock/sectors"
import {
  certificateStatuses,
  clerkCertificateStore,
  type CertificateRequestRecord,
  type CertificateStatus,
} from "@/mock/clerk/certificates"
import { searchTokens, type RosterPage } from "./sectors"

/** The backend paginates this list fifteen rows to a page. */
export const CERTIFICATES_PAGE_SIZE = 15

export type CertificateRequestRow = {
  id: number
  reference: string
  certificate: string
  certificateType: string | null
  residentName: string
  residentNumber: string | null
  purpose: string
  fee: number
  businessName: string | null
  businessAddress: string | null
  notes: string | null
  status: CertificateStatus
  adminNote: string | null
  submittedAt: string
}

/** An unknown or empty status is treated as "no filter", never as a query. */
export function certificateStatusFilter(value: string | null | undefined): CertificateStatus | null {
  const trimmed = (value ?? "").trim()
  return certificateStatuses.includes(trimmed as CertificateStatus)
    ? (trimmed as CertificateStatus)
    : null
}

/** Reference, purpose, certificate name and every resident name part. */
function haystack(request: CertificateRequestRecord): string[] {
  return [
    request.reference,
    request.purpose,
    request.certificate,
    request.residentName,
    request.residentNumber ?? "",
  ].map((field) => field.toLowerCase())
}

function toRow(request: CertificateRequestRecord): CertificateRequestRow {
  return {
    id: request.id,
    reference: request.reference,
    certificate: request.certificate || "Certificate",
    certificateType: request.certificateType,
    residentName: request.residentName || "Unknown resident",
    residentNumber: request.residentNumber,
    purpose: request.purpose,
    fee: request.fee,
    businessName: request.businessName,
    businessAddress: request.businessAddress,
    notes: request.notes,
    status: request.status,
    adminNote: request.adminNote,
    submittedAt: formatIsoDate(request.submittedAt),
  }
}

/**
 * The newest requests first. A search made only of LIKE wildcards matches
 * nothing, so it must not be mistaken for an empty query.
 */
export function certificateRequestPage(
  search: string,
  status: CertificateStatus | null,
  page: number,
): RosterPage<CertificateRequestRow> {
  const tokens = searchTokens(search)

  const rows = clerkCertificateStore
    .queue()
    .filter((request) => (status === null ? true : request.status === status))
    .filter((request) => {
      if (tokens === null) return true
      if (tokens.length === 0) return false
      const fields = haystack(request)
      return tokens.every((token) => fields.some((field) => field.includes(token)))
    })
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt) || b.id - a.id)

  const total = rows.length
  if (total === 0) return { data: [], currentPage: 1, lastPage: 1, perPage: CERTIFICATES_PAGE_SIZE, total: 0, from: null, to: null }

  const lastPage = Math.max(1, Math.ceil(total / CERTIFICATES_PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * CERTIFICATES_PAGE_SIZE
  const slice = rows.slice(start, start + CERTIFICATES_PAGE_SIZE)

  return {
    data: slice.map(toRow),
    currentPage,
    lastPage,
    perPage: CERTIFICATES_PAGE_SIZE,
    total,
    from: start + 1,
    to: start + slice.length,
  }
}

export type CertificateStats = {
  total: number
  byStatus: Record<CertificateStatus, number>
}

/**
 * One grouped count over the whole barangay: the tiles never follow the
 * filters, and the status groups add up to the total.
 */
export function certificateStats(): CertificateStats {
  const queue = clerkCertificateStore.queue()
  const byStatus = Object.fromEntries(
    certificateStatuses.map((status) => [
      status,
      queue.filter((request) => request.status === status).length,
    ]),
  ) as Record<CertificateStatus, number>

  return { total: queue.length, byStatus }
}

/** The seven workflow colours, folded onto the kit's badge tones. */
export const certificateStatusTone: Record<CertificateStatus, Tone> = {
  Pending: "warning",
  "Needs Action": "warning",
  "For Payment": "info",
  Processing: "info",
  "Ready for Claim": "success",
  Released: "neutral",
  Rejected: "danger",
}

export function formatPeso(value: number): string {
  return `₱${value.toFixed(2)}`
}
