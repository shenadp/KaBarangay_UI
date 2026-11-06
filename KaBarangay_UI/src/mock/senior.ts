/**
 * Senior Citizens desk mock data.
 *
 * Shapes mirror the payloads of the Laravel backend `SeniorController` and the
 * `Senior/*` Inertia pages (residents, sector applications with tracking
 * numbers, announcements with kind/type/category/importance and the two-stage
 * approval flow). Nothing here is fetched at runtime — the integration only
 * has to replace this file.
 */

import {
  createSectorDeskStore,
  purokList,
  type SectorApplication,
  type SectorAttendanceRecord,
  type SectorDeskStore,
  type SectorPost,
  type SectorResident,
} from "@/mock/sectorDesks"

/** The categories offered on the senior boards. */
export type SeniorAnnouncementCategory = "General" | "Pension" | "Health" | "Event"

export const seniorCategoryOptions: SeniorAnnouncementCategory[] = [
  "General",
  "Pension",
  "Health",
  "Event",
]

/** Mock "today" for the desk — records filed after this are still open queues. */
export const seniorTodayIso = "2026-10-28"

/* ------------------------------------------------------------------ */
/* Residents / members                                                 */
/* ------------------------------------------------------------------ */

export const seniorPuroks = purokList

export const seniorResidents: SectorResident[] = [
  { id: 1, residentNumber: "BSI-RES-000001", fullName: "Pedro S. Ramos", sex: "Male", purok: "Purok 1", status: "Active", hasQr: true, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0148", birthdate: "1958-03-04", address: "123 Mabini Street, Purok 1", mobile: "0919 884 1123" },
  { id: 2, residentNumber: "BSI-RES-000002", fullName: "Roberto C. Garcia", sex: "Male", purok: "Purok 2", status: "Active", hasQr: true, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0112", birthdate: "1954-07-19", address: "45 Rizal Avenue, Purok 2", mobile: "0920 665 3311" },
  { id: 3, residentNumber: "BSI-RES-000003", fullName: "Teresa L. Pascual", sex: "Female", purok: "Purok 1", status: "Active", hasQr: true, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0121", birthdate: "1960-11-02", address: "78 Bonifacio Street, Purok 1", mobile: "0918 447 2290" },
  { id: 4, residentNumber: "BSI-RES-000004", fullName: "Ramon E. Villareal", sex: "Male", purok: "Purok 3", status: "Active", hasQr: true, sectors: ["Senior Citizen", "Barangay Official"], registrationNo: "OSCA-2026-0104", birthdate: "1952-01-27", address: "16 Sampaguita Lane, Purok 3", mobile: "0916 330 9924" },
  { id: 5, residentNumber: "BSI-RES-000005", fullName: "Alfredo D. Sandoval", sex: "Male", purok: "Purok 4", status: "Active", hasQr: true, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0139", birthdate: "1963-05-30", address: "92 Narra Road, Purok 4", mobile: "0977 882 4416" },
  { id: 6, residentNumber: "BSI-RES-000006", fullName: "Divina R. Lopez", sex: "Female", purok: "Purok 2", status: "Pending", hasQr: false, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0166", birthdate: "1957-09-12", address: "21 Kalachuchi Street, Purok 2", mobile: "0917 553 2201" },
  { id: 7, residentNumber: "BSI-RES-000007", fullName: "Milagros A. Perez", sex: "Female", purok: "Purok 4", status: "Active", hasQr: true, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0117", birthdate: "1955-02-08", address: "5 Ilang-Ilang Road, Purok 4", mobile: "0918 220 7741" },
  { id: 8, residentNumber: "BSI-RES-000008", fullName: "Ester P. Guerrero", sex: "Female", purok: "Purok 6", status: "Active", hasQr: true, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0129", birthdate: "1959-06-21", address: "34 Acacia Street, Purok 6", mobile: "0906 331 9012" },
  { id: 9, residentNumber: "BSI-RES-000009", fullName: "Corazon M. Dimayuga", sex: "Female", purok: "Purok 5", status: "Active", hasQr: true, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0098", birthdate: "1950-08-15", address: "8 Camia Street, Purok 5", mobile: "0935 228 6610" },
  { id: 10, residentNumber: "BSI-RES-000010", fullName: "Alfonso R. Ibarra", sex: "Male", purok: "Purok 3", status: "Active", hasQr: false, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0086", birthdate: "1945-04-09", address: "60 Riverside Road, Purok 3", mobile: "0947 118 3374" },
  { id: 11, residentNumber: "BSI-RES-000011", fullName: "Lourdes P. Sarmiento", sex: "Female", purok: "Purok 6", status: "Pending", hasQr: true, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0172", birthdate: "1962-12-03", address: "27 Bougainvillea Street, Purok 6", mobile: "0999 664 1187" },
  { id: 12, residentNumber: "BSI-RES-000012", fullName: "Gavino T. Mabini", sex: "Male", purok: "Purok 1", status: "Pending", hasQr: true, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0155", birthdate: "1947-10-24", address: "3 Mabini Corner, Purok 1", mobile: "0917 412 8830" },
  { id: 13, residentNumber: "BSI-RES-000013", fullName: "Amparo V. Salcedo", sex: "Female", purok: "Purok 5", status: "Inactive", hasQr: false, sectors: ["Senior Citizen"], registrationNo: "OSCA-2026-0134", birthdate: "1956-03-17", address: "14 Sunrise Street, Purok 5", mobile: "0906 224 8853" },
  { id: 14, residentNumber: "BSI-RES-000014", fullName: "Bernardo V. Aguinaldo", sex: "Male", purok: "Purok 2", status: "Pending", hasQr: true, sectors: ["Senior Citizen"], birthdate: "1961-07-11", address: "40 Mangga Street, Purok 2", mobile: "0939 228 6610" },
  { id: 15, residentNumber: "BSI-RES-000015", fullName: "Nenita L. Pascual", sex: "Female", purok: "Purok 1", status: "Active", hasQr: true, sectors: ["Regular"], birthdate: "1965-01-19", address: "80 Bonifacio Street, Purok 1", mobile: "0906 118 7742" },
  { id: 16, residentNumber: "BSI-RES-000016", fullName: "Jose R. Ibarra", sex: "Male", purok: "Purok 3", status: "Active", hasQr: true, sectors: ["Regular", "Barangay Official"], birthdate: "1972-06-02", address: "60 Riverside Road, Purok 3", mobile: "0916 447 2265" },
]

/* ------------------------------------------------------------------ */
/* Sector applications                                                 */
/* ------------------------------------------------------------------ */


export const seniorApplications: SectorApplication[] = [
  {
    id: 1,
    trackingNumber: "SC-APP-2026-0042",
    residentId: 14,
    residentNumber: "BSI-RES-000014",
    applicantName: "Bernardo V. Aguinaldo",
    purok: "Purok 2",
    submissionType: "staff_assisted",
    submittedByName: "Rogelio S. Panganiban",
    status: "pending_staff_review",
    submittedAt: "2026-10-24",
    staffChecklistCompleted: false,
    documents: [
      { id: 11, title: "Senior Proof Document #1", type: "sector_proof", fileName: "psa-birth-certificate.pdf", fileSize: "1.4 MB", verificationStatus: "Pending" },
      { id: 12, title: "Senior Proof Document #2", type: "valid_id", fileName: "barangay-residency-cert.jpg", fileSize: "820 KB", verificationStatus: "Pending" },
    ],
  },
  {
    id: 2,
    trackingNumber: "SC-APP-2026-0041",
    residentId: 11,
    residentNumber: "BSI-RES-000011",
    applicantName: "Lourdes P. Sarmiento",
    purok: "Purok 6",
    submissionType: "staff_assisted",
    submittedByName: "Records Section",
    status: "pending_staff_review",
    submittedAt: "2026-10-22",
    staffReviewNotes: "Intake reviewed at the counter; OSCA card queued for the weekly print run.",
    staffChecklistCompleted: false,
    documents: [
      { id: 21, title: "Senior Proof Document #1", type: "sector_proof", fileName: "old-senior-id.png", fileSize: "640 KB", verificationStatus: "Verified" },
      { id: 22, title: "Senior Proof Document #2", type: "valid_id", fileName: "valid-id-front.jpg", fileSize: "1.1 MB", verificationStatus: "Verified" },
    ],
  },
  {
    id: 3,
    trackingNumber: "SC-APP-2026-0040",
    residentId: 12,
    residentNumber: "BSI-RES-000012",
    applicantName: "Gavino T. Mabini",
    purok: "Purok 1",
    submissionType: "self_service",
    submittedByName: "Gavino T. Mabini",
    status: "needs_correction",
    submittedAt: "2026-10-19",
    reviewedByStaffName: "Rogelio S. Panganiban",
    staffReviewNotes:
      "Returned for correction — the residency certification submitted is older than six months.",
    staffChecklistCompleted: false,
    documents: [
      { id: 31, title: "Senior Proof Document #1", type: "sector_proof", fileName: "senior-id-scan.pdf", fileSize: "980 KB", verificationStatus: "Verified" },
      { id: 32, title: "Senior Proof Document #2", type: "valid_id", fileName: "residency-cert-2024.jpg", fileSize: "760 KB", verificationStatus: "Rejected" },
    ],
  },
  {
    id: 4,
    trackingNumber: "SC-APP-2026-0039",
    residentId: 6,
    residentNumber: "BSI-RES-000006",
    applicantName: "Divina R. Lopez",
    purok: "Purok 2",
    submissionType: "staff_assisted",
    submittedByName: "Records Section",
    status: "under_admin_review",
    submittedAt: "2026-10-15",
    reviewedByStaffName: "Rogelio S. Panganiban",
    staffReviewNotes: "Documents complete; forwarded to the barangay administrator for the final decision.",
    staffChecklistCompleted: true,
    documents: [
      { id: 41, title: "Senior Proof Document #1", type: "sector_proof", fileName: "psa-birth-cert.pdf", fileSize: "1.2 MB", verificationStatus: "Verified" },
      { id: 42, title: "Senior Proof Document #2", type: "valid_id", fileName: "philsys-id.jpg", fileSize: "540 KB", verificationStatus: "Verified" },
    ],
  },
  {
    id: 5,
    trackingNumber: "SC-APP-2026-0038",
    residentId: 13,
    residentNumber: "BSI-RES-000013",
    applicantName: "Amparo V. Salcedo",
    purok: "Purok 5",
    submissionType: "staff_assisted",
    submittedByName: "Rogelio S. Panganiban",
    status: "approved",
    submittedAt: "2026-10-10",
    reviewedByStaffName: "Rogelio S. Panganiban",
    staffReviewNotes: "Membership reactivated after a two-year absence from the purok.",
    staffChecklistCompleted: true,
    adminDecisionByName: "Hon. Barangay Administrator",
    adminDecisionNotes: "Application approved and Senior Citizens sector membership activated.",
    adminDecidedAt: "2026-10-17",
    registrationNo: "OSCA-2026-0134",
    documents: [
      { id: 51, title: "Senior Proof Document #1", type: "sector_proof", fileName: "senior-id-copy.pdf", fileSize: "1.0 MB", verificationStatus: "Verified" },
      { id: 52, title: "Senior Proof Document #2", type: "valid_id", fileName: "valid-driver-license.jpg", fileSize: "890 KB", verificationStatus: "Verified" },
    ],
  },
  {
    id: 6,
    trackingNumber: "SC-APP-2026-0037",
    residentId: 10,
    residentNumber: "BSI-RES-000010",
    applicantName: "Alfonso R. Ibarra",
    purok: "Purok 3",
    submissionType: "self_service",
    submittedByName: "Alfonso R. Ibarra",
    status: "rejected",
    submittedAt: "2026-10-05",
    reviewedByStaffName: "Rogelio S. Panganiban",
    staffReviewNotes: "Pension endorsement filed through the resident portal.",
    staffChecklistCompleted: true,
    adminDecisionByName: "Hon. Barangay Administrator",
    adminDecisionNotes:
      "Rejected — no proof of residency submitted and the bank record does not match the applicant.",
    adminDecidedAt: "2026-10-08",
    documents: [
      { id: 61, title: "Senior Proof Document #1", type: "sector_proof", fileName: "bank-passport-scan.jpg", fileSize: "420 KB", verificationStatus: "Rejected" },
    ],
  },
  {
    id: 7,
    trackingNumber: "SC-APP-2026-0036",
    residentId: 9,
    residentNumber: "BSI-RES-000009",
    applicantName: "Corazon M. Dimayuga",
    purok: "Purok 5",
    submissionType: "staff_assisted",
    submittedByName: "Rogelio S. Panganiban",
    status: "approved",
    submittedAt: "2026-10-02",
    reviewedByStaffName: "Rogelio S. Panganiban",
    staffReviewNotes: "Renewal of an OSCA card lost during a flood; supporting bills attached.",
    staffChecklistCompleted: true,
    adminDecisionByName: "Hon. Barangay Administrator",
    adminDecisionNotes: "Application approved and Senior Citizens sector membership activated.",
    adminDecidedAt: "2026-10-04",
    registrationNo: "OSCA-2026-0098",
    documents: [
      { id: 71, title: "Senior Proof Document #1", type: "sector_proof", fileName: "affidavit-of-loss.pdf", fileSize: "310 KB", verificationStatus: "Verified" },
      { id: 72, title: "Senior Proof Document #2", type: "valid_id", fileName: "postal-id.jpg", fileSize: "700 KB", verificationStatus: "Verified" },
    ],
  },
]


/* ------------------------------------------------------------------ */
/* Announcements, updates and programs                                 */
/* ------------------------------------------------------------------ */

export const seniorCategoryLabels: Record<string, string> = {
  General: "General",
  Pension: "Social Pension",
  Health: "Health & Wellness",
  Event: "Senior Event",
}

export const seniorAnnouncements: SectorPost[] = [
  {
    id: 1,
    kind: "update",
    title: "Batch 4 social pension release",
    content:
      "The fourth batch of the annual social pension will be released at the barangay hall lobby from 8:00 AM to 3:00 PM. Bring your OSCA ID and the claim stub issued during the last pay-out. Authorised representatives must present a signed authorisation letter and their own valid ID.",
    type: "event",
    category: "Pension",
    importance: "high",
    audience: "Senior Citizens",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-10-29",
    eventTime: "08:00",
    location: "Barangay Hall Lobby",
    requiresAttendance: true,
    createdAt: "2026-10-26",
    author: "Rogelio S. Panganiban",
  },
  {
    id: 2,
    kind: "update",
    title: "Free eye check-up for senior citizens",
    content:
      "The city health office will conduct a free eye check-up and cataract screening for registered senior citizens. Reading glasses and referral letters are provided at no cost. Slots are limited to eighty members and are assigned per purok.",
    type: "informational",
    category: "Health",
    importance: "normal",
    audience: "Senior Citizens",
    approvalStatus: "approved",
    createdAt: "2026-10-25",
    author: "Rogelio S. Panganiban",
    requiresAttendance: false,
  },
  {
    id: 3,
    kind: "update",
    title: "Claiming of newly printed OSCA IDs",
    content:
      "Forty newly printed senior citizen identification cards are ready for claiming at the senior citizens desk. Claim in person between 8:00 AM and 5:00 PM; representatives need a signed authorisation and a photocopy of the member's ID.",
    type: "informational",
    category: "General",
    importance: "normal",
    audience: "Senior Citizens",
    approvalStatus: "approved",
    createdAt: "2026-10-23",
    author: "Rogelio S. Panganiban",
    requiresAttendance: false,
  },
  {
    id: 4,
    kind: "update",
    title: "Maintenance medicine distribution schedule",
    content:
      "Maintenance medicine for enrolled members will be distributed every Tuesday of November at the health center. Bring your current prescription and OSCA ID; the queue is numbered starting 7:30 AM.",
    type: "informational",
    category: "Health",
    importance: "low",
    audience: "Senior Citizens",
    approvalStatus: "pending",
    createdAt: "2026-10-27",
    author: "Rogelio S. Panganiban",
    requiresAttendance: false,
  },
  {
    id: 5,
    kind: "auto",
    title: "Senior citizens quarterly assembly (November 12)",
    content:
      "All registered members are invited to the fourth quarter general assembly. The agenda covers the 2027 senior budget, the medical mission schedule and the updated directory of services. Attendance is recorded at the entrance for the pension listing.",
    type: "event",
    category: "Event",
    importance: "high",
    audience: "Senior Citizens",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-11-12",
    eventTime: "09:00",
    location: "Barangay Hall Session Hall",
    requiresAttendance: true,
    createdAt: "2026-10-20",
    author: "Rogelio S. Panganiban",
  },
  {
    id: 6,
    kind: "auto",
    title: "Blood pressure and glucose screening",
    content:
      "Barangay health workers will conduct free blood pressure and glucose screening for senior citizens at the health center multipurpose room. No appointment is needed.",
    type: "event",
    category: "Health",
    importance: "normal",
    audience: "Senior Citizens",
    approvalStatus: "pending",
    programStatus: "draft",
    eventDate: "2026-11-04",
    eventTime: "07:30",
    location: "Health Center Multipurpose Room",
    requiresAttendance: true,
    createdAt: "2026-10-27",
    author: "Rogelio S. Panganiban",
  },
  {
    id: 7,
    kind: "auto",
    title: "Emergency contact update drive",
    content:
      "Members are asked to visit the senior citizens desk so the office can update emergency contact details, mobile numbers and address records. Records without an emergency contact will be flagged during the next pension verification.",
    type: "informational",
    category: "General",
    importance: "normal",
    audience: "Senior Citizens",
    approvalStatus: "approved",
    createdAt: "2026-10-18",
    author: "Rogelio S. Panganiban",
    requiresAttendance: false,
  },
  {
    id: 8,
    kind: "auto",
    title: "Notice of suspension: October medical mission",
    content:
      "The medical mission scheduled for the last week of October is suspended due to the typhoon response deployment of the city health office. A new date will be posted once confirmed.",
    type: "informational",
    category: "Health",
    importance: "urgent",
    audience: "Senior Citizens",
    approvalStatus: "rejected",
    rejectionReason: "The suspension notice was filed before the health office confirmed the new schedule.",
    createdAt: "2026-10-14",
    author: "Rogelio S. Panganiban",
    requiresAttendance: false,
  },
  {
    id: 9,
    kind: "program",
    title: "Senior citizens quarterly assembly (October 12)",
    content:
      "The quarterly assembly brings together all registered members for the pension update, medical mission schedule and the reading of the barangay senior budget. Attendance is required to keep the pension listing active.",
    type: "event",
    category: "Event",
    importance: "high",
    audience: "Senior Citizens",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-10-12",
    eventTime: "08:30",
    location: "Barangay Hall Session Hall",
    requiresAttendance: true,
    completedAt: "2026-10-12",
    createdAt: "2026-09-28",
    author: "Rogelio S. Panganiban",
  },
  {
    id: 10,
    kind: "program",
    title: "Christmas fellowship and volunteer recognition",
    content:
      "The year-end fellowship honours members who served as barangay health workers and litter marshals. A simple program, sharing of meals and the recognition ceremony will follow.",
    type: "event",
    category: "Event",
    importance: "normal",
    audience: "Senior Citizens",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-12-18",
    eventTime: "10:00",
    location: "Covered Court",
    requiresAttendance: true,
    createdAt: "2026-10-24",
    author: "Rogelio S. Panganiban",
  },
  {
    id: 11,
    kind: "program",
    title: "Livelihood and handicraft workshop",
    content:
      "A two-day handicraft and livelihood workshop for able senior citizens, facilitated by the municipal social development office. Participants receive materials and a certificate of participation.",
    type: "event",
    category: "Event",
    importance: "low",
    audience: "Senior Citizens",
    approvalStatus: "pending",
    programStatus: "draft",
    eventDate: "2026-11-20",
    eventTime: "09:00",
    location: "Barangay Hall Session Hall",
    requiresAttendance: false,
    createdAt: "2026-10-26",
    author: "Rogelio S. Panganiban",
  },
  {
    id: 12,
    kind: "program",
    title: "Pension claim assistance desk",
    content:
      "Walk-in assistance for members encoding requirements for the national social pension batch, including listing forms, proof of residency and bank or ATM endorsement.",
    type: "event",
    category: "Pension",
    importance: "normal",
    audience: "Senior Citizens",
    approvalStatus: "approved",
    programStatus: "ongoing",
    eventDate: "2026-10-15",
    eventTime: "08:00",
    location: "Senior Citizens Desk",
    requiresAttendance: true,
    completedAt: "2026-10-16",
    createdAt: "2026-10-01",
    author: "Rogelio S. Panganiban",
  },
]


/* ------------------------------------------------------------------ */
/* Attendance sheet                                                    */
/* ------------------------------------------------------------------ */

/** Seed records per announcement id — activities already held. */
export const seniorAttendanceSeed: Record<number, SectorAttendanceRecord[]> = {
  9: [
    { id: 1, residentId: 1, residentNumber: "BSI-RES-000001", fullName: "Pedro S. Ramos", status: "present", method: "qr_scanner", loggedAt: "08:21 AM" },
    { id: 2, residentId: 2, residentNumber: "BSI-RES-000002", fullName: "Roberto C. Garcia", status: "present", method: "qr_scanner", loggedAt: "08:24 AM" },
    { id: 3, residentId: 3, residentNumber: "BSI-RES-000003", fullName: "Teresa L. Pascual", status: "present", method: "manual", loggedAt: "08:30 AM" },
    { id: 4, residentId: 4, residentNumber: "BSI-RES-000004", fullName: "Ramon E. Villareal", status: "claimed", method: "qr_scanner", loggedAt: "09:02 AM" },
    { id: 5, residentId: 7, residentNumber: "BSI-RES-000007", fullName: "Milagros A. Perez", status: "claimed", method: "manual", loggedAt: "09:15 AM" },
    { id: 6, residentId: 8, residentNumber: "BSI-RES-000008", fullName: "Ester P. Guerrero", status: "present", method: "qr_scanner", loggedAt: "08:41 AM" },
  ],
  12: [
    { id: 1, residentId: 5, residentNumber: "BSI-RES-000005", fullName: "Alfredo D. Sandoval", status: "present", method: "manual", loggedAt: "08:05 AM" },
    { id: 2, residentId: 9, residentNumber: "BSI-RES-000009", fullName: "Corazon M. Dimayuga", status: "claimed", method: "qr_scanner", loggedAt: "08:38 AM" },
    { id: 3, residentId: 10, residentNumber: "BSI-RES-000010", fullName: "Alfonso R. Ibarra", status: "present", method: "qr_scanner", loggedAt: "08:12 AM" },
  ],
}

/** Members eligible for the sheet — active or pending senior records. */
export function seniorAttendancePool(): SectorResident[] {
  return seniorResidents.filter((resident) => resident.sectors.includes("Senior Citizen"))
}

/* ------------------------------------------------------------------ */
/* Desk session                                                        */
/* ------------------------------------------------------------------ */

/**
 * The senior desk's working copy of the seeded data. The backend persists desk
 * work; this UI keeps it in memory so a filing, post or attendance entry made on
 * one page is still visible on the queue, the board, the detail and the sheet.
 */
export const seniorStore: SectorDeskStore = createSectorDeskStore({
  applications: seniorApplications,
  posts: seniorAnnouncements,
  attendance: seniorAttendanceSeed,
  trackingPrefix: "SC-APP-2026",
})
