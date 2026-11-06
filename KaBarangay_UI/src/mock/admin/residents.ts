/**
 * Admin portal — resident registry and registration queue.
 *
 * The shapes mirror `Admin/ResidentRegistrationController` / `Admin/ResidentController`
 * and the props of `Admin/Residents.tsx`. Two records live here:
 *
 *   • **Resident** — the official barangay record. Status is `active` or
 *     `inactive` only; a record the admin creates starts inactive and is
 *     `source: "admin"`, which is what makes it a candidate for linking.
 *   • **Registration** — a self-service application. Its lifecycle is
 *     `pending → needs_correction → pending → approved | rejected`, and an
 *     approval never creates a resident: it links the application to an
 *     official record the admin selects explicitly.
 *
 * Everything is in memory. The store is shared across the portal so a resident
 * added on the registry shows up in the linking search, the staff eligibility
 * check, the sector rosters and the population counts.
 */

import { auditTrail } from "@/mock/admin/auditLog"

/* ------------------------------------------------------------------ */
/* Reference data                                                      */
/* ------------------------------------------------------------------ */

/** The barangay the backend stamps on every record it hands the admin desk. */
export const adminBarangay = "Barangay San Isidro"

export type AdminSector = {
  id: number
  name: string
  slug: "senior" | "pwd" | string
}

/** The sector catalog — membership is only ever written by a desk decision. */
export const sectorCatalog: AdminSector[] = [
  { id: 1, name: "Senior Citizens", slug: "senior" },
  { id: 2, name: "Persons with Disability", slug: "pwd" },
]

export type AdminPurok = {
  id: number
  name: string
}

export const puroks: AdminPurok[] = [
  { id: 1, name: "Purok 1" },
  { id: 2, name: "Purok 2" },
  { id: 3, name: "Purok 3" },
  { id: 4, name: "Purok 4" },
  { id: 5, name: "Purok 5" },
  { id: 6, name: "Purok 6" },
]

export const purokName = (id: number | null): string =>
  puroks.find((purok) => purok.id === id)?.name ?? "Purok not recorded"

export const civilStatusOptions = ["Single", "Married", "Widowed", "Separated"] as const

/** Field labels offered by the correction request, keyed by the backend column. */
export const correctionFieldLabels: Record<string, string> = {
  first_name: "First name",
  middle_name: "Middle name",
  last_name: "Last name",
  suffix: "Suffix",
  birthdate: "Birthdate",
  sex: "Sex",
  civil_status: "Civil status",
  address_line: "Address",
  mobile: "Mobile number",
  email: "Email address",
  purok_id: "Purok",
}

/** Document labels the applicant can be asked to re-upload. */
export const correctionDocumentLabels: Record<string, string> = {
  valid_id: "Valid ID",
  live_identity_photo: "Live Identity Photo",
  senior_proof: "Senior Citizen Proof",
  pwd_proof: "PWD Proof",
}

/** A replacement file the applicant uploads through the correction form. */
export type CorrectionUpload = {
  type: string
  mimeType: string
  fileSize: number
  isImage: boolean
}

/** The correction targets are keyed by column name; the record is keyed by property. */
const correctionColumns: Record<string, keyof ResidentRegistration> = {
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
  purok_id: "purokId",
}

/* ------------------------------------------------------------------ */
/* Records                                                             */
/* ------------------------------------------------------------------ */

export type ResidentStatus = "active" | "inactive"

export type ResidentSource = "admin" | "portal" | "imported"

export type QrStatus = "active" | "revoked" | "none"

export type AdminResident = {
  id: number
  /** `resident_number`, e.g. BSI-RES-000142. */
  residentNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  birthdate: string | null
  sex: string | null
  civilStatus: string | null
  addressLine: string | null
  mobile: string | null
  email: string | null
  emailVerified: boolean
  purokId: number | null
  /** `active` or `inactive` — there is no third resident status. */
  status: ResidentStatus
  source: ResidentSource
  approvedAt: string | null
  /** Portal account materialises when a registration is approved against this record. */
  accountExists: boolean
  accountActive: boolean
  qrStatus: QrStatus
  /** Raw scanner payload: `KBQR-…`, the same token the public verify page resolves. */
  qrToken: string | null
  sectors: AdminSector[]
  householdId: number | null
  householdRelationship: string | null
}

export type RegistrationStatus = "pending" | "needs_correction" | "rejected" | "approved"

export type RegistrationDocument = {
  id: number
  type: string
  label: string
  mimeType: string | null
  fileSize: number | null
  verificationStatus: "Pending" | "Verified" | "Rejected"
  isImage: boolean
  isSuperseded: boolean
  sectorSlug: string | null
}

export type CorrectionCycle = {
  cycleNumber: number
  instructions: string
  fieldTargets: string[]
  documentTargets: string[]
  reviewer: string | null
  requestedAt: string | null
  /** Set once the applicant resubmits — the backend re-opens the review then. */
  resubmittedAt: string | null
}

/** The delivery record the tables surface as `Decision email: …`. */
export type DecisionNotification = {
  id: number
  status: "sent" | "queued" | "failed" | "deferred"
  attempts: number
}

export type ResidentRegistration = {
  id: number
  reference: string
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  birthdate: string
  sex: string
  civilStatus: string
  addressLine: string
  mobile: string
  email: string | null
  purokId: number | null
  sectors: AdminSector[]
  documents: RegistrationDocument[]
  status: RegistrationStatus
  submittedAt: string | null
  /** Internal review note recorded with a rejection. */
  reviewNotes: string | null
  /** The only reason text the applicant is emailed. */
  emailSafeReason: string | null
  reviewedAt: string | null
  reviewer: string | null
  lastResubmittedAt: string | null
  /** A scanned QR reference adds a suggestion, it never links on its own. */
  qrReference: string | null
  correctionFieldOptions: string[]
  correctionDocumentOptions: string[]
  correctionCycles: CorrectionCycle[]
  /** Set by `approve` — the official record this application was linked to. */
  matchedResidentId: number | null
  matchedAt: string | null
  /** The decision email the applicant was sent, or `failed` when it could not be. */
  decisionNotification: DecisionNotification | null
}

/**
 * What an applicant's own submission carries. Everything the desk adds later
 * (decision, reviewer, correction cycles) is filled in by `submitRegistration`.
 */
export type NewRegistration = Omit<
  ResidentRegistration,
  | "id"
  | "reference"
  | "status"
  | "documents"
  | "reviewNotes"
  | "emailSafeReason"
  | "reviewedAt"
  | "reviewer"
  | "lastResubmittedAt"
  | "correctionFieldOptions"
  | "correctionDocumentOptions"
  | "correctionCycles"
  | "matchedResidentId"
  | "matchedAt"
  | "decisionNotification"
> & { documents: CorrectionUpload[] }

export type AdminHousehold = {
  id: number
  code: string
  head: string
  purokId: number | null
}

/** A candidate for linking: an official record with no account yet. */
export type ResidentCandidate = {
  id: number
  residentNumber: string
  fullName: string
  birthdate: string | null
  sex: string | null
  purok: string | null
  email: string | null
  status: ResidentStatus
  accountExists: boolean
  accountActive: boolean
  qrSuggested: boolean
}

export const fullNameOf = (
  person: Pick<AdminResident | ResidentRegistration, "firstName" | "middleName" | "lastName" | "suffix">,
): string =>
  [
    person.firstName,
    person.middleName ? `${person.middleName.charAt(0)}.` : null,
    `${person.lastName}${person.suffix ? ` ${person.suffix}` : ""}`,
  ]
    .filter(Boolean)
    .join(" ")

export const ageFromBirthdate = (birthdate: string | null): number | null => {
  if (!birthdate) return null
  const born = new Date(birthdate)
  if (Number.isNaN(born.getTime())) return null
  const now = new Date()
  const years = now.getFullYear() - born.getFullYear()
  const hadBirthday =
    now.getMonth() > born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() >= born.getDate())
  return Math.max(0, years - (hadBirthday ? 0 : 1))
}

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

type ResidentSeed = {
  n: number
  first: string
  middle?: string
  last: string
  birth: string
  sex: "Male" | "Female"
  civil: string
  purok: number
  status?: ResidentStatus
  source?: ResidentSource
  mobile?: string
  email?: string
  verified?: boolean
  account?: boolean
  qr?: QrStatus
  sectors?: Array<"senior" | "pwd">
  household?: [number, string]
}

const sectorOf = (slugs: Array<"senior" | "pwd"> = []): AdminSector[] =>
  slugs.flatMap((slug) => sectorCatalog.filter((sector) => sector.slug === slug))

const residentSeeds: ResidentSeed[] = [
  { n: 142, first: "Maria", middle: "Lacsag", last: "Santos", birth: "1992-03-14", sex: "Female", civil: "Married", purok: 1, mobile: "09174128830", email: "maria.santos@example.com", verified: true, account: true, qr: "active", household: [1, "Head"] },
  { n: 143, first: "Juan", middle: "Dela Cruz", last: "Dela Cruz", birth: "1979-07-02", sex: "Male", civil: "Married", purok: 2, mobile: "09182207741", email: "juandelacruz@example.com", verified: true, account: true, qr: "active", household: [2, "Head"] },
  { n: 144, first: "Ana", middle: "Panganiban", last: "Reyes", birth: "1998-01-27", sex: "Female", civil: "Single", purok: 3, mobile: "09063319012", account: true, qr: "active", sectors: ["pwd"], household: [3, "Daughter"] },
  { n: 145, first: "Pedro", middle: "Salazar", last: "Ramos", birth: "1958-05-09", sex: "Male", civil: "Widowed", purok: 1, mobile: "09198841123", email: "pedro.ramos@example.com", verified: true, account: true, qr: "active", sectors: ["senior"], household: [1, "Father"] },
  { n: 146, first: "Liza", middle: "Manalo", last: "Mendoza", birth: "1995-04-18", sex: "Female", civil: "Single", purok: 4, mobile: "09771102244", household: [4, "Daughter"] },
  { n: 147, first: "Roberto", middle: "Cruz", last: "Garcia", birth: "1954-11-30", sex: "Male", civil: "Married", purok: 2, mobile: "09206653311", email: "r.cruz.garcia@example.com", verified: true, account: true, qr: "active", sectors: ["senior"], household: [2, "Father"] },
  { n: 148, first: "Christine", middle: "Buenaventura", last: "Aguilar", birth: "2001-02-11", sex: "Female", civil: "Single", purok: 5, mobile: "09564428890", account: true, qr: "none", household: [5, "Daughter"] },
  { n: 149, first: "Ernesto", middle: "Tolentino", last: "Bautista", birth: "1967-06-23", sex: "Male", civil: "Married", purok: 3, mobile: "09087713345", sectors: ["senior", "pwd"], household: [3, "Head"] },
  { n: 150, first: "Grace", middle: "Villanueva", last: "Navarro", birth: "1985-09-05", sex: "Female", civil: "Separated", purok: 4, mobile: "09179905521", email: "grace.navarro@example.com", verified: true, account: true, qr: "revoked", household: [4, "Head"] },
  { n: 151, first: "Miguel", middle: "Alcantara", last: "Ferrer", birth: "2007-03-19", sex: "Male", civil: "Single", purok: 6, mobile: "09352286610", household: [6, "Son"] },
  { n: 152, first: "Teresa", middle: "Licuanan", last: "Pascual", birth: "1960-08-14", sex: "Female", civil: "Widowed", purok: 1, mobile: "09184472290", account: true, qr: "active", sectors: ["senior"], household: [1, "Mother"] },
  { n: 153, first: "Danilo", middle: "Rivera", last: "Mercado", birth: "1989-12-01", sex: "Male", civil: "Single", purok: 5, mobile: "09471183374", status: "inactive", household: [5, "Head"] },
  { n: 154, first: "Marites", middle: "Fajardo", last: "Ocampo", birth: "1973-02-27", sex: "Female", civil: "Married", purok: 2, mobile: "09996641187", account: true, qr: "active", household: [2, "Mother"] },
  { n: 155, first: "Ramon", middle: "Espinosa", last: "Villareal", birth: "1952-10-08", sex: "Male", civil: "Married", purok: 3, mobile: "09163309924", sectors: ["senior"], household: [3, "Father"] },
  { n: 156, first: "Jasmine", middle: "Castro", last: "Tolentino", birth: "2004-06-30", sex: "Female", civil: "Single", purok: 6, mobile: "09215597702", household: [6, "Daughter"] },
  { n: 157, first: "Alfredo", middle: "Dizon", last: "Sandoval", birth: "1963-01-16", sex: "Male", civil: "Married", purok: 4, mobile: "09778824416", sectors: ["senior"], household: [4, "Father"] },
  { n: 158, first: "Nena", middle: "Bautista", last: "Salazar", birth: "1981-04-04", sex: "Female", civil: "Married", purok: 5, mobile: "09062248853", sectors: ["pwd"], household: [5, "Mother"] },
  { n: 159, first: "Carlo", middle: "Magsano", last: "Ignacio", birth: "1996-08-21", sex: "Male", civil: "Single", purok: 1, mobile: "09391176628", account: true, qr: "none", household: [1, "Son"] },
  { n: 160, first: "Divina", middle: "Reyes", last: "Lopez", birth: "1957-03-12", sex: "Female", civil: "Widowed", purok: 2, mobile: "09175532201", sectors: ["senior"], status: "inactive", household: [2, "Mother"] },
  { n: 161, first: "Benjamin", middle: "Tolentino", last: "Cruz", birth: "1988-07-19", sex: "Male", civil: "Married", purok: 3, mobile: "09476643390", household: [3, "Son"] },
  { n: 162, first: "Rowena", middle: "AquinO", last: "Mendoza", birth: "1965-05-25", sex: "Female", civil: "Married", purok: 4, mobile: "09273301188", email: "rowena.mendoza@example.com", verified: true, account: true, sectors: ["senior"], source: "imported", household: [4, "Mother"] },
  { n: 163, first: "Emilio", middle: "Nacua", last: "Bactol", birth: "1949-11-11", sex: "Male", civil: "Widowed", purok: 6, mobile: "09361187742", sectors: ["senior"], source: "imported", status: "inactive" },
  { n: 164, first: "Fatima", middle: "Sahibiran", last: "Udtuip", birth: "1993-09-09", sex: "Female", civil: "Single", purok: 6, mobile: "09512276640", source: "imported", sectors: ["pwd"] },
  { n: 165, first: "Gwendolyn", middle: "Pineda", last: "Alforque", birth: "1971-12-23", sex: "Female", civil: "Married", purok: 5, mobile: "09084451127", source: "imported", household: [5, "Mother"] },
  // The barangay workforce — every one of these is an official record with a live portal account.
  { n: 166, first: "Elena", middle: "Reyes", last: "Villamor", birth: "1990-05-14", sex: "Female", civil: "Married", purok: 2, mobile: "09173300112", email: "clerk@sanisidro.ph", verified: true, account: true, qr: "active", household: [2, "Mother"] },
  { n: 167, first: "Rogelio", middle: "Salazar", last: "Panganiban", birth: "1957-02-08", sex: "Male", civil: "Widowed", purok: 1, mobile: "09192207741", email: "senior@sanisidro.ph", verified: true, account: true, qr: "active", sectors: ["senior"], household: [1, "Father"] },
  { n: 168, first: "Armando", middle: "Villanueva", last: "Ledesma", birth: "1970-11-21", sex: "Male", civil: "Married", purok: 5, mobile: "09067741123", email: "pwd@sanisidro.ph", verified: true, account: true, qr: "active", sectors: ["pwd"], household: [5, "Father"] },
  { n: 169, first: "Felix", middle: "Manalo", last: "Aquino", birth: "1968-04-02", sex: "Male", civil: "Married", purok: 3, mobile: "09395520017", email: "lupon@sanisidro.ph", verified: true, account: true, household: [3, "Head"] },
  { n: 170, first: "Cristina", middle: "Dizon", last: "Bactol", birth: "1983-09-30", sex: "Female", civil: "Single", purok: 4, mobile: "09271180643", email: "senior.staff@sanisidro.ph", account: true, qr: "none" },
  { n: 171, first: "Roberto", middle: "Mercado", last: "Villanueva", birth: "1966-01-19", sex: "Male", civil: "Married", purok: 1, mobile: "09170004412", email: "admin@sanisidro.ph", verified: true, account: true, qr: "active", household: [7, "Head"] },
  { n: 172, first: "Joselyn", middle: "Panganiban", last: "Ramos", birth: "1994-07-07", sex: "Female", civil: "Single", purok: 6, mobile: "09513370024", email: "pwd.staff@sanisidro.ph", account: true, qr: "revoked", sectors: ["pwd"], household: [6, "Daughter"] },
]

const addressOf = (purokId: number, n: number): string =>
  `${100 + (n % 40)} Riverside Road, ${purokName(purokId)}, Barangay San Isidro, City of Santa Rosa, Laguna`

const qrTokenFor = (residentNumber: string): string =>
  `KBQR-${residentNumber.slice(-6)}-2026`

/** A brand-new household gets an unguessable code, never a sequence. */
const randomHouseholdSuffix = (): string =>
  Array.from({ length: 8 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("")

function seedResidents(): AdminResident[] {
  return residentSeeds.map((seed) => {
    const status = seed.status ?? "active"
    const source = seed.source ?? "admin"
    const accountExists = seed.account ?? false
    const qr = seed.qr ?? "none"
    return {
      id: seed.n,
      residentNumber: `BSI-RES-${String(seed.n).padStart(6, "0")}`,
      firstName: seed.first,
      middleName: seed.middle ?? null,
      lastName: seed.last,
      suffix: null,
      birthdate: seed.birth,
      sex: seed.sex,
      civilStatus: seed.civil,
      addressLine: addressOf(seed.purok, seed.n),
      mobile: seed.mobile ?? null,
      email: seed.email ?? null,
      emailVerified: seed.verified ?? false,
      purokId: seed.purok,
      status,
      source,
      approvedAt: status === "active" ? "2026-01-12" : null,
      accountExists,
      // An inactive resident never keeps a live login.
      accountActive: accountExists && status === "active",
      qrStatus: qr,
      qrToken: qr === "none" ? null : qrTokenFor(`BSI-RES-${String(seed.n).padStart(6, "0")}`),
      sectors: sectorOf(seed.sectors),
      householdId: seed.household ? seed.household[0] : null,
      householdRelationship: seed.household ? seed.household[1] : null,
    }
  })
}

export const householdSeeds: AdminHousehold[] = [
  { id: 1, code: "HH-0001", head: "Maria L. Santos", purokId: 1 },
  { id: 2, code: "HH-0002", head: "Juan D. Dela Cruz", purokId: 2 },
  { id: 3, code: "HH-0003", head: "Ernesto T. Bautista", purokId: 3 },
  { id: 4, code: "HH-0004", head: "Grace V. Navarro", purokId: 4 },
  { id: 5, code: "HH-0005", head: "Danilo R. Mercado", purokId: 5 },
  { id: 6, code: "HH-0006", head: "Miguel A. Ferrer", purokId: 6 },
  { id: 7, code: "HH-0007", head: "Roberto M. Villanueva", purokId: 1 },
]

type RegistrationSeed = {
  id: number
  ref: string
  first: string
  middle?: string
  last: string
  birth: string
  sex: "Male" | "Female"
  civil: string
  purok: number
  mobile: string
  email?: string
  status: RegistrationStatus
  submitted: string
  sectors?: Array<"senior" | "pwd">
  docs: Array<[string, RegistrationDocument["verificationStatus"]?]>
  notes?: string
  emailSafe?: string
  reviewer?: string
  reviewed?: string
  resubmitted?: string
  qr?: string | null
  notif?: { status: DecisionNotification["status"]; attempts: number }
  cycles?: Array<{ instructions: string; fields: string[]; documents: string[]; resubmittedAt?: string }>
  /** The official record an approved application was linked to. */
  matchedResident?: number
}

const documentLabel: Record<string, string> = {
  valid_id: "Valid ID",
  live_identity_photo: "Live Identity Photo",
  senior_proof: "Senior Citizen Proof",
  pwd_proof: "PWD Proof",
}

function documentsOf(
  entries: Array<[string, RegistrationDocument["verificationStatus"]?]>,
  startId: number,
): RegistrationDocument[] {
  return entries.map(([type, verificationStatus], index) => ({
    id: startId + index,
    type,
    label: documentLabel[type] ?? type,
    mimeType: type === "live_identity_photo" ? "image/jpeg" : "application/pdf",
    fileSize: 120_000 + index * 48_000,
    verificationStatus: verificationStatus ?? "Pending",
    isImage: type === "live_identity_photo",
    isSuperseded: false,
    sectorSlug: type === "senior_proof" ? "senior" : type === "pwd_proof" ? "pwd" : null,
  }))
}

const registrationSeeds: RegistrationSeed[] = [
  {
    id: 1, ref: "REG-2026-0318", first: "Liza", middle: "Manalo", last: "Mendoza", birth: "1995-04-18",
    sex: "Female", civil: "Single", purok: 4, mobile: "09771102244", email: "liza.mendoza@gmail.com",
    status: "pending", submitted: "2026-10-28", docs: [["valid_id", "Verified"], ["live_identity_photo"]],
    qr: "KBQR-145145-2026",
  },
  {
    id: 2, ref: "REG-2026-0317", first: "Jasmine", middle: "Castro", last: "Tolentino", birth: "2004-06-30",
    sex: "Female", civil: "Single", purok: 6, mobile: "09215597702", email: "jasmine.tolentino@gmail.com",
    status: "pending", submitted: "2026-10-27", docs: [["valid_id"], ["live_identity_photo", "Rejected"]],
  },
  {
    id: 3, ref: "REG-2026-0316", first: "Miguel", middle: "Alcantara", last: "Ferrer", birth: "2007-03-19",
    sex: "Male", civil: "Single", purok: 6, mobile: "09352286610", status: "pending", submitted: "2026-10-26",
    sectors: ["pwd"], docs: [["valid_id", "Verified"], ["pwd_proof"], ["live_identity_photo", "Verified"]],
  },
  {
    id: 4, ref: "REG-2026-0315", first: "Divina", middle: "Reyes", last: "Lopez", birth: "1957-03-12",
    sex: "Female", civil: "Widowed", purok: 2, mobile: "09175532201", status: "pending", submitted: "2026-10-25",
    sectors: ["senior"], docs: [["valid_id", "Verified"], ["senior_proof"], ["live_identity_photo"]],
    qr: "KBQR-159160-2026",
  },
  {
    id: 5, ref: "REG-2026-0314", first: "Arnold", middle: "Paglinagan", last: "Dizon", birth: "1999-10-02",
    sex: "Male", civil: "Single", purok: 5, mobile: "09471189952", email: "arnold.dizon@gmail.com",
    status: "needs_correction", submitted: "2026-10-22",
    docs: [["valid_id", "Rejected"], ["live_identity_photo"]],
    cycles: [
      {
        instructions:
          "The Valid ID is blurry and the Live Identity Photo was taken against a patterned wall. Please re-upload a clear government ID and a plain-background selfie.",
        fields: ["address_line"],
        documents: ["valid_id", "live_identity_photo"],
      },
    ],
  },
  {
    id: 6, ref: "REG-2026-0313", first: "Susan", middle: "Gopez", last: "Manalo", birth: "1982-01-25",
    sex: "Female", civil: "Married", purok: 3, mobile: "09172204468", email: "susan.manalo@example.com",
    status: "needs_correction", submitted: "2026-10-20", resubmitted: "2026-10-24",
    docs: [["valid_id", "Verified"], ["live_identity_photo", "Verified"]],
    cycles: [
      {
        instructions: "Address is missing the purok house number, and the mobile number cannot be reached.",
        fields: ["address_line", "mobile"],
        documents: [],
        resubmittedAt: "2026-10-24",
      },
    ],
  },
  {
    id: 7, ref: "REG-2026-0312", first: "Joel", middle: "Bautista", last: "Ramirez", birth: "1991-06-14",
    sex: "Male", civil: "Single", purok: 1, mobile: "09563301174", status: "rejected", submitted: "2026-10-18",
    notes: "Submitted an ID that does not belong to the applicant; two applications for the same household.",
    emailSafe: "The identity documents did not match the applicant's name. Please re-apply with your own valid ID.",
    reviewer: "Barangay Admin", reviewed: "2026-10-21",
    notif: { status: "failed", attempts: 3 },
    docs: [["valid_id", "Rejected"], ["live_identity_photo", "Verified"]],
  },
  {
    id: 8, ref: "REG-2026-0311", first: "Nestor", middle: "Balingit", last: "Salvador", birth: "1975-08-08",
    sex: "Male", civil: "Married", purok: 2, mobile: "09081122334", status: "rejected", submitted: "2026-10-15",
    notes: "Proof of residence shows a property outside barangay boundaries.",
    reviewer: "Barangay Admin", reviewed: "2026-10-19",
    docs: [["valid_id", "Verified"]],
  },
  {
    id: 9, ref: "REG-2026-0310", first: "Rowena", middle: "Aguinaldo", last: "Mendoza", birth: "1965-05-25",
    sex: "Female", civil: "Married", purok: 4, mobile: "09273301188", email: "rowena.mendoza@example.com",
    status: "approved", submitted: "2026-10-09",
    sectors: ["senior"], reviewer: "Barangay Admin", reviewed: "2026-10-12", matchedResident: 162,
    notif: { status: "failed", attempts: 2 },
    docs: [["valid_id", "Verified"], ["senior_proof", "Verified"], ["live_identity_photo", "Verified"]],
  },
  {
    id: 10, ref: "REG-2026-0309", first: "Milagros", middle: "Amparo", last: "Perez", birth: "1965-02-03",
    sex: "Female", civil: "Widowed", purok: 4, mobile: "09178845520", status: "pending", submitted: "2026-10-30",
    sectors: ["senior"], docs: [["valid_id", "Verified"], ["senior_proof"], ["live_identity_photo"]],
  },
]

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export type CreateResidentInput = {
  purokId: number
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  birthdate: string
  sex: string
  civilStatus: string
  addressLine: string
  mobile: string
  email: string | null
  householdMode: "none" | "new" | "existing"
  householdId: number | null
  householdRelationship: string | null
}

export type CorrectionRequest = {
  instructions: string
  fieldTargets: string[]
  documentTargets: string[]
}

/** Every write in this desk answers with the flash message the backend returns. */
export type ActionResult = { ok: boolean; message: string }

export const residentPageSize = 15

const digitsOf = (value: string | null): string => (value ?? "").replace(/\D/g, "")

const normalizeEmail = (value: string | null): string => (value ?? "").trim().toLowerCase()

/** The outbox only accepts a syntactically usable recipient address. */
const hasRecipient = (value: string | null): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value))

/** The approve flash prints the delivery state of the approval email. */
const approvalEmailStatus = (notification: DecisionNotification): string => {
  if (notification.status === "sent") return "Approval email sent."
  if (notification.status === "failed")
    return "Approval email could not be sent. Retry the email from the registration notification details."
  if (notification.status === "deferred")
    return "Approval email was deferred. No email was supplied or the notification is not currently eligible."
  return "Approval email is pending delivery. Check the registration notification details."
}

function createResidentRegistry() {
  let residents = seedResidents()
  let households = [...householdSeeds]
  let nextResidentId = residents.reduce((max, item) => Math.max(max, item.id), 0) + 1
  let nextHouseholdId = households.reduce((max, item) => Math.max(max, item.id), 0) + 1

  let nextDocumentId = 5_000
  let nextNotificationId = 100

  let registrations: ResidentRegistration[] = registrationSeeds.map((seed) => ({
    id: seed.id,
    reference: seed.ref,
    firstName: seed.first,
    middleName: seed.middle ?? null,
    lastName: seed.last,
    suffix: null,
    birthdate: seed.birth,
    sex: seed.sex,
    civilStatus: seed.civil,
    addressLine: addressOf(seed.purok, seed.id),
    mobile: seed.mobile,
    email: seed.email ?? null,
    purokId: seed.purok,
    sectors: sectorOf(seed.sectors),
    documents: documentsOf(seed.docs, nextDocumentId++ * 10),
    status: seed.status,
    submittedAt: seed.submitted,
    reviewNotes: seed.notes ?? null,
    emailSafeReason: seed.emailSafe ?? null,
    reviewedAt: seed.reviewed ?? null,
    reviewer: seed.reviewer ?? null,
    lastResubmittedAt: seed.resubmitted ?? null,
    qrReference: seed.qr ?? null,
    correctionFieldOptions: Object.keys(correctionFieldLabels),
    correctionDocumentOptions: seed.docs.map(([type]) => type),
    correctionCycles: (seed.cycles ?? []).map((cycle, index) => ({
      cycleNumber: index + 1,
      instructions: cycle.instructions,
      fieldTargets: cycle.fields,
      documentTargets: cycle.documents,
      reviewer: "Barangay Admin",
      requestedAt: seed.reviewed ?? seed.submitted,
      resubmittedAt: cycle.resubmittedAt ?? null,
    })),
    matchedResidentId: seed.matchedResident ?? null,
    matchedAt: seed.status === "approved" ? seed.reviewed ?? null : null,
    decisionNotification: seed.notif ? { id: seed.id, ...seed.notif } : null,
  }))

  const byId = (id: number) => residents.find((resident) => resident.id === id) ?? null

  return {
    /* Registry ----------------------------------------------------- */
    residents(): AdminResident[] {
      return residents
    },

    residentById(id: number): AdminResident | null {
      return byId(id)
    },

    households(): AdminHousehold[] {
      return households
    },

    householdMembers(householdId: number): AdminResident[] {
      return residents.filter((resident) => resident.householdId === householdId)
    },

    householdCount(): number {
      return households.length
    },

    /** Resident and household counts per purok, derived like the controller query. */
    purokCounts(): Array<AdminPurok & { household_count: number; resident_count: number }> {
      // The chip counts use the same approved-account scope as the directory.
      const approved = residents.filter((resident) => resident.accountExists && resident.accountActive)

      return puroks.map((purok) => ({
        ...purok,
        resident_count: approved.filter((resident) => resident.purokId === purok.id).length,
        household_count: households.filter((household) => household.purokId === purok.id).length,
      }))
    },

    stats() {
      const approved = residents.filter(
        (resident) => resident.accountExists && resident.accountActive,
      ).length

      return {
        totalResidents: approved,
        // The controller reports the roster tile twice: every listed resident counts as active.
        activeResidents: approved,
        pendingRegistrations: registrations.filter(
          (registration) => registration.status === "pending",
        ).length,
        totalHouseholds: households.length,
      }
    },

    /** Added by the admin — the only records an approval may link to. */
    addedByAdmin(): AdminResident[] {
      return residents.filter((resident) => resident.source === "admin")
    },

    /* Population ---------------------------------------------------- */

    /**
     * Population Monitoring counts. Only `residents` rows are population, and
     * only while their status is active; senior and PWD membership overlap, so
     * the categories are not mutually exclusive.
     */
    populationStats() {
      const active = residents.filter((resident) => resident.status === "active")
      const inSector = (resident: AdminResident, slug: string) =>
        resident.sectors.some((sector) => sector.slug === slug)
      const pipeline = registrations.reduce<Record<string, number>>((totals, registration) => {
        totals[registration.status] = (totals[registration.status] ?? 0) + 1
        return totals
      }, {})

      return {
        totalResidents: active.length,
        seniorCitizens: active.filter((resident) => inSector(resident, "senior")).length,
        pwdMembers: active.filter((resident) => inSector(resident, "pwd")).length,
        seniorAndPwd: active.filter(
          (resident) => inSector(resident, "senior") && inSector(resident, "pwd"),
        ).length,
        regularResidents: active.filter((resident) => resident.sectors.length === 0).length,
        inactiveResidents: residents.length - active.length,
        pendingRegistrations:
          (pipeline.pending ?? 0) + (pipeline.needs_correction ?? 0),
        rejectedRegistrations: pipeline.rejected ?? 0,
      }
    },

    /** One row per purok, in the catalog's own order. */
    populationPuroks() {
      const active = residents.filter((resident) => resident.status === "active")
      return puroks.map((purok) => {
        const here = active.filter((resident) => resident.purokId === purok.id)
        const inSector = (slug: string) =>
          here.filter((resident) => resident.sectors.some((sector) => sector.slug === slug)).length
        return { ...purok, total: here.length, seniors: inSector("senior"), pwd: inSector("pwd") }
      })
    },

    /* Registration queue ------------------------------------------- */
    registrations(): ResidentRegistration[] {
      return registrations
    },

    registrationsIn(...statuses: RegistrationStatus[]): ResidentRegistration[] {
      return registrations.filter((registration) => statuses.includes(registration.status))
    },

    registrationById(id: number): ResidentRegistration | null {
      return registrations.find((registration) => registration.id === id) ?? null
    },

    registrationByReference(reference: string): ResidentRegistration | null {
      return registrations.find((registration) => registration.reference === reference) ?? null
    },

    /**
     * `Resident\RegistrationController::store()` — the applicant's own
     * submission. It lands in the same queue the Admin desk works through, so
     * what the wizard files and what the clerk reviews are one record.
     */
    submitRegistration(
      input: NewRegistration,
    ): { ok: true; reference: string } | { ok: false; field: "registration"; message: string } {
      // `ResidentRegistrationDuplicateChecker` looks at the live applications only.
      const duplicate = registrations
        .filter((item) => item.status !== "rejected")
        .find(
          (item) =>
            digitsOf(item.mobile) === digitsOf(input.mobile) ||
            (item.email !== null &&
              input.email !== null &&
              normalizeEmail(item.email) === normalizeEmail(input.email)),
        )

      if (duplicate)
        return {
          ok: false,
          field: "registration",
          message:
            duplicate.mobile && digitsOf(duplicate.mobile) === digitsOf(input.mobile)
              ? "A registration using this mobile number already exists."
              : "A registration using this email address already exists.",
        }

      const id = registrations.reduce((max, item) => Math.max(max, item.id), 0) + 1
      const reference = `REG-2026-${String(400 + id).padStart(4, "0")}`

      registrations = [
        {
          ...input,
          id,
          reference,
          documents: input.documents.map((document, index) => ({
            id: nextDocumentId * 10 + index,
            type: document.type,
            label: documentLabel[document.type] ?? document.type,
            mimeType: document.mimeType,
            fileSize: document.fileSize,
            verificationStatus: "Pending" as const,
            isImage: document.isImage,
            isSuperseded: false,
            sectorSlug:
              document.type === "senior_proof"
                ? "senior"
                : document.type === "pwd_proof"
                  ? "pwd"
                  : null,
          })),
          status: "pending",
          reviewNotes: null,
          emailSafeReason: null,
          reviewedAt: null,
          reviewer: null,
          lastResubmittedAt: null,
          correctionFieldOptions: Object.keys(correctionFieldLabels),
          correctionDocumentOptions: input.documents.map((document) => document.type),
          correctionCycles: [],
          matchedResidentId: null,
          matchedAt: null,
          decisionNotification: null,
        },
        ...registrations,
      ]

      nextDocumentId += 1

      return { ok: true, reference }
    },

    /** Newest application linked to this resident — the one its email block reads. */
    latestMatchedRegistration(residentId: number): ResidentRegistration | null {
      return (
        registrations
          .filter((registration) => registration.matchedResidentId === residentId)
          .sort((a, b) => b.id - a.id)[0] ?? null
      )
    },

    /**
     * Candidates for the linking step. Only admin-created records in this
     * barangay are offered, and a record that already carries an account is
     * surfaced with its warning rather than hidden — the backend disables the
     * button instead of filtering the row out.
     */
    candidates(registrationId: number, search: string): ResidentCandidate[] {
      const registration = this.registrationById(registrationId)
      const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean)

      const candidateOf = (resident: AdminResident): ResidentCandidate => ({
        id: resident.id,
        residentNumber: resident.residentNumber,
        fullName: fullNameOf(resident),
        birthdate: resident.birthdate,
        sex: resident.sex,
        purok: resident.purokId ? purokName(resident.purokId) : null,
        email: resident.email,
        status: resident.status,
        accountExists: resident.accountExists,
        accountActive: resident.accountActive,
        // A QR reference adds a suggestion only — it never links on its own.
        qrSuggested:
          resident.qrToken !== null && registration?.qrReference === resident.qrToken,
      })

      const matches = residents
        .filter((resident) => resident.source === "admin")
        .filter((resident) =>
          terms.every((term) =>
            [
              resident.residentNumber,
              resident.firstName,
              resident.middleName ?? "",
              resident.lastName,
              resident.email ?? "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(term),
          ),
        )
        .sort(
          (a, b) =>
            a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
        )
        .slice(0, 20)
        .map(candidateOf)

      const suggested = residents.find(
        (resident) =>
          resident.qrToken !== null &&
          registration?.qrReference === resident.qrToken &&
          !matches.some((match) => match.id === resident.id),
      )

      return suggested ? [candidateOf(suggested), ...matches] : matches
    },

    /**
     * Approval links the application to an official record, materialises the
     * portal account, activates the resident and syncs the sector membership.
     * It never creates a resident.
     */
    approve(registrationId: number, residentId: number): ActionResult {
      const registration = this.registrationById(registrationId)
      const resident = byId(residentId)

      if (!registration || !resident) return { ok: false, message: "That application or record no longer exists." }
      if (registration.matchedResidentId !== null)
        return { ok: false, message: "This registration has already been linked to a Resident." }
      if (registration.status !== "pending")
        return { ok: false, message: "This registration is no longer available for linking." }
      if (resident.source !== "admin")
        return { ok: false, message: "Select an Admin-added Resident from this barangay." }
      if (resident.accountExists)
        return {
          ok: false,
          message: "This Resident already has an account. Existing account credentials were not changed.",
        }

      const today = new Date().toISOString().slice(0, 10)

      residents = residents.map((item) =>
        item.id === residentId
          ? {
              ...item,
              status: "active",
              accountExists: true,
              accountActive: true,
              approvedAt: today,
              // The application's sector selections carry over to the record.
              sectors: registration.sectors.length > 0 ? registration.sectors : item.sectors,
              email: item.email ?? registration.email,
            }
          : item,
      )

      // The outbox defers when the application supplied no usable recipient.
      const notification: DecisionNotification = {
        id: nextNotificationId++,
        status: hasRecipient(registration.email) ? "queued" : "deferred",
        attempts: hasRecipient(registration.email) ? 1 : 0,
      }

      registrations = registrations.map((item) =>
        item.id === registrationId
          ? {
              ...item,
              status: "approved",
              matchedResidentId: residentId,
              matchedAt: today,
              reviewedAt: today,
              reviewer: "Barangay Admin",
              decisionNotification: notification,
            }
          : item,
      )

      auditTrail.record("resident_registration.approved")
      auditTrail.record("resident_registration.matched")
      return {
        ok: true,
        message: `Registration approved and linked to ${resident.residentNumber}. ${approvalEmailStatus(
          notification,
        )}`,
      }
    },

    reject(
      registrationId: number,
      reason: string,
      emailSafeReason: string | null,
    ): ActionResult {
      const registration = this.registrationById(registrationId)
      if (!registration) return { ok: false, message: "That application no longer exists." }
      if (reason.trim().length < 5 || reason.trim().length > 1000)
        return { ok: false, message: "The internal review note must be 5 to 1000 characters." }

      const today = new Date().toISOString().slice(0, 10)
      // An empty reason is replaced by the generic one, so a decision email is
      // always queued — it is only deferred when there is no recipient address.
      registrations = registrations.map((item) =>
        item.id === registrationId
          ? {
              ...item,
              status: "rejected",
              reviewNotes: reason.trim(),
              emailSafeReason: emailSafeReason?.trim()
                ? emailSafeReason.trim()
                : "Hindi naaprubahan ang iyong application. Makipag-ugnayan sa barangay office para sa karagdagang detalye.",
              reviewedAt: today,
              reviewer: "Barangay Admin",
              decisionNotification: {
                id: nextNotificationId++,
                status: hasRecipient(item.email) ? "queued" : "deferred",
                attempts: hasRecipient(item.email) ? 1 : 0,
              },
            }
          : item,
      )

      auditTrail.record("resident_registration.rejected")
      return { ok: true, message: "Resident application rejected." }
    },

    /**
     * Sends the application back to the applicant. Fields and documents are
     * the only targets — sectors, identity, accounts, QR credentials and the
     * status itself cannot be changed through a correction request.
     */
    requestCorrection(
      registrationId: number,
      request: CorrectionRequest,
    ): { ok: boolean; message: string } {
      const registration = this.registrationById(registrationId)
      if (!registration) return { ok: false, message: "That application no longer exists." }
      if (registration.status !== "pending")
        return { ok: false, message: "Only a pending application can be returned for correction." }
      if (request.instructions.trim().length === 0)
        return { ok: false, message: "Write the instructions the applicant will see." }
      // The backend has a unique (registration, cycle) guard: one open request at a time.
      const openCycle = registration.correctionCycles.at(-1)
      if (openCycle && openCycle.resubmittedAt === null)
        return {
          ok: false,
          message: "A correction request was already recorded. Refresh the application before trying again.",
        }

      const today = new Date().toISOString().slice(0, 10)
      registrations = registrations.map((item) =>
        item.id === registrationId
          ? {
              ...item,
              status: "needs_correction",
              correctionCycles: [
                ...item.correctionCycles,
                {
                  cycleNumber: item.correctionCycles.length + 1,
                  instructions: request.instructions.trim(),
                  fieldTargets: request.fieldTargets,
                  documentTargets: request.documentTargets,
                  reviewer: "Barangay Admin",
                  requestedAt: today,
                  resubmittedAt: null,
                },
              ],
            }
          : item,
      )

      auditTrail.record("resident_registration.correction_requested")
      return {
        ok: true,
        message: "Correction instructions were sent to the applicant’s secure application page.",
      }
    },

    /** Re-delivering a decision email; the queue may still refuse. */
    retryDecisionNotification(registrationId: number): { ok: boolean; message: string } {
      const registration = this.registrationById(registrationId)
      const notification = registration?.decisionNotification
      if (!registration || !notification)
        return { ok: false, message: "There is no decision email to resend for this application." }

      const delivered = notification.status === "failed" && notification.attempts >= 2

      registrations = registrations.map((item) =>
        item.id === registrationId
          ? {
              ...item,
              decisionNotification: {
                ...notification,
                status: delivered ? "sent" : "failed",
                attempts: notification.attempts + 1,
              },
            }
          : item,
      )

      return {
        ok: delivered,
        message: delivered
          ? "Registration notification sent."
          : "Registration notification remains unavailable for delivery.",
      }
    },

    /**
     * The applicant resubmits — the backend re-opens the record for review.
     * `fields` carries only the correction targets the applicant was authorized
     * to edit, and every `documents` entry replaces the one it supersedes.
     */
    resubmit(
      registrationId: number,
      fields: Record<string, string | null> = {},
      documents: CorrectionUpload[] = [],
    ): void {
      const today = new Date().toISOString().slice(0, 10)

      registrations = registrations.map((item) => {
        if (item.id !== registrationId) return item

        const corrected = { ...item }

        for (const [key, value] of Object.entries(fields)) {
          const column = correctionColumns[key]
          if (!column) continue
          Object.assign(corrected, {
            [column]: column === "purokId" ? Number(value) : (value ?? null),
          })
        }

        const replaced = documents.map((upload, index) => ({
          id: nextDocumentId * 10 + index,
          type: upload.type,
          label: correctionDocumentLabels[upload.type] ?? upload.type,
          mimeType: upload.mimeType,
          fileSize: upload.fileSize,
          verificationStatus: "Pending" as const,
          isImage: upload.isImage,
          isSuperseded: false,
          sectorSlug:
            upload.type === "senior_proof"
              ? "senior"
              : upload.type === "pwd_proof"
                ? "pwd"
                : null,
        }))

        nextDocumentId += 1

        return {
          ...corrected,
          status: "pending",
          lastResubmittedAt: today,
          reviewedAt: null,
          reviewer: null,
          reviewNotes: null,
          documents: [
            ...item.documents.map((document) =>
              replaced.some((replacement) => replacement.type === document.type)
                ? { ...document, isSuperseded: true }
                : document,
            ),
            ...replaced,
          ],
          correctionCycles: item.correctionCycles.map((cycle, index) =>
            index === item.correctionCycles.length - 1 ? { ...cycle, resubmittedAt: today } : cycle,
          ),
        }
      })

      auditTrail.record("resident_registration.submitted")
    },

    /* Resident actions --------------------------------------------- */
    setResidentStatus(id: number, status: ResidentStatus): ActionResult {
      const resident = byId(id)
      if (!resident) return { ok: false, message: "Resident not found." }
      residents = residents.map((item) =>
        item.id === id ? { ...item, status } : item,
      )
      auditTrail.record("resident.status_changed")
      return {
        ok: true,
        message: status === "active" ? "Resident activated successfully." : "Resident deactivated successfully.",
      }
    },

    setAccountStatus(id: number, active: boolean): ActionResult {
      const resident = byId(id)
      if (!resident) return { ok: false, message: "Resident not found." }
      if (!resident.accountExists)
        return { ok: false, message: "That resident has no portal account yet." }
      residents = residents.map((item) => (item.id === id ? { ...item, accountActive: active } : item))
      auditTrail.record("resident.account_status_changed")
      return {
        ok: true,
        message: active ? "Resident login account enabled." : "Resident login account disabled.",
      }
    },

    revokeQr(id: number): ActionResult {
      const resident = byId(id)
      if (!resident) return { ok: false, message: "Resident not found." }
      if (resident.qrStatus !== "active")
        return { ok: false, message: "This resident has no active QR credential to revoke." }
      residents = residents.map((item) =>
        item.id === id ? { ...item, qrStatus: "revoked" } : item,
      )
      return { ok: true, message: "QR credential revoked successfully." }
    },

    /** Issue and reissue both mint a fresh token; the old one stops resolving. */
    issueQr(id: number): ActionResult {
      const resident = byId(id)
      if (!resident) return { ok: false, message: "Resident not found." }
      const token = `${qrTokenFor(resident.residentNumber).replace(/-\d{4}$/, "")}-${String(
        Math.floor(Math.random() * 9000) + 1000,
      )}`
      residents = residents.map((item) =>
        item.id === id ? { ...item, qrStatus: "active", qrToken: token } : item,
      )
      return { ok: true, message: "QR credential reissued successfully." }
    },

    /** The credential panel: token plus the URL a scan resolves to. */
    qrCredential(id: number): { residentNumber: string; token: string; verifyUrl: string } | null {
      const resident = byId(id)
      if (!resident || resident.qrStatus !== "active" || !resident.qrToken) return null
      return {
        residentNumber: resident.residentNumber,
        token: resident.qrToken,
        verifyUrl: `/verify/resident/${resident.qrToken}`,
      }
    },

    /* Add resident -------------------------------------------------- */
    /**
     * Admin-created residents are canonical but inactive: the record exists for
     * linking, and the account only materialises when a registration is
     * approved against it.
     */
    createResident(input: CreateResidentInput): { ok: boolean; message: string; field?: string; id?: number } {
      const mobile = digitsOf(input.mobile)
      const email = normalizeEmail(input.email)

      if (residents.some((resident) => digitsOf(resident.mobile) === mobile))
        return {
          ok: false,
          field: "mobile",
          message: "A resident with this mobile number already exists in your barangay.",
        }
      if (email && residents.some((resident) => normalizeEmail(resident.email) === email))
        return {
          ok: false,
          field: "email",
          message: "A resident with this email address already exists in your barangay.",
        }

      const id = nextResidentId++
      const sequence = String(id).padStart(6, "0")
      // The credential is minted with the record, before any account exists.
      const token = qrTokenFor(`BSI-RES-${sequence}`)

      let householdId = input.householdId
      let householdCode: string | null = null

      if (input.householdMode === "new") {
        householdId = nextHouseholdId++
        householdCode = `HH-${randomHouseholdSuffix()}`
        households = [
          ...households,
          {
            id: householdId,
            code: householdCode,
            head: [input.firstName.trim(), input.middleName?.trim(), input.lastName.trim()]
              .filter((part): part is string => Boolean(part))
              .join(" "),
            purokId: input.purokId,
          },
        ]
      }

      // A new household has no other member: the resident who created it is its head.
      const relationship =
        input.householdMode === "new" ? "Head" : input.householdRelationship

      residents = [
        {
          id,
          residentNumber: `BSI-RES-${sequence}`,
          firstName: input.firstName.trim(),
          middleName: input.middleName?.trim() || null,
          lastName: input.lastName.trim(),
          suffix: input.suffix?.trim() || null,
          birthdate: input.birthdate,
          sex: input.sex,
          civilStatus: input.civilStatus,
          addressLine: input.addressLine.trim(),
          mobile: mobile || null,
          email: email || null,
          emailVerified: false,
          purokId: input.purokId,
          status: "inactive",
          source: "admin",
          approvedAt: null,
          accountExists: false,
          accountActive: false,
          qrStatus: "active",
          qrToken: token,
          sectors: [],
          householdId: input.householdMode === "none" ? null : householdId,
          householdRelationship: input.householdMode === "none" ? null : relationship,
        },
        ...residents,
      ]

      return {
        ok: true,
        id,
        message: email
          ? "Resident created. The registration invitation asks them to prepare their Resident ID and QR reference."
          : "Resident created. No registration invitation was sent because no email address was provided.",
      }
    },

    searchHouseholds(search: string): Array<AdminHousehold & { members_count: number }> {
      const needle = search.trim().toLowerCase()
      // The endpoint refuses anything shorter than two characters.
      if (needle.length < 2) return []

      const matches = households
        .filter((household) => {
          const haystack = [
            household.code,
            // The head is matched name part by name part, as the query does.
            ...household.head.split(/\s+/),
          ]
            .join(" ")
            .toLowerCase()
          return haystack.includes(needle)
        })
        .sort((a, b) => a.code.localeCompare(b.code))
        .slice(0, 15)

      return matches.map((household) => ({
        ...household,
        members_count: residents.filter((resident) => resident.householdId === household.id).length,
      }))
    },

    /** Resident numbers still available for linking, newest first. */
    nextResidentNumber(): string {
      return `BSI-RES-${String(nextResidentId).padStart(6, "0")}`
    },
  }
}

/**
 * One registry for the whole session, so a record created in the Residents
 * page is the record the Staff, Sector, Population and Dashboard pages read.
 */
export const residentRegistry = createResidentRegistry()

/** Household rows with their live member count, as the Households tab lists them. */
export function householdRows() {
  return residentRegistry.households().map((household) => ({
    ...household,
    purok: household.purokId ? purokName(household.purokId) : null,
    members_count: residentRegistry.householdMembers(household.id).length,
  }))
}

/**
 * The public QR resolution, mirroring `Resident\QrVerificationController`.
 *
 * A credential is valid only when the token exists, is active and unrevoked,
 * and still belongs to a resident whose own status is `active`. Anything else
 * answers the same way — the page never learns which condition failed, and no
 * identifying field is ever returned.
 */
export function verifyQrToken(token: string): {
  valid: boolean
  message: string
  barangay: null
} {
  const holder = residentRegistry
    .residents()
    .find((resident) => resident.qrToken === token && resident.qrStatus === "active")

  if (!holder || holder.status !== "active")
    return { valid: false, message: "This QR code is invalid or no longer active.", barangay: null }

  return { valid: true, message: "This credential is valid.", barangay: null }
}
