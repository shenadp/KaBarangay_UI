/**
 * Admin portal — staff assignments.
 *
 * Mirrors `Admin/StaffManagementController` and `Admin/Staff.tsx`. A staff row
 * is an **assignment**, not an account: it attaches an official resident record
 * to a department and a position, and the department is the login role. The
 * resident must already be active with a live portal account and a linked user,
 * one resident may hold one assignment per department (inactive rows count),
 * editing can only change the department and position, and deactivation is
 * one-way — there is no reactivate route on the backend. Staff CRUD writes no
 * audit-log rows at all.
 */

import { fullNameOf, purokName, residentRegistry, type AdminResident } from "@/mock/admin/residents"

/* ------------------------------------------------------------------ */
/* Departments                                                         */
/* ------------------------------------------------------------------ */

export type DepartmentValue = "admin" | "clerk" | "lupon" | "senior" | "pwd"

export type DepartmentOption = {
  value: DepartmentValue
  label: string
  /** The position pre-filled when the department is picked. */
  position: string
}

/** `App\Support\StaffDepartments` — the department list and its default titles. */
export const staffDepartments: DepartmentOption[] = [
  { value: "admin", label: "Barangay Administration", position: "Barangay Administrator" },
  { value: "clerk", label: "Records and Certificates", position: "Barangay Clerk" },
  { value: "lupon", label: "Lupon Tagapamayapa", position: "Lupon Officer" },
  { value: "senior", label: "Senior Citizens Affairs", position: "Senior Citizens Officer" },
  { value: "pwd", label: "Persons with Disability Affairs", position: "PWD Officer" },
]

export const departmentLabelOf = (value: string): string =>
  staffDepartments.find((department) => department.value === value)?.label ?? value

export const staffPageSize = 15

/* ------------------------------------------------------------------ */
/* Assignment record                                                   */
/* ------------------------------------------------------------------ */

export type StaffAssignment = {
  id: number
  residentId: number
  residentName: string
  residentNumber: string
  /** The email of the account the assignment grants a role to. */
  userEmail: string
  department: DepartmentValue | string
  departmentLabel: string
  position: string
  isActive: boolean
}

type AssignmentSeed = {
  id: number
  residentId: number
  department: DepartmentValue
  position: string
  isActive: boolean
}

/** The login row carries its own email — it is not the resident contact column. */
const loginEmailOf = (resident: AdminResident): string =>
  resident.email ?? `resident_${resident.id}@kabarangay.local`

/**
 * The list search hands each word to `LIKE '%word%'` unescaped, so `%` and `_`
 * keep their wildcard meaning instead of being stripped.
 */
function likeMatch(token: string, value: string | null | undefined): boolean {
  if (value === null || value === undefined) return false
  const source = value.toLowerCase()
  if (token === "") return true
  if (!/[%_]/.test(token)) return source.includes(token)

  const pattern = token
    .split("")
    .map((char) => (char === "%" ? ".*" : char === "_" ? "." : char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("")
  return new RegExp(`^.*${pattern}.*$`).test(source)
}

/** Whitespace-split, AND across words and columns — the controller's semantics. */
function matchesWords(words: string[], values: Array<string | null | undefined>): boolean {
  return words.every((word) => values.some((value) => likeMatch(word, value)))
}

const assignmentSeeds: AssignmentSeed[] = [
  { id: 1, residentId: 171, department: "admin", position: "Barangay Administrator", isActive: true },
  { id: 2, residentId: 166, department: "clerk", position: "Barangay Clerk", isActive: true },
  { id: 3, residentId: 170, department: "senior", position: "Senior Citizen Assistant", isActive: true },
  { id: 4, residentId: 167, department: "senior", position: "Senior Citizens Officer", isActive: true },
  { id: 5, residentId: 168, department: "pwd", position: "PWD Officer", isActive: true },
  { id: 6, residentId: 172, department: "pwd", position: "PWD Assistant", isActive: false },
  { id: 7, residentId: 169, department: "lupon", position: "Lupon Officer", isActive: true },
]

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export type EligibleResident = {
  id: number
  name: string
  residentNumber: string
  purok: string
}

function createStaffStore() {
  const hydrate = (seed: AssignmentSeed): StaffAssignment | null => {
    const resident = residentRegistry.residentById(seed.residentId)
    if (!resident) return null
    return {
      id: seed.id,
      residentId: resident.id,
      residentName: fullNameOf(resident),
      residentNumber: resident.residentNumber,
      userEmail: loginEmailOf(resident),
      department: seed.department,
      departmentLabel: departmentLabelOf(seed.department),
      position: seed.position,
      isActive: seed.isActive,
    }
  }

  // `latest()` with the id tie-breaker: the newest assignment is the first row.
  let assignments = assignmentSeeds
    .map(hydrate)
    .filter((assignment): assignment is StaffAssignment => assignment !== null)
    .sort((a, b) => b.id - a.id)

  let nextId = assignments.reduce((max, item) => Math.max(max, item.id), 0) + 1

  /**
   * Eligibility is the backend's filter: an active resident in this barangay
   * with a live portal account and a linked, still-active login user.
   */
  const eligible = (residentId: number): boolean => {
    const resident = residentRegistry.residentById(residentId)
    return !!resident && resident.status === "active" && resident.accountExists && resident.accountActive
  }

  /** The columns the roster search may hit, read through the relations. */
  const haystack = (assignment: StaffAssignment): Array<string | null | undefined> => {
    const resident = residentRegistry.residentById(assignment.residentId)
    return [
      assignment.department,
      assignment.position,
      // A label word finds the department it belongs to: `records` → `clerk`.
      departmentLabelOf(assignment.department),
      assignment.userEmail,
      resident?.residentNumber,
      resident?.firstName,
      resident?.middleName,
      resident?.lastName,
    ]
  }

  const clash = (residentId: number, department: string, exceptId?: number) =>
    assignments.find(
      (assignment) =>
        assignment.id !== exceptId &&
        assignment.residentId === residentId &&
        assignment.department.trim().toLowerCase() === department.trim().toLowerCase(),
    )

  return {
    list(): StaffAssignment[] {
      return assignments
    },

    /** Newest first, ordered exactly like the paginated `latest()` query. */
    search(raw: string): StaffAssignment[] {
      const words = raw.trim().toLowerCase().split(/\s+/).filter((word) => word !== "")
      if (words.length === 0) return assignments
      return assignments.filter((assignment) => matchesWords(words, haystack(assignment)))
    },

    /** The assignment that grants this session its own admin role, if any. */
    currentAdminAssignment(): StaffAssignment | null {
      return assignments.find((item) => item.department === "admin" && item.isActive) ?? null
    },

    activeCount(): number {
      return assignments.filter((assignment) => assignment.isActive).length
    },

    /** Residents the assign dialog may pick — only eligible records are offered. */
    searchResidents(search: string): EligibleResident[] {
      const words = search.trim().toLowerCase().split(/\s+/).filter((word) => word !== "")
      if (words.length === 0) return []

      return residentRegistry
        .residents()
        .filter((resident) => eligible(resident.id))
        .filter((resident) =>
          matchesWords(words, [
            resident.firstName,
            resident.middleName,
            resident.lastName,
            resident.residentNumber,
          ]),
        )
        // The endpoint sorts by surname alone and stops at ten rows.
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
        .slice(0, 10)
        .map((resident) => ({
          id: resident.id,
          name: fullNameOf(resident),
          residentNumber: resident.residentNumber,
          purok: resident.purokId ? purokName(resident.purokId) : "Purok not recorded",
        }))
    },

    /**
     * The QR path resolves a token to a resident, then re-checks eligibility —
     * a valid credential alone is not enough to be assigned. The verify endpoint
     * also accepts a resident number and a whole `/verify/resident/…` URL.
     */
    residentFromQrToken(raw: string): { ok: true; resident: EligibleResident } | { ok: false; message: string } {
      const token = raw.trim().replace(/^.*\/verify\/resident\//, "")
      const match = residentRegistry
        .residents()
        .find((resident) => {
          if (resident.qrStatus === "active" && resident.qrToken === token) return true
          return resident.residentNumber.toUpperCase() === token.toUpperCase()
        })

      if (!match)
        return {
          ok: false,
          message: "QR code not found in your barangay, or the resident is inactive.",
        }

      if (!eligible(match.id))
        return {
          ok: false,
          message: "This resident needs an active account and linked user before staff assignment.",
        }

      return {
        ok: true,
        resident: {
          id: match.id,
          name: fullNameOf(match),
          residentNumber: match.residentNumber,
          purok: match.purokId ? purokName(match.purokId) : "Purok not recorded",
        },
      }
    },

    assign(
      residentId: number,
      department: string,
      position: string,
    ): { ok: boolean; message: string; field?: string } {
      if (!eligible(residentId))
        return {
          ok: false,
          field: "resident",
          message: "The resident must have an account and linked user before receiving a staff assignment.",
        }

      // One assignment per resident per department — inactive rows included,
      // because the role itself is what the login checks.
      if (clash(residentId, department))
        return {
          ok: false,
          field: "department",
          message: "This resident is already assigned to this role. Edit the existing staff assignment instead.",
        }

      const resident = residentRegistry.residentById(residentId)
      if (!resident) return { ok: false, message: "That resident record no longer exists." }

      assignments = [
        {
          id: nextId++,
          residentId,
          residentName: fullNameOf(resident),
          residentNumber: resident.residentNumber,
          userEmail: loginEmailOf(resident),
          department: department.trim(),
          departmentLabel: departmentLabelOf(department),
          position: position.trim(),
          isActive: true,
        },
        ...assignments,
      ]

      return { ok: true, message: "Staff assigned successfully." }
    },

    /** Editing is restricted to the department and the position. */
    update(
      id: number,
      department: string,
      position: string,
    ): { ok: boolean; message: string; field?: string } {
      const current = assignments.find((assignment) => assignment.id === id)
      if (!current) return { ok: false, message: "That assignment no longer exists." }

      if (clash(current.residentId, department, id))
        return {
          ok: false,
          field: "department",
          message: "This resident is already assigned to this role. Edit the existing staff assignment instead.",
        }

      assignments = assignments.map((assignment) =>
        assignment.id === id
          ? {
              ...assignment,
              department: department.trim(),
              departmentLabel: departmentLabelOf(department),
              position: position.trim(),
            }
          : assignment,
      )

      return { ok: true, message: "Staff assignment updated." }
    },

    /**
     * One-way: the backend has no reactivate route, flashes nothing the page
     * shows, and writes no audit row. It reports whether the revoked assignment
     * was the one granting this session its own admin role.
     */
    deactivate(id: number): { ok: boolean; selfAccessRevoked: boolean } {
      const current = assignments.find((assignment) => assignment.id === id)
      if (!current || !current.isActive) return { ok: false, selfAccessRevoked: false }

      assignments = assignments.map((assignment) =>
        assignment.id === id ? { ...assignment, isActive: false } : assignment,
      )

      return { ok: true, selfAccessRevoked: current.department === "admin" && current.isActive }
    },
  }
}

export const staffAssignments = createStaffStore()
