/**
 * Desk descriptors for the two sector desks.
 *
 * The backend renders the Senior and PWD portals from the same shared
 * components (`SectorApplicationWizard`, `SectorApplicationList`,
 * `SectorApplicationStaffReview`, `ResidentDirectoryTable`) and only switches
 * wording on the sector slug. This file is that switch: one descriptor per desk
 * holding its data source and its wording, consumed by the generic components in
 * `@/components/sectors/desk`. Nothing is fetched — every value is mock data.
 */

import {
  purokList,
  type SectorDeskKey,
  type SectorDeskStore,
  type SectorPostKind,
  type SectorResident,
} from "@/mock/sectorDesks"
import {
  seniorAttendancePool,
  seniorCategoryLabels,
  seniorStore,
  seniorTodayIso,
  seniorPuroks,
  seniorResidents,
  seniorCategoryOptions,
} from "@/mock/senior"
import {
  pwdAttendancePool,
  pwdCategoryLabels,
  pwdCategoryOptions,
  pwdResidents,
  pwdStore,
  pwdTodayIso,
  pwdOfficer,
} from "@/mock/pwd"
import {
  clerkAttendancePool,
  clerkAudienceOptions,
  clerkCategoryLabels,
  clerkCategoryOptions,
  clerkOfficer,
  clerkStore,
  clerkTodayIso,
} from "@/mock/clerkDesk"

export type DeskBoardCopy = {
  title: string
  description: string
  newLabel: string
  panelTitle: string
  panelDescription: string
  noun: string
  emptyTitle: string
  searchPlaceholder: string
}

export type DeskDetailField = {
  /** Stored as the staff intake note, the way the backend folds it into the filing. */
  label: string
  placeholder: string
}

export type DeskAudienceOption = {
  /** Value written into the `audience` field of a post. */
  value: string
  label: string
}

export type SectorDeskDescriptor = {
  key: SectorDeskKey
  /** Route prefix every desk link hangs off, e.g. `/senior`. */
  basePath: string
  /** Sidebar portal label and page eyebrow. */
  eyebrow: string
  /** Full name used in headings, e.g. "Person with Disability (PWD)". */
  sectorTitle: string
  /** Plural form used for the queue and the target sector. */
  sectorPlural: string
  /** The `sectors[]` tag that marks a resident as a member of this desk. */
  memberTag: string
  /** Value written into the `audience` field of a new post. */
  audience: string
  /** Offered on the board form when a desk posts for more than one sector. */
  audienceOptions?: DeskAudienceOption[]
  /** Sector card in the member dialog. */
  registrationLabel: string
  noRegistrationLabel: string

  /** Mock "today" for the desk — filings after this date are still open queues. */
  todayIso: string
  /** Staff member on this desk — recorded as author and intake officer. */
  officerName: string

  puroks: string[]
  residents: SectorResident[]
  attendancePool: () => SectorResident[]
  store: SectorDeskStore

  categoryOptions: string[]
  categoryLabels: Record<string, string>

  /** Intake wording. */
  intakeHeading: string
  intakeEyebrow: string
  proofLabel: string
  proofHint: string
  validIdHint: string
  proofTitlePrefix: string
  detailFields: DeskDetailField[]
  alreadyMemberBadge: string
  alreadyMemberWarning: string
  confirmStatement: string

  /** Page headings. */
  membersTitle: string
  membersDescription: string
  registeredLabel: string
  directoryDescription: string
  applicationsTitle: string
  applicationsDescription: string
  queueAllDescription: string
  dashboardDescription: string
  dashboardBoardTitle: string

  /** Staff review + board messages. */
  eligibilityLine: string
  approveMessage: string
  updatePublishedMessage: string
  programSubmittedMessage: string

  boards: Record<string, DeskBoardCopy>
}

/** The board a view is showing: `auto,update` is the merged announcements board. */
export function deskBoardKey(kinds: SectorPostKind | SectorPostKind[]): string {
  return Array.isArray(kinds) ? kinds.join(",") : kinds
}

export const seniorDesk: SectorDeskDescriptor = {
  key: "senior",
  basePath: "/senior",
  eyebrow: "Senior Citizens Desk",
  sectorTitle: "Senior Citizen",
  sectorPlural: "Senior Citizens",
  memberTag: "Senior Citizen",
  audience: "Senior Citizens",
  registrationLabel: "OSCA number",
  noRegistrationLabel: "No OSCA number yet",

  todayIso: seniorTodayIso,
  officerName: "Rogelio S. Panganiban",

  puroks: seniorPuroks,
  residents: seniorResidents,
  attendancePool: seniorAttendancePool,
  store: seniorStore,

  categoryOptions: seniorCategoryOptions,
  categoryLabels: seniorCategoryLabels,

  intakeHeading: "Staff-Assisted Senior Citizen Application",
  intakeEyebrow: "Senior Citizen Desk",
  proofLabel: "Proof of Age / Senior ID",
  proofHint: "PSA birth certificate, OSCA ID or previous senior citizen card.",
  validIdHint: "Certification issued within the last six months, or any government ID.",
  proofTitlePrefix: "Senior Proof Document",
  detailFields: [
    {
      label: "OSCA identification details",
      placeholder: "OSCA ID number, date of issue, or the record the applicant presented…",
    },
  ],
  alreadyMemberBadge: "Already Active Senior Citizen",
  alreadyMemberWarning:
    "This resident already carries an active senior citizen classification. Filing again creates a duplicate record — use a renewal or reactivation request instead.",
  confirmStatement:
    "I confirm this is the resident requesting a staff-assisted Senior Citizen application.",

  membersTitle: "Senior Citizens Members",
  membersDescription:
    "Authorised roster of senior citizens sector members within the barangay.",
  registeredLabel: "Registered senior citizens",
  directoryDescription:
    "Residents carrying a senior citizen classification, register number first",
  applicationsTitle: "Senior Citizens Applications",
  applicationsDescription: "Track, verify and decide sector membership applications.",
  queueAllDescription: "Every filing received by the senior citizens desk",
  dashboardDescription:
    "Review sector applications, publish updates, manage programs, and record event or pension attendance.",
  dashboardBoardTitle: "Senior sector updates & programs",

  eligibilityLine:
    "I verify this applicant meets Senior Citizens sector eligibility requirements",
  approveMessage: "Application approved and Senior Citizens sector membership activated.",
  updatePublishedMessage: "Senior Citizen sector update published immediately.",
  programSubmittedMessage: "Senior Citizen sector program submitted for admin approval.",

  boards: {
    "auto,update": {
      title: "Senior Citizens Sector Announcements",
      description:
        "Create, update, and manage announcements for the Senior Citizens sector.",
      newLabel: "Create Senior Announcement",
      panelTitle: "Announcements",
      panelDescription: "Notices and updates posted from this desk",
      noun: "announcements",
      emptyTitle: "No announcements in this view",
      searchPlaceholder: "Search announcements…",
    },
    update: {
      title: "Senior Citizens Updates",
      description: "Publish informational notices and advisories for Senior Citizens.",
      newLabel: "Publish Update",
      panelTitle: "Senior Sector Updates",
      panelDescription: "Advisories and service notices for senior citizens",
      noun: "updates",
      emptyTitle: "No updates in this view",
      searchPlaceholder: "Search updates…",
    },
    program: {
      title: "Senior Citizens Programs",
      description:
        "Create and manage scheduled Senior Citizens activities and attendance.",
      newLabel: "Create Program",
      panelTitle: "Senior Sector Programs",
      panelDescription: "Programs run by this desk and their lifecycle",
      noun: "programs",
      emptyTitle: "No programs in this view",
      searchPlaceholder: "Search programs…",
    },
  },
}

export const pwdDesk: SectorDeskDescriptor = {
  key: "pwd",
  basePath: "/pwd",
  eyebrow: "PWD Desk",
  sectorTitle: "Person with Disability (PWD)",
  sectorPlural: "Persons with Disability",
  memberTag: "PWD",
  audience: "Persons with Disability",
  registrationLabel: "PWD ID number",
  noRegistrationLabel: "No PWD ID yet",

  todayIso: pwdTodayIso,
  officerName: pwdOfficer,

  puroks: purokList,
  residents: pwdResidents,
  attendancePool: pwdAttendancePool,
  store: pwdStore,

  categoryOptions: pwdCategoryOptions,
  categoryLabels: pwdCategoryLabels,

  intakeHeading: "Staff-Assisted PWD Application",
  intakeEyebrow: "PWD Desk",
  proofLabel: "Certificate of Disability / Medical Proof",
  proofHint: "Medical or PWD registry certificate issued by a licensed practitioner.",
  validIdHint: "Barangay residency certification or any government-issued ID.",
  proofTitlePrefix: "PWD Proof Document",
  detailFields: [
    {
      label: "Disability type",
      placeholder: "Physical, visual, hearing, psychosocial, intellectual, learning…",
    },
    {
      label: "Assistive devices",
      placeholder: "Wheelchair, white cane, hearing aid, prosthesis — or none on file.",
    },
  ],
  alreadyMemberBadge: "Already Active PWD Member",
  alreadyMemberWarning:
    "This resident already carries an active PWD classification. Filing again creates a duplicate record — use a renewal or reactivation request instead.",
  confirmStatement:
    "I confirm this is the resident requesting a staff-assisted Person with Disability application.",

  membersTitle: "PWD Members",
  membersDescription:
    "Authorised roster of PWD sector members within the barangay, with their sector ID and membership standing.",
  registeredLabel: "Registered PWD members",
  directoryDescription:
    "Residents carrying a PWD classification, register number first",
  applicationsTitle: "PWD Sector Applications",
  applicationsDescription: "Track, verify and decide sector membership applications.",
  queueAllDescription: "Every filing received by the PWD desk",
  dashboardDescription:
    "Review sector applications, publish updates, manage programs, and record attendance for ayuda releases.",
  dashboardBoardTitle: "PWD sector updates & programs",

  eligibilityLine:
    "I verify this applicant meets the PWD sector eligibility requirements",
  approveMessage: "Application approved and PWD Sector membership activated.",
  updatePublishedMessage: "PWD sector update published immediately.",
  programSubmittedMessage: "PWD sector program submitted for admin approval.",

  boards: {
    "auto,update": {
      title: "Announcements",
      description:
        "Notices and updates published from the PWD desk, with their approval standing.",
      newLabel: "New announcement",
      panelTitle: "Announcements",
      panelDescription: "Notices and updates posted from this desk",
      noun: "announcements",
      emptyTitle: "No announcements in this view",
      searchPlaceholder: "Search announcement title…",
    },
    update: {
      title: "Updates",
      description: "Short advisories pushed to the residents’ PWD update feed.",
      newLabel: "New update",
      panelTitle: "PWD Sector Updates",
      panelDescription: "Advisories and service notices for PWD members",
      noun: "updates",
      emptyTitle: "No updates in this view",
      searchPlaceholder: "Search update title…",
    },
    program: {
      title: "Programs",
      description: "PWD programs and activities, from proposal through to completion.",
      newLabel: "New program",
      panelTitle: "PWD Sector Programs",
      panelDescription: "Programs run by this desk and their lifecycle",
      noun: "programs",
      emptyTitle: "No programs in this view",
      searchPlaceholder: "Search program title…",
    },
  },
}

export const sectorDesks: Record<SectorDeskKey, SectorDeskDescriptor> = {
  senior: seniorDesk,
  pwd: pwdDesk,
}

export type SectorDesk = SectorDeskDescriptor

/**
 * The slice of a descriptor the boards and the QR attendance sheet read.
 *
 * The clerk runs the same announcement, update and program pages the sector
 * desks do — the backend points all three at one `AnnouncementController` — but
 * it has no membership queue, so it only needs this subset.
 */
export type DeskBoardSet = Pick<
  SectorDeskDescriptor,
  | "attendancePool"
  | "audience"
  | "audienceOptions"
  | "basePath"
  | "boards"
  | "categoryLabels"
  | "categoryOptions"
  | "eyebrow"
  | "officerName"
  | "programSubmittedMessage"
  | "sectorPlural"
  | "store"
  | "todayIso"
  | "updatePublishedMessage"
>

export const clerkDesk: DeskBoardSet = {
  basePath: "/clerk",
  eyebrow: "Clerk Desk",
  /** The clerk posts barangay-wide, so the sheet speaks of barangay activities. */
  sectorPlural: "Barangay",
  audience: "All Residents",
  audienceOptions: clerkAudienceOptions,

  todayIso: clerkTodayIso,
  officerName: clerkOfficer,

  attendancePool: clerkAttendancePool,
  store: clerkStore,

  categoryOptions: clerkCategoryOptions,
  categoryLabels: clerkCategoryLabels,

  updatePublishedMessage: "Update published immediately.",
  programSubmittedMessage: "Announcement submitted for admin approval.",

  boards: {
    "auto,update": {
      title: "Announcements",
      description:
        "Create, update and manage barangay-wide notices, with their approval standing.",
      newLabel: "New announcement",
      panelTitle: "Barangay Announcements",
      panelDescription: "Notices and events posted from the clerk desk",
      noun: "announcements",
      emptyTitle: "No announcements in this view",
      searchPlaceholder: "Search announcements by title or content…",
    },
    update: {
      title: "Updates",
      description: "Publish informational notices and advisories straight to residents.",
      newLabel: "Publish update",
      panelTitle: "Barangay Updates",
      panelDescription: "Advisories published by the clerk desk",
      noun: "updates",
      emptyTitle: "No updates in this view",
      searchPlaceholder: "Search updates by title or content…",
    },
    program: {
      title: "Programs",
      description: "Create and manage scheduled barangay activities and their attendance.",
      newLabel: "Create program",
      panelTitle: "Barangay Programs",
      panelDescription: "Scheduled activities run by the barangay",
      noun: "programs",
      emptyTitle: "No programs in this view",
      searchPlaceholder: "Search program title…",
    },
  },
}
