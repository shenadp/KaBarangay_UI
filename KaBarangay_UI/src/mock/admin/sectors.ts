/**
 * Read-only aggregates behind the Admin Sectors hub.
 *
 * Nothing here is owned by this desk: the rosters come from the resident
 * registry, the certificate list from the Clerk's queue, the application count
 * from the sector desks and the case counts from the Lupon register. The Admin
 * only ever reads them, which is exactly what the reference page does.
 */

import { formatIsoDate } from "@/mock/sectors"
import { clerkCertificateStore, type CertificateRequestRecord } from "@/mock/clerk/certificates"
import { luponCases } from "@/mock/luponExtras"
import { sectorApplications } from "@/mock/adminExtras"

import { purokName, residentRegistry, type AdminPurok, puroks, type AdminResident } from "./residents"

/** Both rosters and the certificate list show fifteen rows per page. */
export const SECTORS_PAGE_SIZE = 15

/** Only terminal requests reach the Admin's certificate monitor. */
const monitoredCertificateStatuses = ["Released", "Rejected"] as const

/** Local case statuses folded onto the backend's open/closed split. */
const closedCaseStatuses = ["Settled", "Referred"]

export type SectorRosterKey = "general" | "pwd" | "senior"

export type SectorMemberRow = {
  id: number
  residentNumber: string
  name: string
  /** Empty string when the resident has no purok, which the row prints as "-". */
  purok: string
  status: string
}

export type SectorCertificateRow = {
  id: number
  reference: string
  certificate: string
  residentName: string
  residentNumber: string | null
  purpose: string
  fee: number
  status: string
  submittedAt: string
  statusAt: string
}

/** The shape a Laravel length-aware paginator reaches the page with. */
export type RosterPage<T> = {
  data: T[]
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number | null
  to: number | null
}

function emptyPage<T>(perPage: number): RosterPage<T> {
  return {
    data: [],
    currentPage: 1,
    lastPage: 1,
    perPage,
    total: 0,
    from: null,
    to: null,
  }
}

/**
 * Tokens of a submitted search, or `null` when nothing was searched. An empty
 * array means the query was made up only of LIKE wildcards, which the backend
 * strips and then matches against nothing — so it must not read as "no filter".
 */
export function searchTokens(search: string): string[] | null {
  const trimmed = search.trim()
  if (trimmed === "") return null
  const tokens = trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[%_]/g, ""))
    .filter((token) => token !== "")
  return tokens.length > 0 ? tokens : []
}

function fullName(resident: AdminResident): string {
  const middle = resident.middleName ? `${resident.middleName} ` : ""
  const suffix = resident.suffix ? ` ${resident.suffix}` : ""
  return `${resident.firstName} ${middle}${resident.lastName}${suffix}`
}

/** The columns a roster search may hit: every name part, the number, the purok. */
function residentHaystack(resident: AdminResident): string[] {
  return [
    resident.firstName,
    resident.middleName ?? "",
    resident.lastName,
    resident.suffix ?? "",
    resident.residentNumber,
    resident.purokId ? purokName(resident.purokId) : "",
  ].map((field) => field.toLowerCase())
}

/**
 * The base scope of one roster. Resident status is deliberately unconstrained:
 * both active and inactive members appear in their sector's list.
 */
function rosterScope(key: SectorRosterKey): AdminResident[] {
  return residentRegistry.residents().filter((resident) =>
    key === "general"
      ? resident.sectors.length === 0
      : resident.sectors.some((sector) => sector.slug === key),
  )
}

function matchesRoster(
  resident: AdminResident,
  tokens: string[] | null,
  purokId: number | null,
): boolean {
  if (tokens !== null) {
    if (tokens.length === 0) return false
    const haystack = residentHaystack(resident)
    // Every token must land on at least one column, so "Ana Reyes" is Ana AND Reyes.
    if (!tokens.every((token) => haystack.some((field) => field.includes(token)))) return false
  }
  return purokId === null || resident.purokId === purokId
}

function buildRosterPage(
  key: SectorRosterKey,
  search: string,
  purokId: number | null,
  page: number,
): RosterPage<SectorMemberRow> {
  const tokens = searchTokens(search)
  const rows = rosterScope(key)
    .filter((resident) => matchesRoster(resident, tokens, purokId))
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName) ||
        a.id - b.id,
    )

  const total = rows.length
  if (total === 0) return { ...emptyPage(SECTORS_PAGE_SIZE) }

  const lastPage = Math.max(1, Math.ceil(total / SECTORS_PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * SECTORS_PAGE_SIZE
  const slice = rows.slice(start, start + SECTORS_PAGE_SIZE)

  return {
    data: slice.map((resident) => ({
      id: resident.id,
      residentNumber: resident.residentNumber,
      name: fullName(resident),
      purok: resident.purokId ? purokName(resident.purokId) : "",
      status: resident.status,
    })),
    currentPage,
    lastPage,
    perPage: SECTORS_PAGE_SIZE,
    total,
    from: start + 1,
    to: start + slice.length,
  }
}

export function generalRosterPage(search: string, purokId: number | null, page: number) {
  return buildRosterPage("general", search, purokId, page)
}

export function pwdRosterPage(search: string, purokId: number | null, page: number) {
  return buildRosterPage("pwd", search, purokId, page)
}

export function seniorRosterPage(search: string, purokId: number | null, page: number) {
  return buildRosterPage("senior", search, purokId, page)
}

function certificateStatusAt(request: CertificateRequestRecord): string {
  return request.reviewedAt ?? request.submittedAt
}

/** Terminal requests only; anything still moving is the Clerk's business. */
function certificateScope(): CertificateRequestRecord[] {
  return clerkCertificateStore
    .queue()
    .filter((request) =>
      monitoredCertificateStatuses.includes(request.status as (typeof monitoredCertificateStatuses)[number]),
    )
}

/** reference, purpose, certificate name and every resident column are searchable. */
function certificateHaystack(request: CertificateRequestRecord): string[] {
  return [
    request.reference,
    request.purpose,
    request.certificate,
    request.residentName,
    request.residentNumber ?? "",
  ].map((field) => field.toLowerCase())
}

export function certificateRosterPage(search: string, page: number): RosterPage<SectorCertificateRow> {
  const tokens = searchTokens(search)
  const rows = certificateScope()
    .filter((request) => {
      if (tokens === null) return true
      if (tokens.length === 0) return false
      const haystack = certificateHaystack(request)
      return tokens.every((token) => haystack.some((field) => field.includes(token)))
    })
    // The list is newest-decision-first, with id as the tie-breaker.
    .sort((a, b) => certificateStatusAt(b).localeCompare(certificateStatusAt(a)) || b.id - a.id)

  const total = rows.length
  if (total === 0) return { ...emptyPage(SECTORS_PAGE_SIZE) }

  const lastPage = Math.max(1, Math.ceil(total / SECTORS_PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * SECTORS_PAGE_SIZE
  const slice = rows.slice(start, start + SECTORS_PAGE_SIZE)

  return {
    data: slice.map((request) => ({
      id: request.id,
      reference: request.reference,
      certificate: request.certificate,
      residentName: request.residentName,
      residentNumber: request.residentNumber,
      purpose: request.purpose,
      fee: request.fee,
      status: request.status,
      submittedAt: formatIsoDate(request.submittedAt),
      statusAt: formatIsoDate(certificateStatusAt(request)),
    })),
    currentPage,
    lastPage,
    perPage: SECTORS_PAGE_SIZE,
    total,
    from: start + 1,
    to: start + slice.length,
  }
}

export type SectorStats = {
  sectorApplications: number
  generalMembers: number
  pwdMembers: number
  seniorMembers: number
  certificates: number
  openCases: number
}

/**
 * The six KPI tiles. These are the unfiltered totals: the rosters carry the
 * filtered count in their own pagination footers instead.
 */
export function sectorStats(): SectorStats {
  return {
    sectorApplications: sectorApplications.filter((application) => application.status === "Under Admin Review")
      .length,
    generalMembers: rosterScope("general").length,
    pwdMembers: rosterScope("pwd").length,
    seniorMembers: rosterScope("senior").length,
    certificates: certificateScope().length,
    openCases: luponCases.filter((record) => !closedCaseStatuses.includes(record.status)).length,
  }
}

export type LuponSummary = { open: number; closed: number; total: number }

export function luponCaseSummary(): LuponSummary {
  const closed = luponCases.filter((record) => closedCaseStatuses.includes(record.status)).length
  return {
    open: luponCases.length - closed,
    closed,
    total: luponCases.length,
  }
}

export const sectorPuroks: AdminPurok[] = puroks
