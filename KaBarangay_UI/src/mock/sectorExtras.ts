/**
 * Page-level mock data for the two sector desks that own a member roster:
 * Senior Citizens (`/senior/*`) and PWD (`/pwd/*`).
 *
 * Everything here feeds the Members, Applications and ApplicationDetail pages.
 * Shapes mirror the sector payloads of the Laravel backend
 * (`ResidentDirectoryItem`, `SectorApplicationItem`) so the integration only has
 * to swap this file — `src/mock/data.ts` and `src/mock/sectors.ts` stay intact.
 */

import type { SectorKey } from "@/config/navigation"

/** The two desks this file feeds. */
export type SectorDesk = Extract<SectorKey, "senior" | "pwd">

/** Mock "today" for newly filed applications and newly issued IDs. */
export const todayIso = "2026-10-28"

/** Month of the mock "today", used by the "this month" counters. */
export const currentMonth = todayIso.slice(0, 7)

/* ------------------------------------------------------------------ */
/* Members                                                             */
/* ------------------------------------------------------------------ */

export type MemberIdStatus = "Issued" | "Pending" | "For renewal" | "Not applied"

export type MembershipStatus = "Active" | "Pending" | "Inactive"

export type SectorMember = {
  id: number
  residentNo: string
  name: string
  age: number
  sex: "Male" | "Female"
  /** ISO date, render with `formatIsoDate`. */
  birthdate: string
  civilStatus: string
  purok: string
  address: string
  mobile: string
  /** Sector ID on file: OSCA number for seniors, PWD number for PWD. */
  sectorId: string
  idStatus: MemberIdStatus
  membership: MembershipStatus
  /** ISO date the member was enrolled, render with `formatIsoDate`. */
  registered: string
  /** Share of sector assemblies and pay-outs attended this year (%). */
  attendance: number
  benefits: string[]
  emergency: { name: string; relationship: string; mobile: string }
}

export const puroks = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6"]

export const sectorMembers: Record<SectorDesk, SectorMember[]> = {
  senior: [
    { id: 1, residentNo: "RES-2026-04185", name: "Pedro S. Ramos", age: 68, sex: "Male", birthdate: "1958-03-04", civilStatus: "Married", purok: "Purok 1", address: "123 Mabini Street, Purok 1", mobile: "0919 884 1123", sectorId: "OSCA-2026-0148", idStatus: "Issued", membership: "Active", registered: "2026-02-08", attendance: 92, benefits: ["Monthly pension", "Medical mission", "Medicine discount"], emergency: { name: "Ana M. Ramos", relationship: "Daughter", mobile: "0917 220 4415" } },
    { id: 2, residentNo: "RES-2026-04187", name: "Roberto C. Garcia", age: 72, sex: "Male", birthdate: "1954-07-19", civilStatus: "Widowed", purok: "Purok 2", address: "45 Rizal Avenue, Purok 2", mobile: "0920 665 3311", sectorId: "OSCA-2026-0112", idStatus: "Issued", membership: "Active", registered: "2026-03-25", attendance: 88, benefits: ["Monthly pension", "Free eye check-up"], emergency: { name: "Ricardo C. Garcia", relationship: "Son", mobile: "0918 774 2210" } },
    { id: 3, residentNo: "RES-2026-04192", name: "Teresa L. Pascual", age: 66, sex: "Female", birthdate: "1960-11-02", civilStatus: "Married", purok: "Purok 1", address: "78 Bonifacio Street, Purok 1", mobile: "0918 447 2290", sectorId: "OSCA-2026-0121", idStatus: "For renewal", membership: "Active", registered: "2026-05-14", attendance: 75, benefits: ["Monthly pension", "Discount on utilities"], emergency: { name: "Nenita L. Pascual", relationship: "Sister", mobile: "0906 118 7742" } },
    { id: 4, residentNo: "RES-2026-04195", name: "Ramon E. Villareal", age: 74, sex: "Male", birthdate: "1952-01-27", civilStatus: "Married", purok: "Purok 3", address: "16 Sampaguita Lane, Purok 3", mobile: "0916 330 9924", sectorId: "OSCA-2026-0104", idStatus: "Issued", membership: "Active", registered: "2026-06-18", attendance: 96, benefits: ["Monthly pension", "Medical mission", "Free transportation"], emergency: { name: "Lourdes V. Villareal", relationship: "Wife", mobile: "0917 552 8813" } },
    { id: 5, residentNo: "RES-2026-04197", name: "Alfredo D. Sandoval", age: 63, sex: "Male", birthdate: "1963-05-30", civilStatus: "Married", purok: "Purok 4", address: "92 Narra Road, Purok 4", mobile: "0977 882 4416", sectorId: "OSCA-2026-0139", idStatus: "Issued", membership: "Active", registered: "2026-07-15", attendance: 71, benefits: ["Monthly pension", "Medicine discount"], emergency: { name: "Melanie D. Sandoval", relationship: "Daughter", mobile: "0995 441 2278" } },
    { id: 6, residentNo: "RES-2026-04200", name: "Divina R. Lopez", age: 69, sex: "Female", birthdate: "1957-09-12", civilStatus: "Widowed", purok: "Purok 2", address: "21 Kalachuchi Street, Purok 2", mobile: "0917 553 2201", sectorId: "OSCA-2026-0166", idStatus: "Pending", membership: "Pending", registered: "2026-09-09", attendance: 60, benefits: ["Medical mission"], emergency: { name: "Efren R. Lopez", relationship: "Son", mobile: "0939 117 6628" } },
    { id: 7, residentNo: "RES-2026-04203", name: "Milagros A. Perez", age: 71, sex: "Female", birthdate: "1955-02-08", civilStatus: "Married", purok: "Purok 4", address: "5 Ilang-Ilang Road, Purok 4", mobile: "0918 220 7741", sectorId: "OSCA-2026-0117", idStatus: "Issued", membership: "Active", registered: "2026-04-27", attendance: 83, benefits: ["Monthly pension", "Free eye check-up", "Medicine discount"], emergency: { name: "Arturo A. Perez", relationship: "Husband", mobile: "0920 118 3390" } },
    { id: 8, residentNo: "RES-2026-04206", name: "Ester P. Guerrero", age: 67, sex: "Female", birthdate: "1959-06-21", civilStatus: "Married", purok: "Purok 6", address: "34 Acacia Street, Purok 6", mobile: "0906 331 9012", sectorId: "OSCA-2026-0129", idStatus: "Issued", membership: "Active", registered: "2026-05-03", attendance: 79, benefits: ["Monthly pension", "Medical mission"], emergency: { name: "Nilda P. Bautista", relationship: "Niece", mobile: "0917 990 5521" } },
    { id: 9, residentNo: "RES-2026-04211", name: "Corazon M. Dimayuga", age: 76, sex: "Female", birthdate: "1950-08-15", civilStatus: "Widowed", purok: "Purok 5", address: "8 Camia Street, Purok 5", mobile: "0935 228 6610", sectorId: "OSCA-2026-0098", idStatus: "Issued", membership: "Active", registered: "2026-01-22", attendance: 88, benefits: ["Monthly pension", "Medical assistance", "Free eye check-up"], emergency: { name: "Marites M. Dimayuga", relationship: "Daughter", mobile: "0921 559 7702" } },
    { id: 10, residentNo: "RES-2026-04214", name: "Alfonso R. Ibarra", age: 81, sex: "Male", birthdate: "1945-04-09", civilStatus: "Widowed", purok: "Purok 3", address: "60 Riverside Road, Purok 3", mobile: "0947 118 3374", sectorId: "OSCA-2026-0086", idStatus: "For renewal", membership: "Active", registered: "2026-02-27", attendance: 67, benefits: ["Monthly pension", "Free transportation", "Medicine discount"], emergency: { name: "Jose R. Ibarra", relationship: "Son", mobile: "0916 447 2265" } },
    { id: 11, residentNo: "RES-2026-04217", name: "Lourdes P. Sarmiento", age: 64, sex: "Female", birthdate: "1962-12-03", civilStatus: "Married", purok: "Purok 6", address: "27 Bougainvillea Street, Purok 6", mobile: "0999 664 1187", sectorId: "OSCA-2026-0172", idStatus: "Pending", membership: "Active", registered: "2026-10-06", attendance: 55, benefits: ["Medical mission"], emergency: { name: "Danilo P. Sarmiento", relationship: "Husband", mobile: "0908 771 3345" } },
    { id: 12, residentNo: "RES-2026-04219", name: "Gavino T. Mabini", age: 79, sex: "Male", birthdate: "1947-10-24", civilStatus: "Married", purok: "Purok 1", address: "3 Mabini Corner, Purok 1", mobile: "0917 412 8830", sectorId: "OSCA-2026-0155", idStatus: "Pending", membership: "Active", registered: "2026-10-13", attendance: 62, benefits: ["Monthly pension", "Free eye check-up"], emergency: { name: "Celia T. Mabini", relationship: "Wife", mobile: "0918 220 7741" } },
    { id: 13, residentNo: "RES-2026-04222", name: "Amparo V. Salcedo", age: 70, sex: "Female", birthdate: "1956-03-17", civilStatus: "Widowed", purok: "Purok 5", address: "14 Sunrise Street, Purok 5", mobile: "0906 224 8853", sectorId: "OSCA-2026-0134", idStatus: "Not applied", membership: "Inactive", registered: "2026-06-01", attendance: 41, benefits: ["Medical mission"], emergency: { name: "Rogelio V. Salcedo", relationship: "Brother", mobile: "0939 117 6628" } },
    { id: 14, residentNo: "RES-2026-04225", name: "Bernardo V. Aguinaldo", age: 65, sex: "Male", birthdate: "1961-07-11", civilStatus: "Married", purok: "Purok 2", address: "40 Mangga Street, Purok 2", mobile: "0939 228 6610", sectorId: "OSCA-2026-0179", idStatus: "Pending", membership: "Pending", registered: "2026-10-24", attendance: 50, benefits: ["Medical mission"], emergency: { name: "Josie V. Aguinaldo", relationship: "Wife", mobile: "0917 553 2201" } },
  ],
  pwd: [
    { id: 1, residentNo: "RES-2026-04184", name: "Ana P. Reyes", age: 28, sex: "Female", birthdate: "1998-04-18", civilStatus: "Single", purok: "Purok 3", address: "19 Orchid Street, Purok 3", mobile: "0906 331 9012", sectorId: "PWD-2026-0771", idStatus: "Issued", membership: "Active", registered: "2026-02-02", attendance: 90, benefits: ["Wheelchair issuance", "PWD ID discounts", "Medical assistance"], emergency: { name: "Marites P. Reyes", relationship: "Mother", mobile: "0917 412 8830" } },
    { id: 2, residentNo: "RES-2026-04189", name: "Ernesto T. Bautista", age: 59, sex: "Male", birthdate: "1967-09-25", civilStatus: "Married", purok: "Purok 3", address: "55 Riverside Road, Purok 3", mobile: "0908 771 3345", sectorId: "PWD-2026-0744", idStatus: "Issued", membership: "Active", registered: "2026-04-11", attendance: 84, benefits: ["Medical assistance", "PWD ID discounts", "Rehabilitation referral"], emergency: { name: "Lorna T. Bautista", relationship: "Wife", mobile: "0918 447 2290" } },
    { id: 3, residentNo: "RES-2026-04196", name: "Nena B. Salazar", age: 45, sex: "Female", birthdate: "1981-01-30", civilStatus: "Married", purok: "Purok 5", address: "7 Sampaguita Lane, Purok 5", mobile: "0906 224 8853", sectorId: "PWD-2026-0758", idStatus: "Issued", membership: "Active", registered: "2026-08-04", attendance: 78, benefits: ["PWD ID discounts", "Assistive device"], emergency: { name: "Benjamin Salazar", relationship: "Husband", mobile: "0916 330 9924" } },
    { id: 4, residentNo: "RES-2026-04205", name: "Oliver P. Dimaculangan", age: 37, sex: "Male", birthdate: "1989-06-07", civilStatus: "Single", purok: "Purok 2", address: "31 Rizal Avenue, Purok 2", mobile: "0917 990 5521", sectorId: "PWD-2026-0763", idStatus: "For renewal", membership: "Active", registered: "2026-05-19", attendance: 72, benefits: ["PWD ID discounts", "Transportation fare discount"], emergency: { name: "Susan P. Dimaculangan", relationship: "Sister", mobile: "0920 665 3311" } },
    { id: 5, residentNo: "RES-2026-04207", name: "Maricel V. Ilagan", age: 52, sex: "Female", birthdate: "1974-10-14", civilStatus: "Widowed", purok: "Purok 6", address: "23 Acacia Street, Purok 6", mobile: "0921 559 7702", sectorId: "PWD-2026-0769", idStatus: "Issued", membership: "Active", registered: "2026-06-30", attendance: 81, benefits: ["Medical assistance", "PWD ID discounts"], emergency: { name: "Jomar V. Ilagan", relationship: "Brother", mobile: "0935 228 6610" } },
    { id: 6, residentNo: "RES-2026-04209", name: "Danilo P. Estrada", age: 41, sex: "Male", birthdate: "1985-03-12", civilStatus: "Married", purok: "Purok 5", address: "66 Camia Street, Purok 5", mobile: "0947 118 3374", sectorId: "PWD-2026-0776", idStatus: "Issued", membership: "Active", registered: "2026-07-08", attendance: 69, benefits: ["Assistive device", "PWD ID discounts"], emergency: { name: "Rowena P. Estrada", relationship: "Wife", mobile: "0918 220 7741" } },
    { id: 7, residentNo: "RES-2026-04213", name: "Fe G. Atienza", age: 33, sex: "Female", birthdate: "1993-08-21", civilStatus: "Single", purok: "Purok 1", address: "11 Mabini Street, Purok 1", mobile: "0917 220 4415", sectorId: "PWD-2026-0781", idStatus: "Issued", membership: "Active", registered: "2026-08-27", attendance: 76, benefits: ["PWD ID discounts", "Rehabilitation referral"], emergency: { name: "Rosalinda G. Atienza", relationship: "Mother", mobile: "0906 331 9012" } },
    { id: 8, residentNo: "RES-2026-04216", name: "Jose C. Trinidad", age: 26, sex: "Male", birthdate: "2000-02-05", civilStatus: "Single", purok: "Purok 4", address: "88 Narra Road, Purok 4", mobile: "0939 117 6628", sectorId: "PWD-2026-0784", idStatus: "Pending", membership: "Pending", registered: "2026-10-10", attendance: 58, benefits: ["PWD ID discounts"], emergency: { name: "Milagros C. Trinidad", relationship: "Mother", mobile: "0917 553 2201" } },
    { id: 9, residentNo: "RES-2026-04220", name: "Teresita R. Manalo", age: 61, sex: "Female", birthdate: "1965-05-16", civilStatus: "Widowed", purok: "Purok 2", address: "45 Kalachuchi Street, Purok 2", mobile: "0999 664 1187", sectorId: "PWD-2026-0788", idStatus: "Pending", membership: "Pending", registered: "2026-10-17", attendance: 54, benefits: ["Medical assistance"], emergency: { name: "Aldrin R. Manalo", relationship: "Son", mobile: "0916 447 2265" } },
    { id: 10, residentNo: "RES-2026-04224", name: "Wilfredo B. Lazaro", age: 48, sex: "Male", birthdate: "1978-11-29", civilStatus: "Married", purok: "Purok 4", address: "2 Ilang-Ilang Road, Purok 4", mobile: "0916 447 2265", sectorId: "PWD-2026-0749", idStatus: "For renewal", membership: "Inactive", registered: "2026-03-14", attendance: 44, benefits: ["PWD ID discounts"], emergency: { name: "Elena B. Lazaro", relationship: "Wife", mobile: "0908 771 3345" } },
  ],
}

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export type ApplicationStatus = "Pending" | "For Correction" | "Approved" | "Rejected"

export type RequirementStatus = "Verified" | "Pending" | "Missing"

export type SectorRequirement = {
  id: string
  label: string
  status: RequirementStatus
  note: string
}

export type ReviewNote = {
  id: number
  author: string
  role: string
  /** ISO date, render with `formatIsoDate`. */
  date: string
  body: string
}

export type IssuedSectorId = {
  idNumber: string
  issuedOn: string
  validUntil: string
}

export type SectorApplication = {
  id: string
  applicant: string
  residentNo: string
  purok: string
  age: number
  sex: "Male" | "Female"
  /** ISO date, render with `formatIsoDate`. */
  birthdate: string
  mobile: string
  address: string
  type: string
  submission: "Staff-assisted" | "Self-service"
  /** ISO date the application was filed, render with `formatIsoDate`. */
  filed: string
  assignee: string
  status: ApplicationStatus
  request: {
    program: string
    category: string
    reference: string
    amount: string
    notes: string
  }
  requirements: SectorRequirement[]
  notes: ReviewNote[]
  /** Populated once the application is approved. */
  issued?: IssuedSectorId
}

/** Application types each desk files, in queue order. */
export const applicationTypes: Record<SectorDesk, string[]> = {
  senior: [
    "Membership registration",
    "Senior citizen ID issuance",
    "Senior citizen ID renewal",
    "Pension endorsement",
    "Medical assistance",
    "Membership reactivation",
  ],
  pwd: [
    "Membership registration",
    "PWD ID issuance",
    "PWD ID renewal",
    "Assistive device request",
    "Medical assistance",
  ],
}

/** Staff the desk can assign a queue item to. */
export const deskAssignees: Record<SectorDesk, string[]> = {
  senior: ["Rogelio S. Panganiban", "Barangay Administrator", "Records Section"],
  pwd: ["Armando V. Ledesma", "Barangay Administrator", "Records Section"],
}

const requirementNote: Record<RequirementStatus, string> = {
  Verified: "Checked against the original document at the desk",
  Pending: "Awaiting verification before the decision",
  Missing: "Not submitted — returned to the applicant",
}

/** Builds the completeness checklist shared by both desks. */
function requirementsFor(
  sector: SectorDesk,
  statuses: [RequirementStatus, RequirementStatus, RequirementStatus, RequirementStatus],
): SectorRequirement[] {
  const labels =
    sector === "senior"
      ? [
          "Proof of age / senior citizen ID",
          "Barangay residency certification or valid ID",
          "One 2×2 ID photo",
          "Eligibility verified against the resident register",
        ]
      : [
          "Certificate of disability / medical proof",
          "Barangay residency certification or valid ID",
          "One 1×1 ID photo",
          "Eligibility verified against the resident register",
        ]

  return statuses.map((status, index) => ({
    id: `req-${index + 1}`,
    label: labels[index],
    status,
    note: requirementNote[status],
  }))
}

/** Checklist state of a freshly filed application — nothing verified yet. */
export function pendingRequirements(sector: SectorDesk): SectorRequirement[] {
  return requirementsFor(sector, ["Pending", "Pending", "Pending", "Pending"])
}

export const sectorApplications: Record<SectorDesk, SectorApplication[]> = {
  senior: [
    {
      id: "SCA-2026-0031",
      applicant: "Bernardo V. Aguinaldo",
      residentNo: "RES-2026-04225",
      purok: "Purok 2",
      age: 65,
      sex: "Male",
      birthdate: "1961-07-11",
      mobile: "0939 228 6610",
      address: "40 Mangga Street, Purok 2",
      type: "Membership registration",
      submission: "Staff-assisted",
      filed: "2026-10-24",
      assignee: "Rogelio S. Panganiban",
      status: "Pending",
      request: {
        program: "Senior citizen registry enrolment",
        category: "Membership",
        reference: "OSCA-2026-0179",
        amount: "—",
        notes: "Applicant presented the PSA birth certificate and the barangay residency certification.",
      },
      requirements: requirementsFor("senior", ["Verified", "Verified", "Pending", "Pending"]),
      notes: [
        { id: 1, author: "Rogelio S. Panganiban", role: "Senior Citizens Desk", date: "2026-10-24", body: "Intake reviewed at the counter; waiting for the 2×2 photo before the eligibility sign-off." },
      ],
    },
    {
      id: "SCA-2026-0030",
      applicant: "Lourdes P. Sarmiento",
      residentNo: "RES-2026-04217",
      purok: "Purok 6",
      age: 64,
      sex: "Female",
      birthdate: "1962-12-03",
      mobile: "0999 664 1187",
      address: "27 Bougainvillea Street, Purok 6",
      type: "Senior citizen ID issuance",
      submission: "Staff-assisted",
      filed: "2026-10-22",
      assignee: "Records Section",
      status: "Pending",
      request: {
        program: "OSCA identification card printing",
        category: "Identification",
        reference: "OSCA-2026-0172",
        amount: "Free of charge",
        notes: "Card will be claimed at the barangay hall lobby once printed.",
      },
      requirements: requirementsFor("senior", ["Verified", "Verified", "Verified", "Pending"]),
      notes: [
        { id: 1, author: "Records Section", role: "Records Section", date: "2026-10-22", body: "Photo and signature specimen captured; queued for the weekly OSCA print run." },
      ],
    },
    {
      id: "SCA-2026-0029",
      applicant: "Gavino T. Mabini",
      residentNo: "RES-2026-04219",
      purok: "Purok 1",
      age: 79,
      sex: "Male",
      birthdate: "1947-10-24",
      mobile: "0917 412 8830",
      address: "3 Mabini Corner, Purok 1",
      type: "Senior citizen ID renewal",
      submission: "Self-service",
      filed: "2026-10-19",
      assignee: "Rogelio S. Panganiban",
      status: "For Correction",
      request: {
        program: "OSCA identification card renewal",
        category: "Identification",
        reference: "OSCA-2026-0155",
        amount: "Free of charge",
        notes: "Renewal of the card that expires on Dec 31, 2026.",
      },
      requirements: requirementsFor("senior", ["Verified", "Verified", "Missing", "Pending"]),
      notes: [
        { id: 1, author: "Rogelio S. Panganiban", role: "Senior Citizens Desk", date: "2026-10-20", body: "Returned for correction — the residency certification submitted is older than six months." },
        { id: 2, author: "Rogelio S. Panganiban", role: "Senior Citizens Desk", date: "2026-10-19", body: "Application encoded from the resident portal queue." },
      ],
    },
    {
      id: "SCA-2026-0028",
      applicant: "Amparo V. Salcedo",
      residentNo: "RES-2026-04222",
      purok: "Purok 5",
      age: 70,
      sex: "Female",
      birthdate: "1956-03-17",
      mobile: "0906 224 8853",
      address: "14 Sunrise Street, Purok 5",
      type: "Membership reactivation",
      submission: "Staff-assisted",
      filed: "2026-10-15",
      assignee: "Rogelio S. Panganiban",
      status: "Approved",
      request: {
        program: "Senior citizen registry enrolment",
        category: "Membership",
        reference: "OSCA-2026-0134",
        amount: "—",
        notes: "Member reactivated after a two-year residence absence in the purok.",
      },
      requirements: requirementsFor("senior", ["Verified", "Verified", "Verified", "Verified"]),
      notes: [
        { id: 1, author: "Barangay Administrator", role: "Approving authority", date: "2026-10-17", body: "Approved — membership reactivated and the OSCA record updated." },
      ],
      issued: { idNumber: "OSCA-2026-0134", issuedOn: "2026-10-17", validUntil: "2027-10-17" },
    },
    {
      id: "SCA-2026-0027",
      applicant: "Corazon M. Dimayuga",
      residentNo: "RES-2026-04211",
      purok: "Purok 5",
      age: 76,
      sex: "Female",
      birthdate: "1950-08-15",
      mobile: "0935 228 6610",
      address: "8 Camia Street, Purok 5",
      type: "Medical assistance",
      submission: "Staff-assisted",
      filed: "2026-10-11",
      assignee: "Barangay Administrator",
      status: "Approved",
      request: {
        program: "Senior medical assistance release",
        category: "Benefit",
        reference: "MA-2026-0087",
        amount: "₱3,500",
        notes: "Laboratory and maintenance medicine reimbursement for October.",
      },
      requirements: requirementsFor("senior", ["Verified", "Verified", "Verified", "Verified"]),
      notes: [
        { id: 1, author: "Barangay Administrator", role: "Approving authority", date: "2026-10-13", body: "Approved for release at the next pay-out window; supporting bills checked." },
      ],
      issued: { idNumber: "OSCA-2026-0098", issuedOn: "2026-10-13", validUntil: "2027-10-13" },
    },
    {
      id: "SCA-2026-0026",
      applicant: "Alfonso R. Ibarra",
      residentNo: "RES-2026-04214",
      purok: "Purok 3",
      age: 81,
      sex: "Male",
      birthdate: "1945-04-09",
      mobile: "0947 118 3374",
      address: "60 Riverside Road, Purok 3",
      type: "Pension endorsement",
      submission: "Self-service",
      filed: "2026-10-05",
      assignee: "Rogelio S. Panganiban",
      status: "Rejected",
      request: {
        program: "Monthly pension endorsement",
        category: "Benefit",
        reference: "PEN-2026-0042",
        amount: "₱5,000 / month",
        notes: "Requested endorsement for the national social pension batch.",
      },
      requirements: requirementsFor("senior", ["Verified", "Missing", "Missing", "Missing"]),
      notes: [
        { id: 1, author: "Barangay Administrator", role: "Approving authority", date: "2026-10-08", body: "Rejected — no proof of residency submitted and the bank record does not match the applicant." },
      ],
    },
    {
      id: "SCA-2026-0025",
      applicant: "Divina R. Lopez",
      residentNo: "RES-2026-04200",
      purok: "Purok 2",
      age: 69,
      sex: "Female",
      birthdate: "1957-09-12",
      mobile: "0917 553 2201",
      address: "21 Kalachuchi Street, Purok 2",
      type: "Membership registration",
      submission: "Staff-assisted",
      filed: "2026-09-30",
      assignee: "Records Section",
      status: "For Correction",
      request: {
        program: "Senior citizen registry enrolment",
        category: "Membership",
        reference: "OSCA-2026-0166",
        amount: "—",
        notes: "Enrolment filed together with the pension endorsement of the same member.",
      },
      requirements: requirementsFor("senior", ["Pending", "Verified", "Pending", "Missing"]),
      notes: [
        { id: 1, author: "Records Section", role: "Records Section", date: "2026-10-02", body: "Age proof is a photocopy; please submit the original PSA birth certificate." },
      ],
    },
  ],
  pwd: [
    {
      id: "PWA-2026-0018",
      applicant: "Wilfredo B. Lazaro",
      residentNo: "RES-2026-04224",
      purok: "Purok 4",
      age: 48,
      sex: "Male",
      birthdate: "1978-11-29",
      mobile: "0916 447 2265",
      address: "2 Ilang-Ilang Road, Purok 4",
      type: "Membership registration",
      submission: "Staff-assisted",
      filed: "2026-10-23",
      assignee: "Armando V. Ledesma",
      status: "Pending",
      request: {
        program: "PWD registry enrolment",
        category: "Membership",
        reference: "PWD-2026-0749",
        amount: "—",
        notes: "Reactivation of an expired record after the family transferred back to the purok.",
      },
      requirements: requirementsFor("pwd", ["Verified", "Verified", "Pending", "Pending"]),
      notes: [
        { id: 1, author: "Armando V. Ledesma", role: "PWD Desk", date: "2026-10-23", body: "Clinical abstract received; awaiting the 1×1 photo for the ID application." },
      ],
    },
    {
      id: "PWA-2026-0017",
      applicant: "Fe G. Atienza",
      residentNo: "RES-2026-04213",
      purok: "Purok 1",
      age: 33,
      sex: "Female",
      birthdate: "1993-08-21",
      mobile: "0917 220 4415",
      address: "11 Mabini Street, Purok 1",
      type: "PWD ID issuance",
      submission: "Self-service",
      filed: "2026-10-21",
      assignee: "Records Section",
      status: "Pending",
      request: {
        program: "PWD identification card printing",
        category: "Identification",
        reference: "PWD-2026-0781",
        amount: "Free of charge",
        notes: "Card printing for a member whose record was encoded without a physical ID.",
      },
      requirements: requirementsFor("pwd", ["Verified", "Verified", "Verified", "Pending"]),
      notes: [
        { id: 1, author: "Records Section", role: "Records Section", date: "2026-10-21", body: "Encoded from the resident portal; documents look complete pending final review." },
      ],
    },
    {
      id: "PWA-2026-0016",
      applicant: "Teresita R. Manalo",
      residentNo: "RES-2026-04220",
      purok: "Purok 2",
      age: 61,
      sex: "Female",
      birthdate: "1965-05-16",
      mobile: "0999 664 1187",
      address: "45 Kalachuchi Street, Purok 2",
      type: "PWD ID renewal",
      submission: "Staff-assisted",
      filed: "2026-10-17",
      assignee: "Armando V. Ledesma",
      status: "For Correction",
      request: {
        program: "PWD identification card renewal",
        category: "Identification",
        reference: "PWD-2026-0788",
        amount: "Free of charge",
        notes: "Renewal of a card that expired in September 2026.",
      },
      requirements: requirementsFor("pwd", ["Missing", "Verified", "Pending", "Pending"]),
      notes: [
        { id: 1, author: "Armando V. Ledesma", role: "PWD Desk", date: "2026-10-18", body: "Returned for correction — the medical certificate must be issued within the last three months." },
      ],
    },
    {
      id: "PWA-2026-0015",
      applicant: "Maricel V. Ilagan",
      residentNo: "RES-2026-04207",
      purok: "Purok 6",
      age: 52,
      sex: "Female",
      birthdate: "1974-10-14",
      mobile: "0921 559 7702",
      address: "23 Acacia Street, Purok 6",
      type: "Assistive device request",
      submission: "Staff-assisted",
      filed: "2026-10-13",
      assignee: "Barangay Administrator",
      status: "Rejected",
      request: {
        program: "Quarterly assistive device distribution",
        category: "Benefit",
        reference: "AD-2026-0031",
        amount: "₱6,200",
        notes: "Request for a lightweight wheelchair to replace the unit issued in 2024.",
      },
      requirements: requirementsFor("pwd", ["Verified", "Verified", "Missing", "Missing"]),
      notes: [
        { id: 1, author: "Barangay Administrator", role: "Approving authority", date: "2026-10-16", body: "Rejected — the assessment from the city rehabilitation center was not attached." },
      ],
    },
    {
      id: "PWA-2026-0014",
      applicant: "Ernesto T. Bautista",
      residentNo: "RES-2026-04189",
      purok: "Purok 3",
      age: 59,
      sex: "Male",
      birthdate: "1967-09-25",
      mobile: "0908 771 3345",
      address: "55 Riverside Road, Purok 3",
      type: "Medical assistance",
      submission: "Staff-assisted",
      filed: "2026-10-09",
      assignee: "Barangay Administrator",
      status: "Approved",
      request: {
        program: "PWD medical assistance release",
        category: "Benefit",
        reference: "MA-2026-0079",
        amount: "₱3,500",
        notes: "Dialysis transport allowance for the October cycle.",
      },
      requirements: requirementsFor("pwd", ["Verified", "Verified", "Verified", "Verified"]),
      notes: [
        { id: 1, author: "Barangay Administrator", role: "Approving authority", date: "2026-10-11", body: "Approved for release with the November batch of medical assistance." },
      ],
      issued: { idNumber: "PWD-2026-0744", issuedOn: "2026-10-11", validUntil: "2027-10-11" },
    },
    {
      id: "PWA-2026-0013",
      applicant: "Oliver P. Dimaculangan",
      residentNo: "RES-2026-04205",
      purok: "Purok 2",
      age: 37,
      sex: "Male",
      birthdate: "1989-06-07",
      mobile: "0917 990 5521",
      address: "31 Rizal Avenue, Purok 2",
      type: "PWD ID renewal",
      submission: "Self-service",
      filed: "2026-10-02",
      assignee: "Records Section",
      status: "Approved",
      request: {
        program: "PWD identification card renewal",
        category: "Identification",
        reference: "PWD-2026-0763",
        amount: "Free of charge",
        notes: "Renewal printed on site and released at the records section.",
      },
      requirements: requirementsFor("pwd", ["Verified", "Verified", "Verified", "Verified"]),
      notes: [
        { id: 1, author: "Barangay Administrator", role: "Approving authority", date: "2026-10-05", body: "Approved — replacement card released to the member the same day." },
      ],
      issued: { idNumber: "PWD-2026-0763", issuedOn: "2026-10-05", validUntil: "2027-10-05" },
    },
    {
      id: "PWA-2026-0012",
      applicant: "Jose C. Trinidad",
      residentNo: "RES-2026-04216",
      purok: "Purok 4",
      age: 26,
      sex: "Male",
      birthdate: "2000-02-05",
      mobile: "0939 117 6628",
      address: "88 Narra Road, Purok 4",
      type: "Membership registration",
      submission: "Staff-assisted",
      filed: "2026-09-28",
      assignee: "Armando V. Ledesma",
      status: "For Correction",
      request: {
        program: "PWD registry enrolment",
        category: "Membership",
        reference: "PWD-2026-0784",
        amount: "—",
        notes: "New member with a congenital hearing impairment recorded at birth.",
      },
      requirements: requirementsFor("pwd", ["Pending", "Verified", "Verified", "Missing"]),
      notes: [
        { id: 1, author: "Armando V. Ledesma", role: "PWD Desk", date: "2026-10-01", body: "Clinical abstract must be signed by the city health officer before the eligibility check." },
      ],
    },
  ],
}
