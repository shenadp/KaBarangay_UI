import { Navigate, Route, Routes } from "react-router-dom"

import { TooltipProvider } from "@/components/ui/tooltip"
import DashboardLayout from "@/layouts/DashboardLayout"
import ResidentLayout from "@/layouts/ResidentLayout"
import { adminNav, sectorNav, type SectorKey } from "@/config/navigation"

/* Auth */
import StaffLogin from "@/pages/auth/StaffLogin"
import ResidentLogin from "@/pages/auth/ResidentLogin"
import ResidentRegister from "@/pages/auth/ResidentRegister"
import ForgotPassword from "@/pages/auth/ForgotPassword"
import RegistrationPending from "@/pages/auth/RegistrationPending"
import RegistrationAccess from "@/pages/auth/RegistrationAccess"
import ApplicationStatus from "@/pages/auth/ApplicationStatus"
import EmailVerified from "@/pages/auth/EmailVerified"
import VerifyResident from "@/pages/resident/VerifyResident"
import ResetPassword from "@/pages/auth/ResetPassword"

/* Admin */
import AdminDashboard from "@/pages/admin/Dashboard"
import AdminResidents from "@/pages/admin/Residents"
import AdminSectorApplications from "@/pages/admin/SectorApplications"
import AdminSectorApplicationDetail from "@/pages/admin/SectorApplicationDetail"
import AdminAnnouncementApprovals from "@/pages/admin/AnnouncementApprovals"
import AdminCertificates from "@/pages/admin/Certificates"
import AdminSectors from "@/pages/admin/Sectors"
import AdminStaff from "@/pages/admin/Staff"
import AdminAuditLog from "@/pages/admin/AuditLog"
import AdminReports from "@/pages/admin/Reports"
import AdminPopulation from "@/pages/admin/Population"
import AdminOrgChart from "@/pages/admin/OrgChart"
import AdminEmergencyNumbers from "@/pages/admin/EmergencyNumbers"
import AdminQrScanner from "@/pages/admin/QrScanner"
import AdminSettings from "@/pages/admin/Settings"

/* Sectors — clerk */
import ClerkDashboard from "@/pages/sectors/clerk/Dashboard"
import ClerkCertificates from "@/pages/sectors/clerk/Certificates"
import ClerkCertificateDetail from "@/pages/sectors/clerk/CertificateDetail"
import ClerkAnnouncements from "@/pages/sectors/clerk/Announcements"
import ClerkAnnouncementDetail from "@/pages/sectors/clerk/AnnouncementDetail"
import ClerkUpdates from "@/pages/sectors/clerk/Updates"
import ClerkUpdateDetail from "@/pages/sectors/clerk/UpdateDetail"
import ClerkAttendance from "@/pages/sectors/clerk/Attendance"
import ClerkPrograms from "@/pages/sectors/clerk/Programs"
import ClerkProgramDetail from "@/pages/sectors/clerk/ProgramDetail"
import ClerkDisbursements from "@/pages/sectors/clerk/Disbursements"
import ClerkDisbursementDetail from "@/pages/sectors/clerk/DisbursementDetail"
import ClerkCitizenCharter from "@/pages/sectors/clerk/CitizenCharter"
import ClerkCitizenCharterDetail from "@/pages/sectors/clerk/CitizenCharterDetail"
import ClerkOrgChart from "@/pages/sectors/clerk/OrgChart"

/* Sectors — senior citizens */
import SeniorDashboard from "@/pages/sectors/senior/Dashboard"
import SeniorMembers from "@/pages/sectors/senior/Members"
import SeniorApplications from "@/pages/sectors/senior/Applications"
import SeniorApplicationCreate from "@/pages/sectors/senior/ApplicationCreate"
import SeniorApplicationDetail from "@/pages/sectors/senior/ApplicationDetail"
import SeniorAnnouncements from "@/pages/sectors/senior/Announcements"
import SeniorAnnouncementDetail from "@/pages/sectors/senior/AnnouncementDetail"
import SeniorAttendance from "@/pages/sectors/senior/Attendance"
import SeniorUpdates from "@/pages/sectors/senior/Updates"
import SeniorUpdateDetail from "@/pages/sectors/senior/UpdateDetail"
import SeniorPrograms from "@/pages/sectors/senior/Programs"
import SeniorProgramDetail from "@/pages/sectors/senior/ProgramDetail"

/* Sectors — PWD */
import PwdDashboard from "@/pages/sectors/pwd/Dashboard"
import PwdMembers from "@/pages/sectors/pwd/Members"
import PwdApplications from "@/pages/sectors/pwd/Applications"
import PwdApplicationCreate from "@/pages/sectors/pwd/ApplicationCreate"
import PwdApplicationDetail from "@/pages/sectors/pwd/ApplicationDetail"
import PwdAnnouncements from "@/pages/sectors/pwd/Announcements"
import PwdAnnouncementDetail from "@/pages/sectors/pwd/AnnouncementDetail"
import PwdAttendance from "@/pages/sectors/pwd/Attendance"
import PwdUpdates from "@/pages/sectors/pwd/Updates"
import PwdUpdateDetail from "@/pages/sectors/pwd/UpdateDetail"
import PwdPrograms from "@/pages/sectors/pwd/Programs"
import PwdProgramDetail from "@/pages/sectors/pwd/ProgramDetail"

/* Sectors — lupon */
import LuponDashboard from "@/pages/sectors/lupon/Dashboard"
import LuponComplaints from "@/pages/sectors/lupon/Complaints"
import LuponCases from "@/pages/sectors/lupon/Cases"
import LuponNewCase from "@/pages/sectors/lupon/NewCase"
import LuponCaseDetail from "@/pages/sectors/lupon/CaseDetail"
import LuponHearings from "@/pages/sectors/lupon/Hearings"

/* Resident */
import ResidentHome from "@/pages/resident/Home"
import ResidentCertificates from "@/pages/resident/Certificates"
import ResidentAnnouncements from "@/pages/resident/Announcements"
import ResidentAnnouncementDetail from "@/pages/resident/AnnouncementDetail"
import ResidentUpdates from "@/pages/resident/Updates"
import ResidentPrograms from "@/pages/resident/Programs"
import ResidentOrgChart from "@/pages/resident/OrgChart"
import ResidentSectorApplications from "@/pages/resident/SectorApplications"
import ResidentSectorApplicationEdit from "@/pages/resident/SectorApplicationEdit"
import ResidentLupon from "@/pages/resident/Lupon"
import ResidentLuponCaseDetail from "@/pages/resident/LuponCaseDetail"
import ResidentProfile from "@/pages/resident/Profile"
import ResidentSettings from "@/pages/resident/Settings"
import ResidentAbout from "@/pages/resident/About"
import ResidentCitizenCharter from "@/pages/resident/CitizenCharter"
import ResidentCitizenCharterDetail from "@/pages/resident/CitizenCharterDetail"
import ResidentDisbursement from "@/pages/resident/Disbursement"
import ResidentDisbursementDetail from "@/pages/resident/DisbursementDetail"
import ResidentChatbot from "@/pages/resident/Chatbot"

const adminUser = { name: "Barangay Admin", role: "Administrator", initials: "BA" }

const sectorUsers: Record<SectorKey, { name: string; role: string; initials: string }> = {
  clerk: { name: "Elena R. Villamor", role: "Barangay Clerk", initials: "EV" },
  senior: { name: "Rogelio S. Panganiban", role: "Senior Citizens Desk", initials: "RP" },
  pwd: { name: "Armando V. Ledesma", role: "PWD Desk", initials: "AL" },
  lupon: { name: "Felix M. Aquino", role: "Lupon Tagapamayapa", initials: "FA" },
}

const sectorPortalLabels: Record<SectorKey, string> = {
  clerk: "Clerk desk",
  senior: "Senior citizens desk",
  pwd: "PWD desk",
  lupon: "Lupon portal",
}

export default function App() {
  return (
    <TooltipProvider delayDuration={150}>
      <Routes>
        {/* ---------------------------------------------------------- */}
        {/* Authentication                                              */}
        {/* ---------------------------------------------------------- */}
        <Route path="/" element={<Navigate to="/resident/login" replace />} />
        <Route path="/login" element={<StaffLogin />} />
        <Route path="/resident/login" element={<ResidentLogin />} />
        <Route path="/resident/register" element={<ResidentRegister />} />
        <Route path="/resident/register/submitted" element={<RegistrationPending />} />
        <Route path="/resident/application/access" element={<RegistrationAccess />} />
        <Route path="/resident/application/:reference" element={<ApplicationStatus />} />
        <Route path="/resident/forgot-password" element={<ForgotPassword />} />
        <Route path="/resident/reset-password/:token" element={<ResetPassword />} />
        <Route path="/resident/email/verify/:token" element={<EmailVerified />} />
        <Route path="/verify/resident/:token" element={<VerifyResident />} />

        {/* ---------------------------------------------------------- */}
        {/* Admin (desktop)                                             */}
        {/* ---------------------------------------------------------- */}
        <Route
          element={
            <DashboardLayout
              nav={adminNav}
              user={adminUser}
              portalLabel="Admin portal"
              searchPlaceholder="Search residents or requests"
            />
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/residents" element={<AdminResidents />} />
          <Route path="/admin/sector-applications" element={<AdminSectorApplications />} />
          <Route path="/admin/sector-applications/:id" element={<AdminSectorApplicationDetail />} />
          <Route path="/admin/announcements/approvals" element={<AdminAnnouncementApprovals />} />
          <Route path="/admin/certificates" element={<AdminCertificates />} />
          <Route path="/admin/sectors" element={<AdminSectors />} />
          <Route path="/admin/staff" element={<AdminStaff />} />
          <Route path="/admin/audit-log" element={<AdminAuditLog />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/population" element={<AdminPopulation />} />
          <Route path="/admin/org-chart" element={<AdminOrgChart />} />
          <Route path="/admin/emergency-numbers" element={<AdminEmergencyNumbers />} />
          <Route path="/admin/qr-scanner" element={<AdminQrScanner />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        {/* ---------------------------------------------------------- */}
        {/* Clerk desk (desktop)                                        */}
        {/* ---------------------------------------------------------- */}
        <Route
          element={
            <DashboardLayout
              nav={sectorNav.clerk}
              user={sectorUsers.clerk}
              portalLabel={sectorPortalLabels.clerk}
              searchPlaceholder="Search residents or requests"
            />
          }
        >
          <Route path="/clerk/dashboard" element={<ClerkDashboard />} />
          <Route path="/clerk/certificates" element={<ClerkCertificates />} />
          <Route path="/clerk/certificates/:id" element={<ClerkCertificateDetail />} />
          <Route path="/clerk/updates" element={<ClerkUpdates />} />
          <Route path="/clerk/updates/:id" element={<ClerkUpdateDetail />} />
          <Route path="/clerk/programs" element={<ClerkPrograms />} />
          <Route path="/clerk/programs/:id" element={<ClerkProgramDetail />} />
          <Route path="/clerk/announcements" element={<ClerkAnnouncements />} />
          <Route path="/clerk/announcements/:id" element={<ClerkAnnouncementDetail />} />
          <Route path="/clerk/announcements/:id/attendance" element={<ClerkAttendance />} />
          <Route path="/clerk/disbursements" element={<ClerkDisbursements />} />
          <Route path="/clerk/disbursements/:id" element={<ClerkDisbursementDetail />} />
          <Route path="/clerk/citizen-charter" element={<ClerkCitizenCharter />} />
          <Route path="/clerk/citizen-charter/:id" element={<ClerkCitizenCharterDetail />} />
          <Route path="/clerk/org-chart" element={<ClerkOrgChart />} />
        </Route>

        {/* ---------------------------------------------------------- */}
        {/* Senior citizens desk (desktop)                              */}
        {/* ---------------------------------------------------------- */}
        <Route
          element={
            <DashboardLayout
              nav={sectorNav.senior}
              user={sectorUsers.senior}
              portalLabel={sectorPortalLabels.senior}
              searchPlaceholder="Search senior citizens"
            />
          }
        >
          <Route path="/senior/dashboard" element={<SeniorDashboard />} />
          <Route path="/senior/residents" element={<SeniorMembers />} />
          <Route path="/senior/applications" element={<SeniorApplications />} />
          <Route path="/senior/applications/create" element={<SeniorApplicationCreate />} />
          <Route path="/senior/applications/:id" element={<SeniorApplicationDetail />} />
          <Route path="/senior/announcements" element={<SeniorAnnouncements />} />
          <Route path="/senior/announcements/:id" element={<SeniorAnnouncementDetail />} />
          <Route path="/senior/announcements/:id/attendance" element={<SeniorAttendance />} />
          <Route path="/senior/updates" element={<SeniorUpdates />} />
          <Route path="/senior/updates/:id" element={<SeniorUpdateDetail />} />
          <Route path="/senior/programs" element={<SeniorPrograms />} />
          <Route path="/senior/programs/:id" element={<SeniorProgramDetail />} />
        </Route>

        {/* ---------------------------------------------------------- */}
        {/* PWD desk (desktop)                                          */}
        {/* ---------------------------------------------------------- */}
        <Route
          element={
            <DashboardLayout
              nav={sectorNav.pwd}
              user={sectorUsers.pwd}
              portalLabel={sectorPortalLabels.pwd}
              searchPlaceholder="Search registered PWDs"
            />
          }
        >
          <Route path="/pwd/dashboard" element={<PwdDashboard />} />
          <Route path="/pwd/residents" element={<PwdMembers />} />
          <Route path="/pwd/applications" element={<PwdApplications />} />
          <Route path="/pwd/applications/create" element={<PwdApplicationCreate />} />
          <Route path="/pwd/applications/:id" element={<PwdApplicationDetail />} />
          <Route path="/pwd/announcements" element={<PwdAnnouncements />} />
          <Route path="/pwd/announcements/:id" element={<PwdAnnouncementDetail />} />
          <Route path="/pwd/announcements/:id/attendance" element={<PwdAttendance />} />
          <Route path="/pwd/updates" element={<PwdUpdates />} />
          <Route path="/pwd/updates/:id" element={<PwdUpdateDetail />} />
          <Route path="/pwd/programs" element={<PwdPrograms />} />
          <Route path="/pwd/programs/:id" element={<PwdProgramDetail />} />
        </Route>

        {/* ---------------------------------------------------------- */}
        {/* Lupon tagapamayapa (desktop)                                */}
        {/* ---------------------------------------------------------- */}
        <Route
          element={
            <DashboardLayout
              nav={sectorNav.lupon}
              user={sectorUsers.lupon}
              portalLabel={sectorPortalLabels.lupon}
              searchPlaceholder="Search complaints"
            />
          }
        >
          <Route path="/lupon/dashboard" element={<LuponDashboard />} />
          <Route path="/lupon/complaints" element={<LuponComplaints />} />
          <Route path="/lupon/cases" element={<LuponCases />} />
          <Route path="/lupon/cases/create" element={<LuponNewCase />} />
          <Route path="/lupon/cases/:id" element={<LuponCaseDetail />} />
          <Route path="/lupon/hearings" element={<LuponHearings />} />
        </Route>

        {/* ---------------------------------------------------------- */}
        {/* Resident portal (mobile first)                              */}
        {/* ---------------------------------------------------------- */}
        <Route element={<ResidentLayout />}>
          <Route path="/resident" element={<ResidentHome />} />
          <Route path="/resident/certificates" element={<ResidentCertificates />} />
          <Route path="/resident/announcements" element={<ResidentAnnouncements />} />
          <Route path="/resident/announcements/:id" element={<ResidentAnnouncementDetail />} />
          <Route path="/resident/updates" element={<ResidentUpdates />} />
          <Route path="/resident/updates/:id" element={<ResidentAnnouncementDetail kind="updates" />} />
          <Route path="/resident/programs" element={<ResidentPrograms />} />
          <Route path="/resident/org-chart" element={<ResidentOrgChart />} />
          <Route path="/resident/sector-applications" element={<ResidentSectorApplications />} />
          <Route
            path="/resident/sector-applications/:id/edit"
            element={<ResidentSectorApplicationEdit />}
          />
          <Route path="/resident/lupon" element={<ResidentLupon />} />
          <Route path="/resident/lupon/cases/:id" element={<ResidentLuponCaseDetail />} />
          <Route path="/resident/profile" element={<ResidentProfile />} />
          <Route path="/resident/settings" element={<ResidentSettings />} />
          <Route path="/resident/about" element={<ResidentAbout />} />
          <Route path="/resident/citizen-charter" element={<ResidentCitizenCharter />} />
          <Route path="/resident/citizen-charter/:id" element={<ResidentCitizenCharterDetail />} />
          <Route path="/resident/disbursement" element={<ResidentDisbursement />} />
          <Route path="/resident/disbursement/:id" element={<ResidentDisbursementDetail />} />
          <Route path="/resident/chatbot" element={<ResidentChatbot />} />
        </Route>

        <Route path="*" element={<Navigate to="/resident/login" replace />} />
      </Routes>
    </TooltipProvider>
  )
}
