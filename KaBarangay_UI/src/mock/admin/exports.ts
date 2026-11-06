/**
 * Admin Settings — Data Export.
 *
 * Mirrors the four downloads `Admin/SettingsController` offers. Each one is
 * assembled from the live session stores with the controller's own column
 * allowlist, filename pattern (`residents-2026-10-28.csv`) and spreadsheet
 * safety rules, so the file a visitor downloads here has the shape the backend
 * would have produced.
 *
 * Nothing is fetched, and no credential, authentication material or uploaded
 * document ever enters an export.
 */

import { auditTrail } from "@/mock/admin/auditLog"
import { emergencyDirectory } from "@/mock/admin/emergency"
import { puroks, residentRegistry, sectorCatalog } from "@/mock/admin/residents"
import { staffAssignments } from "@/mock/admin/staff"
import { todayIso } from "@/mock/sectorExtras"

export type Download = { filename: string; mime: string; body: string }

/** The barangay the demo session is signed into. */
export const BARANGAY_CODE = "BRGY-042"

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Spreadsheet applications read a leading `=`, `+`, `-`, `@`, tab or carriage
 * return as a formula, so those cells are prefixed with an apostrophe — the
 * same guard `csvValue()` applies server-side.
 */
function csvValue(value: unknown): string {
  if (value === null || value === undefined) return ""

  const text = String(value)

  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

/** `fputcsv` quoting: delimiters, quotes, whitespace and line breaks force an enclosure. */
function csvField(value: string): string {
  if (/[",\n\r\t]/.test(value) || /^\s|\s$/.test(value)) return `"${value.replace(/"/g, '""')}"`

  return value
}

function csvLine(values: string[]): string {
  return values.map(csvField).join(",")
}

function csvDocument(columns: string[], rows: unknown[][]): string {
  return [csvLine(columns), ...rows.map((row) => csvLine(row.map(csvValue)))].join("\n")
}

/* ------------------------------------------------------------------ */
/* Residents                                                           */
/* ------------------------------------------------------------------ */

/** `RESIDENT_COLUMNS` — display fields only, never account material. */
const RESIDENT_COLUMNS = [
  "Resident Number",
  "First Name",
  "Middle Name",
  "Last Name",
  "Suffix",
  "Birthdate",
  "Sex",
  "Civil Status",
  "Address",
  "Purok",
  "Mobile",
  "Email",
  "Status",
  "Approved At",
]

const purokNameOf = (purokId: number | null): string | null =>
  puroks.find((purok) => purok.id === purokId)?.name ?? null

export function residentsCsv(): Download {
  /* `orderBy('last_name')->orderBy('first_name')` */
  const rows = [...residentRegistry.residents()].sort(
    (a, b) =>
      a.lastName.localeCompare(b.lastName) ||
      a.firstName.localeCompare(b.firstName) ||
      a.id - b.id,
  )

  return {
    filename: `residents-${todayIso}.csv`,
    mime: "text/csv;charset=utf-8",
    body: csvDocument(
      RESIDENT_COLUMNS,
      rows.map((resident) => [
        resident.residentNumber,
        resident.firstName,
        resident.middleName,
        resident.lastName,
        resident.suffix,
        resident.birthdate,
        resident.sex,
        resident.civilStatus,
        resident.addressLine,
        purokNameOf(resident.purokId),
        resident.mobile,
        resident.email,
        resident.status,
        resident.approvedAt,
      ]),
    ),
  }
}

/* ------------------------------------------------------------------ */
/* Staff                                                               */
/* ------------------------------------------------------------------ */

const STAFF_COLUMNS = ["Name", "Email", "Department", "Position", "Status"]

export function staffCsv(): Download {
  return {
    filename: `staff-${todayIso}.csv`,
    mime: "text/csv;charset=utf-8",
    body: csvDocument(
      STAFF_COLUMNS,
      staffAssignments
        .list()
        .sort((a, b) => a.id - b.id)
        .map((assignment) => [
          assignment.residentName,
          assignment.userEmail,
          assignment.department,
          assignment.position,
          assignment.isActive ? "active" : "inactive",
        ]),
    ),
  }
}

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

/**
 * `AUDIT_LOG_COLUMNS`. The local trail stores the event, the acting account and
 * the timestamp — the same three fields the Audit Log page displays — so the
 * entity and IP columns are written as they arrive, which is empty.
 */
const AUDIT_LOG_COLUMNS = ["Recorded At", "Event", "Entity Type", "Entity ID", "Context", "IP Address"]

export function auditLogCsv(): Download {
  return {
    filename: `audit-log-${todayIso}.csv`,
    mime: "text/csv;charset=utf-8",
    body: csvDocument(
      AUDIT_LOG_COLUMNS,
      [...auditTrail.entries()]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
        .map((entry) => [entry.createdAt, entry.event, "", "", "", ""]),
    ),
  }
}

/* ------------------------------------------------------------------ */
/* JSON data export                                                    */
/* ------------------------------------------------------------------ */

export const EXPORT_FORMAT = "kabarangay.barangay-data-export"

export const EXPORT_FORMAT_VERSION = 1

/** Tables carried without barangay ownership, so references stay interpretable. */
export const GLOBAL_TABLES = ["sectors"]

const EXPORT_NOTE =
  "Barangay-scoped data export, not a restore-verified backup. Passwords, authentication material, " +
  "and uploaded document binaries are excluded, so this file cannot fully restore an application " +
  "state. Timestamps and values use the raw database representation. User reference ids " +
  "(created_by, reviewed_by, verified_by, actor_id) may be unresolved because the users table is " +
  "not exported."

type Table = { columns: string[]; rows: Record<string, unknown>[] }

function table(columns: string[], rows: Record<string, unknown>[]): Table {
  return { columns, rows: rows.map((row) => Object.fromEntries(columns.map((c) => [c, row[c] ?? null]))) }
}

/** The session stores hold camelCase read models; the export uses database column names. */
function pick<T extends object>(record: T, map: Record<string, keyof T>) {
  return Object.fromEntries(
    Object.entries(map).map(([column, field]) => [column, record[field] ?? null]),
  ) as Record<string, unknown>
}

export function barangayDataJson(): Download {
  const residents = residentRegistry
    .residents()
    .sort((a, b) => a.id - b.id)
    .map((resident) =>
      pick(resident, {
        id: "id",
        purok_id: "purokId",
        resident_number: "residentNumber",
        first_name: "firstName",
        middle_name: "middleName",
        last_name: "lastName",
        suffix: "suffix",
        birthdate: "birthdate",
        sex: "sex",
        civil_status: "civilStatus",
        address_line: "addressLine",
        mobile: "mobile",
        email: "email",
        status: "status",
        approved_at: "approvedAt",
      }),
    )

  const registrations = residentRegistry
    .registrations()
    .sort((a, b) => a.id - b.id)
    .map((registration) => ({
      ...pick(registration, {
        id: "id",
        purok_id: "purokId",
        reference: "reference",
        first_name: "firstName",
        middle_name: "middleName",
        last_name: "lastName",
        suffix: "suffix",
        birthdate: "birthdate",
        sex: "sex",
        civil_status: "civilStatus",
        address_line: "addressLine",
        mobile: "mobile",
        email: "email",
        status: "status",
        submitted_at: "submittedAt",
        reviewed_at: "reviewedAt",
        last_resubmitted_at: "lastResubmittedAt",
      }),
      /* Only the ids travel — names would duplicate the `sectors` catalog. */
      sectors: registration.sectors.map((sector) => sector.id),
    }))

  const hotlines = emergencyDirectory
    .hotlines()
    .map((contact) =>
      pick(contact, {
        id: "id",
        category: "category",
        sub_category: "subCategory",
        name: "name",
        label: "label",
        phone_number: "phoneNumber",
        can_call: "canCall",
        can_sms: "canSms",
        display_order: "displayOrder",
        is_active: "isActive",
      }),
    )

  const sharedContacts = emergencyDirectory
    .sharedContacts()
    .map((contact) =>
      pick(contact, {
        id: "id",
        service_type: "serviceType",
        name: "name",
        label: "label",
        phone_number: "phoneNumber",
        coverage_area: "coverageArea",
        can_call: "canCall",
        can_sms: "canSms",
        display_order: "displayOrder",
        is_active: "isActive",
      }),
    )

  const staff = staffAssignments
    .list()
    .sort((a, b) => a.id - b.id)
    .map((assignment) => ({
      id: assignment.id,
      name: assignment.residentName,
      email: assignment.userEmail,
      department: assignment.department,
      position: assignment.position,
      status: assignment.isActive ? "active" : "inactive",
    }))

  const auditLogs = [...auditTrail.entries()]
    .sort((a, b) => a.id - b.id)
    .map((entry) => ({
      id: entry.id,
      created_at: entry.createdAt,
      event: entry.event,
      actor_name: entry.actor?.name ?? null,
      actor_position: entry.actor?.position ?? null,
      actor_department: entry.actor?.departmentLabel ?? null,
    }))

  const payload = {
    meta: {
      format: EXPORT_FORMAT,
      format_version: EXPORT_FORMAT_VERSION,
      generated_at: new Date().toISOString(),
      barangay_id: 1,
      barangay_code: BARANGAY_CODE,
      scope: "barangay",
      global_tables: GLOBAL_TABLES,
      value_encoding: "raw-database",
      note: EXPORT_NOTE,
    },
    tables: {
      puroks: table(
        ["id", "name"],
        puroks.map((purok) => ({ id: purok.id, name: purok.name })),
      ),
      residents: table(
        [
          "id",
          "purok_id",
          "resident_number",
          "first_name",
          "middle_name",
          "last_name",
          "suffix",
          "birthdate",
          "sex",
          "civil_status",
          "address_line",
          "mobile",
          "email",
          "status",
          "approved_at",
        ],
        residents,
      ),
      sectors: table(
        ["id", "name", "slug"],
        sectorCatalog.map((sector) => ({ id: sector.id, name: sector.name, slug: sector.slug })),
      ),
      resident_registrations: table(
        [
          "id",
          "purok_id",
          "reference",
          "first_name",
          "middle_name",
          "last_name",
          "suffix",
          "birthdate",
          "sex",
          "civil_status",
          "address_line",
          "mobile",
          "email",
          "status",
          "submitted_at",
          "reviewed_at",
          "last_resubmitted_at",
          "sectors",
        ],
        registrations,
      ),
      emergency_contacts: table(
        [
          "id",
          "category",
          "sub_category",
          "name",
          "label",
          "phone_number",
          "can_call",
          "can_sms",
          "display_order",
          "is_active",
        ],
        hotlines,
      ),
      shared_emergency_contacts: table(
        [
          "id",
          "service_type",
          "name",
          "label",
          "phone_number",
          "coverage_area",
          "can_call",
          "can_sms",
          "display_order",
          "is_active",
        ],
        sharedContacts,
      ),
      staff_assignments: table(
        ["id", "name", "email", "department", "position", "status"],
        staff,
      ),
      audit_logs: table(
        ["id", "created_at", "event", "actor_name", "actor_position", "actor_department"],
        auditLogs,
      ),
    },
  }

  return {
    filename: `barangay-data-${todayIso}.json`,
    mime: "application/json",
    body: JSON.stringify(payload, null, 2),
  }
}

/* ------------------------------------------------------------------ */
/* Delivery                                                            */
/* ------------------------------------------------------------------ */

/**
 * The browser half of `Content-Disposition: attachment`. Only ever called from
 * a click handler — nothing here exists during a server render.
 */
export function downloadFile(download: Download): void {
  const url = URL.createObjectURL(new Blob([download.body], { type: download.mime }))
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = download.filename
  anchor.click()

  URL.revokeObjectURL(url)
}
