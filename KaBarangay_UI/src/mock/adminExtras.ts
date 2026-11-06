/**
 * Page-level mock data for the admin pages that have no desk store of their
 * own: ResidentClaims and SectorApplications.
 *
 * Shapes mirror the Laravel/Inertia payloads
 * (github.com/lewww123/KaBarangay, branch `security/secret-containment`) so the
 * group can swap this file for real API responses without touching the markup.
 * `src/mock/data.ts` stays untouched.
 */

/* ------------------------------------------------------------------ */
/* Resident claims — residents claiming an existing barangay record    */
/* ------------------------------------------------------------------ */

export type ClaimStatus = "Pending" | "Needs Correction" | "Approved" | "Rejected"

/** The details on both sides of a claim comparison. */
export type ClaimParty = {
  name: string
  birthdate: string
  purok: string
  mobile: string
  email: string
}

export type ClaimNotification = {
  status: "Queued" | "Sent" | "Failed"
  attempts: number
  sentAt: string | null
}

export type ResidentClaim = {
  id: number
  reference: string
  /** Resident number the claimant is asking to be linked to. */
  residentNo: string
  submitted: string
  /** 0–100 record-match confidence computed by the matching engine. */
  confidence: number
  emailVerified: boolean
  identityMethod: string
  status: ClaimStatus
  notes: string | null
  claimed: ClaimParty
  record: ClaimParty
  notification: ClaimNotification | null
}

export const residentClaims: ResidentClaim[] = [
  {
    id: 1,
    reference: "CLM-2026-0114",
    residentNo: "RES-2026-04182",
    submitted: "Oct 21, 2026",
    confidence: 96,
    emailVerified: true,
    identityMethod: "Government ID + selfie match",
    status: "Pending",
    notes: null,
    claimed: {
      name: "Maria L. Santos",
      birthdate: "Mar 14, 1992",
      purok: "Purok 1",
      mobile: "0917 412 8830",
      email: "maria.santos@gmail.com",
    },
    record: {
      name: "Maria L. Santos",
      birthdate: "Mar 14, 1992",
      purok: "Purok 1",
      mobile: "0917 412 8830",
      email: "m.santos2016@yahoo.com",
    },
    notification: null,
  },
  {
    id: 2,
    reference: "CLM-2026-0113",
    residentNo: "RES-2026-04183",
    submitted: "Oct 20, 2026",
    confidence: 88,
    emailVerified: true,
    identityMethod: "Barangay ID presented at the hall",
    status: "Pending",
    notes: null,
    claimed: {
      name: "Juan Dela Cruz",
      birthdate: "Jul 2, 1979",
      purok: "Purok 2",
      mobile: "0918 220 7741",
      email: "juandelacruz88@gmail.com",
    },
    record: {
      name: "Juan D. Dela Cruz",
      birthdate: "Jul 2, 1979",
      purok: "Purok 2",
      mobile: "0918 220 7741",
      email: "juandelacruz88@gmail.com",
    },
    notification: null,
  },
  {
    id: 3,
    reference: "CLM-2026-0112",
    residentNo: "RES-2026-04184",
    submitted: "Oct 19, 2026",
    confidence: 64,
    emailVerified: false,
    identityMethod: "Online submission, ID pending review",
    status: "Needs Correction",
    notes: "Birthdate and purok do not match the record — ask the claimant to re-upload a valid ID.",
    claimed: {
      name: "Ana P. Reyes",
      birthdate: "Feb 19, 1998",
      purok: "Purok 5",
      mobile: "0906 331 9012",
      email: "ana.reyes.ph@gmail.com",
    },
    record: {
      name: "Ana P. Reyes",
      birthdate: "Feb 2, 1998",
      purok: "Purok 3",
      mobile: "0906 331 9012",
      email: "ana.reyes.ph@gmail.com",
    },
    notification: null,
  },
  {
    id: 4,
    reference: "CLM-2026-0110",
    residentNo: "RES-2026-04185",
    submitted: "Oct 17, 2026",
    confidence: 93,
    emailVerified: true,
    identityMethod: "Government ID + selfie match",
    status: "Approved",
    notes: "Linked by the barangay clerk after an in-person check.",
    claimed: {
      name: "Pedro S. Ramos",
      birthdate: "Nov 8, 1957",
      purok: "Purok 1",
      mobile: "0919 884 1123",
      email: "pedro.ramos57@gmail.com",
    },
    record: {
      name: "Pedro S. Ramos",
      birthdate: "Nov 8, 1957",
      purok: "Purok 1",
      mobile: "0919 884 1123",
      email: "pedro.ramos57@gmail.com",
    },
    notification: { status: "Sent", attempts: 1, sentAt: "Oct 17, 2026 · 4:05 PM" },
  },
  {
    id: 5,
    reference: "CLM-2026-0109",
    residentNo: "RES-2026-04186",
    submitted: "Oct 16, 2026",
    confidence: 72,
    emailVerified: false,
    identityMethod: "Online submission, ID pending review",
    status: "Pending",
    notes: null,
    claimed: {
      name: "Liza M. Mendoza",
      birthdate: "Sep 30, 1995",
      purok: "Purok 4",
      mobile: "0977 110 2244",
      email: "liza.mendoza.ph@gmail.com",
    },
    record: {
      name: "Liza M. Mendoza",
      birthdate: "Sep 30, 1995",
      purok: "Purok 4",
      mobile: "0977 110 9911",
      email: "liza_mendoza@yahoo.com",
    },
    notification: null,
  },
  {
    id: 6,
    reference: "CLM-2026-0105",
    residentNo: "RES-2026-04189",
    submitted: "Oct 12, 2026",
    confidence: 41,
    emailVerified: true,
    identityMethod: "Government ID presented at the hall",
    status: "Rejected",
    notes: "Claimant could not confirm the birthdate on record. Re-file with a valid ID.",
    claimed: {
      name: "Ernesto T. Bautista",
      birthdate: "Jan 5, 1967",
      purok: "Purok 3",
      mobile: "0908 771 3345",
      email: "e.bautista66@gmail.com",
    },
    record: {
      name: "Ernesto T. Bautista",
      birthdate: "Apr 22, 1966",
      purok: "Purok 3",
      mobile: "0908 771 3345",
      email: "e.bautista66@gmail.com",
    },
    notification: null,
  },
  {
    id: 7,
    reference: "CLM-2026-0103",
    residentNo: "RES-2026-04190",
    submitted: "Oct 10, 2026",
    confidence: 90,
    emailVerified: true,
    identityMethod: "Government ID + selfie match",
    status: "Approved",
    notes: null,
    claimed: {
      name: "Grace V. Navarro",
      birthdate: "Dec 12, 1984",
      purok: "Purok 4",
      mobile: "0917 990 5521",
      email: "grace.navarro@gmail.com",
    },
    record: {
      name: "Grace V. Navarro",
      birthdate: "Dec 12, 1984",
      purok: "Purok 4",
      mobile: "0917 990 5521",
      email: "grace.navarro84@gmail.com",
    },
    notification: { status: "Failed", attempts: 3, sentAt: null },
  },
]

/* ------------------------------------------------------------------ */
/* Sector applications — senior / PWD / indigent membership requests   */
/* ------------------------------------------------------------------ */

export type SectorKind = "senior" | "pwd" | "indigent"

export type SectorAppStatus =
  | "Under Admin Review"
  | "Pending Staff Review"
  | "Needs Correction"
  | "Approved"
  | "Rejected"

/** Where the application entered the desk: the resident portal or staff intake. */
export type SectorAppOrigin = "self_service" | "staff_assisted"

export type SectorDocument = {
  name: string
  file: string
  state: "Received" | "Missing"
}

export type SectorApplication = {
  id: number
  tracking: string
  applicant: string
  residentNo: string
  sector: SectorKind
  sectorName: string
  purok: string
  age: number
  mobile: string
  submitted: string
  origin: SectorAppOrigin
  /** The staff member who filed it on the resident's behalf. */
  originBy?: string
  status: SectorAppStatus
  /** Sector desk recommendation handed to the administrator. */
  recommendation: {
    recommended: boolean
    by: string
    note: string
  }
  documents: SectorDocument[]
  /** Reason recorded with the last reject / correction decision. */
  decisionNote?: string | null
}

const documents = (
  tracking: string,
  names: [string, "Received" | "Missing"][],
): SectorDocument[] =>
  names.map(([name, state], index) => ({
    name,
    file: `${tracking.toLowerCase()}-${String(index + 1).padStart(2, "0")}.pdf`,
    state,
  }))

export const sectorApplications: SectorApplication[] = [
  {
    id: 41,
    origin: "self_service",
    tracking: "SEC-2026-0041",
    applicant: "Pedro S. Ramos",
    residentNo: "RES-2026-04185",
    sector: "senior",
    sectorName: "Senior Citizens",
    purok: "Purok 1",
    age: 68,
    mobile: "0919 884 1123",
    submitted: "Oct 22, 2026",
    status: "Under Admin Review",
    recommendation: {
      recommended: true,
      by: "Rogelio S. Panganiban",
      note: "PSOCR and government ID are on file; age verified against the registry.",
    },
    documents: documents("SEC-2026-0041", [
      ["Senior citizen PSOCR", "Received"],
      ["Government-issued ID", "Received"],
      ["Proof of residence", "Received"],
      ["Barangay clearance", "Received"],
    ]),
  },
  {
    id: 42,
    origin: "staff_assisted",
    originBy: "Rogelio S. Panganiban",
    tracking: "SEC-2026-0042",
    applicant: "Teresa L. Pascual",
    residentNo: "RES-2026-04192",
    sector: "senior",
    sectorName: "Senior Citizens",
    purok: "Purok 1",
    age: 66,
    mobile: "0918 447 2290",
    submitted: "Oct 21, 2026",
    status: "Pending Staff Review",
    recommendation: {
      recommended: false,
      by: "Rogelio S. Panganiban",
      note: "Intake checklist not yet completed.",
    },
    documents: documents("SEC-2026-0042", [
      ["Senior citizen PSOCR", "Received"],
      ["Government-issued ID", "Received"],
      ["Proof of residence", "Missing"],
    ]),
  },
  {
    id: 43,
    origin: "self_service",
    tracking: "SEC-2026-0043",
    applicant: "Nena B. Salazar",
    residentNo: "RES-2026-04198",
    sector: "pwd",
    sectorName: "PWD",
    purok: "Purok 5",
    age: 45,
    mobile: "0906 224 8853",
    submitted: "Oct 20, 2026",
    status: "Under Admin Review",
    recommendation: {
      recommended: true,
      by: "Armando V. Ledesma",
      note: "PWD identification card and medical certificate both legible.",
    },
    documents: documents("SEC-2026-0043", [
      ["PWD identification card", "Received"],
      ["Medical certificate", "Received"],
      ["Government-issued ID", "Received"],
      ["Barangay clearance", "Missing"],
    ]),
  },
  {
    id: 44,
    origin: "staff_assisted",
    originBy: "Rogelio S. Panganiban",
    tracking: "SEC-2026-0044",
    applicant: "Divina R. Lopez",
    residentNo: "RES-2026-04200",
    sector: "senior",
    sectorName: "Senior Citizens",
    purok: "Purok 2",
    age: 69,
    mobile: "0917 553 2201",
    submitted: "Oct 19, 2026",
    status: "Needs Correction",
    recommendation: {
      recommended: false,
      by: "Rogelio S. Panganiban",
      note: "Upload a clearer scan of the PSOCR and the proof of residence.",
    },
    documents: documents("SEC-2026-0044", [
      ["Senior citizen PSOCR", "Missing"],
      ["Government-issued ID", "Received"],
      ["Proof of residence", "Missing"],
    ]),
  },
  {
    id: 45,
    origin: "self_service",
    tracking: "SEC-2026-0045",
    applicant: "Ernesto T. Bautista",
    residentNo: "RES-2026-04189",
    sector: "pwd",
    sectorName: "PWD",
    purok: "Purok 3",
    age: 59,
    mobile: "0908 771 3345",
    submitted: "Oct 18, 2026",
    status: "Approved",
    recommendation: {
      recommended: true,
      by: "Armando V. Ledesma",
      note: "Disability is permanent; ID valid until 2029.",
    },
    documents: documents("SEC-2026-0045", [
      ["PWD identification card", "Received"],
      ["Medical certificate", "Received"],
      ["Government-issued ID", "Received"],
    ]),
  },
  {
    id: 46,
    origin: "self_service",
    tracking: "SEC-2026-0046",
    applicant: "Arnel P. Dizon",
    residentNo: "RES-2026-04204",
    sector: "indigent",
    sectorName: "Indigent",
    purok: "Purok 5",
    age: 27,
    mobile: "0917 335 4410",
    submitted: "Oct 18, 2026",
    status: "Rejected",
    recommendation: {
      recommended: false,
      by: "Elena R. Villamor",
      note: "Household income documents do not support an indigent classification.",
    },
    documents: documents("SEC-2026-0046", [
      ["Certificate of indigency", "Received"],
      ["Household income statement", "Received"],
      ["Government-issued ID", "Received"],
    ]),
  },
  {
    id: 47,
    origin: "staff_assisted",
    originBy: "Elena R. Villamor",
    tracking: "SEC-2026-0047",
    applicant: "Susan G. Manalo",
    residentNo: "RES-2026-04207",
    sector: "indigent",
    sectorName: "Indigent",
    purok: "Purok 3",
    age: 44,
    mobile: "0995 210 7788",
    submitted: "Oct 17, 2026",
    status: "Pending Staff Review",
    recommendation: {
      recommended: false,
      by: "Elena R. Villamor",
      note: "Awaiting the social worker's home visit notes.",
    },
    documents: documents("SEC-2026-0047", [
      ["Certificate of indigency", "Received"],
      ["Household income statement", "Missing"],
      ["Government-issued ID", "Received"],
    ]),
  },
  {
    id: 48,
    origin: "self_service",
    tracking: "SEC-2026-0048",
    applicant: "Ramon E. Villareal",
    residentNo: "RES-2026-04195",
    sector: "senior",
    sectorName: "Senior Citizens",
    purok: "Purok 3",
    age: 74,
    mobile: "0916 330 9924",
    submitted: "Oct 16, 2026",
    status: "Approved",
    recommendation: {
      recommended: true,
      by: "Rogelio S. Panganiban",
      note: "PSOCR renewed at the municipal hall this year.",
    },
    documents: documents("SEC-2026-0048", [
      ["Senior citizen PSOCR", "Received"],
      ["Government-issued ID", "Received"],
      ["Proof of residence", "Received"],
    ]),
  },
  {
    id: 49,
    origin: "self_service",
    tracking: "SEC-2026-0049",
    applicant: "Jasmine C. Tolentino",
    residentNo: "RES-2026-04196",
    sector: "indigent",
    sectorName: "Indigent",
    purok: "Purok 6",
    age: 22,
    mobile: "0921 559 7702",
    submitted: "Oct 15, 2026",
    status: "Under Admin Review",
    recommendation: {
      recommended: true,
      by: "Elena R. Villamor",
      note: "Enrolled as a scholar; income statement matches the barangay profile.",
    },
    documents: documents("SEC-2026-0049", [
      ["Certificate of indigency", "Received"],
      ["Household income statement", "Received"],
      ["Government-issued ID", "Received"],
    ]),
  },
]
