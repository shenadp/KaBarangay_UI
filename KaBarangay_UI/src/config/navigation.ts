import type { LucideIcon } from "lucide-react"
import {
  Accessibility,
  BadgeCheck,
  Banknote,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FileText,
  Gavel,
  HeartHandshake,
  History,
  Home,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Network,
  ScanLine,
  Scale,
  Settings,
  ShieldCheck,
  Siren,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react"

export type SectorKey = "clerk" | "senior" | "pwd" | "lupon"

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export type NavGroup = {
  label?: string
  items: NavItem[]
}

/* ------------------------------------------------------------------ */
/* Admin (desktop only)                                                */
/* ------------------------------------------------------------------ */

/**
 * The order follows the backend's own sidebar (`Overview, Residents, Sectors,
 * Staff, Population, Audit Log, Reports, Org Chart, Emergency Numbers,
 * Settings`). Four surfaces exist as admin routes but are not sidebar items
 * there — QR Scanner, Announcement Approvals, Certificate Requests and Sector
 * Applications — so this demo lists each beside the item it belongs to.
 */
export const adminNav: NavGroup[] = [
  {
    items: [
      { label: "Overview", to: "/admin", icon: LayoutDashboard, end: true },
      { label: "Residents", to: "/admin/residents", icon: Users },
      { label: "QR Scanner", to: "/admin/qr-scanner", icon: ScanLine },
      { label: "Announcement Approvals", to: "/admin/announcements/approvals", icon: Megaphone },
      { label: "Certificate Requests", to: "/admin/certificates", icon: FileText },
    ],
  },
  {
    label: "Barangay Records",
    items: [
      { label: "Sectors", to: "/admin/sectors", icon: UsersRound },
      { label: "Sector Applications", to: "/admin/sector-applications", icon: ClipboardCheck },
      { label: "Staff", to: "/admin/staff", icon: UserCog },
      { label: "Population", to: "/admin/population", icon: BarChart3 },
      { label: "Reports", to: "/admin/reports", icon: FileBarChart },
      { label: "Org Chart", to: "/admin/org-chart", icon: Network },
      { label: "Emergency Numbers", to: "/admin/emergency-numbers", icon: Siren },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Audit Log", to: "/admin/audit-log", icon: History },
      { label: "Settings", to: "/admin/settings", icon: Settings },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Sector desks (desktop only)                                         */
/* ------------------------------------------------------------------ */

export type SectorMeta = {
  key: SectorKey
  name: string
  shortName: string
  roleLabel: string
  icon: LucideIcon
  description: string
}

export const sectors: Record<SectorKey, SectorMeta> = {
  clerk: {
    key: "clerk",
    name: "Office of the Barangay Clerk",
    shortName: "Clerk",
    roleLabel: "Barangay Clerk",
    icon: ClipboardList,
    description: "Certificate processing, resident records and public announcements.",
  },
  senior: {
    key: "senior",
    name: "Senior Citizens Desk",
    shortName: "Senior Citizen",
    roleLabel: "Senior Citizens Desk",
    icon: BadgeCheck,
    description: "Senior citizen roster, benefits and assembly attendance.",
  },
  pwd: {
    key: "pwd",
    name: "PWD Desk",
    shortName: "PWD",
    roleLabel: "PWD Desk",
    icon: Accessibility,
    description: "Persons with disability registry, assistance and attendance.",
  },
  lupon: {
    key: "lupon",
    name: "Lupon Tagapamayapa",
    shortName: "Lupon",
    roleLabel: "Lupon Tagapamayapa",
    icon: Gavel,
    description: "Amicable settlement of disputes referred to the barangay.",
  },
}

export const sectorNav: Record<SectorKey, NavGroup[]> = {
  clerk: [
    {
      items: [
        { label: "Overview", to: "/clerk/dashboard", icon: LayoutDashboard, end: true },
        { label: "Certificates", to: "/clerk/certificates", icon: FileText, end: true },
        { label: "Updates", to: "/clerk/updates", icon: Megaphone, end: true },
        { label: "Programs", to: "/clerk/programs", icon: CalendarDays, end: true },
      ],
    },
    {
      label: "Public documents",
      items: [
        { label: "Disbursements", to: "/clerk/disbursements", icon: Banknote },
        { label: "Citizen's Charter", to: "/clerk/citizen-charter", icon: BookOpen },
        { label: "Org Chart", to: "/clerk/org-chart", icon: Network },
      ],
    },
  ],
  senior: [
    {
      items: [
        { label: "Dashboard", to: "/senior/dashboard", icon: LayoutDashboard, end: true },
        { label: "Members", to: "/senior/residents", icon: Users },
        { label: "Applications", to: "/senior/applications", icon: ClipboardCheck, end: true },
        { label: "Updates", to: "/senior/updates", icon: Megaphone, end: true },
        { label: "Programs", to: "/senior/programs", icon: CalendarDays, end: true },
      ],
    },
  ],
  pwd: [
    {
      items: [
        { label: "Dashboard", to: "/pwd/dashboard", icon: LayoutDashboard, end: true },
        { label: "Members", to: "/pwd/residents", icon: Users },
        { label: "Applications", to: "/pwd/applications", icon: ClipboardCheck, end: true },
        { label: "Updates", to: "/pwd/updates", icon: Megaphone, end: true },
        { label: "Programs", to: "/pwd/programs", icon: CalendarDays, end: true },
      ],
    },
  ],
  lupon: [
    {
      items: [
        { label: "Dashboard", to: "/lupon/dashboard", icon: LayoutDashboard, end: true },
        { label: "Complaints", to: "/lupon/complaints", icon: Gavel, end: true },
        { label: "Cases", to: "/lupon/cases", icon: Scale, end: true },
        { label: "Hearings", to: "/lupon/hearings", icon: CalendarClock, end: true },
      ],
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Resident (mobile first)                                             */
/* ------------------------------------------------------------------ */

export const residentNav: NavItem[] = [
  { label: "Home", to: "/resident", icon: Home, end: true },
  { label: "Certificates", to: "/resident/certificates", icon: FileText },
  { label: "Announcements", to: "/resident/announcements", icon: Megaphone },
  { label: "Lupon", to: "/resident/lupon", icon: HeartHandshake },
  { label: "Profile", to: "/resident/profile", icon: Users },
]

/**
 * The drawer behind the mobile "More" button, grouped exactly as
 * `layouts/ResidentLayout.tsx` groups its navigation sheet: the services a
 * resident uses, the information they can read, and their own account.
 */
export const residentMoreNav: NavGroup[] = [
  {
    label: "Main Services",
    items: [
      { label: "Home", to: "/resident", icon: Home, end: true },
      { label: "Request Certificate", to: "/resident/certificates", icon: FileText },
      { label: "File a Complaint", to: "/resident/lupon", icon: Gavel },
      { label: "Sector Services", to: "/resident/sector-applications", icon: ClipboardCheck },
      { label: "Announcements", to: "/resident/announcements", icon: Megaphone },
      { label: "Updates", to: "/resident/updates", icon: History },
      { label: "Programs", to: "/resident/programs", icon: CalendarDays },
      { label: "Disbursement", to: "/resident/disbursement", icon: Banknote },
    ],
  },
  {
    label: "Information",
    items: [
      { label: "Citizen's Charter", to: "/resident/citizen-charter", icon: BookOpen },
      { label: "Organizational Chart", to: "/resident/org-chart", icon: Network },
      { label: "Kabarangay AI", to: "/resident/chatbot", icon: MessageSquare },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "My Profile", to: "/resident/profile", icon: Users },
      { label: "Settings", to: "/resident/settings", icon: Settings },
      { label: "About", to: "/resident/about", icon: ShieldCheck },
    ],
  },
]
