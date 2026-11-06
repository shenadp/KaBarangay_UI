/**
 * Mock data for the KaBarangay UI.
 *
 * Shapes here mirror the payloads returned by the Laravel backend
 * (github.com/lewww123/KaBarangay) so the group can swap these for real API
 * calls without touching the markup.
 */

export const barangay = {
  name: "Barangay San Isidro",
  code: "BRGY-042",
  city: "City of Santa Rosa",
  province: "Laguna",
  captain: "Hon. Roberto M. Villanueva",
}

/* ------------------------------------------------------------------ */
/* Residents                                                           */
/* ------------------------------------------------------------------ */

export type Resident = {
  id: number
  residentNo: string
  name: string
  age: number
  sex: "Male" | "Female"
  purok: string
  sector: string
  mobile: string
  status: "Active" | "Pending" | "Inactive"
  registered: string
}

export const residents: Resident[] = [
  { id: 1, residentNo: "RES-2026-04182", name: "Maria L. Santos", age: 34, sex: "Female", purok: "Purok 1", sector: "Regular", mobile: "0917 412 8830", status: "Active", registered: "Jan 12, 2026" },
  { id: 2, residentNo: "RES-2026-04183", name: "Juan D. Dela Cruz", age: 47, sex: "Male", purok: "Purok 2", sector: "Regular", mobile: "0918 220 7741", status: "Active", registered: "Jan 14, 2026" },
  { id: 3, residentNo: "RES-2026-04184", name: "Ana P. Reyes", age: 28, sex: "Female", purok: "Purok 3", sector: "PWD", mobile: "0906 331 9012", status: "Active", registered: "Feb 02, 2026" },
  { id: 4, residentNo: "RES-2026-04185", name: "Pedro S. Ramos", age: 68, sex: "Male", purok: "Purok 1", sector: "Senior Citizen", mobile: "0919 884 1123", status: "Active", registered: "Feb 08, 2026" },
  { id: 5, residentNo: "RES-2026-04186", name: "Liza M. Mendoza", age: 31, sex: "Female", purok: "Purok 4", sector: "Regular", mobile: "0977 110 2244", status: "Pending", registered: "Mar 21, 2026" },
  { id: 6, residentNo: "RES-2026-04187", name: "Roberto C. Garcia", age: 72, sex: "Male", purok: "Purok 2", sector: "Senior Citizen", mobile: "0920 665 3311", status: "Active", registered: "Mar 25, 2026" },
  { id: 7, residentNo: "RES-2026-04188", name: "Christine B. Aguilar", age: 25, sex: "Female", purok: "Purok 5", sector: "Regular", mobile: "0956 442 8890", status: "Active", registered: "Apr 03, 2026" },
  { id: 8, residentNo: "RES-2026-04189", name: "Ernesto T. Bautista", age: 59, sex: "Male", purok: "Purok 3", sector: "PWD", mobile: "0908 771 3345", status: "Active", registered: "Apr 11, 2026" },
  { id: 9, residentNo: "RES-2026-04190", name: "Grace V. Navarro", age: 41, sex: "Female", purok: "Purok 4", sector: "Solo Parent", mobile: "0917 990 5521", status: "Active", registered: "Apr 19, 2026" },
  { id: 10, residentNo: "RES-2026-04191", name: "Miguel A. Ferrer", age: 19, sex: "Male", purok: "Purok 6", sector: "Youth", mobile: "0935 228 6610", status: "Pending", registered: "May 02, 2026" },
  { id: 11, residentNo: "RES-2026-04192", name: "Teresa L. Pascual", age: 66, sex: "Female", purok: "Purok 1", sector: "Senior Citizen", mobile: "0918 447 2290", status: "Active", registered: "May 14, 2026" },
  { id: 12, residentNo: "RES-2026-04193", name: "Danilo R. Mercado", age: 37, sex: "Male", purok: "Purok 5", sector: "Regular", mobile: "0947 118 3374", status: "Inactive", registered: "May 27, 2026" },
  { id: 13, residentNo: "RES-2026-04194", name: "Marites F. Ocampo", age: 53, sex: "Female", purok: "Purok 2", sector: "Regular", mobile: "0999 664 1187", status: "Active", registered: "Jun 05, 2026" },
  { id: 14, residentNo: "RES-2026-04195", name: "Ramon E. Villareal", age: 74, sex: "Male", purok: "Purok 3", sector: "Senior Citizen", mobile: "0916 330 9924", status: "Active", registered: "Jun 18, 2026" },
  { id: 15, residentNo: "RES-2026-04196", name: "Jasmine C. Tolentino", age: 22, sex: "Female", purok: "Purok 6", sector: "Youth", mobile: "0921 559 7702", status: "Pending", registered: "Jul 01, 2026" },
  { id: 16, residentNo: "RES-2026-04197", name: "Alfredo D. Sandoval", age: 63, sex: "Male", purok: "Purok 4", sector: "Senior Citizen", mobile: "0977 882 4416", status: "Active", registered: "Jul 15, 2026" },
  { id: 17, residentNo: "RES-2026-04198", name: "Nena B. Salazar", age: 45, sex: "Female", purok: "Purok 5", sector: "PWD", mobile: "0906 224 8853", status: "Active", registered: "Aug 04, 2026" },
  { id: 18, residentNo: "RES-2026-04199", name: "Carlo M. Ignacio", age: 30, sex: "Male", purok: "Purok 1", sector: "Regular", mobile: "0939 117 6628", status: "Active", registered: "Aug 22, 2026" },
  { id: 19, residentNo: "RES-2026-04200", name: "Divina R. Lopez", age: 69, sex: "Female", purok: "Purok 2", sector: "Senior Citizen", mobile: "0917 553 2201", status: "Pending", registered: "Sep 09, 2026" },
  { id: 20, residentNo: "RES-2026-04201", name: "Benjamin T. Cruz", age: 38, sex: "Male", purok: "Purok 3", sector: "Regular", mobile: "0947 664 3390", status: "Active", registered: "Sep 26, 2026" },
]

/* ------------------------------------------------------------------ */
/* Registrations awaiting approval                                     */
/* ------------------------------------------------------------------ */

export type Registration = {
  id: number
  name: string
  purok: string
  age: number
  submitted: string
  documents: number
  status: "Pending" | "For Review" | "Approved" | "Rejected"
}

export const registrations: Registration[] = [
  { id: 101, name: "Liza M. Mendoza", purok: "Purok 4", age: 31, submitted: "Oct 18, 2026", documents: 3, status: "Pending" },
  { id: 102, name: "Jasmine C. Tolentino", purok: "Purok 6", age: 22, submitted: "Oct 17, 2026", documents: 2, status: "For Review" },
  { id: 103, name: "Miguel A. Ferrer", purok: "Purok 6", age: 19, submitted: "Oct 17, 2026", documents: 4, status: "Pending" },
  { id: 104, name: "Divina R. Lopez", purok: "Purok 2", age: 69, submitted: "Oct 16, 2026", documents: 3, status: "For Review" },
  { id: 105, name: "Arnel P. Dizon", purok: "Purok 5", age: 27, submitted: "Oct 15, 2026", documents: 2, status: "Rejected" },
  { id: 106, name: "Susan G. Manalo", purok: "Purok 3", age: 44, submitted: "Oct 15, 2026", documents: 4, status: "Approved" },
  { id: 107, name: "Joel B. Ramirez", purok: "Purok 1", age: 35, submitted: "Oct 14, 2026", documents: 3, status: "Pending" },
  { id: 108, name: "Milagros A. Perez", purok: "Purok 4", age: 61, submitted: "Oct 13, 2026", documents: 3, status: "Approved" },
]

/* ------------------------------------------------------------------ */
/* Certificates                                                        */
/* ------------------------------------------------------------------ */

export const certificateTypes = [
  "Barangay Clearance",
  "Certificate of Residency",
  "Certificate of Indigency",
  "Business Permit",
  "Certificate of Good Moral Character",
  "Certificate of Low Income",
  "Barangay ID Endorsement",
  "Delayed PSA Registration",
  "Scholarship Endorsement",
  "Marriage / Cohabitation Certificate",
]

export type CertificateRequest = {
  id: string
  resident: string
  type: string
  purpose: string
  filed: string
  status: "Pending" | "For Review" | "Approved" | "For Release" | "Released" | "Rejected"
}

export const certificateRequests: CertificateRequest[] = [
  { id: "CR-2026-0142", resident: "Maria L. Santos", type: "Barangay Clearance", purpose: "Employment", filed: "Oct 9, 2026", status: "Pending" },
  { id: "CR-2026-0141", resident: "Juan D. Dela Cruz", type: "Certificate of Residency", purpose: "School requirement", filed: "Oct 9, 2026", status: "Approved" },
  { id: "CR-2026-0140", resident: "Ana P. Reyes", type: "Certificate of Indigency", purpose: "Medical assistance", filed: "Oct 8, 2026", status: "For Review" },
  { id: "CR-2026-0139", resident: "Pedro S. Ramos", type: "Business Permit", purpose: "Sari-sari store", filed: "Oct 8, 2026", status: "Rejected" },
  { id: "CR-2026-0138", resident: "Liza M. Mendoza", type: "Barangay Clearance", purpose: "Police clearance", filed: "Oct 7, 2026", status: "Released" },
  { id: "CR-2026-0137", resident: "Roberto C. Garcia", type: "Certificate of Residency", purpose: "Pension claim", filed: "Oct 6, 2026", status: "For Release" },
  { id: "CR-2026-0136", resident: "Christine B. Aguilar", type: "Certificate of Good Moral Character", purpose: "Employment", filed: "Oct 5, 2026", status: "Approved" },
  { id: "CR-2026-0135", resident: "Ernesto T. Bautista", type: "Certificate of Indigency", purpose: "Educational aid", filed: "Oct 4, 2026", status: "Released" },
  { id: "CR-2026-0134", resident: "Grace V. Navarro", type: "Scholarship Endorsement", purpose: "College scholarship", filed: "Oct 3, 2026", status: "Pending" },
  { id: "CR-2026-0133", resident: "Teresa L. Pascual", type: "Certificate of Low Income", purpose: "Medical assistance", filed: "Oct 2, 2026", status: "Approved" },
  { id: "CR-2026-0132", resident: "Danilo R. Mercado", type: "Barangay Clearance", purpose: "Employment", filed: "Oct 1, 2026", status: "Released" },
  { id: "CR-2026-0131", resident: "Marites F. Ocampo", type: "Certificate of Residency", purpose: "Bank requirement", filed: "Sep 30, 2026", status: "Rejected" },
]

/** Resident-side view of the same records. */
export const myCertificateRequests = [
  { id: "CR-2026-0142", type: "Barangay Clearance", purpose: "Employment", filed: "Oct 9, 2026", status: "Pending", reference: "Pick up at the barangay hall" },
  { id: "CR-2026-0118", type: "Certificate of Residency", purpose: "School requirement", filed: "Sep 21, 2026", status: "For Release", reference: "Ready for pick up" },
  { id: "CR-2026-0097", type: "Certificate of Indigency", purpose: "Medical assistance", filed: "Aug 30, 2026", status: "Released", reference: "Claimed Sep 1, 2026" },
  { id: "CR-2026-0064", type: "Barangay Clearance", purpose: "Police clearance", filed: "Jul 18, 2026", status: "Released", reference: "Claimed Jul 19, 2026" },
]

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export type Announcement = {
  id: number
  title: string
  summary: string
  audience: "All residents" | "Senior Citizens" | "PWD" | "Youth" | "Barangay officials"
  date: string
  status: "Published" | "Pending" | "Draft" | "Scheduled"
  author: string
  attendees?: number
}

export const announcements: Announcement[] = [
  { id: 1, title: "Senior citizens quarterly assembly", summary: "Pension release, medical mission schedule and DISC updates for the fourth quarter.", audience: "Senior Citizens", date: "Oct 12, 2026", status: "Published", author: "Lupon Sec. R. Villareal", attendees: 84 },
  { id: 2, title: "Barangay clean-up drive", summary: "Weekly clean-up along Riverside Road. Volunteers are welcome at the covered court.", audience: "All residents", date: "Oct 10, 2026", status: "Published", author: "Kap. R. Villanueva", attendees: 132 },
  { id: 3, title: "PWD assistive device distribution", summary: "Claiming of wheelchairs, walkers and hearing aids at the health center.", audience: "PWD", date: "Oct 8, 2026", status: "Published", author: "PWD Desk", attendees: 41 },
  { id: 4, title: "Free blood pressure and diabetes screening", summary: "Open to all residents. Bring a valid barangay ID.", audience: "All residents", date: "Oct 6, 2026", status: "Published", author: "Barangay Health Worker", attendees: 96 },
  { id: 5, title: "Youth sports league orientation", summary: "Basketball and volleyball league sign-ups for ages 15–30.", audience: "Youth", date: "Oct 4, 2026", status: "Published", author: "SK Chairperson", attendees: 58 },
  { id: 6, title: "Kagawad session: budget deliberation", summary: "Special session on the 2027 barangay development fund.", audience: "Barangay officials", date: "Oct 15, 2026", status: "Scheduled", author: "Barangay Secretary" },
  { id: 7, title: "Disaster preparedness seminar", summary: "Earthquake and typhoon response drill with the municipal DRRMO.", audience: "All residents", date: "Oct 14, 2026", status: "Pending", author: "Lupon Sec. R. Villareal" },
  { id: 8, title: "Scholarship application window", summary: "Municipal scholarship applications close on November 15.", audience: "Youth", date: "Oct 20, 2026", status: "Draft", author: "Barangay Secretary" },
]

/* ------------------------------------------------------------------ */
/* Population                                                          */
/* ------------------------------------------------------------------ */

export const populationSummary = {
  residents: 4182,
  households: 1026,
  male: 2074,
  female: 2108,
  registeredThisMonth: 38,
}

export const populationByPurok = [
  { purok: "Purok 1", households: 186, residents: 742 },
  { purok: "Purok 2", households: 174, residents: 691 },
  { purok: "Purok 3", households: 168, residents: 664 },
  { purok: "Purok 4", households: 179, residents: 713 },
  { purok: "Purok 5", households: 165, residents: 655 },
  { purok: "Purok 6", households: 154, residents: 617 },
]

export const populationByAge = [
  { group: "0–17", count: 1042 },
  { group: "18–30", count: 918 },
  { group: "31–45", count: 987 },
  { group: "46–59", count: 664 },
  { group: "60+", count: 571 },
]

export const populationBySector = [
  { sector: "Senior Citizens", count: 486 },
  { sector: "PWD", count: 173 },
  { sector: "Youth", count: 712 },
  { sector: "Solo Parents", count: 218 },
  { sector: "Women", count: 654 },
]

/* ------------------------------------------------------------------ */
/* Lupon / complaints                                                  */
/* ------------------------------------------------------------------ */

export type Complaint = {
  id: string
  complainant: string
  respondent: string
  subject: string
  filed: string
  hearing: string
  status: "Open" | "For Mediation" | "Under Review" | "Settled" | "Escalated" | "Closed"
}

export const complaints: Complaint[] = [
  { id: "BLT-2026-0088", complainant: "Maria L. Santos", respondent: "Danilo R. Mercado", subject: "Noise disturbance past 10 PM", filed: "Oct 18, 2026", hearing: "Oct 25, 2026", status: "For Mediation" },
  { id: "BLT-2026-0087", complainant: "Juan D. Dela Cruz", respondent: "Carlo M. Ignacio", subject: "Property boundary dispute", filed: "Oct 16, 2026", hearing: "Oct 28, 2026", status: "Open" },
  { id: "BLT-2026-0086", complainant: "Grace V. Navarro", respondent: "Ernesto T. Bautista", subject: "Unpaid debt of ₱8,500", filed: "Oct 14, 2026", hearing: "Oct 27, 2026", status: "Under Review" },
  { id: "BLT-2026-0085", complainant: "Roberto C. Garcia", respondent: "Marites F. Ocampo", subject: "Stray animals damaging crops", filed: "Oct 11, 2026", hearing: "Oct 21, 2026", status: "Settled" },
  { id: "BLT-2026-0084", complainant: "Teresa L. Pascual", respondent: "Anonymous", subject: "Vandalism of barangay signage", filed: "Oct 9, 2026", hearing: "—", status: "Escalated" },
  { id: "BLT-2026-0083", complainant: "Christine B. Aguilar", respondent: "Benjamin T. Cruz", subject: "Verbal altercation at the market", filed: "Oct 7, 2026", hearing: "Oct 17, 2026", status: "Closed" },
  { id: "BLT-2026-0082", complainant: "Ana P. Reyes", respondent: "Jasmine C. Tolentino", subject: "Non-return of borrowed tools", filed: "Oct 5, 2026", hearing: "Oct 15, 2026", status: "Settled" },
]

/* ------------------------------------------------------------------ */
/* Dashboard series                                                    */
/* ------------------------------------------------------------------ */

export const monthlyRequests = [
  { month: "May", count: 96 },
  { month: "Jun", count: 118 },
  { month: "Jul", count: 104 },
  { month: "Aug", count: 137 },
  { month: "Sep", count: 152 },
  { month: "Oct", count: 121 },
]

export const requestsByType = [
  { type: "Barangay Clearance", count: 42 },
  { type: "Certificate of Residency", count: 31 },
  { type: "Certificate of Indigency", count: 18 },
  { type: "Business Permit", count: 9 },
  { type: "Blotter Reports", count: 4 },
]

/* ------------------------------------------------------------------ */
/* Resident session                                                    */
/* ------------------------------------------------------------------ */

export const currentResident = {
  id: 1,
  fullName: "Maria L. Santos",
  initials: "MS",
  residentNo: "RES-2026-04182",
  age: 34,
  sex: "Female",
  civilStatus: "Married",
  mobile: "0917 412 8830",
  email: "maria.santos@example.com",
  purok: "Purok 1",
  barangay: barangay.name,
  city: barangay.city,
  province: barangay.province,
  status: "Verified",
  registered: "January 12, 2026",
  classification: "Regular Resident",
  qrId: "QR-4F2A-91C7-2026",
}

export const barangayOptions = [
  "Barangay San Isidro",
  "Barangay Poblacion",
  "Barangay Malinao",
  "Barangay Bagong Silang",
  "Barangay San Roque",
]
