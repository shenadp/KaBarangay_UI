/**
 * Admin Reports — the period model, window maths and aggregate reads of
 * `Admin/ReportsController`.
 *
 * The reporting window is computed in Philippine calendar days, exactly like
 * the controller: a daily window buckets timestamps by hour, a weekly or
 * monthly window by day, a yearly window by month, and a selected range is
 * inclusive of both of its dates and capped at 366 days. Population is always
 * a current snapshot and ignores the window.
 */

import { sectorCatalog, residentRegistry, type AdminResident } from "@/mock/admin/residents"
import { clerkCertificateStore } from "@/mock/clerk/certificates"
import { clerkStore } from "@/mock/clerkDesk"
import { luponCases } from "@/mock/luponExtras"
import type { SectorDeskStore, SectorPost } from "@/mock/sectorDesks"
import { todayIso } from "@/mock/sectorExtras"
import { pwdStore } from "@/mock/pwd"
import { seniorStore } from "@/mock/senior"

export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly" | "range"

export type ReportCategory =
  | "all"
  | "population"
  | "certificates"
  | "lupon"
  | "programs"
  | "financial"

export type ReportFilters = {
  period: ReportPeriod
  /** The anchor day, `YYYY-MM-DD`. */
  date: string
  date_from: string
  date_to: string
  category: ReportCategory
}

export type CountPoint = { label: string; count: number }

export type ReportWindow = {
  from: string
  to: string
  label: string
  timezone: string
  boundary: string
}

export type Report = {
  window: ReportWindow
  population: {
    metrics: Record<string, number>
    sectors: CountPoint[]
    distribution_note: string
  }
  certificates: { count: number; trend: CountPoint[]; by_type: CountPoint[]; meaning: string }
  lupon: { count: number; trend: CountPoint[]; by_type: CountPoint[]; meaning: string }
  programs: {
    count: number
    trend: CountPoint[]
    by_category: CountPoint[]
    attendance: CountPoint[]
  }
  financial: { available: boolean; message: string }
}

export const reportingTimezone = "Asia/Manila"

const maxRangeDays = 366

export const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "range", label: "Date range" },
]

export const categoryLabels: Record<ReportCategory, string> = {
  all: "All reports",
  population: "Population reports",
  certificates: "Certificate reports",
  lupon: "Lupon reports",
  programs: "Programs & attendance reports",
  financial: "Financial reports",
}

export const categoryOptions = Object.entries(categoryLabels) as [ReportCategory, string][]

/** The desk's "today" — the same anchor every mock surface is evaluated against. */
export const reportsTodayIso = todayIso

export const defaultFilters: ReportFilters = {
  period: "monthly",
  date: reportsTodayIso,
  date_from: "",
  date_to: "",
  category: "all",
}

/* ------------------------------------------------------------------ */
/* Calendar helpers                                                    */
/* ------------------------------------------------------------------ */

const pad = (value: number) => String(value).padStart(2, "0")

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const shortMonths = months.map((name) => name.slice(0, 3))

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

const toUtc = (iso: string) =>
  new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))))

const fromUtc = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`

const addDays = (iso: string, days: number) => {
  const date = toUtc(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return fromUtc(date)
}

const addMonths = (iso: string, months: number) => {
  const date = toUtc(iso)
  date.setUTCMonth(date.getUTCMonth() + months)
  return fromUtc(date)
}

/** Weeks run Monday through Sunday. */
const startOfWeek = (iso: string) => addDays(iso, -((toUtc(iso).getUTCDay() + 6) % 7))

const dayOfMonth = (iso: string) => Number(iso.slice(8, 10))

const longDate = (iso: string) =>
  `${shortMonths[Number(iso.slice(5, 7)) - 1]} ${dayOfMonth(iso)}, ${iso.slice(0, 4)}`

const shortDate = (iso: string) => `${shortMonths[Number(iso.slice(5, 7)) - 1]} ${dayOfMonth(iso)}`

const longMonth = (iso: string) => `${months[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`

const shortMonthYear = (iso: string) => `${shortMonths[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`

/* ------------------------------------------------------------------ */
/* Window                                                              */
/* ------------------------------------------------------------------ */

type Granularity = "hour" | "day" | "month"

type Bucket = { key: string; label: string }

type Window = {
  start: string
  /** Exclusive end, as a date. */
  endExclusive: string
  dateFrom: string
  dateToInclusive: string
  dateToExclusive: string
  granularity: Granularity
  buckets: Bucket[]
  label: string
}

const hourBucket = (hour: number): Bucket => ({
  key: pad(hour),
  label: `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`,
})

export function reportWindow(filters: ReportFilters): Window {
  let start: string
  let endExclusive: string
  let granularity: Granularity
  let label: string

  if (filters.period === "range") {
    start = filters.date_from
    endExclusive = addDays(filters.date_to, 1)
    granularity = "day"
    label = `${longDate(start)} – ${longDate(addDays(endExclusive, -1))}`
  } else {
    // A cleared anchor arrives as null and falls back to the desk's today.
    const anchor = filters.date === "" ? reportsTodayIso : filters.date
    if (filters.period === "daily") {
      start = anchor
      endExclusive = addDays(anchor, 1)
      granularity = "hour"
    } else if (filters.period === "weekly") {
      start = startOfWeek(anchor)
      endExclusive = addDays(start, 7)
      granularity = "day"
    } else if (filters.period === "yearly") {
      start = `${anchor.slice(0, 4)}-01-01`
      endExclusive = `${Number(anchor.slice(0, 4)) + 1}-01-01`
      granularity = "month"
    } else {
      start = `${anchor.slice(0, 7)}-01`
      endExclusive = addMonths(start, 1)
      granularity = "day"
    }
    label =
      filters.period === "daily"
        ? longDate(start)
        : filters.period === "weekly"
          ? `${shortDate(start)} – ${longDate(addDays(endExclusive, -1))}`
          : filters.period === "yearly"
            ? start.slice(0, 4)
            : longMonth(start)
  }

  const buckets: Bucket[] = []
  let cursor = start
  while (toUtc(cursor) < toUtc(endExclusive)) {
    if (granularity === "hour") {
      // Hours belong to the anchor day, so walk the clock instead the calendar.
      for (let hour = 0; hour < 24; hour += 1) buckets.push(hourBucket(hour))
      break
    }
    buckets.push(
      granularity === "month"
        ? { key: cursor.slice(0, 7), label: shortMonthYear(cursor) }
        : { key: cursor, label: shortDate(cursor) },
    )
    cursor = granularity === "month" ? addMonths(cursor, 1) : addDays(cursor, 1)
  }

  return {
    start,
    endExclusive,
    dateFrom: start,
    dateToInclusive: addDays(endExclusive, -1),
    dateToExclusive: endExclusive,
    granularity,
    buckets,
    label,
  }
}

export const windowBoundary =
  "Calendar boundaries use Philippine time. Weeks run Monday through Sunday. Selected ranges include both dates; timestamp filters use local midnight as an inclusive start and the next local midnight as an exclusive end. Stored UTC timestamps are converted to Asia/Manila for chart buckets."

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/** Mirrors the controller's validator; an empty object means the filters pass. */
export function validateFilters(filters: ReportFilters): Record<string, string> {
  const errors: Record<string, string> = {}
  const validPeriod: string[] = ["daily", "weekly", "monthly", "yearly", "range"]
  const validCategory: string[] = Object.keys(categoryLabels)

  if (!validPeriod.includes(filters.period))
    errors.period = "The selected period is invalid."
  if (!validCategory.includes(filters.category))
    errors.category = "The selected category is invalid."

  if (filters.date !== "" && !isIsoDate(filters.date)) errors.date = "The date must be a valid date."

  if (filters.period === "range") {
    if (filters.date_from === "") errors.date_from = "The date from field is required."
    else if (!isIsoDate(filters.date_from)) errors.date_from = "The date from must be a valid date."

    if (filters.date_to === "") errors.date_to = "The date to field is required."
    else if (!isIsoDate(filters.date_to)) errors.date_to = "The date to must be a valid date."

    if (!errors.date_from && !errors.date_to) {
      if (toUtc(filters.date_to) < toUtc(filters.date_from))
        errors.date_to = "The date to must be a date after or equal to date from."
      else if (Math.round((toUtc(filters.date_to).getTime() - toUtc(filters.date_from).getTime()) / 86_400_000) + 1 > maxRangeDays)
        errors.date_to = "Choose a date range of 366 days or fewer."
    }
  }

  return errors
}

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

const hourOf = (time: string | null | undefined): number | null => {
  const matched = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec((time ?? "").trim())
  if (!matched) return null
  let hour = Number(matched[1]) % 24
  const meridiem = matched[3]?.toUpperCase()
  if (meridiem === "PM" && hour !== 12) hour += 12
  if (meridiem === "AM" && hour === 12) hour = 0
  return hour
}

/** A row's bucket key for the window, or null when it falls outside it. */
function bucketKey(date: string, hour: number | null, window: Window): string | null {
  if (toUtc(date) < toUtc(window.start) || toUtc(date) >= toUtc(window.endExclusive)) return null
  if (window.granularity === "hour") return hour === null ? null : pad(hour)
  if (window.granularity === "month") return date.slice(0, 7)
  return date
}

function groupCounts(rows: Array<{ label: string; key: string | null }>): {
  byLabel: CountPoint[]
  counts: Record<string, number>
} {
  const labels: Record<string, number> = {}
  const counts: Record<string, number> = {}
  for (const row of rows) {
    labels[row.label] = (labels[row.label] ?? 0) + 1
    if (row.key !== null) counts[row.key] = (counts[row.key] ?? 0) + 1
  }
  return {
    byLabel: Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, count]) => ({ label, count })),
    counts,
  }
}

const trendFrom = (counts: Record<string, number>, window: Window, timestamped: boolean): CountPoint[] => {
  const buckets =
    // A plain date column cannot answer an hourly question, so the controller
    // collapses the daily window to a single day bucket.
    !timestamped && window.granularity === "hour"
      ? [{ key: window.dateFrom, label: shortDate(window.dateFrom) }]
      : window.buckets
  return buckets.map((bucket) => ({ label: bucket.label, count: counts[bucket.key] ?? 0 }))
}

const inWindow = (date: string, window: Window) =>
  toUtc(date) >= toUtc(window.start) && toUtc(date) < toUtc(window.endExclusive)

/** Approved residents with an active account — the directory's own scope. */
const approvedResidents = (): AdminResident[] =>
  residentRegistry
    .residents()
    .filter((resident) => resident.accountExists && resident.accountActive)

const withSector = (residents: AdminResident[], slug: string) =>
  residents.filter((resident) => resident.sectors.some((sector) => sector.slug === slug))

/** Programs are barangay-wide, so every desk board is read. Post ids repeat
 *  between desks, so the store that owns each post travels with it. */
function programPosts(): { post: SectorPost; desk: SectorDeskStore }[] {
  const posts = [clerkStore, seniorStore, pwdStore].flatMap((desk) =>
    desk.postsFor(["auto", "update", "program"]).map((post) => ({ post, desk })),
  )
  return posts.filter(
    ({ post }) =>
      post.approvalStatus === "approved" &&
      post.programStatus !== "draft" &&
      (post.type === "event" || post.requiresAttendance) &&
      Boolean(post.eventDate),
  )
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

export const distributionNote =
  "General Residents are approved residents with active accounts and no sector membership. Totals use the same qualification as the Residents directory. Senior and PWD memberships may overlap, so an exclusive distribution chart is omitted."

const certificateMeaning =
  "Issuance rows represent generated and recorded certificates, not proof of physical handover. Fee snapshots are not revenue."

const luponMeaning = "Counts Lupon case records by filed_date. Complaints are not counted separately."

const financialMessage =
  "Financial reports are unavailable because the current data sources do not provide an authoritative revenue and expense ledger."

const includes = (filters: ReportFilters, category: ReportCategory) =>
  filters.category === "all" || filters.category === category

export function buildReport(filters: ReportFilters): Report {
  const window = reportWindow(filters)
  const residents = approvedResidents()

  const population = {
    metrics: {
      "Total active Residents": residents.length,
      "Senior Citizens": withSector(residents, "senior").length,
      PWD: withSector(residents, "pwd").length,
      "General Residents": residents.filter((resident) => resident.sectors.length === 0).length,
    },
    sectors: includes(filters, "population")
      ? sectorCatalog
          .map((sector) => ({
            label: sector.name,
            count: withSector(residents, sector.slug).length,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
      : [],
    distribution_note: distributionNote,
  }

  const issuances = clerkCertificateStore
    .issuanceQueue()
    .filter((issuance) => inWindow(issuance.issuedAt, window))
  const certificateGroups = groupCounts(
    includes(filters, "certificates")
      ? issuances.map((issuance) => ({
          label: issuance.certificateType,
          key: bucketKey(issuance.issuedAt, hourOf(issuance.issuedTime), window),
        }))
      : [],
  )

  const cases = luponCases
    .filter((record) => record.caseNumber !== null)
    .filter((record) => inWindow(record.filed, window))
  const luponGroups = groupCounts(
    includes(filters, "lupon")
      ? cases.map((record) => ({
          label: record.nature,
          key: bucketKey(record.filed, null, window),
        }))
      : [],
  )

  const programs = programPosts().filter(({ post }) => inWindow(post.eventDate!, window))
  const programGroups = groupCounts(
    includes(filters, "programs")
      ? programs.map(({ post }) => ({
          label: post.category,
          key: bucketKey(post.eventDate!, hourOf(post.eventTime), window),
        }))
      : [],
  )

  const attendance = includes(filters, "programs")
    ? Object.entries(
        programs.reduce<Record<string, number>>((totals, { post, desk }) => {
          for (const record of desk.attendanceFor(post.id))
            totals[record.status] = (totals[record.status] ?? 0) + 1
          return totals
        }, {}),
      )
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([label, count]) => ({ label, count }))
    : []

  return {
    window: {
      from: window.dateFrom,
      to: window.dateToInclusive,
      label: window.label,
      timezone: reportingTimezone,
      boundary: windowBoundary,
    },
    population,
    certificates: {
      count: certificateGroups.byLabel.reduce((sum, point) => sum + point.count, 0),
      trend: trendFrom(certificateGroups.counts, window, true),
      by_type: certificateGroups.byLabel,
      meaning: certificateMeaning,
    },
    lupon: {
      count: luponGroups.byLabel.reduce((sum, point) => sum + point.count, 0),
      trend: trendFrom(luponGroups.counts, window, false),
      by_type: luponGroups.byLabel,
      meaning: luponMeaning,
    },
    programs: {
      count: programGroups.byLabel.reduce((sum, point) => sum + point.count, 0),
      trend: trendFrom(programGroups.counts, window, true),
      by_category: programGroups.byLabel,
      attendance,
    },
    financial: { available: false, message: financialMessage },
  }
}

/* ------------------------------------------------------------------ */
/* Aggregate CSV export                                                */
/* ------------------------------------------------------------------ */

export function reportCsvRows(filters: ReportFilters): string[][] {
  const rows: string[][] = [["Report", "Metric", "Period", "Value"]]
  const add = (...row: (string | number)[]) => rows.push(row.map(String))

  // The financial export is a fixed row and needs no report data at all.
  if (filters.category === "financial") {
    const window = reportWindow(filters)
    add("Financial", "Availability", window.label, "Unavailable: no authoritative financial ledger")
    return rows
  }

  const report = buildReport(filters)
  const period = report.window.label

  if (includes(filters, "population")) {
    for (const [label, value] of Object.entries(report.population.metrics))
      add("Population", label, "Current snapshot", value)
    for (const sector of report.population.sectors)
      add("Population", sector.label, "Current snapshot", sector.count)
  }

  if (includes(filters, "certificates")) {
    add("Certificates", "Generated issuances", period, report.certificates.count)
    for (const point of report.certificates.trend) add("Certificates", "Issuances", point.label, point.count)
    for (const point of report.certificates.by_type)
      add("Certificates", `Issuance type: ${point.label}`, period, point.count)
  }

  if (includes(filters, "lupon")) {
    add("Lupon", "Cases filed", period, report.lupon.count)
    for (const point of report.lupon.trend) add("Lupon", "Cases filed", point.label, point.count)
    for (const point of report.lupon.by_type)
      add("Lupon", `Case type: ${point.label}`, period, point.count)
  }

  if (includes(filters, "programs")) {
    add("Programs & Attendance", "Approved and published programs", period, report.programs.count)
    for (const point of report.programs.by_category)
      add("Programs & Attendance", `Program category: ${point.label}`, period, point.count)
    for (const point of report.programs.attendance)
      add("Programs & Attendance", `Attendance status: ${point.label}`, period, point.count)
  }

  if (includes(filters, "financial"))
    add("Financial", "Availability", period, "Unavailable: no authoritative financial ledger")

  return rows
}

/** A leading =, +, @ or - would execute in a spreadsheet, so it is neutralised. */
const guardFormula = (value: string) => (/^[=+@-]/.test(value.trimStart()) ? `'${value}` : value)

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`

export const reportFileName = (filters: ReportFilters) => {
  const window = reportWindow(filters)
  return `barangay-reports-${window.dateFrom}-${window.dateToInclusive}.csv`
}

export function downloadReportCsv(filters: ReportFilters): void {
  const body = reportCsvRows(filters)
    .map((row) => row.map((cell) => csvCell(guardFormula(cell))).join(","))
    .join("\r\n")

  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=UTF-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = reportFileName(filters)
  link.click()
  URL.revokeObjectURL(url)
}
