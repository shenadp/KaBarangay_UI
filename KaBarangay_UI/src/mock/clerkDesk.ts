/**
 * Clerk desk mock data.
 *
 * Shapes mirror the payloads of the Laravel backend `Clerk/AnnouncementController`
 * and the `Clerk/Announcements/*` Inertia pages, so the desk only has to supply
 * data and wording. Nothing here is fetched at runtime.
 */

import {
  createSectorDeskStore,
  type SectorAttendanceRecord,
  type SectorAttendanceMethod,
  type SectorAttendanceStatus,
  type SectorDeskStore,
  type SectorPost,
  type SectorResident,
} from "@/mock/sectorDesks"
import { seniorResidents } from "@/mock/senior"
import { pwdResidents } from "@/mock/pwd"

export const clerkTodayIso = "2026-10-28"

/** The staff member encoded at this desk — author of every clerk posting. */
export const clerkOfficer = "Elena R. Villamor"

/* ------------------------------------------------------------------ */
/* The barangay register                                               */
/* ------------------------------------------------------------------ */

/** Residents outside the two sector desks, so the clerk roster is not only members. */
const generalResidents: SectorResident[] = [
  { id: 201, residentNumber: "BSI-RES-000036", fullName: "Maria L. Santos", sex: "Female", purok: "Purok 1", status: "Active", hasQr: true, sectors: ["Regular"], address: "12 Mabini Street, Purok 1", mobile: "0917 412 8830" },
  { id: 202, residentNumber: "BSI-RES-000037", fullName: "Juan D. Dela Cruz", sex: "Male", purok: "Purok 2", status: "Active", hasQr: true, sectors: ["Regular"], address: "5 Bonifacio Street, Purok 2", mobile: "0918 220 7741" },
  { id: 203, residentNumber: "BSI-RES-000038", fullName: "Ana P. Reyes", sex: "Female", purok: "Purok 3", status: "Pending", hasQr: false, sectors: ["Regular"], address: "88 Rafael Street, Purok 3", mobile: "0906 331 9012" },
  { id: 204, residentNumber: "BSI-RES-000039", fullName: "Liza M. Mendoza", sex: "Female", purok: "Purok 4", status: "Active", hasQr: true, sectors: ["Solo Parent"], address: "31 Kalentong Road, Purok 4", mobile: "0977 110 2244" },
  { id: 205, residentNumber: "BSI-RES-000040", fullName: "Miguel A. Ferrer", sex: "Male", purok: "Purok 6", status: "Active", hasQr: true, sectors: ["Youth"], address: "9 Insurgentes Street, Purok 6", mobile: "0935 228 6610" },
  { id: 206, residentNumber: "BSI-RES-000041", fullName: "Christine B. Aguilar", sex: "Female", purok: "Purok 5", status: "Inactive", hasQr: false, sectors: ["Regular"], address: "27 Santo Niño Street, Purok 5", mobile: "0956 442 8890" },
]

/**
 * One register, three desks. The sector rosters keep their own ids, so the
 * clerk pool offsets the PWD rows to keep every resident addressable by a
 * single id on the attendance sheet.
 */
export const clerkResidents: SectorResident[] = [
  ...seniorResidents,
  ...pwdResidents.map((resident) => ({ ...resident, id: resident.id + 100 })),
  ...generalResidents,
]

/** Everyone with an active record — the roster the QR sheet validates against. */
export function clerkAttendancePool(): SectorResident[] {
  return clerkResidents.filter((resident) => resident.status === "Active")
}

/* ------------------------------------------------------------------ */
/* Announcements, updates and programs                                 */
/* ------------------------------------------------------------------ */

/** The categories offered on the clerk boards. */
export type ClerkAnnouncementCategory =
  | "General"
  | "Event"
  | "Relief Goods"
  | "Cash Assistance"
  | "Meeting"

export const clerkCategoryOptions: ClerkAnnouncementCategory[] = [
  "General",
  "Event",
  "Relief Goods",
  "Cash Assistance",
  "Meeting",
]

export const clerkCategoryLabels: Record<string, string> = {
  General: "General",
  Event: "Event",
  "Relief Goods": "Relief Goods",
  "Cash Assistance": "Cash Assistance",
  Meeting: "Meeting",
}

/** The audience choices the clerk picks from — sectors cannot offer this. */
export const clerkAudienceOptions = [
  { value: "All Residents", label: "All Residents" },
  { value: "Senior Citizens", label: "Senior Citizens" },
  { value: "PWD", label: "Persons with Disability" },
]

export const clerkPosts: SectorPost[] = [
  {
    id: 1,
    kind: "auto",
    title: "Bayanihan cleanup drive moved to Saturday",
    content:
      "Ang scheduled na bayanihan cleanup drive ay ilipat sa Sabado, Nobyembre 1, 6:00 AM. Magdala ng walis, shovel at garbage bag. Kaawa-awa po ang lahat ng purok na mag-represent.",
    type: "informational",
    category: "General",
    importance: "high",
    audience: "All Residents",
    approvalStatus: "pending",
    requiresAttendance: false,
    createdAt: "2026-10-27",
    author: clerkOfficer,
  },
  {
    id: 2,
    kind: "auto",
    title: "Water interruption along Purok 3 main line",
    content:
      "Aba-abihan po ang supply ng tubig sa Purok 3 bukas, 9:00 AM hanggang 3:00 PM dahil sa pipeline repair ng local water district. Mag-imbak po ng sapat na tubig.",
    type: "informational",
    category: "General",
    importance: "urgent",
    audience: "All Residents",
    approvalStatus: "approved",
    requiresAttendance: false,
    createdAt: "2026-10-26",
    author: clerkOfficer,
  },
  {
    id: 3,
    kind: "auto",
    title: "Barangay General Assembly — Fourth Quarter",
    content:
      "Para sa po, inyong inaanyayahang dumalo sa Barangay General Assembly para sa ikaapat na markahan. Talakayin natin ang budget utilization, mga proyekto at programang isasagawa sa darating na taon.",
    type: "event",
    category: "Meeting",
    importance: "high",
    audience: "All Residents",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-11-02",
    eventTime: "08:00 AM",
    location: "Barangay Hall Covered Court",
    requiresAttendance: true,
    createdAt: "2026-10-24",
    author: clerkOfficer,
  },
  {
    id: 4,
    kind: "auto",
    title: "Ayuda distribution — Batch 5",
    content:
      "Ipamimpo po ang Batch 5 ng barangay ayuda sa mga nahalal na beneficiary. Dalhin po ang inyong QR card at valid ID para sa mabilisang pag-release.",
    type: "event",
    category: "Relief Goods",
    importance: "normal",
    audience: "All Residents",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-10-31",
    eventTime: "09:00 AM",
    location: "Barangay Health Center",
    requiresAttendance: true,
    createdAt: "2026-10-22",
    author: clerkOfficer,
  },
  {
    id: 5,
    kind: "auto",
    title: "Revised garbage collection schedule",
    content:
      "Bagong iskedyul po ng pagapulot ng basura: Tuwing Martes at Biyernes, galing 8:00 AM. Ilagay po ang mga sako sa labas ng bahay bago ang 7:00 AM.",
    type: "informational",
    category: "General",
    importance: "normal",
    audience: "All Residents",
    approvalStatus: "rejected",
    rejectionReason:
      "Kulang sa barangay capitol endorsement — pakisulatan muli kasama ang permit number.",
    requiresAttendance: false,
    createdAt: "2026-10-20",
    author: clerkOfficer,
  },
  {
    id: 6,
    kind: "auto",
    title: "Holiday clearance counters open until 4:00 PM",
    content:
      "Sa panahon ng holiday, bukas po ang clearance counter mula 8:00 AM hanggang 4:00 PM. Prioritize po natin ang senior citizens at PWD holders.",
    type: "informational",
    category: "General",
    importance: "low",
    audience: "All Residents",
    approvalStatus: "pending",
    requiresAttendance: false,
    createdAt: "2026-10-19",
    author: "Arnel M. Balagtas",
  },
  {
    id: 7,
    kind: "update",
    title: "Barangay clearance processing now open on Saturdays",
    content:
      "Dagdag oras po: bukas ang counter ng barangay clearance tuwing Sabado, 8:00 AM hanggang 12:00 NN. Libre ang first copy para sa duly registered residents.",
    type: "informational",
    category: "General",
    importance: "normal",
    audience: "All Residents",
    approvalStatus: "approved",
    requiresAttendance: false,
    createdAt: "2026-10-27",
    author: clerkOfficer,
  },
  {
    id: 8,
    kind: "update",
    title: "Resident portal maintenance — Sunday 2:00 to 5:00 AM",
    content:
      "Magkakaroon po ng maintenance ang resident portal Linggo, 2:00 hanggang 5:00 AM. Panandaling hindi makapag-log in o makapag-submit ng application.",
    type: "informational",
    category: "General",
    importance: "high",
    audience: "All Residents",
    approvalStatus: "approved",
    requiresAttendance: false,
    createdAt: "2026-10-25",
    author: clerkOfficer,
  },
  {
    id: 9,
    kind: "program",
    title: "Senior citizen pension payout day",
    content:
      "Release po ng ikaapat na markahang social pension para sa rehistradong senior citizens. Dalhin po ang OSCA ID at QR card. Unahan po ang mga 80 taong gulang pataas.",
    type: "event",
    category: "Cash Assistance",
    importance: "high",
    audience: "Senior Citizens",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-10-30",
    eventTime: "08:30 AM",
    location: "Barangay Hall Multifunction Room",
    requiresAttendance: true,
    createdAt: "2026-10-21",
    author: clerkOfficer,
  },
  {
    id: 10,
    kind: "program",
    title: "Skills training: bread-making livelihood batch 2",
    content:
      "Libreng training sa pan de sal at ensaymada na may kasamang starter kit at certificate of completion. Limitado lang sa 30 kalahok.",
    type: "event",
    category: "Event",
    importance: "normal",
    audience: "All Residents",
    approvalStatus: "approved",
    programStatus: "draft",
    eventDate: "2026-11-14",
    eventTime: "01:00 PM",
    location: "Barangay Hall Kitchen Annex",
    requiresAttendance: true,
    createdAt: "2026-10-18",
    author: clerkOfficer,
  },
  {
    id: 11,
    kind: "program",
    title: "Youth sports league opening day",
    content:
      "Pormal na pagbubukas ng barangay youth sports league — basketball at badminton. Sumali po ang mga purok team.",
    type: "event",
    category: "Event",
    importance: "normal",
    audience: "All Residents",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-10-18",
    eventTime: "07:30 AM",
    location: "Covered Court, Barangay San Isidro",
    requiresAttendance: true,
    completedAt: "2026-10-18",
    createdAt: "2026-10-10",
    author: clerkOfficer,
  },
  {
    id: 12,
    kind: "program",
    title: "PWD aid distribution — Batch 4",
    content:
      "Pagpapalagay po ng tulong pinansyal at assistive devices para sa rehistradong PWD. Kailangan po ang PWD ID at QR card sa pag-abot.",
    type: "event",
    category: "Relief Goods",
    importance: "urgent",
    audience: "PWD",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-11-05",
    eventTime: "09:00 AM",
    location: "Barangay Health Center",
    requiresAttendance: true,
    createdAt: "2026-10-23",
    author: clerkOfficer,
  },
  {
    id: 13,
    kind: "update",
    title: "Anti-rabies vaccination drive — batch 1 closed",
    content:
      "Tapos na po ang unang batch ng libreng bakuna laban sa rabies. Salamat po sa 312 na panginoon ng mga alaga. Ang susunod na batch ay sa Disyembre pa — abangan po ang karagdagang anunsyo.",
    type: "informational",
    category: "Health",
    importance: "normal",
    audience: "All Residents",
    approvalStatus: "approved",
    requiresAttendance: false,
    completedAt: "2026-10-15",
    createdAt: "2026-10-09",
    author: clerkOfficer,
  },
]

/* ------------------------------------------------------------------ */
/* Attendance sheets                                                   */
/* ------------------------------------------------------------------ */

let recordSequence = 0

function attendanceRecord(
  residentNumber: string,
  status: SectorAttendanceStatus,
  method: SectorAttendanceMethod,
  loggedAt: string,
): SectorAttendanceRecord | null {
  const resident = clerkResidents.find((entry) => entry.residentNumber === residentNumber)
  if (!resident) return null
  recordSequence += 1
  return {
    id: recordSequence,
    residentId: resident.id,
    residentNumber: resident.residentNumber,
    fullName: resident.fullName,
    status,
    method,
    loggedAt,
  }
}

/** Seeded sheets, newest first — the same rows the QR scan panel appends to. */
function seed(rows: (SectorAttendanceRecord | null)[]): SectorAttendanceRecord[] {
  return rows.filter((row): row is SectorAttendanceRecord => row !== null)
}

export const clerkAttendanceSeed: Record<number, SectorAttendanceRecord[]> = {
  9: seed([
    attendanceRecord("BSI-RES-000001", "present", "qr_scanner", "08:21 AM"),
    attendanceRecord("BSI-RES-000003", "present", "manual", "08:29 AM"),
    attendanceRecord("BSI-RES-000009", "present", "qr_scanner", "08:37 AM"),
    attendanceRecord("BSI-RES-000001", "claimed", "qr_scanner", "08:44 AM"),
    attendanceRecord("BSI-RES-000003", "claimed", "manual", "08:51 AM"),
  ]),
  12: seed([
    attendanceRecord("BSI-RES-000024", "present", "qr_scanner", "09:05 AM"),
    attendanceRecord("BSI-RES-000031", "present", "qr_scanner", "09:12 AM"),
    attendanceRecord("BSI-RES-000021", "claimed", "manual", "09:26 AM"),
  ]),
}

/* ------------------------------------------------------------------ */
/* Session store                                                       */
/* ------------------------------------------------------------------ */

/**
 * The clerk has no membership queue of its own, so the applications list stays
 * empty and the store carries only the boards and the attendance sheets.
 */
export const clerkStore: SectorDeskStore = createSectorDeskStore({
  applications: [],
  posts: clerkPosts,
  attendance: clerkAttendanceSeed,
  trackingPrefix: "CLERK-2026",
})
