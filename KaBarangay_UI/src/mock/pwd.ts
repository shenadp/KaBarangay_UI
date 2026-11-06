/**
 * PWD desk mock data.
 *
 * Mirrors the payloads of the Laravel backend `PwdController` and the `Pwd/*`
 * Inertia pages. The backend reuses the very same components as the senior
 * desk, so the shapes come from `@/mock/sectorDesks` and only the records and
 * wording differ. Nothing here is fetched at runtime.
 */

import {
  createSectorDeskStore,
  type SectorApplication,
  type SectorAttendanceRecord,
  type SectorDeskStore,
  type SectorPost,
  type SectorResident,
} from "@/mock/sectorDesks"

/** Mock "today" for the desk — records filed after this are still open queues. */
export const pwdTodayIso = "2026-10-28"

/** Staff member assigned to this desk (see the desk assignments in sectors.ts). */
export const pwdOfficer = "Armando V. Ledesma"

/* ------------------------------------------------------------------ */
/* Members                                                             */
/* ------------------------------------------------------------------ */

export const pwdResidents: SectorResident[] = [
  { id: 1, residentNumber: "BSI-RES-000021", fullName: "Maricel B. Domingo", sex: "Female", purok: "Purok 1", status: "Active", hasQr: true, sectors: ["PWD"], registrationNo: "PWD-2026-0041", birthdate: "1988-02-11", address: "9 Mabini Street, Purok 1", mobile: "0917 220 4418" },
  { id: 2, residentNumber: "BSI-RES-000022", fullName: "Ernesto G. Mercado", sex: "Male", purok: "Purok 2", status: "Active", hasQr: true, sectors: ["PWD", "Senior Citizen"], registrationNo: "PWD-2026-0018", birthdate: "1959-05-27", address: "31 Rizal Avenue, Purok 2", mobile: "0920 771 3390" },
  { id: 3, residentNumber: "BSI-RES-000023", fullName: "Joy A. Naval", sex: "Female", purok: "Purok 3", status: "Active", hasQr: true, sectors: ["PWD"], registrationNo: "PWD-2026-0063", birthdate: "1994-09-08", address: "14 Bonifacio Street, Purok 3", mobile: "0918 664 2277" },
  { id: 4, residentNumber: "BSI-RES-000024", fullName: "Ferdinand L. Ocampo", sex: "Male", purok: "Purok 4", status: "Pending", hasQr: false, sectors: ["PWD"], birthdate: "1981-12-19", address: "55 Narra Road, Purok 4", mobile: "0977 330 8841" },
  { id: 5, residentNumber: "BSI-RES-000025", fullName: "Rowena P. Castillo", sex: "Female", purok: "Purok 5", status: "Active", hasQr: true, sectors: ["PWD"], registrationNo: "PWD-2026-0027", birthdate: "1975-03-30", address: "3 Camia Street, Purok 5", mobile: "0935 882 1104" },
  { id: 6, residentNumber: "BSI-RES-000026", fullName: "Noel T. Agrava", sex: "Male", purok: "Purok 6", status: "Active", hasQr: true, sectors: ["PWD"], registrationNo: "PWD-2026-0055", birthdate: "1990-07-14", address: "22 Acacia Street, Purok 6", mobile: "0906 441 7729" },
  { id: 7, residentNumber: "BSI-RES-000027", fullName: "Liza M. Bautista", sex: "Female", purok: "Purok 2", status: "Active", hasQr: false, sectors: ["PWD"], registrationNo: "PWD-2026-0072", birthdate: "2001-01-05", address: "8 Kalachuchi Street, Purok 2", mobile: "0916 227 5580" },
  { id: 8, residentNumber: "BSI-RES-000028", fullName: "Dante S. Rivera", sex: "Male", purok: "Purok 1", status: "Inactive", hasQr: true, sectors: ["PWD"], registrationNo: "PWD-2026-0009", birthdate: "1968-10-23", address: "40 Sampaguita Lane, Purok 1", mobile: "0919 553 6612" },
  { id: 9, residentNumber: "BSI-RES-000029", fullName: "Florangel C. Uy", sex: "Female", purok: "Purok 3", status: "Pending", hasQr: false, sectors: ["PWD"], birthdate: "1997-06-02", address: "17 Ilang-Ilang Road, Purok 3", mobile: "0918 990 3316" },
  { id: 10, residentNumber: "BSI-RES-000030", fullName: "Romeo V. Espina", sex: "Male", purok: "Purok 5", status: "Active", hasQr: true, sectors: ["PWD"], registrationNo: "PWD-2026-0034", birthdate: "1972-08-17", address: "6 Riverside Road, Purok 5", mobile: "0947 662 8890" },
  { id: 11, residentNumber: "BSI-RES-000031", fullName: "Grace D. Tandoc", sex: "Female", purok: "Purok 4", status: "Active", hasQr: true, sectors: ["PWD", "Barangay Official"], registrationNo: "PWD-2026-0015", birthdate: "1985-11-29", address: "73 Mangga Street, Purok 4", mobile: "0939 118 4425" },
  { id: 12, residentNumber: "BSI-RES-000032", fullName: "Alfredo J. Buenaventura", sex: "Male", purok: "Purok 6", status: "Pending", hasQr: true, sectors: ["PWD"], registrationNo: "PWD-2026-0081", birthdate: "1963-04-21", address: "11 Bougainvillea Street, Purok 6", mobile: "0999 337 2214" },
  { id: 13, residentNumber: "BSI-RES-000033", fullName: "Nimfa R. Aquino", sex: "Female", purok: "Purok 2", status: "Active", hasQr: true, sectors: ["Senior Citizen"], birthdate: "1953-02-09", address: "27 Mabini Corner, Purok 2", mobile: "0917 884 0021" },
  { id: 14, residentNumber: "BSI-RES-000034", fullName: "Celia B. Flores", sex: "Female", purok: "Purok 1", status: "Active", hasQr: true, sectors: ["Regular"], birthdate: "1979-07-31", address: "5 Bonifacio Street, Purok 1", mobile: "0920 226 7734" },
  { id: 15, residentNumber: "BSI-RES-000035", fullName: "Manuel E. Torres", sex: "Male", purok: "Purok 4", status: "Active", hasQr: false, sectors: ["Regular", "Barangay Official"], birthdate: "1966-09-16", address: "88 Narra Road, Purok 4", mobile: "0906 771 5528" },
]

/* ------------------------------------------------------------------ */
/* Sector applications                                                 */
/* ------------------------------------------------------------------ */

export const pwdApplications: SectorApplication[] = [
  {
    id: 1,
    trackingNumber: "PWD-APP-2026-0011",
    residentId: 4,
    residentNumber: "BSI-RES-000024",
    applicantName: "Ferdinand L. Ocampo",
    purok: "Purok 4",
    submissionType: "staff_assisted",
    submittedByName: pwdOfficer,
    status: "pending_staff_review",
    submittedAt: "2026-10-27",
    staffChecklistCompleted: false,
    staffReviewNotes: "Disability type: Visual. Assistive devices: none on file.",
    documents: [
      { id: 11, title: "PWD Proof Document #1", type: "sector_proof", fileName: "medical-certificate.jpg", fileSize: "820 KB", verificationStatus: "Pending" },
      { id: 12, title: "Residency Certification", type: "valid_id", fileName: "barangay-clearance.pdf", fileSize: "180 KB", verificationStatus: "Pending" },
    ],
  },
  {
    id: 2,
    trackingNumber: "PWD-APP-2026-0012",
    residentId: 9,
    residentNumber: "BSI-RES-000029",
    applicantName: "Florangel C. Uy",
    purok: "Purok 3",
    submissionType: "self_service",
    submittedByName: "Resident Self-Service",
    status: "pending_staff_review",
    submittedAt: "2026-10-26",
    staffChecklistCompleted: false,
    staffReviewNotes: "Disability type: Psychosocial. Filed through the resident portal.",
    documents: [
      { id: 21, title: "PWD Proof Document #1", type: "sector_proof", fileName: "psychiatric-abstract.pdf", fileSize: "1.2 MB", verificationStatus: "Pending" },
      { id: 22, title: "Valid ID", type: "valid_id", fileName: "drivers-license.jpg", fileSize: "540 KB", verificationStatus: "Pending" },
    ],
  },
  {
    id: 3,
    trackingNumber: "PWD-APP-2026-0010",
    residentId: 12,
    residentNumber: "BSI-RES-000032",
    applicantName: "Alfredo J. Buenaventura",
    purok: "Purok 6",
    submissionType: "staff_assisted",
    submittedByName: pwdOfficer,
    status: "under_admin_review",
    submittedAt: "2026-10-21",
    reviewedByStaffName: pwdOfficer,
    staffReviewNotes: "Renewal of a lost PWD ID. Disability type: Physical (mobility). Uses a wheelchair.",
    staffChecklistCompleted: true,
    documents: [
      { id: 31, title: "PWD Proof Document #1", type: "sector_proof", fileName: "ptdi-abstract.jpg", fileSize: "960 KB", verificationStatus: "Verified" },
      { id: 32, title: "Affidavit of Loss", type: "other", fileName: "affidavit-of-loss.pdf", fileSize: "240 KB", verificationStatus: "Verified" },
    ],
  },
  {
    id: 4,
    trackingNumber: "PWD-APP-2026-0008",
    residentId: 7,
    residentNumber: "BSI-RES-000027",
    applicantName: "Liza M. Bautista",
    purok: "Purok 2",
    submissionType: "staff_assisted",
    submittedByName: pwdOfficer,
    status: "under_admin_review",
    submittedAt: "2026-10-18",
    reviewedByStaffName: pwdOfficer,
    staffReviewNotes: "First-time registration. Disability type: Hearing.",
    staffChecklistCompleted: true,
    documents: [
      { id: 41, title: "PWD Proof Document #1", type: "sector_proof", fileName: "audiogram-result.pdf", fileSize: "1.4 MB", verificationStatus: "Verified" },
      { id: 42, title: "Valid ID", type: "valid_id", fileName: "umid-card.jpg", fileSize: "410 KB", verificationStatus: "Verified" },
    ],
  },
  {
    id: 5,
    trackingNumber: "PWD-APP-2026-0005",
    residentId: 1,
    residentNumber: "BSI-RES-000021",
    applicantName: "Maricel B. Domingo",
    purok: "Purok 1",
    submissionType: "self_service",
    submittedByName: "Resident Self-Service",
    status: "approved",
    submittedAt: "2026-10-06",
    reviewedByStaffName: pwdOfficer,
    staffReviewNotes: "Disability type: Visual. Confirmed against the city PWD registry.",
    staffChecklistCompleted: true,
    adminDecisionByName: "Hon. Barangay Administrator",
    adminDecisionNotes: "Application approved and PWD sector membership activated.",
    adminDecidedAt: "2026-10-09",
    registrationNo: "PWD-2026-0041",
    documents: [
      { id: 51, title: "PWD Proof Document #1", type: "sector_proof", fileName: "clinical-abstract.pdf", fileSize: "700 KB", verificationStatus: "Verified" },
      { id: 52, title: "Valid ID", type: "valid_id", fileName: "philsys-id.jpg", fileSize: "380 KB", verificationStatus: "Verified" },
    ],
  },
  {
    id: 6,
    trackingNumber: "PWD-APP-2026-0004",
    residentId: 3,
    residentNumber: "BSI-RES-000023",
    applicantName: "Joy A. Naval",
    purok: "Purok 3",
    submissionType: "staff_assisted",
    submittedByName: pwdOfficer,
    status: "needs_correction",
    submittedAt: "2026-10-04",
    reviewedByStaffName: pwdOfficer,
    staffReviewNotes: "Medical certificate is illegible and the barangay residency certification is missing.",
    staffChecklistCompleted: false,
    adminDecisionByName: "Hon. Barangay Administrator",
    adminDecisionNotes: "Return to applicant: attach a readable certificate and a residency certification.",
    adminDecidedAt: "2026-10-07",
    documents: [
      { id: 61, title: "PWD Proof Document #1", type: "sector_proof", fileName: "scanned-certificate.jpg", fileSize: "220 KB", verificationStatus: "Rejected" },
    ],
  },
  {
    id: 7,
    trackingNumber: "PWD-APP-2026-0003",
    residentId: 8,
    residentNumber: "BSI-RES-000028",
    applicantName: "Dante S. Rivera",
    purok: "Purok 1",
    submissionType: "staff_assisted",
    submittedByName: pwdOfficer,
    status: "rejected",
    submittedAt: "2026-09-28",
    reviewedByStaffName: pwdOfficer,
    staffChecklistCompleted: true,
    adminDecisionByName: "Hon. Barangay Administrator",
    adminDecisionNotes: "Resident transferred to another barangay; membership cannot be reissued here.",
    adminDecidedAt: "2026-10-01",
    documents: [
      { id: 71, title: "PWD Proof Document #1", type: "sector_proof", fileName: "old-pwd-id.jpg", fileSize: "300 KB", verificationStatus: "Rejected" },
    ],
  },
  {
    id: 8,
    trackingNumber: "PWD-APP-2026-0009",
    residentId: 2,
    residentNumber: "BSI-RES-000022",
    applicantName: "Ernesto G. Mercado",
    purok: "Purok 2",
    submissionType: "staff_assisted",
    submittedByName: pwdOfficer,
    status: "approved",
    submittedAt: "2026-10-12",
    reviewedByStaffName: pwdOfficer,
    staffReviewNotes: "Dual classification with the senior citizens desk. Disability type: Physical.",
    staffChecklistCompleted: true,
    adminDecisionByName: "Hon. Barangay Administrator",
    adminDecisionNotes: "Application approved and PWD sector membership activated.",
    adminDecidedAt: "2026-10-15",
    registrationNo: "PWD-2026-0018",
    emergencyContact: "Corazon Mercado · 0920 771 3391",
    documents: [
      { id: 81, title: "PWD Proof Document #1", type: "sector_proof", fileName: "x-ray-report.pdf", fileSize: "1.1 MB", verificationStatus: "Verified" },
      { id: 82, title: "Senior Citizen ID", type: "valid_id", fileName: "osca-id.jpg", fileSize: "350 KB", verificationStatus: "Verified" },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Announcements, updates and programs                                 */
/* ------------------------------------------------------------------ */

/** The categories offered on the PWD boards. */
export type PwdAnnouncementCategory = "General" | "Ayuda" | "Health" | "Event"

export const pwdCategoryOptions: PwdAnnouncementCategory[] = ["General", "Ayuda", "Health", "Event"]

export const pwdCategoryLabels: Record<string, string> = {
  General: "General",
  Ayuda: "Ayuda / Financial Aid",
  Health: "Medical / Mobility Support",
  Event: "PWD Event",
}

export const pwdAnnouncements: SectorPost[] = [
  {
    id: 1,
    kind: "update",
    title: "October ayuda release for registered PWDs",
    content:
      "The monthly financial ayuda will be released at the barangay hall lobby from 8:00 AM to 2:00 PM. Bring your PWD ID and the claim stub from the previous release. Representatives must present a signed authorisation letter and their own valid ID.",
    type: "event",
    category: "Ayuda",
    importance: "high",
    audience: "Persons with Disability",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-10-30",
    eventTime: "08:00",
    location: "Barangay Hall Lobby",
    requiresAttendance: true,
    createdAt: "2026-10-26",
    author: pwdOfficer,
  },
  {
    id: 2,
    kind: "update",
    title: "Free wheelchairs and walking canes from the city PWD office",
    content:
      "Assistive devices will be distributed to verified members who filed a request. Bring any valid ID; a companion may assist a member who cannot travel alone. Priority is given to members without a working device.",
    type: "informational",
    category: "Health",
    importance: "normal",
    audience: "Persons with Disability",
    approvalStatus: "approved",
    createdAt: "2026-10-25",
    author: pwdOfficer,
    requiresAttendance: false,
  },
  {
    id: 3,
    kind: "update",
    title: "Claiming of newly printed PWD IDs",
    content:
      "Twenty-eight PWD identification cards are now ready for claiming at the desk. Claim in person between 8:00 AM and 5:00 PM. Representatives need a signed authorisation and a photocopy of the member's ID.",
    type: "informational",
    category: "General",
    importance: "low",
    audience: "Persons with Disability",
    approvalStatus: "approved",
    createdAt: "2026-10-22",
    author: pwdOfficer,
    requiresAttendance: false,
  },
  {
    id: 4,
    kind: "update",
    title: "Sign-language orientation for barangay staff",
    content:
      "A short orientation on basic sign-language courtesy will be held for front-line staff. Members of the PWD sector are welcome to attend and help with practice sessions.",
    type: "informational",
    category: "General",
    importance: "normal",
    audience: "Persons with Disability",
    approvalStatus: "pending",
    createdAt: "2026-10-27",
    author: pwdOfficer,
    requiresAttendance: false,
  },
  {
    id: 5,
    kind: "auto",
    title: "PWD summit: accessible livelihood programs",
    content:
      "The barangay will host the quarterly PWD summit with the city social welfare office. Livelihood grants, skills training slots and the accessible-market stall allocation will be discussed.",
    type: "event",
    category: "Event",
    importance: "high",
    audience: "All",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-11-05",
    eventTime: "09:00",
    location: "Barangay covered court",
    requiresAttendance: true,
    createdAt: "2026-10-24",
    author: "Gloria P. Manalo",
  },
  {
    id: 6,
    kind: "auto",
    title: "Mobile registration for out-of-school PWD youth",
    content:
      "A mobile registration team will visit Purok 4 and Purok 5 to encode members who cannot reach the hall. Bring proof of disability and any valid identification.",
    type: "informational",
    category: "Ayuda",
    importance: "normal",
    audience: "All",
    approvalStatus: "approved",
    createdAt: "2026-10-20",
    author: "Gloria P. Manalo",
    requiresAttendance: false,
  },
  {
    id: 7,
    kind: "auto",
    title: "Reminder: annual PWD validation of residence",
    content:
      "Members must validate their residence each year to keep benefits active. Validation is open at the desk from Monday to Friday.",
    type: "informational",
    category: "General",
    importance: "urgent",
    audience: "All",
    approvalStatus: "pending",
    createdAt: "2026-10-28",
    author: "Gloria P. Manalo",
    requiresAttendance: false,
  },
  {
    id: 8,
    kind: "auto",
    title: "Revised schedule of the PWD ayuda pay-out",
    content:
      "The pay-out moved to the first Friday of the month to avoid conflict with the senior pension schedule. Members already holding a stub for the previous batch need no re-encoding.",
    type: "informational",
    category: "General",
    importance: "normal",
    audience: "All",
    approvalStatus: "rejected",
    rejectionReason: "Superseded by the final memorandum from the city accountant's office.",
    createdAt: "2026-10-14",
    author: "Gloria P. Manalo",
    requiresAttendance: false,
  },
  {
    id: 9,
    kind: "program",
    title: "Livelihood grant turnover (October 20)",
    content:
      "Start-up kits and cash grants were turned over to twelve members who completed the Barangay Enterprise Mentoring course. Attendance was recorded for the grant and for the mentoring certificate release.",
    type: "event",
    category: "Event",
    importance: "high",
    audience: "Persons with Disability",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-10-20",
    eventTime: "09:00",
    location: "Barangay hall multipurpose room",
    requiresAttendance: true,
    createdAt: "2026-10-05",
    author: pwdOfficer,
  },
  {
    id: 10,
    kind: "program",
    title: "Therapy and mobility clinic (November 8)",
    content:
      "A licensed physical therapist and an occupational therapist will run free sessions for members with mobility and developmental needs. Thirty slots will be assigned per purok, priority to first-time beneficiaries.",
    type: "event",
    category: "Health",
    importance: "normal",
    audience: "Persons with Disability",
    approvalStatus: "approved",
    programStatus: "draft",
    eventDate: "2026-11-08",
    eventTime: "08:30",
    location: "Barangay Health Center",
    requiresAttendance: true,
    createdAt: "2026-10-23",
    author: pwdOfficer,
  },
  {
    id: 11,
    kind: "program",
    title: "PWD annual assembly and recognition",
    content:
      "Year-end fellowship with recognition of member entrepreneurs and barangay volunteers who supported the sector. A simple program and sharing of meals will follow the ceremony.",
    type: "event",
    category: "Event",
    importance: "high",
    audience: "Persons with Disability",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-12-12",
    eventTime: "15:00",
    location: "Barangay covered court",
    requiresAttendance: false,
    createdAt: "2026-10-18",
    author: pwdOfficer,
  },
  {
    id: 12,
    kind: "program",
    title: "Ayuda distribution for the fourth quarter",
    content:
      "The final quarterly ayuda will be distributed to all verified members. Bring your PWD ID and claim stub; the desk also accepts certified representatives.",
    type: "event",
    category: "Ayuda",
    importance: "urgent",
    audience: "Persons with Disability",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-10-16",
    eventTime: "08:00",
    location: "Barangay Hall Lobby",
    requiresAttendance: true,
    completedAt: "2026-10-17",
    createdAt: "2026-10-02",
    author: pwdOfficer,
  },
]

/* ------------------------------------------------------------------ */
/* Attendance sheet                                                    */
/* ------------------------------------------------------------------ */

/** Seed records per announcement id — activities already held. */
export const pwdAttendanceSeed: Record<number, SectorAttendanceRecord[]> = {
  9: [
    { id: 1, residentId: 1, residentNumber: "BSI-RES-000021", fullName: "Maricel B. Domingo", status: "present", method: "qr_scanner", loggedAt: "09:04 AM" },
    { id: 2, residentId: 3, residentNumber: "BSI-RES-000023", fullName: "Joy A. Naval", status: "present", method: "qr_scanner", loggedAt: "09:07 AM" },
    { id: 3, residentId: 5, residentNumber: "BSI-RES-000025", fullName: "Rowena P. Castillo", status: "present", method: "manual", loggedAt: "09:12 AM" },
    { id: 4, residentId: 11, residentNumber: "BSI-RES-000031", fullName: "Grace D. Tandoc", status: "claimed", method: "qr_scanner", loggedAt: "09:40 AM" },
    { id: 5, residentId: 6, residentNumber: "BSI-RES-000026", fullName: "Noel T. Agrava", status: "claimed", method: "manual", loggedAt: "09:52 AM" },
  ],
  12: [
    { id: 1, residentId: 2, residentNumber: "BSI-RES-000022", fullName: "Ernesto G. Mercado", status: "claimed", method: "qr_scanner", loggedAt: "08:18 AM" },
    { id: 2, residentId: 7, residentNumber: "BSI-RES-000027", fullName: "Liza M. Bautista", status: "claimed", method: "manual", loggedAt: "08:35 AM" },
    { id: 3, residentId: 10, residentNumber: "BSI-RES-000030", fullName: "Romeo V. Espina", status: "present", method: "qr_scanner", loggedAt: "08:22 AM" },
    { id: 4, residentId: 12, residentNumber: "BSI-RES-000032", fullName: "Alfredo J. Buenaventura", status: "present", method: "qr_scanner", loggedAt: "08:45 AM" },
  ],
}

/** Members eligible for the sheet — residents carrying the PWD classification. */
export function pwdAttendancePool(): SectorResident[] {
  return pwdResidents.filter((resident) => resident.sectors.includes("PWD"))
}

/* ------------------------------------------------------------------ */
/* Desk session                                                        */
/* ------------------------------------------------------------------ */

/**
 * The PWD desk's working copy of the seeded data, so a filing, post or
 * attendance entry made on one page is still visible on every other page.
 */
export const pwdStore: SectorDeskStore = createSectorDeskStore({
  applications: pwdApplications,
  posts: pwdAnnouncements,
  attendance: pwdAttendanceSeed,
  trackingPrefix: "PWD-APP-2026",
})
