import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { FileBadge, SearchX, Users } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs, { type Segment } from "@/components/SegmentedTabs"
import StatusBadge from "@/components/StatusBadge"
import { cn } from "@/lib/utils"
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/Panel"
import { SearchInput, TablePagination, TableToolbar } from "@/components/TableTools"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  certificateRosterPage,
  generalRosterPage,
  luponCaseSummary,
  pwdRosterPage,
  sectorPuroks,
  sectorStats,
  seniorRosterPage,
  type RosterPage,
} from "@/mock/admin/sectors"

/* ------------------------------------------------------------------ */
/* Tabs                                                               */
/* ------------------------------------------------------------------ */

/** The six read-only views; `?tab=` picks the one the page opens on. */
type SectorsTab = "applications" | "general" | "pwd" | "senior" | "certificates" | "lupon"

const SECTORS_TABS: SectorsTab[] = [
  "applications",
  "general",
  "pwd",
  "senior",
  "certificates",
  "lupon",
]

const TAB_SEGMENTS: Segment[] = [
  { label: "Sector Applications", value: "applications" },
  { label: "General Resident", value: "general" },
  { label: "PWD Members", value: "pwd" },
  { label: "Senior Citizens", value: "senior" },
  { label: "Certificates", value: "certificates" },
  { label: "Lupon Cases", value: "lupon" },
]

/** Anything unrecognised lands on the general roster, never on an empty view. */
function initialTab(value: string | null): SectorsTab {
  return SECTORS_TABS.includes(value as SectorsTab) ? (value as SectorsTab) : "general"
}

/* ------------------------------------------------------------------ */
/* Tiles                                                              */
/* ------------------------------------------------------------------ */

/**
 * The KPI strip doubles as the tab switcher, which the shared StatCard cannot
 * do — it has no click target — so this desk keeps its own tile.
 */
function MetricTile({
  label,
  value,
  hint,
  active,
  onSelect,
}: {
  label: string
  value: number
  hint: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "rounded-xl border bg-surface p-4 text-left shadow-card transition-colors",
        active ? "border-brand ring-1 ring-brand" : "border-line-soft hover:border-line",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink-strong tnum">{value}</p>
      <p className="mt-0.5 text-[11px] text-ink-muted">{hint}</p>
    </button>
  )
}

/** The count card that heads each tab. */
function SummaryTile({
  label,
  value,
  hint,
  tone = "brand",
}: {
  label: string
  value: number
  hint: string
  tone?: "brand" | "neutral"
}) {
  return (
    <div
      className={cn(
        "max-w-xs rounded-xl border p-5",
        tone === "brand" ? "border-brand bg-brand text-white" : "border-line-soft bg-surface",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-wide",
          tone === "brand" ? "text-white/80" : "text-ink-faint",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tnum",
          tone === "brand" ? "text-white" : "text-ink-strong",
        )}
      >
        {value}
      </p>
      <p className={cn("mt-1 text-xs", tone === "brand" ? "text-white/70" : "text-ink-muted")}>
        {hint}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Roster copy                                                        */
/* ------------------------------------------------------------------ */

type RosterTab = Extract<SectorsTab, "general" | "pwd" | "senior">

const rosterCopy: Record<
  RosterTab,
  { label: string; empty: string; filtered: string; footnote: string; hero: HeroCopy }
> = {
  general: {
    label: "general residents",
    empty: "No general residents found for this barangay.",
    filtered: "No general residents match the current filters.",
    footnote:
      "Read-only list of verified residents who do not belong to any designated sector (such as Senior Citizen or PWD) in your barangay.",
    hero: {
      label: "General Residents",
      hint: "Registered residents with no specific sector membership in your barangay",
    },
  },
  pwd: {
    label: "PWD members",
    empty: "No PWD members have been recorded for this barangay yet.",
    filtered: "No PWD members match the current filters.",
    footnote:
      "Read-only list of residents tagged with the PWD sector in your barangay, including inactive accounts. Contact details and documents are not shown here.",
    hero: { label: "PWD Members", hint: "Residents tagged with the PWD sector in your barangay" },
  },
  senior: {
    label: "senior citizens",
    empty: "No senior citizens have been recorded for this barangay yet.",
    filtered: "No senior citizens match the current filters.",
    footnote:
      "Read-only list of residents tagged with the senior sector in your barangay, including inactive accounts. Contact details and documents are not shown here.",
    hero: {
      label: "Senior Citizens",
      hint: "Residents tagged with the senior sector in your barangay",
    },
  },
}

type HeroCopy = { label: string; hint: string }

/** A single-page roster shows no footer at all, exactly like the reference. */
function RosterFooter<T>({
  page,
  label,
  onPageChange,
}: {
  page: RosterPage<T>
  label: string
  onPageChange: (page: number) => void
}) {
  if (page.lastPage <= 1) return null

  return (
    <TablePagination
      page={page.currentPage}
      pageSize={page.perPage}
      total={page.total}
      label={label}
      onPageChange={onPageChange}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

const firstRosterPages = () => ({ general: 1, pwd: 1, senior: 1 })

export default function AdminSectors() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<SectorsTab>(() => initialTab(searchParams.get("tab")))

  /** Typed-then-submitted, like the reference: keystrokes alone never refetch. */
  const [searchDraft, setSearchDraft] = useState("")
  const [purokDraft, setPurokDraft] = useState("all")
  const [applied, setApplied] = useState({ search: "", purokId: null as number | null })

  const [certificateDraft, setCertificateDraft] = useState("")
  const [appliedCertificateSearch, setAppliedCertificateSearch] = useState("")

  const [rosterPages, setRosterPages] = useState(firstRosterPages)
  const [certificatePage, setCertificatePage] = useState(1)

  const stats = useMemo(() => sectorStats(), [])
  const lupon = useMemo(() => luponCaseSummary(), [])

  const rosters = useMemo(
    () => ({
      general: generalRosterPage(applied.search, applied.purokId, rosterPages.general),
      pwd: pwdRosterPage(applied.search, applied.purokId, rosterPages.pwd),
      senior: seniorRosterPage(applied.search, applied.purokId, rosterPages.senior),
    }),
    [applied, rosterPages],
  )
  const certificates = useMemo(
    () => certificateRosterPage(appliedCertificateSearch, certificatePage),
    [appliedCertificateSearch, certificatePage],
  )

  const hasMemberFilters = applied.search.trim() !== "" || applied.purokId !== null

  /** Search and purok filtering always restart every roster at page one. */
  const applyMemberFilters = (purokId: number | null, search = searchDraft) => {
    setApplied({ search, purokId })
    setRosterPages(firstRosterPages())
  }

  const clearMemberFilters = () => {
    setSearchDraft("")
    setPurokDraft("all")
    applyMemberFilters(null, "")
  }

  /** One roster moves; the other two go back to their first page. */
  const navigateRoster = (page: number) => {
    setRosterPages({
      general: activeTab === "general" ? page : 1,
      pwd: activeTab === "pwd" ? page : 1,
      senior: activeTab === "senior" ? page : 1,
    })
  }

  const clearCertificateFilters = () => {
    setCertificateDraft("")
    setAppliedCertificateSearch("")
    setCertificatePage(1)
  }

  const changePurok = (value: string) => {
    setPurokDraft(value)
    applyMemberFilters(value === "all" ? null : Number(value))
  }

  /** Only read while a roster tab is on screen. */
  const memberRoster =
    activeTab === "pwd" ? rosters.pwd : activeTab === "senior" ? rosters.senior : rosters.general
  const copy =
    rosterCopy[activeTab === "pwd" || activeTab === "senior" ? activeTab : "general"]

  return (
    <div className="space-y-6">
      <PageHeader title="Sectors" description="Consolidated resident sector rosters and community records" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile
          label="Applications"
          value={stats.sectorApplications}
          hint="Under Admin Review"
          active={activeTab === "applications"}
          onSelect={() => setActiveTab("applications")}
        />
        <MetricTile
          label="General Resident"
          value={stats.generalMembers}
          hint="No sector affiliation"
          active={activeTab === "general"}
          onSelect={() => setActiveTab("general")}
        />
        <MetricTile
          label="PWD Members"
          value={stats.pwdMembers}
          hint="Verified PWD roster"
          active={activeTab === "pwd"}
          onSelect={() => setActiveTab("pwd")}
        />
        <MetricTile
          label="Senior Citizen"
          value={stats.seniorMembers}
          hint="Verified senior roster"
          active={activeTab === "senior"}
          onSelect={() => setActiveTab("senior")}
        />
        <MetricTile
          label="Certificates"
          value={stats.certificates}
          hint="Released & Completed"
          active={activeTab === "certificates"}
          onSelect={() => setActiveTab("certificates")}
        />
        <MetricTile
          label="Lupon Cases"
          value={stats.openCases}
          hint="Active disputes"
          active={activeTab === "lupon"}
          onSelect={() => setActiveTab("lupon")}
        />
      </div>

      <SegmentedTabs
        segments={TAB_SEGMENTS}
        value={activeTab}
        onChange={(value) => setActiveTab(value as SectorsTab)}
      />

      {activeTab === "applications" && (
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SummaryTile
              label="Applications Under Review"
              value={stats.sectorApplications}
              hint="Sector applications pending Admin final decision"
            />
            <Button asChild>
              <Link to="/admin/sector-applications">
                Open Full Review Queue <span aria-hidden>→</span>
              </Link>
            </Button>
          </div>

          <Panel>
            <PanelHeader>
              <PanelTitle>Sector Application Processing</PanelTitle>
              <PanelDescription>
                Resident applications for sector classification (Senior Citizen, PWD, Solo Parent,
                etc.) undergo desk review before reaching the Admin final decision queue.
              </PanelDescription>
            </PanelHeader>
            <PanelContent>
              <Link
                to="/admin/sector-applications"
                className="text-sm font-medium text-brand hover:underline"
              >
                Go to Sector Applications page to review and process submissions <span aria-hidden>→</span>
              </Link>
            </PanelContent>
          </Panel>
        </div>
      )}

      {(activeTab === "general" || activeTab === "pwd" || activeTab === "senior") && (
        <div className="space-y-4">
          <SummaryTile
            label={copy.hero.label}
            value={
              activeTab === "pwd"
                ? stats.pwdMembers
                : activeTab === "senior"
                  ? stats.seniorMembers
                  : stats.generalMembers
            }
            hint={copy.hero.hint}
          />

          <Panel>
            <TableToolbar>
              <form
                className="flex w-full flex-wrap items-center gap-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  applyMemberFilters(applied.purokId)
                }}
              >
                <SearchInput
                  value={searchDraft}
                  onChange={setSearchDraft}
                  placeholder="Search resident number, name, or purok..."
                  className="min-w-0 flex-1 sm:max-w-xs"
                />
                <Select value={purokDraft} onValueChange={changePurok}>
                  <SelectTrigger className="w-[180px]" aria-label="Filter by purok">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Puroks</SelectItem>
                    {sectorPuroks.map((purok) => (
                      <SelectItem key={purok.id} value={String(purok.id)}>
                        {purok.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm">
                    Search
                  </Button>
                  {(searchDraft.trim() !== "" || purokDraft !== "all") && (
                    <Button type="button" size="sm" variant="outline" onClick={clearMemberFilters}>
                      Clear
                    </Button>
                  )}
                </div>
              </form>
            </TableToolbar>

            {memberRoster.data.length === 0 ? (
              <EmptyState
                icon={hasMemberFilters ? SearchX : Users}
                title={hasMemberFilters ? copy.filtered : copy.empty}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Resident no.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Purok</TableHead>
                    <TableHead className="pr-5">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberRoster.data.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="pl-5 text-ink-muted tnum">
                        {member.residentNumber}
                      </TableCell>
                      <TableCell className="font-medium text-ink-strong">{member.name}</TableCell>
                      <TableCell className="text-ink-muted">{member.purok || "-"}</TableCell>
                      <TableCell className="pr-5">
                        <StatusBadge
                          status={member.status}
                          tone={member.status === "active" ? "success" : "neutral"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <RosterFooter
              page={memberRoster}
              label={copy.label}
              onPageChange={navigateRoster}
            />
          </Panel>

          <p className="text-xs text-ink-faint">{copy.footnote}</p>
        </div>
      )}

      {activeTab === "certificates" && (
        <div className="space-y-4">
          <SummaryTile
            label="Processed Certificates"
            value={stats.certificates}
            hint="Certificate requests with a terminal status in your barangay"
          />

          <p className="text-xs text-ink-faint">
            Read-only monitoring of certificate requests whose status is Released or Rejected.
            Processed and Completed share the same approved definition, so a single count is shown.
            Requests still being processed are handled by the Clerk and are not shown here.
          </p>

          <Panel>
            <TableToolbar>
              <form
                className="flex w-full flex-wrap items-center gap-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  setAppliedCertificateSearch(certificateDraft)
                  setCertificatePage(1)
                }}
              >
                <SearchInput
                  value={certificateDraft}
                  onChange={setCertificateDraft}
                  placeholder="Search reference, resident, or certificate type..."
                  className="min-w-0 flex-1 sm:max-w-xs"
                />
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm">
                    Search
                  </Button>
                  {certificateDraft.trim() !== "" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={clearCertificateFilters}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </form>
            </TableToolbar>

            {certificates.data.length === 0 ? (
              <EmptyState
                icon={appliedCertificateSearch.trim() !== "" ? SearchX : FileBadge}
                title={
                  appliedCertificateSearch.trim() !== ""
                    ? "No released or rejected requests match the current search."
                    : "No released or rejected certificate requests have been recorded for this barangay yet."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Reference</TableHead>
                      <TableHead>Certificate</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="pr-5">Released / Rejected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.data.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="pl-5 font-medium text-ink-strong">
                          {request.reference}
                        </TableCell>
                        <TableCell className="text-ink-muted">{request.certificate}</TableCell>
                        <TableCell>
                          <span className="font-medium text-ink-strong">{request.residentName}</span>
                          {request.residentNumber && (
                            <span className="block text-xs text-ink-faint tnum">
                              {request.residentNumber}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-ink-muted">{request.purpose}</TableCell>
                        <TableCell className="text-ink-muted tnum">
                          ₱{request.fee.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={request.status}
                            tone={request.status === "Released" ? "success" : "danger"}
                            /* --color-danger has no soft token yet, so the rejected pill borrows the canvas. */
                            className={
                              request.status === "Released"
                                ? undefined
                                : "border border-destructive/30 bg-canvas/60"
                            }
                          />
                        </TableCell>
                        <TableCell className="text-ink-muted tnum">{request.submittedAt}</TableCell>
                        <TableCell className="pr-5 text-ink-muted tnum">
                          {request.statusAt}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <RosterFooter
              page={certificates}
              label="certificate requests"
              onPageChange={setCertificatePage}
            />
          </Panel>
        </div>
      )}

      {activeTab === "lupon" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryTile
              label="Open / Active Cases"
              value={lupon.open}
              hint="Active, Under Mediation, or Conciliation"
            />
            <SummaryTile
              label="Resolved Cases"
              value={lupon.closed}
              hint="Settled, Dismissed, or Unresolved"
              tone="neutral"
            />
            <SummaryTile
              label="Total Filed Cases"
              value={lupon.total}
              hint="All Lupon cases recorded for this barangay"
              tone="neutral"
            />
          </div>

          <Panel>
            <PanelHeader>
              <PanelTitle>Lupong Tagapamayapa Confidentiality Notice</PanelTitle>
              <PanelDescription>
                Under Republic Act No. 7160 (Local Government Code), Katarungang Pambarangay
                proceedings and case details are confidential to protect the parties involved.
                Detailed case records, hearing minutes, and amicable settlement terms are accessible
                only to authorized Lupon desk officers.
              </PanelDescription>
            </PanelHeader>
            <PanelContent>
              <p className="text-xs text-ink-faint">
                The Admin dashboard displays aggregate case statistics only. Direct mediation records
                are restricted to the Lupong Tagapamayapa portal.
              </p>
            </PanelContent>
          </Panel>
        </div>
      )}
    </div>
  )
}
