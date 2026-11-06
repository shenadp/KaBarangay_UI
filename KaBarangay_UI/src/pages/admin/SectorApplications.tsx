import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import EmptyState from "@/components/EmptyState"
import StatusBadge from "@/components/StatusBadge"
import { cn } from "@/lib/utils"
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { SearchInput } from "@/components/TableTools"
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
  emptySectorApplicationFilters,
  sectorApplicationPage,
  sectorApplicationStats,
  sectorApplicationStatuses,
  sectorOptions,
  type SectorApplicationFilters,
} from "@/mock/admin/sector-applications"

/**
 * Sector Applications mirrors `Admin/SectorApplicationController`: a queue the
 * administrator reads. Filters are applied by submitting the form, the four
 * tiles always count the whole barangay, and every row opens the recorded
 * decision rather than a decision form.
 */

const UNSET = "all"

function Tile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "warning" | "success" | "info" | "danger"
}) {
  const shell = {
    warning: "border-warning/40 bg-warning-soft text-warning",
    success: "border-success/40 bg-success-soft text-success",
    info: "border-info/40 bg-info-soft text-info",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
  }[tone]

  return (
    <div className={cn("rounded-xl border p-4 shadow-card", shell)}>
      <p className="text-[10px] font-bold tracking-wider uppercase opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold tnum">{value}</p>
    </div>
  )
}

export default function AdminSectorApplications() {
  const [draft, setDraft] = useState<SectorApplicationFilters>(emptySectorApplicationFilters)
  const [applied, setApplied] = useState<SectorApplicationFilters>(emptySectorApplicationFilters)
  const [page, setPage] = useState(1)

  // The queue is read the moment the filters land, exactly like the query.
  const result = useMemo(
    () => sectorApplicationPage({ search: applied.search, sector: applied.sector, status: applied.status }, page),
    [applied, page],
  )
  const stats = sectorApplicationStats()
  const hasFilters = applied.search.trim() !== "" || applied.sector !== "all" || applied.status !== "all"

  const submit = () => {
    setApplied({ ...draft, search: draft.search.trim() })
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Sector Membership Applications"
        description="Barangay Administrator final approval queue for Senior Citizens and PWD sector registrations."
        actions={
          <div className="hidden items-center gap-1.5 rounded-lg border border-line-soft bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-card sm:flex">
            <span>Total Queue:</span>
            <span className="font-semibold text-brand tnum">{stats.total}</span>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Tile label="Pending Final Decision" value={stats.pending} tone="warning" />
        <Tile label="Admin Approved" value={stats.approved} tone="success" />
        <Tile label="In Staff Review" value={stats.staff_review} tone="info" />
        <Tile label="Rejected / Returned" value={stats.returned} tone="danger" />
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Application queue</PanelTitle>
            <PanelDescription>
              Sector staff record the decision. Opening a row shows what was decided and by whom.
            </PanelDescription>
          </div>
        </PanelHeader>

        <div className="space-y-3 border-b border-line-soft px-5 py-4">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <SearchInput
                value={draft.search}
                onChange={(value) => setDraft((current) => ({ ...current, search: value }))}
                placeholder="Search by resident name, resident ID, or tracking number…"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={draft.sector}
                onValueChange={(value) => setDraft((current) => ({ ...current, sector: value }))}
              >
                <SelectTrigger size="sm" className="h-9 w-44 bg-surface" aria-label="Filter by sector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET}>All Sectors</SelectItem>
                  {sectorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={draft.status}
                onValueChange={(value) => setDraft((current) => ({ ...current, status: value }))}
              >
                <SelectTrigger size="sm" className="h-9 w-56 bg-surface" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET}>All Statuses</SelectItem>
                  {sectorApplicationStatuses.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="submit" size="sm" className="h-9 px-4">
                Apply
              </Button>

              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 text-ink-muted"
                  onClick={() => {
                    setDraft(emptySectorApplicationFilters)
                    setApplied(emptySectorApplicationFilters)
                    setPage(1)
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </div>

        {result.data.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No sector applications match the active filters."
            description="Try another tracking number, resident name or status."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Tracking No.</TableHead>
                <TableHead>Applicant Resident</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Staff Recommendation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Admin Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="pl-5">
                    <Link
                      to={`/admin/sector-applications/${application.id}`}
                      className="text-sm font-medium text-brand tnum"
                    >
                      {application.trackingNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="leading-tight">
                      <p className="text-sm font-medium text-ink-strong">{application.applicantName}</p>
                      <p className="text-[11px] text-ink-faint tnum">{application.residentNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-ink">{application.sectorName}</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {application.staffChecklistCompleted ? (
                      <span className="font-medium text-success">
                        ✓ Recommended ({application.reviewedByStaffName || "Staff"})
                      </span>
                    ) : (
                      <span className="text-ink-faint">In Intake Review</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={application.status} />
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 bg-surface font-semibold"
                    >
                      <Link to={`/admin/sector-applications/${application.id}`}>
                        Review &amp; Decide →
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {result.lastPage > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-line-soft px-5 py-3 text-xs text-ink-muted">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              disabled={result.currentPage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>

            <span className="tnum">
              Page {result.currentPage} of {result.lastPage} · {result.total} results
            </span>

            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              disabled={result.currentPage >= result.lastPage}
              onClick={() => setPage((current) => Math.min(result.lastPage, current + 1))}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}
