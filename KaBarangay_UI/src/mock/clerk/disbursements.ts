/**
 * Clerk desk — disbursement documents.
 *
 * Shapes mirror the Laravel backend's `Clerk/DisbursementDocumentController`
 * and the `Clerk/Disbursements/*` Inertia pages: a document is a PDF or CSV
 * record that starts life as a draft, is published to residents at most once
 * and may then be archived for good. There is no edit, no delete and no
 * versioning, so the only writes this module exposes are `upload`, `publish`
 * and `archive`.
 *
 * The list page and the detail page share the store below, so a publish made
 * on the list is already reflected when the document is opened. Nothing here
 * is fetched at runtime — an "upload" only ever records the browser `File`
 * object's name, size and type.
 */

import { clerkOfficer, clerkTodayIso } from "@/mock/clerkDesk"
import { formatIsoDate } from "@/mock/sectors"
import { disbursementDocs as residentVouchers } from "@/mock/residentExtras"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ClerkDisbursementStatus = "draft" | "published" | "archived"

export type DisbursementFileKind = "PDF" | "CSV" | "File"

/** One particulars line of the voucher — the amounts the resident portal shows. */
export type DisbursementLine = { particulars: string; amount: number }

/** Everything the UI keeps about a picked file: the `File` object's metadata. */
export type SimulatedFile = { name: string; size: number; type: string }

export type ClerkDisbursementDocument = {
  id: number
  /** Disbursement voucher number, shared with the resident portal (DV-2026-0418). */
  reference: string
  title: string
  description: string | null
  originalName: string
  mimeType: string
  fileSize: number
  category: string
  payee: string
  fund: string
  period: string
  /** Line items of the scanned voucher — feeds the mock PDF sheet. */
  lines: DisbursementLine[]
  /** ISO timestamp of the upload. */
  uploadedAt: string
  uploadedBy: string
  isPublished: boolean
  publishedAt: string | null
  archivedAt: string | null
  /**
   * Embedded contents of a seeded CSV so the private preview parses a real
   * table instead of pretending to stream a server file. Uploads have none.
   */
  csv?: string
}

export type ClerkDisbursementStats = {
  total: number
  draft: number
  published: number
  archived: number
}

export type DisbursementUploadInput = {
  title: string
  description?: string | null
  file: SimulatedFile
}

/**
 * Outcome of `publish`/`archive`. The backend is idempotent and refuses to
 * republish an archived document, so `changed` says whether anything moved and
 * `rejected` marks the one case that fails validation outright.
 */
export type DisbursementActionOutcome = {
  message: string
  changed: boolean
  rejected: boolean
}

/* ------------------------------------------------------------------ */
/* Derived fields                                                      */
/* ------------------------------------------------------------------ */

/** The three-way lifecycle the backend computes from the published/archived flags. */
export function clerkDisbursementStatus(
  document: ClerkDisbursementDocument,
): ClerkDisbursementStatus {
  if (document.archivedAt) return "archived"
  return document.isPublished ? "published" : "draft"
}

export const clerkDisbursementStatusLabels: Record<ClerkDisbursementStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
}

/** Extension wins over the MIME type, exactly like the backend's `isPdf`/`isCsv`. */
export function disbursementFileKind(document: ClerkDisbursementDocument): DisbursementFileKind {
  const extension = document.originalName.split(".").pop()?.toLowerCase() ?? ""
  if (extension === "pdf" || document.mimeType === "application/pdf") return "PDF"
  if (extension === "csv" || document.mimeType === "text/csv") return "CSV"
  return "File"
}

export function disbursementIsPdf(document: ClerkDisbursementDocument): boolean {
  return disbursementFileKind(document) === "PDF"
}

export function disbursementIsCsv(document: ClerkDisbursementDocument): boolean {
  return disbursementFileKind(document) === "CSV"
}

export function disbursementTotal(document: ClerkDisbursementDocument): number {
  return document.lines.reduce((sum, line) => sum + line.amount, 0)
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export const disbursementMaxUploadBytes = MAX_UPLOAD_BYTES

/** Same buckets the backend uses: bytes below 1 KB still read as "1 KB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB"
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDisbursementDate(value: string | null): string {
  if (!value) return "Not available"
  return formatIsoDate(value.slice(0, 10))
}

function clockLabel(value: string): string {
  const time = value.split("T")[1]
  if (!time) return ""
  const [rawHour, rawMinute] = time.split(":")
  const hour = Number(rawHour)
  const minute = Number(rawMinute)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return ""
  const suffix = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`
}

export function formatDisbursementDateTime(value: string | null): string {
  if (!value) return "Not available"
  const clock = clockLabel(value)
  return clock ? `${formatDisbursementDate(value)} · ${clock}` : formatDisbursementDate(value)
}

/** The resident dataset carries sizes as display strings; the store keeps bytes. */
function bytesFromDisplaySize(size: string): number {
  const [value, unit] = size.split(" ")
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * (unit?.toUpperCase() === "MB" ? 1024 * 1024 : 1024))
}

/* ------------------------------------------------------------------ */
/* CSV preview                                                         */
/* ------------------------------------------------------------------ */

/** Preview ceilings copied from `PresentsDisbursementDocuments`. */
export const CSV_PREVIEW_MAX_ROWS = 200
export const CSV_PREVIEW_MAX_COLUMNS = 30
export const CSV_PREVIEW_MAX_CELL_LENGTH = 500

export type DisbursementCsvPreview = {
  columns: string[]
  rows: string[][]
  rowLimit: number
  columnLimit: number
  rowsTruncated: boolean
  columnsTruncated: boolean
  cellsTruncated: boolean
  error: string | null
}

/** Splits CSV text into records, honouring quoted cells and embedded commas/newlines. */
export function splitCsvRows(source: string): string[][] {
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  const endCell = () => {
    row.push(cell)
    cell = ""
  }
  const endRow = () => {
    endCell()
    rows.push(row)
    row = []
  }

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') quoted = true
    else if (char === ",") endCell()
    else if (char === "\n") endRow()
    else if (char === "\r") {
      if (text[index + 1] === "\n") index += 1
      endRow()
    } else cell += char
  }

  if (cell !== "" || row.length > 0) endRow()

  return rows.filter((entry) => !(entry.length === 1 && entry[0].trim() === ""))
}

function emptyCsvPreview(message: string): DisbursementCsvPreview {
  return {
    columns: [],
    rows: [],
    rowLimit: CSV_PREVIEW_MAX_ROWS,
    columnLimit: CSV_PREVIEW_MAX_COLUMNS,
    rowsTruncated: false,
    columnsTruncated: false,
    cellsTruncated: false,
    error: message,
  }
}

function clipCell(value: string): { text: string; clipped: boolean } {
  if (value.length <= CSV_PREVIEW_MAX_CELL_LENGTH) return { text: value, clipped: false }
  return { text: `${value.slice(0, CSV_PREVIEW_MAX_CELL_LENGTH)}…`, clipped: true }
}

/**
 * CSV string → the preview payload the backend hands the page. Column, row and
 * cell ceilings are enforced here so the notice under the table is truthful.
 */
export function parseDisbursementCsv(source?: string | null): DisbursementCsvPreview {
  if (!source) {
    return emptyCsvPreview("The document file is unavailable.")
  }

  const records = splitCsvRows(source)
  const [header, ...body] = records

  if (!header) {
    return emptyCsvPreview("This CSV file does not contain any readable rows.")
  }

  let columnsTruncated = header.length > CSV_PREVIEW_MAX_COLUMNS
  const columns = header.slice(0, CSV_PREVIEW_MAX_COLUMNS).map((name, index) => {
    const trimmed = name.trim()
    return trimmed === "" ? `Column ${index + 1}` : trimmed
  })

  const rowsTruncated = body.length > CSV_PREVIEW_MAX_ROWS
  let cellsTruncated = false

  const rows = body.slice(0, CSV_PREVIEW_MAX_ROWS).map((record) => {
    if (record.length > columns.length) columnsTruncated = true

    return columns.map((_, index) => {
      const cell = clipCell(String(record[index] ?? ""))
      if (cell.clipped) cellsTruncated = true
      return cell.text
    })
  })

  return {
    columns,
    rows,
    rowLimit: CSV_PREVIEW_MAX_ROWS,
    columnLimit: CSV_PREVIEW_MAX_COLUMNS,
    rowsTruncated,
    columnsTruncated,
    cellsTruncated,
    error: null,
  }
}

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

const [healthVoucher, streetlightVoucher, drainageVoucher] = residentVouchers

const educationalAssistanceCsv = [
  "Scholar No.,Scholar Name,School,Level,Tuition Assistance (PHP),School Supplies (PHP),Total (PHP),Date Released,Remarks",
  "BSI-SCH-0101,Angeline M. Reyes,Santa Rosa National High School,Grade 11 STEM,8000,1500,9500,2026-10-06,Released",
  "BSI-SCH-0102,Jomar D. Pascual,Irrawaddy National High School,Grade 12 ABM,7500,1500,9000,2026-10-06,Released",
  "BSI-SCH-0103,Kristine A. Dela Cruz,University of the Visayas,1st year BS Criminology,9000,1500,10500,2026-10-07,Released",
  "BSI-SCH-0104,Mikhail S. Fernandez,Santa Rosa College,2nd year BS Information Technology,6500,1500,8000,2026-10-07,Released",
  "BSI-SCH-0105,Rowena T. Flores,St. Rose Academy,Grade 10,8000,1500,9500,2026-10-08,Released",
  "BSI-SCH-0106,Noel P. Garcia,Santa Rosa National High School,Grade 12 HUMSS,7000,1500,8500,2026-10-08,Released",
].join("\n")

const utilitiesCsv = [
  "Bill,Particulars,Amount (PHP),Paid On,OR No.",
  "Electricity,Meralco — barangay hall and streetlight service,5450,2026-10-02,OR-2026-1188",
  "Water,Santa Rosa Water District — hall and covered court,2500,2026-10-03,OR-2026-1191",
  "Internet,Fiber line for the registry and online services,4500,2026-10-04,OR-2026-1196",
].join("\n")

/**
 * The three vouchers the resident portal already lists keep their titles,
 * line items and file sizes here, so both portals always agree on the money.
 */
export const clerkDisbursementSeed: ClerkDisbursementDocument[] = [
  {
    id: 1,
    reference: healthVoucher.id,
    title: healthVoucher.item,
    description:
      "Maintenance drugs, consumables and the cold-chain vaccine shipment for the October health-station run.\nCertified by the barangay health worker on 2026-10-17.",
    originalName: healthVoucher.file.name,
    mimeType: "application/pdf",
    fileSize: bytesFromDisplaySize(healthVoucher.file.size),
    category: healthVoucher.category,
    payee: healthVoucher.payee,
    fund: healthVoucher.fund,
    period: healthVoucher.period,
    lines: healthVoucher.lines,
    uploadedAt: "2026-10-18T08:42:00",
    uploadedBy: "Mr. Nestor B. Salvador",
    isPublished: true,
    publishedAt: "2026-10-18T13:20:00",
    archivedAt: null,
  },
  {
    id: 2,
    reference: streetlightVoucher.id,
    title: streetlightVoucher.item,
    description:
      "Replacement of 18 failed LED fixtures and two bent poles along Riverside Road after the September storms.",
    originalName: streetlightVoucher.file.name,
    mimeType: "application/pdf",
    fileSize: bytesFromDisplaySize(streetlightVoucher.file.size),
    category: streetlightVoucher.category,
    payee: streetlightVoucher.payee,
    fund: streetlightVoucher.fund,
    period: streetlightVoucher.period,
    lines: streetlightVoucher.lines,
    uploadedAt: "2026-10-15T09:05:00",
    uploadedBy: "Hon. Ferdinand C. Ocampo",
    isPublished: true,
    publishedAt: "2026-10-15T15:40:00",
    archivedAt: null,
  },
  {
    id: 3,
    reference: drainageVoucher.id,
    title: drainageVoucher.item,
    description:
      "Desilting of the collector canal and hauling of silt across Purok 3, including the community labor honoraria.",
    originalName: drainageVoucher.file.name,
    mimeType: "application/pdf",
    fileSize: bytesFromDisplaySize(drainageVoucher.file.size),
    category: drainageVoucher.category,
    payee: drainageVoucher.payee,
    fund: drainageVoucher.fund,
    period: drainageVoucher.period,
    lines: drainageVoucher.lines,
    uploadedAt: "2026-10-12T16:20:00",
    uploadedBy: "Mr. Nestor B. Salvador",
    isPublished: true,
    publishedAt: "2026-10-12T17:05:00",
    archivedAt: null,
  },
  {
    id: 4,
    reference: "DV-2026-0415",
    title: "2026 Educational Assistance Payout",
    description:
      "Per-scholar payout roster for the first semester of the barangay education program.",
    originalName: "dv-2026-0415-educational-assistance.csv",
    mimeType: "text/csv",
    fileSize: 6_140,
    category: "Education",
    payee: "Barangay Education Committee",
    fund: "Barangay Development Fund 2026",
    period: "Oct 1 – Oct 8, 2026",
    lines: [
      { particulars: "Tuition subsidy — 6 scholars", amount: 46_000 },
      { particulars: "School supplies and load allowance — ₱1,500 each", amount: 9_000 },
      { particulars: "Documentation, monitoring and disbursement ceremony", amount: 3_000 },
    ],
    uploadedAt: "2026-10-26T10:15:00",
    uploadedBy: "Hon. Lourdes T. Salvador",
    isPublished: false,
    publishedAt: null,
    archivedAt: null,
    csv: educationalAssistanceCsv,
  },
  {
    id: 5,
    reference: "DV-2026-0414",
    title: "Barangay hall utilities and internet",
    description: "Monthly electricity, water and fiber internet bills for the barangay hall.",
    originalName: "dv-2026-0414-utilities.csv",
    mimeType: "text/csv",
    fileSize: 1_840,
    category: "Administration",
    payee: "Multiple suppliers",
    fund: "Barangay Operating Fund 2026",
    period: "Sep 1 – Sep 30, 2026",
    lines: [
      { particulars: "Electricity", amount: 5_450 },
      { particulars: "Water", amount: 2_500 },
      { particulars: "Fiber internet", amount: 4_500 },
    ],
    uploadedAt: "2026-10-05T09:30:00",
    uploadedBy: "Ms. Rowena S. Villareal",
    isPublished: true,
    publishedAt: "2026-10-05T11:50:00",
    archivedAt: null,
    csv: utilitiesCsv,
  },
  {
    id: 6,
    reference: "DV-2026-0413",
    title: "Medical assistance for 14 senior citizens",
    description:
      "Cash assistance, transport allowance and laboratory work endorsed by the barangay health worker.",
    originalName: "dv-2026-0413-medical-assistance.pdf",
    mimeType: "application/pdf",
    fileSize: 339_968,
    category: "Social services",
    payee: "Various beneficiaries",
    fund: "Barangay Health Fund 2026",
    period: "Oct 1 – Oct 10, 2026",
    lines: [
      { particulars: "Cash assistance — 14 beneficiaries", amount: 28_000 },
      { particulars: "Transport allowance to the referral hospital", amount: 4_500 },
      { particulars: "Laboratory work", amount: 2_500 },
    ],
    uploadedAt: "2026-10-27T09:12:00",
    uploadedBy: "Hon. Ma. Cecilia D. Ramos",
    isPublished: false,
    publishedAt: null,
    archivedAt: null,
  },
  {
    id: 7,
    reference: "DV-2026-0412",
    title: "Youth sports league balls and jerseys",
    description: "Equipment and uniforms for the 2026 inter-purok basketball and volleyball league.",
    originalName: "dv-2026-0412-youth-sports.pdf",
    mimeType: "application/pdf",
    fileSize: 200_704,
    category: "Youth and sports",
    payee: "Purok 4 Uniforms and Supply",
    fund: "SK Fund 2026",
    period: "Aug 15 – Sep 30, 2026",
    lines: [
      { particulars: "Jerseys and shorts — 8 teams", amount: 16_400 },
      { particulars: "Balls and trophies", amount: 7_700 },
      { particulars: "Venue rental", amount: 3_500 },
    ],
    uploadedAt: "2026-10-08T10:22:00",
    uploadedBy: "Mr. Kevin M. Alvarez",
    isPublished: true,
    publishedAt: "2026-10-08T13:05:00",
    archivedAt: null,
  },
  {
    id: 8,
    reference: "DV-2026-0411",
    title: "Coastal clean-up drive supplies",
    description: "Bags, gloves and hauling fees for the coastal clean-up drive held with the eco-aide.",
    originalName: "dv-2026-0411-cleanup.pdf",
    mimeType: "application/pdf",
    fileSize: 157_696,
    category: "Relief operations",
    payee: "Santa Rosa Hauling Services",
    fund: "Barangay Environment Fund 2026",
    period: "Aug 20 – Sep 5, 2026",
    lines: [
      { particulars: "Cleaning supplies", amount: 12_400 },
      { particulars: "Hauling fee", amount: 4_500 },
      { particulars: "Snacks for volunteers", amount: 2_000 },
    ],
    uploadedAt: "2026-09-08T09:25:00",
    uploadedBy: "Hon. Romeo V. Lazaro",
    isPublished: false,
    publishedAt: "2026-09-22T14:10:00",
    archivedAt: "2026-09-28T15:44:00",
  },
  {
    id: 9,
    reference: "DV-2026-0419",
    title: "Relief goods for 60 flooded households",
    description:
      "Family packs distributed after the Riverside overflow, pending the accounting report from the DRRM committee.",
    originalName: "dv-2026-0419-relief-goods.pdf",
    mimeType: "application/pdf",
    fileSize: 421_888,
    category: "Relief operations",
    payee: "Lopez Grocers — Purok 2",
    fund: "Barangay Quarantine and Relief Fund 2026",
    period: "Oct 20 – Oct 27, 2026",
    lines: [
      { particulars: "Dry-goods family packs — 60 households", amount: 78_000 },
      { particulars: "Bottled water and canned goods", amount: 12_600 },
      { particulars: "Tarpaulins, blankets and hygiene kits", amount: 9_400 },
    ],
    uploadedAt: "2026-10-28T08:35:00",
    uploadedBy: "Ms. Rowena S. Villareal",
    isPublished: false,
    publishedAt: null,
    archivedAt: null,
  },
]

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

/** Newest first, mirroring the backend's `latest('created_at')->latest('id')`. */
function sortNewestFirst(documents: ClerkDisbursementDocument[]): ClerkDisbursementDocument[] {
  return [...documents].sort((a, b) => {
    if (a.uploadedAt === b.uploadedAt) return b.id - a.id
    return a.uploadedAt < b.uploadedAt ? 1 : -1
  })
}

function mimeForName(name: string, declaredType: string): string {
  if (declaredType) return declaredType
  const extension = name.split(".").pop()?.toLowerCase() ?? ""
  if (extension === "pdf") return "application/pdf"
  if (extension === "csv") return "text/csv"
  return "application/octet-stream"
}

/**
 * One store for the clerk's disbursement desk. The backend persists lifecycle
 * changes to the database; this keeps them in memory so an upload or a publish
 * made on the list page shows up on the detail page and vice versa.
 */
export function createClerkDisbursementStore(
  seed: ClerkDisbursementDocument[] = clerkDisbursementSeed,
  options: { officer: string; todayIso: string } = {
    officer: clerkOfficer,
    todayIso: clerkTodayIso,
  },
) {
  let documents = [...seed]

  /** Stays on the desk's mock calendar but uses the wall clock for the time. */
  const stampNow = () => {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, "0")
    const mm = String(now.getMinutes()).padStart(2, "0")
    return `${options.todayIso}T${hh}:${mm}:00`
  }

  const nextReference = () => {
    const highest = documents.reduce((max, document) => {
      const suffix = Number(document.reference.split("-").pop() ?? 0)
      return Number.isNaN(suffix) ? max : Math.max(max, suffix)
    }, 0)
    return `DV-${options.todayIso.slice(0, 4)}-${String(highest + 1).padStart(4, "0")}`
  }

  // Closures rather than `this` lookups, so callers may destructure the store.
  const nextId = () => documents.reduce((max, document) => Math.max(max, document.id), 0) + 1

  return {
    documents(): ClerkDisbursementDocument[] {
      return sortNewestFirst(documents)
    },

    documentById(id: number): ClerkDisbursementDocument | undefined {
      return documents.find((document) => document.id === id)
    },

    stats(): ClerkDisbursementStats {
      const byStatus = (status: ClerkDisbursementStatus) =>
        documents.filter((document) => clerkDisbursementStatus(document) === status).length

      return {
        total: documents.length,
        draft: byStatus("draft"),
        published: byStatus("published"),
        archived: byStatus("archived"),
      }
    },

    /** Records the picked file's metadata only — no bytes leave the browser. */
    upload(input: DisbursementUploadInput): ClerkDisbursementDocument {
      const description = input.description?.trim()
      const document: ClerkDisbursementDocument = {
        id: nextId(),
        reference: nextReference(),
        title: input.title.trim(),
        description: description ? description : null,
        originalName: input.file.name,
        mimeType: mimeForName(input.file.name, input.file.type),
        fileSize: input.file.size,
        category: "Uncategorised",
        payee: "Not recorded",
        fund: "Not recorded",
        period: "Not recorded",
        lines: [],
        uploadedAt: stampNow(),
        uploadedBy: options.officer,
        isPublished: false,
        publishedAt: null,
        archivedAt: null,
      }

      documents = [document, ...documents]

      return document
    },

    publish(id: number): DisbursementActionOutcome {
      const document = documents.find((entry) => entry.id === id)
      if (!document) {
        return { message: "The document could not be found.", changed: false, rejected: true }
      }

      if (document.archivedAt) {
        return {
          message: "Archived documents cannot be published.",
          changed: false,
          rejected: true,
        }
      }

      if (document.isPublished) {
        return { message: "The document is already published.", changed: false, rejected: false }
      }

      const publishedAt = stampNow()
      documents = documents.map((entry) =>
        entry.id === id ? { ...entry, isPublished: true, publishedAt } : entry,
      )

      return { message: "Disbursement document published.", changed: true, rejected: false }
    },

    /** Idempotent, like the backend: re-archiving reports the no-op. */
    archive(id: number): DisbursementActionOutcome {
      const document = documents.find((entry) => entry.id === id)
      if (!document) {
        return { message: "The document could not be found.", changed: false, rejected: true }
      }

      if (document.archivedAt) {
        return { message: "The document is already archived.", changed: false, rejected: false }
      }

      const archivedAt = stampNow()
      documents = documents.map((entry) =>
        entry.id === id ? { ...entry, isPublished: false, archivedAt } : entry,
      )

      return { message: "Disbursement document archived.", changed: true, rejected: false }
    },
  }
}

export type ClerkDisbursementStore = ReturnType<typeof createClerkDisbursementStore>

export const clerkDisbursementStore: ClerkDisbursementStore = createClerkDisbursementStore()
