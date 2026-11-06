/**
 * Page-level mock data for the four sector desks (clerk, senior, PWD, lupon).
 *
 * Everything here belongs to the sector portal UI — `src/mock/data.ts` stays
 * untouched so the backend integration only has to swap one of the two files.
 * Shapes mirror the payloads described in `docs/UI-PATTERNS.md`.
 */

import type { SectorKey } from "@/config/navigation"

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

/** "2026-10-12" → "Oct 12, 2026" (parsed manually so no timezone shifts happen). */
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return iso
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

/** The desk officer credited as the author of anything posted from a sector portal. */
export const sectorStaff: Record<SectorKey, string> = {
  clerk: "Elena R. Villamor",
  senior: "Rogelio S. Panganiban",
  pwd: "Armando V. Ledesma",
  lupon: "Felix M. Aquino",
}

/** Default audience of the "New announcement" dialog per desk. */
export const sectorAudience: Record<SectorKey, "All residents" | "Senior Citizens" | "PWD" | "Barangay officials"> =
  {
    clerk: "All residents",
    senior: "Senior Citizens",
    pwd: "PWD",
    lupon: "Barangay officials",
  }

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export type ActivityItem = {
  id: number
  title: string
  meta: string
  time: string
  status: string
}

export type TodoItem = {
  id: number
  label: string
  due: string
}

export type SeriesPoint = { label: string; value: number }

export const recentActivity: Record<SectorKey, ActivityItem[]> = {
  clerk: [
    { id: 1, title: "Certificate CR-2026-0142 approved", meta: "Barangay Clearance · Maria L. Santos", time: "Today, 8:47 AM", status: "Approved" },
    { id: 2, title: "Registration approved", meta: "Milagros A. Perez · Purok 4", time: "Today, 8:12 AM", status: "Approved" },
    { id: 3, title: "Announcement published", meta: "Barangay clean-up drive", time: "Yesterday, 5:02 PM", status: "Published" },
    { id: 4, title: "Certificate released", meta: "CR-2026-0138 · Liza M. Mendoza", time: "Oct 20, 2026", status: "Released" },
    { id: 5, title: "Registration rejected", meta: "Arnel P. Dizon · valid ID not submitted", time: "Oct 21, 2026", status: "Rejected" },
  ],
  senior: [
    { id: 1, title: "Pension pay-out completed", meta: "Batch 3 · 42 seniors · ₱210,000 released", time: "Today, 9:20 AM", status: "Released" },
    { id: 2, title: "Attendance recorded", meta: "Quarterly assembly · 84 of 96 expected", time: "Oct 12, 2026", status: "Complete" },
    { id: 3, title: "Senior registered", meta: "Divina R. Lopez · Purok 2", time: "Oct 9, 2026", status: "Verified" },
    { id: 4, title: "Medical mission slot confirmed", meta: "Santa Rosa Health Center · Nov 5, 2026", time: "Oct 8, 2026", status: "Scheduled" },
    { id: 5, title: "12 senior IDs released", meta: "Claimed at the barangay hall lobby", time: "Oct 6, 2026", status: "Released" },
  ],
  pwd: [
    { id: 1, title: "Assistive device issued", meta: "Wheelchair · Ana P. Reyes", time: "Today, 10:15 AM", status: "Released" },
    { id: 2, title: "Medical aid request approved", meta: "₱3,500 · Ernesto T. Bautista", time: "Yesterday, 3:18 PM", status: "Approved" },
    { id: 3, title: "Attendance recorded", meta: "Assistive device distribution · 41 of 48", time: "Oct 8, 2026", status: "Complete" },
    { id: 4, title: "PWD ID renewed", meta: "Nena B. Salazar · Purok 5", time: "Oct 7, 2026", status: "Approved" },
    { id: 5, title: "Medical aid request returned", meta: "Missing clinical abstract · Maricel V. Ilagan", time: "Oct 3, 2026", status: "Rejected" },
  ],
  lupon: [
    { id: 1, title: "BLT-2026-0085 marked settled", meta: "Stray animals damaging crops · Roberto C. Garcia", time: "Today, 8:31 AM", status: "Settled" },
    { id: 2, title: "Hearing scheduled", meta: "BLT-2026-0087 · Oct 28, 2026, 2:00 PM", time: "Yesterday, 4:40 PM", status: "Scheduled" },
    { id: 3, title: "Case escalated", meta: "BLT-2026-0084 · referred to the police station", time: "Oct 9, 2026", status: "Escalated" },
    { id: 4, title: "Mediation notes uploaded", meta: "BLT-2026-0088 · first mediation conference", time: "Oct 8, 2026", status: "Under Review" },
    { id: 5, title: "Settlement agreement signed", meta: "BLT-2026-0082 · both parties present", time: "Oct 5, 2026", status: "Settled" },
  ],
}

export const todos: Record<SectorKey, TodoItem[]> = {
  clerk: [
    { id: 1, label: "Release 6 certificates set for pick-up", due: "Before 5:00 PM" },
    { id: 2, label: "Encode 3 pending resident registrations", due: "Today" },
    { id: 3, label: "Print the agenda for the kagawad session", due: "Oct 15, 2026" },
    { id: 4, label: "Follow up 4 requests with missing requirements", due: "Today" },
    { id: 5, label: "Forward the October report to the barangay secretary", due: "Oct 31, 2026" },
  ],
  senior: [
    { id: 1, label: "Finalise the batch 4 pension pay-out list", due: "Oct 29, 2026" },
    { id: 2, label: "Confirm the venue for the quarterly assembly", due: "Today" },
    { id: 3, label: "Submit DISC forms for 6 newly registered seniors", due: "This week" },
    { id: 4, label: "Call 12 seniors with unclaimed senior IDs", due: "Today" },
    { id: 5, label: "Coordinate the medical mission with the health center", due: "Nov 5, 2026" },
  ],
  pwd: [
    { id: 1, label: "Validate 4 medical aid requests", due: "Today" },
    { id: 2, label: "Coordinate the pickup of 8 hearing aids", due: "Oct 27, 2026" },
    { id: 3, label: "Update the assistive device inventory sheet", due: "This week" },
    { id: 4, label: "Send the assembly reminder to 48 PWD members", due: "Today" },
    { id: 5, label: "Encode renewal details for 3 PWD IDs", due: "Oct 28, 2026" },
  ],
  lupon: [
    { id: 1, label: "Prepare mediation notes for BLT-2026-0088", due: "Oct 25, 2026" },
    { id: 2, label: "Confirm the parties for the Oct 27 hearing", due: "Today" },
    { id: 3, label: "Draft the settlement agreement for BLT-2026-0085", due: "This week" },
    { id: 4, label: "Review the supporting documents of BLT-2026-0086", due: "Oct 26, 2026" },
    { id: 5, label: "File the year-end case inventory", due: "Dec 4, 2026" },
  ],
}

export const monthlyActivity: Record<SectorKey, SeriesPoint[]> = {
  clerk: [
    { label: "Jun", value: 62 },
    { label: "Jul", value: 74 },
    { label: "Aug", value: 69 },
    { label: "Sep", value: 88 },
    { label: "Oct", value: 76 },
  ],
  senior: [
    { label: "Jun", value: 71 },
    { label: "Jul", value: 64 },
    { label: "Aug", value: 79 },
    { label: "Sep", value: 73 },
    { label: "Oct", value: 84 },
  ],
  pwd: [
    { label: "Jun", value: 24 },
    { label: "Jul", value: 31 },
    { label: "Aug", value: 27 },
    { label: "Sep", value: 38 },
    { label: "Oct", value: 41 },
  ],
  lupon: [
    { label: "Jun", value: 5 },
    { label: "Jul", value: 7 },
    { label: "Aug", value: 4 },
    { label: "Sep", value: 6 },
    { label: "Oct", value: 8 },
  ],
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export type AnnouncementAudience =
  | "All residents"
  | "Senior Citizens"
  | "PWD"
  | "Youth"
  | "Barangay officials"

export type AnnouncementKind = "announcement" | "update" | "program"

export type SectorAnnouncement = {
  id: number
  /** Which board the entry belongs to: Announcements, Updates or Programs. */
  kind: AnnouncementKind
  title: string
  summary: string
  body: string
  audience: AnnouncementAudience
  /** ISO date, formatted for display with `formatIsoDate`. */
  date: string
  venue: string
  status: "Published" | "Pending" | "Draft" | "Scheduled"
  author: string
  /** Expected attendees — 0 means still to be confirmed. */
  expected: number
  requiresAttendance: boolean
  sectors: SectorKey[]
}

export const sectorAnnouncements: SectorAnnouncement[] = [
  {
    id: 1,
    kind: "announcement",
    title: "Barangay general assembly",
    summary: "Fourth quarter assembly: 2027 development fund, health programs and disaster preparedness.",
    body: "All residents are invited to the fourth quarter general assembly. The agenda covers the proposed 2027 barangay development fund, the free health and vaccination calendar, and the typhoon season preparedness plan. Please bring your barangay ID and arrive at least fifteen minutes early so the attendance sheet can be encoded.",
    audience: "All residents",
    date: "2026-10-11",
    venue: "Covered Court, Barangay San Isidro",
    status: "Published",
    author: "Barangay Secretary",
    expected: 400,
    requiresAttendance: true,
    sectors: ["clerk", "senior", "pwd", "lupon"],
  },
  {
    id: 2,
    kind: "program",
    title: "Senior citizens quarterly assembly",
    summary: "Pension release, medical mission schedule and DISC updates for the fourth quarter.",
    body: "The senior citizens quarterly assembly will review the batch 3 pension release, the November 5 medical mission at the Santa Rosa Health Center, and the updated Directory of Information and Services for Community. Attendance will be recorded at the door; representatives of absent members may claim their certificates on their behalf.",
    audience: "Senior Citizens",
    date: "2026-10-12",
    venue: "Barangay Hall Session Hall",
    status: "Published",
    author: "Senior Citizens Desk",
    expected: 96,
    requiresAttendance: true,
    sectors: ["clerk", "senior"],
  },
  {
    id: 3,
    kind: "update",
    title: "Pension pay-out, batch 3",
    summary: "Release of the October pension to registered senior citizens of San Isidro.",
    body: "Batch 3 of the monthly pension will be released at the health center multipurpose room. Bring your senior citizen ID and the claim stub issued during the last assembly. Authorised representatives must present a signed authorisation together with their own valid ID.",
    audience: "Senior Citizens",
    date: "2026-10-29",
    venue: "Health Center Multipurpose Room",
    status: "Published",
    author: "Senior Citizens Desk",
    expected: 120,
    requiresAttendance: true,
    sectors: ["senior"],
  },
  {
    id: 4,
    kind: "announcement",
    title: "Free eye check-up for seniors",
    summary: "Cataract screening and free reading glasses in partnership with the city health office.",
    body: "The city health office will conduct a free eye check-up for registered senior citizens. Screening, reading glasses and referral letters for cataract operation are offered at no cost. Slots are limited to eighty seniors and will be assigned by purok.",
    audience: "Senior Citizens",
    date: "2026-11-05",
    venue: "Santa Rosa Health Center",
    status: "Pending",
    author: "Senior Citizens Desk",
    expected: 80,
    requiresAttendance: false,
    sectors: ["senior"],
  },
  {
    id: 5,
    kind: "program",
    title: "PWD assistive device distribution",
    summary: "Claiming of wheelchairs, walkers and hearing aids at the health center.",
    body: "Assistive devices procured for this quarter will be released to beneficiaries on a first-come, first-served basis. Bring your PWD ID and the claim slip issued by the PWD desk. Devices not claimed within seven days will be reissued to the next beneficiary on the waiting list.",
    audience: "PWD",
    date: "2026-10-08",
    venue: "Barangay Health Center",
    status: "Published",
    author: "PWD Desk",
    expected: 41,
    requiresAttendance: true,
    sectors: ["clerk", "pwd"],
  },
  {
    id: 6,
    kind: "update",
    title: "PWD medical aid cut-off",
    summary: "Last day to submit requests for the November medical assistance release.",
    body: "Requests submitted after the cut-off will be scheduled for the December release. Attach the clinical abstract, prescription and the barangay assessment form. Incomplete submissions will be returned through the assigned purok health worker.",
    audience: "PWD",
    date: "2026-10-30",
    venue: "Barangay Hall Records Section",
    status: "Draft",
    author: "PWD Desk",
    expected: 60,
    requiresAttendance: false,
    sectors: ["pwd"],
  },
  {
    id: 7,
    kind: "announcement",
    title: "Accessibility ramp installation briefing",
    summary: "Residents and households requesting a ramp may attend the assessment briefing.",
    body: "The barangay will start installing concrete ramps for households with bedridden or wheelchair-bound members. Attend the briefing to have your household assessed and to sign the consent form for the right-of-way along your property frontage.",
    audience: "PWD",
    date: "2026-11-12",
    venue: "Covered Court",
    status: "Pending",
    author: "PWD Desk",
    expected: 35,
    requiresAttendance: false,
    sectors: ["pwd"],
  },
  {
    id: 8,
    kind: "program",
    title: "Dispute mediation week",
    summary: "Walk-in conciliation for pending and referred disputes at the Lupon room.",
    body: "The Lupon Tagapamayapa will accept walk-in requests for conciliation throughout the week. Parties to a pending case should bring any supporting evidence and their proposed settlement terms. Mediation is voluntary and free of charge.",
    audience: "All residents",
    date: "2026-10-26",
    venue: "Lupon Room, Barangay Hall",
    status: "Published",
    author: "Lupon Tagapamayapa",
    expected: 30,
    requiresAttendance: true,
    sectors: ["clerk", "lupon"],
  },
  {
    id: 9,
    kind: "program",
    title: "Mediation skills training for kagawads",
    summary: "Two-day capacitation on the Katarungang Pambarangay law and negotiation techniques.",
    body: "All barangay officials are required to attend the two-day capacitation on the Katarungang Pambarangay law, settlement drafting and de-escalation techniques. The session is facilitated by the municipal legal office.",
    audience: "Barangay officials",
    date: "2026-11-03",
    venue: "Municipal Hall Session Hall",
    status: "Pending",
    author: "Lupon Tagapamayapa",
    expected: 21,
    requiresAttendance: false,
    sectors: ["lupon"],
  },
  {
    id: 10,
    kind: "announcement",
    title: "Kagawad session: budget deliberation",
    summary: "Special session on the 2027 barangay development fund.",
    body: "A special session of the Sangguniang Barangay will deliberate on the proposed 2027 barangay development fund, including the road concreting projects in Purok 4 and Purok 6. Committee reports are due before the session begins.",
    audience: "Barangay officials",
    date: "2026-10-15",
    venue: "Barangay Hall Session Hall",
    status: "Scheduled",
    author: "Barangay Secretary",
    expected: 15,
    requiresAttendance: false,
    sectors: ["clerk", "lupon"],
  },
  {
    id: 11,
    kind: "program",
    title: "Barangay clean-up drive",
    summary: "Weekly clean-up along Riverside Road. Volunteers are welcome at the covered court.",
    body: "Volunteers will gather at the covered court at 6:00 AM for the weekly clean-up along Riverside Road. Gloves, sacks and collection tools will be provided by the barangay. Participants are encouraged to bring drinking water.",
    audience: "All residents",
    date: "2026-10-10",
    venue: "Riverside Road, Purok 3",
    status: "Published",
    author: "Hon. Roberto M. Villanueva",
    expected: 132,
    requiresAttendance: true,
    sectors: ["clerk"],
  },
  {
    id: 12,
    kind: "update",
    title: "Scholarship application window",
    summary: "Municipal scholarship applications close on November 15.",
    body: "The municipal scholarship office will accept applications until November 15. Requirements include the certificate of registration, barangay clearance and a certification of good moral character. Endorsements are issued by the barangay clerk.",
    audience: "Youth",
    date: "2026-10-20",
    venue: "Barangay Hall Records Section",
    status: "Draft",
    author: "Barangay Secretary",
    expected: 60,
    requiresAttendance: false,
    sectors: ["clerk"],
  },
  {
    id: 13,
    kind: "update",
    title: "Senior ID claiming",
    summary: "Newly printed senior citizen IDs are ready for claiming at the barangay hall lobby.",
    body: "Forty newly printed senior citizen IDs are ready for release. Claim in person and present any valid ID; authorised representatives may claim on behalf of a member with a signed authorisation letter and a photocopy of the member's ID.",
    audience: "Senior Citizens",
    date: "2026-10-23",
    venue: "Barangay Hall Lobby",
    status: "Published",
    author: "Senior Citizens Desk",
    expected: 24,
    requiresAttendance: true,
    sectors: ["senior"],
  },
  {
    id: 14,
    kind: "update",
    title: "PWD ID renewals",
    summary: "Renewal and printing of expiring PWD identification cards.",
    body: "PWD IDs expiring this quarter may be renewed at the records section. Bring the old ID, one 1×1 photo and the updated medical certificate. Renewals are printed on site and released within the same week.",
    audience: "PWD",
    date: "2026-10-27",
    venue: "Barangay Hall Records Section",
    status: "Published",
    author: "PWD Desk",
    expected: 30,
    requiresAttendance: true,
    sectors: ["pwd"],
  },
  {
    id: 15,
    kind: "announcement",
    title: "Lupon year-end case review",
    summary: "Inventory of all cases handled for the year and preparation of the annual report.",
    body: "The Lupon will conduct its year-end review of all cases filed for the calendar year. Each member is asked to bring the complete case folder, settlement drafts and attendance sheets so the annual report can be finalised.",
    audience: "Barangay officials",
    date: "2026-12-04",
    venue: "Lupon Room, Barangay Hall",
    status: "Draft",
    author: "Lupon Tagapamayapa",
    expected: 12,
    requiresAttendance: false,
    sectors: ["lupon"],
  },
  {
    id: 16,
    kind: "update",
    title: "Extended hours for certificate requests",
    summary: "The barangay hall window will stay open until 7:00 PM on Thursdays this October.",
    body: "To clear the backlog of certificate requests, the barangay clerk's window will operate extended hours every Thursday of October. Only encoding and claiming will be accommodated after 5:00 PM.",
    audience: "All residents",
    date: "2026-10-26",
    venue: "Barangay Hall Records Section",
    status: "Pending",
    author: "Barangay Clerk",
    expected: 150,
    requiresAttendance: false,
    sectors: ["clerk"],
  },
  {
    id: 17,
    kind: "program",
    title: "Senior Christmas fellowship",
    summary: "Year-end fellowship and recognition of outstanding senior volunteers.",
    body: "The senior citizens' year-end fellowship will honour members who served as barangay health workers and litter marshals this year. A simple program and sharing of meals will follow the recognition ceremony.",
    audience: "Senior Citizens",
    date: "2026-12-18",
    venue: "Covered Court",
    status: "Draft",
    author: "Senior Citizens Desk",
    expected: 150,
    requiresAttendance: false,
    sectors: ["senior"],
  },
]

/**
 * Announcements visible on a given sector desk, optionally narrowed to one or
 * more boards. The desk's Announcements board lists notices **and** updates
 * together (`["announcement", "update"]`); Programs stays its own board.
 */
export function announcementsFor(
  sector: SectorKey,
  kind?: AnnouncementKind | AnnouncementKind[],
): SectorAnnouncement[] {
  const kinds = kind === undefined ? null : Array.isArray(kind) ? kind : [kind]
  return sectorAnnouncements.filter(
    (item) => item.sectors.includes(sector) && (kinds === null || kinds.includes(item.kind)),
  )
}

/* ------------------------------------------------------------------ */
/* Attendance rosters                                                  */
/* ------------------------------------------------------------------ */

export type AttendanceStatus = "Present" | "Absent" | "Excused"

export type AttendanceRow = {
  residentNo: string
  name: string
  purok: string
  sector: string
  arrivedAt: string | null
  status: AttendanceStatus
}

export const rosters: Record<SectorKey, AttendanceRow[]> = {
  clerk: [
    { residentNo: "RES-2026-04182", name: "Maria L. Santos", purok: "Purok 1", sector: "Regular", arrivedAt: "8:02 AM", status: "Present" },
    { residentNo: "RES-2026-04183", name: "Juan D. Dela Cruz", purok: "Purok 2", sector: "Regular", arrivedAt: "8:05 AM", status: "Present" },
    { residentNo: "RES-2026-04184", name: "Ana P. Reyes", purok: "Purok 3", sector: "PWD", arrivedAt: "8:11 AM", status: "Present" },
    { residentNo: "RES-2026-04185", name: "Pedro S. Ramos", purok: "Purok 1", sector: "Senior Citizen", arrivedAt: "8:14 AM", status: "Present" },
    { residentNo: "RES-2026-04186", name: "Liza M. Mendoza", purok: "Purok 4", sector: "Regular", arrivedAt: null, status: "Absent" },
    { residentNo: "RES-2026-04187", name: "Roberto C. Garcia", purok: "Purok 2", sector: "Senior Citizen", arrivedAt: null, status: "Excused" },
    { residentNo: "RES-2026-04190", name: "Grace V. Navarro", purok: "Purok 4", sector: "Solo Parent", arrivedAt: "8:20 AM", status: "Present" },
    { residentNo: "RES-2026-04193", name: "Marites F. Ocampo", purok: "Purok 2", sector: "Regular", arrivedAt: null, status: "Absent" },
    { residentNo: "RES-2026-04198", name: "Carlo M. Ignacio", purok: "Purok 1", sector: "Regular", arrivedAt: "8:26 AM", status: "Present" },
  ],
  senior: [
    { residentNo: "RES-2026-04185", name: "Pedro S. Ramos", purok: "Purok 1", sector: "Senior Citizen", arrivedAt: "8:03 AM", status: "Present" },
    { residentNo: "RES-2026-04187", name: "Roberto C. Garcia", purok: "Purok 2", sector: "Senior Citizen", arrivedAt: "8:06 AM", status: "Present" },
    { residentNo: "RES-2026-04192", name: "Teresa L. Pascual", purok: "Purok 1", sector: "Senior Citizen", arrivedAt: "8:09 AM", status: "Present" },
    { residentNo: "RES-2026-04195", name: "Ramon E. Villareal", purok: "Purok 3", sector: "Senior Citizen", arrivedAt: "8:12 AM", status: "Present" },
    { residentNo: "RES-2026-04197", name: "Alfredo D. Sandoval", purok: "Purok 4", sector: "Senior Citizen", arrivedAt: null, status: "Absent" },
    { residentNo: "RES-2026-04200", name: "Divina R. Lopez", purok: "Purok 2", sector: "Senior Citizen", arrivedAt: "8:17 AM", status: "Present" },
    { residentNo: "RES-2026-04203", name: "Milagros A. Perez", purok: "Purok 4", sector: "Senior Citizen", arrivedAt: null, status: "Excused" },
    { residentNo: "RES-2026-04206", name: "Ester P. Guerrero", purok: "Purok 6", sector: "Senior Citizen", arrivedAt: "8:22 AM", status: "Present" },
  ],
  pwd: [
    { residentNo: "RES-2026-04184", name: "Ana P. Reyes", purok: "Purok 3", sector: "PWD", arrivedAt: "9:01 AM", status: "Present" },
    { residentNo: "RES-2026-04189", name: "Ernesto T. Bautista", purok: "Purok 3", sector: "PWD", arrivedAt: "9:04 AM", status: "Present" },
    { residentNo: "RES-2026-04196", name: "Nena B. Salazar", purok: "Purok 5", sector: "PWD", arrivedAt: null, status: "Absent" },
    { residentNo: "RES-2026-04205", name: "Oliver P. Dimaculangan", purok: "Purok 2", sector: "PWD", arrivedAt: "9:07 AM", status: "Present" },
    { residentNo: "RES-2026-04207", name: "Maricel V. Ilagan", purok: "Purok 6", sector: "PWD", arrivedAt: "9:12 AM", status: "Present" },
    { residentNo: "RES-2026-04209", name: "Danilo P. Estrada", purok: "Purok 5", sector: "PWD", arrivedAt: null, status: "Excused" },
  ],
  lupon: [
    { residentNo: "RES-2026-04182", name: "Maria L. Santos", purok: "Purok 1", sector: "Regular", arrivedAt: "2:01 PM", status: "Present" },
    { residentNo: "RES-2026-04192", name: "Danilo R. Mercado", purok: "Purok 5", sector: "Regular", arrivedAt: "2:04 PM", status: "Present" },
    { residentNo: "RES-2026-04183", name: "Juan D. Dela Cruz", purok: "Purok 2", sector: "Regular", arrivedAt: "2:06 PM", status: "Present" },
    { residentNo: "RES-2026-04198", name: "Carlo M. Ignacio", purok: "Purok 1", sector: "Regular", arrivedAt: null, status: "Absent" },
    { residentNo: "RES-2026-04190", name: "Grace V. Navarro", purok: "Purok 4", sector: "Solo Parent", arrivedAt: "2:10 PM", status: "Present" },
    { residentNo: "RES-2026-04189", name: "Ernesto T. Bautista", purok: "Purok 3", sector: "PWD", arrivedAt: null, status: "Excused" },
  ],
}
