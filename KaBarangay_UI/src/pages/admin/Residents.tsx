import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Home, RotateCcw, SearchX, ShieldCheck, UserRoundPlus, Users } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import SegmentedTabs, { type Segment } from "@/components/SegmentedTabs"
import StatCard from "@/components/StatCard"
import StatusBadge from "@/components/StatusBadge"
import { Panel } from "@/components/Panel"
import { SearchInput, TablePagination } from "@/components/TableTools"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PurokFilterChips,
  SectorChips,
  formatAdminDate,
  purokLabel,
} from "@/components/admin/residents/bits"
import CreateResidentDialog from "@/components/admin/residents/CreateResidentDialog"
import CorrectionRequestDialog from "@/components/admin/residents/CorrectionRequestDialog"
import RejectRegistrationDialog from "@/components/admin/residents/RejectRegistrationDialog"
import ResidentDetailsDialog, {
  type DetailsTarget,
} from "@/components/admin/residents/ResidentDetailsDialog"
import ReviewRegistrationDialog from "@/components/admin/residents/ReviewRegistrationDialog"
import {
  fullNameOf,
  householdRows,
  residentPageSize,
  residentRegistry,
  type AdminResident,
  type ResidentRegistration,
} from "@/mock/admin/residents"

/* ------------------------------------------------------------------ */
/* Tabs                                                               */
/* ------------------------------------------------------------------ */

/** One page, six independent queues — each keeps its own page number. */
type TabKey = "all" | "households" | "added" | "pending" | "correction" | "rejected"

const RESIDENT_TABS: TabKey[] = ["all", "added", "households"]

const firstPage = (): Record<TabKey, number> => ({
  all: 1,
  households: 1,
  added: 1,
  pending: 1,
  correction: 1,
  rejected: 1,
})

/* ------------------------------------------------------------------ */
/* Search — the same columns the controller LIKEs                      */
/* ------------------------------------------------------------------ */

const has = (value: string | null | undefined, needle: string) =>
  (value ?? "").toLowerCase().includes(needle)

/** The directory only matches the resident number and the names. */
function matchesDirectory(resident: AdminResident, needle: string): boolean {
  if (!needle) return true
  return (
    has(resident.residentNumber, needle) ||
    has(resident.firstName, needle) ||
    has(resident.middleName, needle) ||
    has(resident.lastName, needle)
  )
}

/** The Admin masterlist also matches contact details and the purok name. */
function matchesResident(resident: AdminResident, needle: string): boolean {
  if (!needle) return true
  return (
    matchesDirectory(resident, needle) ||
    has(resident.mobile, needle) ||
    has(resident.email, needle) ||
    has(purokLabel(resident.purokId), needle)
  )
}

function matchesApplicant(registration: ResidentRegistration, needle: string): boolean {
  if (!needle) return true
  return (
    has(registration.reference, needle) ||
    has(registration.firstName, needle) ||
    has(registration.middleName, needle) ||
    has(registration.lastName, needle) ||
    has(registration.mobile, needle) ||
    has(registration.email, needle) ||
    has(purokLabel(registration.purokId), needle)
  )
}

/** `orderBy(last_name, first_name, id)`, the resident tables. */
const byName = (a: AdminResident, b: AdminResident) =>
  a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName) || a.id - b.id

/** Registrations come back newest submission first. */
const byNewest = (a: ResidentRegistration, b: ResidentRegistration) =>
  (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "") || b.id - a.id

function paginate<T>(rows: T[], page: number): T[] {
  const start = (page - 1) * residentPageSize
  return rows.slice(start, start + residentPageSize)
}

/* ------------------------------------------------------------------ */
/* Record actions the backend asks through `window.confirm`            */
/* ------------------------------------------------------------------ */

type ActionKind =
  | "activate"
  | "deactivate"
  | "enable_login"
  | "disable_login"
  | "revoke_qr"
  | "issue_qr"

type PendingAction = { kind: ActionKind; resident: AdminResident }

function residentActionQuestion(kind: ActionKind, fullName: string): string | null {
  switch (kind) {
    case "deactivate":
      return `Deactivate ${fullName}? They will lose portal access until reactivated.`
    case "disable_login":
      return `Disable the login account for ${fullName}? They will not be able to sign in.`
    case "revoke_qr":
      return `Revoke the QR credential for ${fullName}? Their current QR code will stop working immediately.`
    case "issue_qr":
      return `Reissue the QR credential for ${fullName}? Any previously issued QR code will stop working immediately.`
    case "activate":
    case "enable_login":
      return null
  }
}

const qrBadge = (status: AdminResident["qrStatus"]) =>
  status === "active"
    ? { label: "Active", tone: "success" as const }
    : status === "revoked"
      ? { label: "Revoked", tone: "danger" as const }
      : { label: "Not issued", tone: "neutral" as const }

/* ------------------------------------------------------------------ */
/* Page                                                              */
/* ------------------------------------------------------------------ */

export default function AdminResidents() {
  /** Bumping the version re-reads the registry, the way a partial reload does. */
  const [version, setVersion] = useState(0)
  const sync = () => setVersion((current) => current + 1)

  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<TabKey>(() =>
    // A dashboard link can drop straight into the household register.
    searchParams.get("tab") === "households" ? "households" : "all",
  )
  const [purokId, setPurokId] = useState<number | null>(null)
  const [pages, setPages] = useState(firstPage)

  /** Two searches: the resident tabs and the applicant tabs never share one. */
  const [residentQuery, setResidentQuery] = useState("")
  const [applicantQuery, setApplicantQuery] = useState("")
  const [residentNeedle, setResidentNeedle] = useState("")
  const [applicantNeedle, setApplicantNeedle] = useState("")

  const [flash, setFlash] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState<ResidentRegistration | null>(null)
  const [correcting, setCorrecting] = useState<ResidentRegistration | null>(null)
  const [rejecting, setRejecting] = useState<ResidentRegistration | null>(null)
  const [details, setDetails] = useState<DetailsTarget>(null)
  const [creating, setCreating] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [busy, setBusy] = useState(false)

  const onResidentTabs = RESIDENT_TABS.includes(tab)

  /* Each search box debounces 300 ms before the list reloads. */
  useEffect(() => {
    const timer = window.setTimeout(() => setResidentNeedle(residentQuery.trim().toLowerCase()), 300)
    return () => window.clearTimeout(timer)
  }, [residentQuery])

  useEffect(() => {
    const timer = window.setTimeout(() => setApplicantNeedle(applicantQuery.trim().toLowerCase()), 300)
    return () => window.clearTimeout(timer)
  }, [applicantQuery])

  /* A filter change restarts only the pages of the tabs it applies to. */
  useEffect(() => {
    setPages((current) => ({ ...current, all: 1, added: 1, households: 1 }))
  }, [residentNeedle, purokId])

  useEffect(() => {
    setPages((current) => ({ ...current, pending: 1, correction: 1, rejected: 1 }))
  }, [applicantNeedle, purokId])

  const residents = useMemo(() => residentRegistry.residents(), [version])
  const registrations = useMemo(() => residentRegistry.registrations(), [version])

  /* The directory excludes applicants and official records with no online account. */
  const directory = useMemo(
    () =>
      residents
        .filter((resident) => resident.accountExists && resident.accountActive)
        .filter((resident) => purokId === null || resident.purokId === purokId)
        .filter((resident) => matchesDirectory(resident, residentNeedle))
        .sort(byName),
    [residents, purokId, residentNeedle],
  )

  const adminAdded = useMemo(
    () =>
      residents
        .filter((resident) => resident.source === "admin")
        .filter((resident) => purokId === null || resident.purokId === purokId)
        .filter((resident) => matchesResident(resident, residentNeedle))
        .sort(byName),
    [residents, purokId, residentNeedle],
  )

  const households = useMemo(
    () =>
      householdRows()
        .filter((household) => purokId === null || household.purokId === purokId)
        .filter(
          (household) =>
            !residentNeedle || has(household.code, residentNeedle) || has(household.head, residentNeedle),
        ),
    [version, purokId, residentNeedle],
  )

  const queue = (status: ResidentRegistration["status"]) =>
    registrations
      .filter((registration) => registration.status === status)
      .filter((registration) => purokId === null || registration.purokId === purokId)
      .filter((registration) => matchesApplicant(registration, applicantNeedle))
      .sort(byNewest)

  const pendingRows = useMemo(
    () => queue("pending"),
    [registrations, purokId, applicantNeedle],
  )
  const correctionRows = useMemo(
    () => queue("needs_correction"),
    [registrations, purokId, applicantNeedle],
  )
  const rejectedRows = useMemo(
    () => queue("rejected"),
    [registrations, purokId, applicantNeedle],
  )

  const totals: Record<TabKey, number> = {
    all: directory.length,
    households: households.length,
    added: adminAdded.length,
    pending: pendingRows.length,
    correction: correctionRows.length,
    rejected: rejectedRows.length,
  }

  const stats = residentRegistry.stats()

  const segments: Segment[] = [
    { label: "All Residents", value: "all", count: totals.all },
    { label: "Households", value: "households", count: totals.households },
    { label: "Added by Admin", value: "added", count: totals.added },
    { label: "Pending Accounts", value: "pending", count: totals.pending },
    { label: "Needs Correction", value: "correction", count: totals.correction },
    { label: "Rejected", value: "rejected", count: totals.rejected },
  ]

  const filtersActive = purokId !== null || applicantNeedle !== ""
  const totalPending = residentRegistry.registrationsIn("pending").length

  const announce = (message: string) => {
    setFlash(message)
    setActionError(null)
  }

  const clearFilters = () => {
    setPurokId(null)
    setApplicantQuery("")
    setApplicantNeedle("")
    setPages((current) => ({ ...current, pending: 1 }))
  }

  /* Resident actions ------------------------------------------------ */

  const runAction = (action: PendingAction) => {
    setBusy(true)
    // UI-only: the backend integration replaces this delay.
    window.setTimeout(() => {
      const { kind, resident } = action
      const result =
        kind === "activate"
          ? residentRegistry.setResidentStatus(resident.id, "active")
          : kind === "deactivate"
            ? residentRegistry.setResidentStatus(resident.id, "inactive")
            : kind === "enable_login"
              ? residentRegistry.setAccountStatus(resident.id, true)
              : kind === "disable_login"
                ? residentRegistry.setAccountStatus(resident.id, false)
                : kind === "revoke_qr"
                  ? residentRegistry.revokeQr(resident.id)
                  : residentRegistry.issueQr(resident.id)

      setBusy(false)
      setPending(null)
      sync()
      if (result.ok) announce(result.message)
      else setActionError(result.message)
    }, 500)
  }

  const requestAction = (kind: ActionKind, resident: AdminResident) => {
    setActionError(null)
    // Activating a resident or enabling a login needs no confirmation; the rest do.
    if (residentActionQuestion(kind, fullNameOf(resident)) === null) {
      runAction({ kind, resident })
      return
    }
    setPending({ kind, resident })
  }

  const retryNotification = (registrationId: number) => {
    setBusy(true)
    window.setTimeout(() => {
      const result = residentRegistry.retryDecisionNotification(registrationId)
      setBusy(false)
      sync()
      if (result.ok) announce(result.message)
      else setActionError(result.message)
    }, 500)
  }

  /* Shared cells ---------------------------------------------------- */

  const openResident = (id: number) => setDetails({ type: "resident", id })

  const linkButton = "text-xs font-medium text-brand hover:underline"
  const dangerLink = "text-xs font-medium text-destructive hover:underline"

  const residentCell = (resident: AdminResident) => (
    <>
      <button
        type="button"
        onClick={() => openResident(resident.id)}
        className="text-left text-sm font-medium text-ink-strong hover:text-brand hover:underline"
      >
        {fullNameOf(resident)}
      </button>
      <p className="mt-0.5 text-[11px] text-ink-faint">{resident.sex ?? "—"}</p>
    </>
  )

  const applicantCell = (registration: ResidentRegistration) => (
    <>
      <p className="text-sm font-medium text-ink-strong">{fullNameOf(registration)}</p>
      <p className="mt-0.5 text-[11px] text-ink-faint tnum">{registration.mobile}</p>
      {registration.decisionNotification && (
        <p className="mt-1 text-[11px] text-ink-muted">
          Decision email: {registration.decisionNotification.status}
        </p>
      )}
    </>
  )

  const retryButton = (registration: ResidentRegistration) =>
    registration.decisionNotification?.status === "failed" ? (
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="border-warning/40 bg-surface text-warning"
        onClick={() => retryNotification(registration.id)}
      >
        <RotateCcw className="size-3" /> Retry email
      </Button>
    ) : null

  /* Tables ---------------------------------------------------------- */

  const directoryTable = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5">Resident ID</TableHead>
          <TableHead>Resident</TableHead>
          <TableHead>Purok</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Resident Status</TableHead>
          <TableHead className="pr-5 text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginate(directory, pages.all).map((resident) => (
          <TableRow key={resident.id}>
            <TableCell className="pl-5">
              <button
                type="button"
                onClick={() => openResident(resident.id)}
                aria-label={`View details for Resident ID ${resident.residentNumber}`}
                className="text-left font-mono text-[11px] font-semibold text-ink-muted hover:text-brand hover:underline"
              >
                {resident.residentNumber}
              </button>
            </TableCell>
            <TableCell>{residentCell(resident)}</TableCell>
            <TableCell className="text-sm text-ink-muted">{purokLabel(resident.purokId)}</TableCell>
            <TableCell>
              <SectorChips sectors={resident.sectors} />
            </TableCell>
            <TableCell>
              <StatusBadge status="Linked" tone="success" />
            </TableCell>
            <TableCell>
              <StatusBadge
                status={resident.status === "active" ? "Active" : "Inactive"}
                tone={resident.status === "active" ? "success" : "neutral"}
              />
            </TableCell>
            <TableCell className="pr-5 text-right">
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="bg-surface"
                onClick={() => openResident(resident.id)}
              >
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {directory.length === 0 && (
          <EmptyRow
            columns={7}
            title="No residents found"
            note="Verified Residents with linked online accounts will appear here."
          />
        )}
      </TableBody>
    </Table>
  )

  const householdsTable = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5">Household Code</TableHead>
          <TableHead>Family Head</TableHead>
          <TableHead>Purok</TableHead>
          <TableHead className="pr-5">Members</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginate(households, pages.households).map((household) => (
          <TableRow key={household.id}>
            <TableCell className="pl-5 font-mono text-[11px] font-semibold text-brand">
              {household.code}
            </TableCell>
            <TableCell className="text-sm text-ink-strong">{household.head}</TableCell>
            <TableCell className="text-sm text-ink-muted">{household.purok ?? "—"}</TableCell>
            <TableCell className="pr-5 text-sm text-ink-muted tnum">{household.members_count}</TableCell>
          </TableRow>
        ))}
        {households.length === 0 && <EmptyRow columns={4} title="No households match this filter." />}
      </TableBody>
    </Table>
  )

  const addedTable = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5">Resident ID</TableHead>
          <TableHead>Resident</TableHead>
          <TableHead>Purok</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Resident Status</TableHead>
          <TableHead>Login Account</TableHead>
          <TableHead>QR Code</TableHead>
          <TableHead className="pr-5 text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginate(adminAdded, pages.added).map((resident) => {
          const qr = qrBadge(resident.qrStatus)
          return (
            <TableRow key={resident.id}>
              <TableCell className="pl-5">
                <button
                  type="button"
                  onClick={() => openResident(resident.id)}
                  aria-label={`View details for Resident ID ${resident.residentNumber}`}
                  className="text-left font-mono text-[11px] font-semibold text-brand hover:underline"
                >
                  {resident.residentNumber}
                </button>
              </TableCell>
              <TableCell>{residentCell(resident)}</TableCell>
              <TableCell className="text-sm text-ink-muted">{purokLabel(resident.purokId)}</TableCell>
              <TableCell>
                <SectorChips sectors={resident.sectors} />
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={resident.status === "active" ? "Active" : "Inactive"}
                  tone={resident.status === "active" ? "success" : "neutral"}
                />
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={resident.accountActive ? "Enabled" : "Disabled"}
                  tone={resident.accountActive ? "success" : "neutral"}
                />
              </TableCell>
              <TableCell>
                <StatusBadge status={qr.label} tone={qr.tone} />
              </TableCell>
              <TableCell className="pr-5">
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                  <button
                    type="button"
                    className={linkButton}
                    onClick={() =>
                      requestAction(resident.status === "active" ? "deactivate" : "activate", resident)
                    }
                  >
                    {resident.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className={linkButton}
                    onClick={() =>
                      requestAction(resident.accountActive ? "disable_login" : "enable_login", resident)
                    }
                  >
                    {resident.accountActive ? "Disable Login" : "Enable Login"}
                  </button>
                  {resident.qrStatus === "active" && (
                    <button
                      type="button"
                      className={dangerLink}
                      onClick={() => requestAction("revoke_qr", resident)}
                    >
                      Revoke QR
                    </button>
                  )}
                  <button
                    type="button"
                    className={linkButton}
                    onClick={() => requestAction("issue_qr", resident)}
                  >
                    {resident.qrStatus === "none" ? "Issue QR" : "Reissue QR"}
                  </button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
        {adminAdded.length === 0 && (
          <EmptyRow
            columns={8}
            title="No Residents added by Admin yet"
            note="Approved resident accounts will appear here."
          />
        )}
      </TableBody>
    </Table>
  )

  const queueTable = (rows: ResidentRegistration[], page: number) => (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5">Applicant</TableHead>
          <TableHead>Purok</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="pr-5 text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginate(rows, page).map((registration) => (
          <TableRow key={registration.id}>
            <TableCell className="pl-5">{applicantCell(registration)}</TableCell>
            <TableCell className="text-sm text-ink-muted">{purokLabel(registration.purokId)}</TableCell>
            <TableCell>
              <SectorChips sectors={registration.sectors} />
            </TableCell>
            <TableCell className="text-sm text-ink-muted tnum">
              {formatAdminDate(registration.submittedAt)}
            </TableCell>
            <TableCell className="pr-5">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="bg-surface"
                  onClick={() => setReviewing(registration)}
                >
                  View
                </Button>
                {retryButton(registration)}
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="border-destructive/30 bg-surface text-destructive"
                  onClick={() => {
                    setReviewing(null)
                    setRejecting(registration)
                  }}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  size="xs"
                  disabled={busy}
                  onClick={() => setReviewing(registration)}
                >
                  {busy ? "Approving…" : "Approve"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <EmptyRow
            columns={5}
            title={applicantNeedle ? "No matching registrations" : "No pending registrations"}
            note={
              applicantNeedle
                ? "Try a different name, ID, or contact number."
                : "New resident registrations will appear here."
            }
          />
        )}
      </TableBody>
    </Table>
  )

  const rejectedTable = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5">Applicant</TableHead>
          <TableHead>Purok</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Reviewed</TableHead>
          <TableHead className="pr-5 text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginate(rejectedRows, pages.rejected).map((registration) => (
          <TableRow key={registration.id}>
            <TableCell className="pl-5">{applicantCell(registration)}</TableCell>
            <TableCell className="text-sm text-ink-muted">{purokLabel(registration.purokId)}</TableCell>
            <TableCell>
              <SectorChips sectors={registration.sectors} />
            </TableCell>
            <TableCell className="text-sm text-ink-muted tnum">
              {formatAdminDate(registration.reviewedAt ?? registration.submittedAt)}
            </TableCell>
            <TableCell className="pr-5">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {retryButton(registration)}
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="bg-surface"
                  onClick={() => setDetails({ type: "registration", id: registration.id })}
                >
                  View
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {rejectedRows.length === 0 && (
          <EmptyRow
            columns={5}
            title={applicantNeedle ? "No matching rejected registrations" : "No rejected registrations"}
            note={
              applicantNeedle
                ? "Try a different name, ID, or contact number."
                : "Rejected registrations will appear here."
            }
          />
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Resident Management"
        description="Manage verified online accounts and official Resident records"
        actions={
          <Button size="sm" className="h-9" onClick={() => setCreating(true)}>
            <UserRoundPlus className="size-4" /> Add Resident
          </Button>
        }
      />

      {flash && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line-soft bg-success-soft px-4 py-3">
          <p className="text-sm text-success">{flash}</p>
          <button
            type="button"
            onClick={() => setFlash(null)}
            className="text-xs font-medium text-success/80 hover:text-success"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-canvas/60 px-4 py-3">
          <p className="text-sm text-destructive">{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-medium text-destructive/80 hover:text-destructive"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total Residents"
          value={stats.totalResidents}
          hint="Official records in your barangay"
        />
        <StatCard
          icon={Home}
          label="Households"
          value={stats.totalHouseholds}
          hint="Grouped by household code"
          tone="neutral"
        />
        <StatCard
          icon={ShieldCheck}
          label="Active Residents"
          value={stats.activeResidents}
          hint="Cleared for barangay services"
        />
      </div>

      <PurokFilterChips puroks={residentRegistry.purokCounts()} selected={purokId} onSelect={setPurokId} />

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
          <SegmentedTabs segments={segments} value={tab} onChange={(value) => setTab(value as TabKey)} />
          <SearchInput
            className="w-full sm:w-72"
            value={onResidentTabs ? residentQuery : applicantQuery}
            onChange={(value) => (onResidentTabs ? setResidentQuery(value) : setApplicantQuery(value))}
            placeholder={onResidentTabs ? "Search resident…" : "Search applicant…"}
          />
        </div>

        {tab === "pending" && (filtersActive || pages.pending > 1) && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
            <p className="text-xs text-ink-muted">
              {filtersActive
                ? `Filters are active: showing ${pendingRows.length} of ${totalPending} pending applications in your barangay.`
                : `Showing page ${pages.pending} of the pending applications in your barangay.`}
            </p>
            <button
              type="button"
              className="text-xs font-semibold text-brand hover:underline"
              onClick={clearFilters}
            >
              View all pending accounts
            </button>
          </div>
        )}

        {tab === "all" && directoryTable}
        {tab === "households" && householdsTable}
        {tab === "added" && addedTable}
        {tab === "pending" && queueTable(pendingRows, pages.pending)}
        {tab === "correction" && queueTable(correctionRows, pages.correction)}
        {tab === "rejected" && rejectedTable}

        {totals[tab] > residentPageSize && (
          <TablePagination
            page={pages[tab]}
            pageSize={residentPageSize}
            total={totals[tab]}
            onPageChange={(page) => setPages((current) => ({ ...current, [tab]: page }))}
          />
        )}
      </Panel>

      {reviewing && (
        <ReviewRegistrationDialog
          key={reviewing.id}
          registration={reviewing}
          onLinked={(message) => {
            setReviewing(null)
            sync()
            announce(message)
          }}
          onReject={() => {
            setRejecting(reviewing)
            setReviewing(null)
          }}
          onRequestCorrection={() => {
            setCorrecting(reviewing)
            setReviewing(null)
          }}
          onClose={() => setReviewing(null)}
        />
      )}

      {correcting && (
        <CorrectionRequestDialog
          key={correcting.id}
          registration={correcting}
          onSent={(message) => {
            setCorrecting(null)
            sync()
            announce(message)
          }}
          onClose={() => setCorrecting(null)}
        />
      )}

      {rejecting && (
        <RejectRegistrationDialog
          key={rejecting.id}
          registration={rejecting}
          onRejected={(message) => {
            setRejecting(null)
            sync()
            announce(message)
          }}
          onClose={() => setRejecting(null)}
        />
      )}

      <ResidentDetailsDialog
        target={details}
        onClose={() => setDetails(null)}
        onRetryNotification={retryNotification}
      />

      <CreateResidentDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(message) => {
          sync()
          announce(message)
        }}
      />

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setPending(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm this change</DialogTitle>
            <DialogDescription>
              {pending
                ? residentActionQuestion(pending.kind, fullNameOf(pending.resident))
                : "Select a resident to continue."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="bg-surface"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                pending?.kind === "deactivate" || pending?.kind === "revoke_qr" ? "destructive" : "default"
              }
              disabled={busy}
              onClick={() => pending && runAction(pending)}
            >
              {busy ? "Working…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* In-table empty state                                               */
/* ------------------------------------------------------------------ */

function EmptyRow({ columns, title, note }: { columns: number; title: string; note?: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columns} className="px-5 py-14 text-center">
        <span className="mx-auto grid size-10 place-items-center rounded-full bg-canvas text-ink-faint">
          <SearchX className="size-5" />
        </span>
        <p className="mt-3 text-sm font-medium text-ink">{title}</p>
        {note && <p className="mt-1 text-xs text-ink-faint">{note}</p>}
      </TableCell>
    </TableRow>
  )
}
