import type { Tone } from "@/components/StatusBadge"

import { barangay } from "@/mock/data"

/**
 * Page-local mock for the Lupon desk: cases, parties, hearings and settlements.
 * It mirrors the Katarungang Pambarangay workflow of the backend (complaint →
 * promotion → mediation → hearing → settlement / referral) but lives here so
 * `src/mock/data.ts` stays untouched.
 *
 * Dates are stored as ISO strings (`YYYY-MM-DD`) so the pages can compare them;
 * render them with `formatDate`.
 */

export type CaseStatus =
  | "Pending Promotion"
  | "Filed"
  | "For Mediation"
  | "For Hearing"
  | "Settled"
  | "Referred"

export type CaseParty = {
  id: string
  role: "Complainant" | "Respondent"
  name: string
  address: string
  contact: string
  counsel: string
}

export type HearingType = "Mediation" | "Hearing" | "Conciliation"
export type HearingStatus = "Scheduled" | "Completed" | "Cancelled"
export type Attendance =
  | "Awaiting parties"
  | "Both parties present"
  | "Complainant only"
  | "Respondent only"
  | "Both parties absent"
export type HearingOutcome = "Pending" | "Continued" | "Settled" | "Referred" | "Dismissed"

export type HearingRecord = {
  id: string
  hearingNo: number
  /** ISO date, `YYYY-MM-DD` */
  date: string
  time: string
  venue: string
  type: HearingType
  status: HearingStatus
  attendance: Attendance
  outcome: HearingOutcome
}

export type Settlement = {
  type: "Amicable Settlement" | "Conciliation Settlement" | "Arbitration Award"
  terms: string
  /** Amount in digits and commas, no peso sign — render with `formatPeso`. */
  amount: string
  /** ISO date of signing */
  signedOn: string
}

export type ActivityEntry = {
  id: string
  actor: string
  action: string
  time: string
}

export type LuponCase = {
  id: string
  /** `null` while the record is still an intake complaint awaiting promotion. */
  caseNumber: string | null
  complaintRef: string | null
  nature: string
  /** ISO date the dispute was filed */
  filed: string
  barangay: string
  purok: string
  venue: string
  description: string
  status: CaseStatus
  parties: CaseParty[]
  hearings: HearingRecord[]
  settlement: Settlement | null
  activity: ActivityEntry[]
}

export type FlatHearing = HearingRecord & {
  caseId: string
  caseNumber: string | null
  complaintRef: string | null
  complainant: string
  respondent: string
}

/** The desk's "today" — the mock pages are evaluated against this date. */
export const TODAY = "2026-10-28"

export const puroks = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"]

export const caseNatures = [
  "Property / Boundary Dispute",
  "Unpaid Debt or Loan",
  "Damage to Property",
  "Physical Injury",
  "Verbal Defamation",
  "Noise & Nuisance",
  "Rental & Lease Dispute",
  "Theft",
]

export const venues = [
  "Lupon Room, Barangay Hall",
  "Barangay Session Hall",
  "Office of the Punong Barangay",
  "Purok 2 Covered Court",
]

export const hearingTypes: HearingType[] = ["Mediation", "Hearing", "Conciliation"]

export const timeSlots = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
]

export const attendanceOptions: Attendance[] = [
  "Both parties present",
  "Complainant only",
  "Respondent only",
  "Both parties absent",
]

export const outcomeOptions: HearingOutcome[] = ["Continued", "Settled", "Referred", "Dismissed"]

export const settlementTypes: Settlement["type"][] = [
  "Amicable Settlement",
  "Conciliation Settlement",
  "Arbitration Award",
]

/** Badge colour per docket status — pending work reads amber, outcomes read their tone. */
export const caseTone: Record<CaseStatus, Tone> = {
  "Pending Promotion": "warning",
  Filed: "info",
  "For Mediation": "warning",
  "For Hearing": "warning",
  Settled: "success",
  Referred: "info",
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** `2026-10-09` → `Oct 9, 2026` */
export function formatDate(iso: string): string {
  const parts = iso.split("-").map(Number)
  if (parts.length !== 3 || parts.some((part) => !part)) return iso
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/** `2026-10-09` → `Oct 9` (month + day, for grouped lists). */
export function formatShortDate(iso: string): string {
  const parts = iso.split("-").map(Number)
  if (parts.length !== 3 || parts.some((part) => !part)) return iso
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** `2026-10-09` → `Oct 2026` */
export function formatMonth(iso: string): string {
  const parts = iso.split("-").map(Number)
  if (parts.length !== 3 || parts.some((part) => !part)) return iso
  const date = new Date(parts[0], parts[1] - 1, 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

/** Short month label used on charts: `2026-10-09` → `Oct`. */
export function monthLabel(iso: string): string {
  const parts = iso.split("-").map(Number)
  if (parts.length !== 3 || parts.some((part) => !part)) return iso
  const date = new Date(parts[0], parts[1] - 1, 1)
  return date.toLocaleDateString("en-US", { month: "short" })
}

/** Shift an ISO date by a number of days (positive or negative). */
export function addDays(iso: string, days: number): string {
  const parts = iso.split("-").map(Number)
  if (parts.length !== 3 || parts.some((part) => !part)) return iso
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/** `1200` → `₱1,200`; an empty amount renders as an em dash. */
export function formatPeso(amount: string): string {
  const digits = amount.replace(/,/g, "")
  if (!digits) return "—"
  return `₱${Number(digits).toLocaleString("en-PH")}`
}

/** ISO date of the next scheduled hearing, or `null` when nothing is booked. */
export function nextHearingDate(record: LuponCase): string | null {
  const scheduled = record.hearings
    .filter((hearing) => hearing.status === "Scheduled")
    .map((hearing) => hearing.date)
    .sort()
  return scheduled.length > 0 ? scheduled[0] : null
}

/** Flattens the docket into one list for the hearing calendar. */
export function flattenHearings(cases: LuponCase[]): FlatHearing[] {
  return cases.flatMap((record) => {
    const complainant = record.parties.find((party) => party.role === "Complainant")
    const respondent = record.parties.find((party) => party.role === "Respondent")
    return record.hearings.map((hearing) => ({
      ...hearing,
      caseId: record.id,
      caseNumber: record.caseNumber,
      complaintRef: record.complaintRef,
      complainant: complainant?.name ?? "—",
      respondent: respondent?.name ?? "—",
    }))
  })
}

/** Next free docket number, e.g. `KP-2026-015`. */
export function nextCaseNumber(cases: LuponCase[]): string {
  const numbers = cases
    .map((record) => record.caseNumber)
    .filter((number): number is string => number !== null)
    .map((number) => Number(number.split("-")[2]))
    .filter((number) => Number.isFinite(number))
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  return `KP-2026-${String(next).padStart(3, "0")}`
}

/* ------------------------------------------------------------------ */
/* Docket                                                              */
/* ------------------------------------------------------------------ */

export const luponCases: LuponCase[] = [
  {
    id: "case-014",
    caseNumber: "KP-2026-014",
    complaintRef: "BLT-2026-0088",
    nature: "Noise & Nuisance",
    filed: "2026-10-18",
    barangay: barangay.name,
    purok: "Purok 2",
    venue: "Lupon Room, Barangay Hall",
    description:
      "Complainant reports amplified videoke and gatherings past 10 PM on weekends from the respondent's residence along Riverside Road, disturbing the sleep of neighbouring households.",
    status: "For Mediation",
    parties: [
      {
        id: "pty-014-a",
        role: "Complainant",
        name: "Maria L. Santos",
        address: "42 Riverside Road, Purok 2",
        contact: "0917 412 8830",
        counsel: "—",
      },
      {
        id: "pty-014-b",
        role: "Respondent",
        name: "Danilo R. Mercado",
        address: "38 Riverside Road, Purok 2",
        contact: "0918 220 4417",
        counsel: "—",
      },
    ],
    hearings: [
      {
        id: "hr-014-1",
        hearingNo: 1,
        date: "2026-10-25",
        time: "2:00 PM",
        venue: "Lupon Room, Barangay Hall",
        type: "Mediation",
        status: "Completed",
        attendance: "Both parties present",
        outcome: "Continued",
      },
      {
        id: "hr-014-2",
        hearingNo: 2,
        date: "2026-11-10",
        time: "2:00 PM",
        venue: "Lupon Room, Barangay Hall",
        type: "Mediation",
        status: "Scheduled",
        attendance: "Awaiting parties",
        outcome: "Pending",
      },
    ],
    settlement: null,
    activity: [
      {
        id: "act-014-1",
        actor: "Felix M. Aquino",
        action: "Scheduled mediation hearing #2",
        time: "Oct 26, 2026 · 8:40 AM",
      },
      {
        id: "act-014-2",
        actor: "Felix M. Aquino",
        action: "Recorded hearing #1 outcome: continued",
        time: "Oct 25, 2026 · 4:15 PM",
      },
      {
        id: "act-014-3",
        actor: "Elena R. Villamor",
        action: "Promoted complaint BLT-2026-0088 to case KP-2026-014",
        time: "Oct 18, 2026 · 3:41 PM",
      },
    ],
  },
  {
    id: "case-013",
    caseNumber: "KP-2026-013",
    complaintRef: "BLT-2026-0087",
    nature: "Property / Boundary Dispute",
    filed: "2026-10-16",
    barangay: barangay.name,
    purok: "Purok 4",
    venue: "Barangay Session Hall",
    description:
      "Complainant claims the respondent's newly built wall encroaches 40 cm into the registered lot line. Both parties hold tax declarations dating back to 1998.",
    status: "For Hearing",
    parties: [
      {
        id: "pty-013-a",
        role: "Complainant",
        name: "Juan D. Dela Cruz",
        address: "17 Mabini Extension, Purok 4",
        contact: "0917 334 5521",
        counsel: "Atty. Rolando P. Mabini",
      },
      {
        id: "pty-013-b",
        role: "Respondent",
        name: "Carlo M. Ignacio",
        address: "19 Mabini Extension, Purok 4",
        contact: "0995 118 2043",
        counsel: "—",
      },
    ],
    hearings: [
      {
        id: "hr-013-1",
        hearingNo: 1,
        date: "2026-10-22",
        time: "3:00 PM",
        venue: "Lupon Room, Barangay Hall",
        type: "Mediation",
        status: "Completed",
        attendance: "Complainant only",
        outcome: "Referred",
      },
      {
        id: "hr-013-2",
        hearingNo: 2,
        date: "2026-10-30",
        time: "9:00 AM",
        venue: "Barangay Session Hall",
        type: "Hearing",
        status: "Scheduled",
        attendance: "Awaiting parties",
        outcome: "Pending",
      },
    ],
    settlement: null,
    activity: [
      {
        id: "act-013-1",
        actor: "Felix M. Aquino",
        action: "Set case for hearing after mediation stalled",
        time: "Oct 23, 2026 · 9:05 AM",
      },
      {
        id: "act-013-2",
        actor: "Felix M. Aquino",
        action: "Recorded hearing #1 outcome: referred for hearing",
        time: "Oct 22, 2026 · 5:02 PM",
      },
      {
        id: "act-013-3",
        actor: "Elena R. Villamor",
        action: "Promoted complaint BLT-2026-0087 to case KP-2026-013",
        time: "Oct 16, 2026 · 11:26 AM",
      },
    ],
  },
  {
    id: "case-012",
    caseNumber: "KP-2026-012",
    complaintRef: "BLT-2026-0086",
    nature: "Unpaid Debt or Loan",
    filed: "2026-10-14",
    barangay: barangay.name,
    purok: "Purok 1",
    venue: "Lupon Room, Barangay Hall",
    description:
      "Complainant seeks payment of an unpaid repair invoice of ₱8,500 acknowledged in writing by the respondent on 12 August 2026.",
    status: "For Mediation",
    parties: [
      {
        id: "pty-012-a",
        role: "Complainant",
        name: "Grace V. Navarro",
        address: "8 Bonifacio Street, Purok 1",
        contact: "0916 771 9082",
        counsel: "—",
      },
      {
        id: "pty-012-b",
        role: "Respondent",
        name: "Ernesto T. Bautista",
        address: "22 Rizal Street, Purok 3",
        contact: "0921 445 7710",
        counsel: "—",
      },
    ],
    hearings: [
      {
        id: "hr-012-1",
        hearingNo: 1,
        date: "2026-10-21",
        time: "10:00 AM",
        venue: "Lupon Room, Barangay Hall",
        type: "Mediation",
        status: "Completed",
        attendance: "Both parties present",
        outcome: "Continued",
      },
      {
        id: "hr-012-2",
        hearingNo: 2,
        date: "2026-11-05",
        time: "10:00 AM",
        venue: "Lupon Room, Barangay Hall",
        type: "Mediation",
        status: "Scheduled",
        attendance: "Awaiting parties",
        outcome: "Pending",
      },
    ],
    settlement: null,
    activity: [
      {
        id: "act-012-1",
        actor: "Felix M. Aquino",
        action: "Scheduled mediation hearing #2",
        time: "Oct 21, 2026 · 11:48 AM",
      },
      {
        id: "act-012-2",
        actor: "Elena R. Villamor",
        action: "Promoted complaint BLT-2026-0086 to case KP-2026-012",
        time: "Oct 14, 2026 · 2:12 PM",
      },
    ],
  },
  {
    id: "case-011",
    caseNumber: "KP-2026-011",
    complaintRef: "BLT-2026-0085",
    nature: "Damage to Property",
    filed: "2026-09-28",
    barangay: barangay.name,
    purok: "Purok 5",
    venue: "Lupon Room, Barangay Hall",
    description:
      "Stray animals from the respondent's compound damaged the complainant's vegetable plot and destroyed feed sacks worth ₱1,200.",
    status: "Settled",
    parties: [
      {
        id: "pty-011-a",
        role: "Complainant",
        name: "Roberto C. Garcia",
        address: "Sampaguita Lane, Purok 5",
        contact: "0918 663 2277",
        counsel: "—",
      },
      {
        id: "pty-011-b",
        role: "Respondent",
        name: "Marites F. Ocampo",
        address: "Sampaguita Lane, Purok 5",
        contact: "0906 214 5590",
        counsel: "—",
      },
    ],
    hearings: [
      {
        id: "hr-011-1",
        hearingNo: 1,
        date: "2026-10-05",
        time: "2:00 PM",
        venue: "Lupon Room, Barangay Hall",
        type: "Mediation",
        status: "Completed",
        attendance: "Both parties present",
        outcome: "Continued",
      },
      {
        id: "hr-011-2",
        hearingNo: 2,
        date: "2026-10-12",
        time: "2:00 PM",
        venue: "Lupon Room, Barangay Hall",
        type: "Mediation",
        status: "Completed",
        attendance: "Both parties present",
        outcome: "Settled",
      },
    ],
    settlement: {
      type: "Amicable Settlement",
      terms:
        "Respondent shall repair the damaged vegetable plot fence within fifteen (15) days and reimburse the complainant ₱1,200 for the destroyed feed sacks. All stray animals shall be kept in a closed pen starting 13 October 2026. Both parties waive further claims arising from the incident.",
      amount: "1,200",
      signedOn: "2026-10-12",
    },
    activity: [
      {
        id: "act-011-1",
        actor: "Felix M. Aquino",
        action: "Recorded amicable settlement and marked the case settled",
        time: "Oct 12, 2026 · 3:55 PM",
      },
      {
        id: "act-011-2",
        actor: "Felix M. Aquino",
        action: "Recorded hearing #1 outcome: continued",
        time: "Oct 5, 2026 · 4:30 PM",
      },
      {
        id: "act-011-3",
        actor: "Elena R. Villamor",
        action: "Promoted complaint BLT-2026-0085 to case KP-2026-011",
        time: "Sep 28, 2026 · 10:09 AM",
      },
    ],
  },
  {
    id: "case-010",
    caseNumber: "KP-2026-010",
    complaintRef: "BLT-2026-0084",
    nature: "Damage to Property",
    filed: "2026-10-09",
    barangay: barangay.name,
    purok: "Purok 3",
    venue: "Office of the Punong Barangay",
    description:
      "Barangay signage was vandalised with spray paint. The respondent could not be identified as a resident of this barangay, so the case was referred for action outside the Lupon.",
    status: "Referred",
    parties: [
      {
        id: "pty-010-a",
        role: "Complainant",
        name: "Teresa L. Pascual",
        address: "5 Kalayaan Street, Purok 3",
        contact: "0917 908 3364",
        counsel: "—",
      },
      {
        id: "pty-010-b",
        role: "Respondent",
        name: "Unidentified individual",
        address: "Not a resident of this barangay",
        contact: "—",
        counsel: "—",
      },
    ],
    hearings: [
      {
        id: "hr-010-1",
        hearingNo: 1,
        date: "2026-10-16",
        time: "1:00 PM",
        venue: "Lupon Room, Barangay Hall",
        type: "Conciliation",
        status: "Completed",
        attendance: "Respondent only",
        outcome: "Referred",
      },
    ],
    settlement: null,
    activity: [
      {
        id: "act-010-1",
        actor: "Felix M. Aquino",
        action: "Referred the case to BPATS for further action",
        time: "Oct 17, 2026 · 9:22 AM",
      },
      {
        id: "act-010-2",
        actor: "Elena R. Villamor",
        action: "Promoted complaint BLT-2026-0084 to case KP-2026-010",
        time: "Oct 9, 2026 · 4:47 PM",
      },
    ],
  },
  {
    id: "case-009",
    caseNumber: "KP-2026-009",
    complaintRef: null,
    nature: "Rental & Lease Dispute",
    filed: "2026-10-03",
    barangay: barangay.name,
    purok: "Purok 1",
    venue: "Barangay Session Hall",
    description:
      "Walk-in complaint about unpaid back rent of three months and the agreed return of the security deposit when the lease ends on 30 November 2026.",
    status: "For Hearing",
    parties: [
      {
        id: "pty-009-a",
        role: "Complainant",
        name: "Alicia M. Fernandez",
        address: "11 Acacia Street, Purok 1",
        contact: "0917 550 3312",
        counsel: "—",
      },
      {
        id: "pty-009-b",
        role: "Respondent",
        name: "Nestor B. Sagucio",
        address: "11 Acacia Street, Purok 1",
        contact: "0939 887 1145",
        counsel: "Atty. Cecilia D. Ramos",
      },
    ],
    hearings: [
      {
        id: "hr-009-1",
        hearingNo: 1,
        date: "2026-10-15",
        time: "9:00 AM",
        venue: "Barangay Session Hall",
        type: "Mediation",
        status: "Completed",
        attendance: "Both parties present",
        outcome: "Continued",
      },
      {
        id: "hr-009-2",
        hearingNo: 2,
        date: "2026-10-29",
        time: "9:00 AM",
        venue: "Barangay Session Hall",
        type: "Hearing",
        status: "Scheduled",
        attendance: "Awaiting parties",
        outcome: "Pending",
      },
    ],
    settlement: null,
    activity: [
      {
        id: "act-009-1",
        actor: "Felix M. Aquino",
        action: "Scheduled hearing #2 with both counsel notified",
        time: "Oct 16, 2026 · 8:58 AM",
      },
      {
        id: "act-009-2",
        actor: "Felix M. Aquino",
        action: "Encoded walk-in case KP-2026-009",
        time: "Oct 3, 2026 · 1:35 PM",
      },
    ],
  },
  {
    id: "case-008",
    caseNumber: "KP-2026-008",
    complaintRef: null,
    nature: "Verbal Defamation",
    filed: "2026-08-20",
    barangay: barangay.name,
    purok: "Purok 2",
    venue: "Lupon Room, Barangay Hall",
    description:
      "Complainant alleges slanderous remarks made during a purok meeting that affected his standing in the community. Parties are neighbours of long standing.",
    status: "Settled",
    parties: [
      {
        id: "pty-008-a",
        role: "Complainant",
        name: "Elmer P. Tolentino",
        address: "3 Narra Street, Purok 2",
        contact: "0917 226 7781",
        counsel: "—",
      },
      {
        id: "pty-008-b",
        role: "Respondent",
        name: "Norma B. Villareal",
        address: "7 Narra Street, Purok 2",
        contact: "0908 471 2263",
        counsel: "—",
      },
    ],
    hearings: [
      {
        id: "hr-008-1",
        hearingNo: 1,
        date: "2026-08-28",
        time: "2:00 PM",
        venue: "Lupon Room, Barangay Hall",
        type: "Mediation",
        status: "Completed",
        attendance: "Both parties present",
        outcome: "Continued",
      },
      {
        id: "hr-008-2",
        hearingNo: 2,
        date: "2026-09-03",
        time: "2:00 PM",
        venue: "Lupon Room, Barangay Hall",
        type: "Mediation",
        status: "Completed",
        attendance: "Both parties present",
        outcome: "Settled",
      },
    ],
    settlement: {
      type: "Amicable Settlement",
      terms:
        "Respondent shall issue a written apology read at the next purok assembly and pay ₱2,500 moral damages in two equal installments due 30 September and 15 October 2026. Both parties agree not to repeat the remarks and to keep dealings civil.",
      amount: "2,500",
      signedOn: "2026-09-03",
    },
    activity: [
      {
        id: "act-008-1",
        actor: "Felix M. Aquino",
        action: "Recorded amicable settlement and marked the case settled",
        time: "Sep 3, 2026 · 3:40 PM",
      },
      {
        id: "act-008-2",
        actor: "Felix M. Aquino",
        action: "Encoded walk-in case KP-2026-008",
        time: "Aug 20, 2026 · 10:18 AM",
      },
    ],
  },
  {
    id: "case-015",
    caseNumber: null,
    complaintRef: "BLT-2026-0089",
    nature: "Theft",
    filed: "2026-10-24",
    barangay: barangay.name,
    purok: "Purok 3",
    venue: "Lupon Room, Barangay Hall",
    description:
      "Reported loss of a mobile phone at the covered court during the league night. The blotter entry was endorsed to the Lupon for possible case filing against a named neighbour.",
    status: "Pending Promotion",
    parties: [
      {
        id: "pty-015-a",
        role: "Complainant",
        name: "Lorna P. Enriquez",
        address: "14 Narra Street, Purok 3",
        contact: "0917 335 6690",
        counsel: "—",
      },
      {
        id: "pty-015-b",
        role: "Respondent",
        name: "Felipe M. Cordero",
        address: "16 Narra Street, Purok 3",
        contact: "0995 662 1108",
        counsel: "—",
      },
    ],
    hearings: [],
    settlement: null,
    activity: [
      {
        id: "act-015-1",
        actor: "Elena R. Villamor",
        action: "Endorsed complaint BLT-2026-0089 to the Lupon for review",
        time: "Oct 24, 2026 · 4:02 PM",
      },
    ],
  },
]
