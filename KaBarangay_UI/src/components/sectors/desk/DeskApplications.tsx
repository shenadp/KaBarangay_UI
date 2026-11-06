import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, ClipboardList, FileCheck2, Inbox, Plus, Scale } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import EmptyState from "@/components/EmptyState"
import StatusBadge, { type Tone } from "@/components/StatusBadge"
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
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
import { cn } from "@/lib/utils"
import type { SectorDesk } from "@/config/sectorDesks"
import {
  applicationCounters,
  applicationStatusLabel,
  formatIsoDate,
  submissionTypeLabel,
  type SectorApplication,
  type SectorApplicationStatus,
} from "@/mock/sectorDesks"

const PAGE_SIZE = 8

const statusTone: Record<SectorApplicationStatus, Tone> = {
  pending_staff_review: "warning",
  under_admin_review: "info",
  approved: "success",
  rejected: "danger",
  needs_correction: "danger",
}

const statusFilterOptions: SectorApplicationStatus[] = [
  "pending_staff_review",
  "under_admin_review",
  "approved",
  "rejected",
  "needs_correction",
]

export default function DeskApplications({ desk }: { desk: SectorDesk }) {
  const navigate = useNavigate()
  const [applications] = useState<SectorApplication[]>(() => desk.store.applicationQueue())
  const [statusSegment, setStatusSegment] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const counters = useMemo(() => applicationCounters(applications), [applications])

  const cards = [
    {
      key: "all",
      icon: ClipboardList,
      label: "All applications",
      value: counters.all,
      hint: "Filed on this desk",
    },
    {
      key: "pending_staff_review",
      icon: Inbox,
      label: "Staff review needed",
      value: counters.staffReviewNeeded,
      hint: "Waiting for a completeness check",
    },
    {
      key: "under_admin_review",
      icon: Scale,
      label: "Legacy forwarded",
      value: counters.legacyForwarded,
      hint: "With the barangay captain",
    },
    {
      key: "approved",
      icon: FileCheck2,
      label: "Approved",
      value: counters.approved,
      hint: "Membership activated",
    },
  ]

  const filtered = applications.filter((application) => {
    const matchesCard =
      statusSegment === "all" ||
      (statusSegment === "pending_staff_review" &&
        application.status === "pending_staff_review") ||
      (statusSegment === "under_admin_review" && application.status === "under_admin_review") ||
      (statusSegment === "approved" && application.status === "approved")
    const matchesSelect = statusFilter === "all" || application.status === statusFilter
    const needle = query.trim().toLowerCase()
    const matchesQuery =
      !needle ||
      [
        application.trackingNumber,
        application.applicantName,
        application.residentNumber,
        application.purok,
      ].some((value) => value.toLowerCase().includes(needle))
    return matchesCard && matchesSelect && matchesQuery
  })

  const pageStart = (page - 1) * PAGE_SIZE
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={desk.eyebrow}
        title={desk.applicationsTitle}
        description={desk.applicationsDescription}
        actions={
          <Button size="sm" className="h-9" asChild>
            <Link to={`${desk.basePath}/applications/create`}>
              <Plus className="size-4" /> New application
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const active = statusSegment === card.key
          const Icon = card.icon
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                setStatusSegment(card.key)
                setPage(1)
              }}
              className={cn(
                "rounded-xl border bg-surface p-4 text-left shadow-card transition-colors hover:shadow-raised",
                active ? "border-brand ring-1 ring-brand/30" : "border-line-soft",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-lg",
                    active ? "bg-brand-soft text-brand" : "bg-canvas text-ink-muted",
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>
                {active && (
                  <span className="text-[11px] font-medium text-brand">Filtering</span>
                )}
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-ink-strong tnum">
                {card.value}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-muted">{card.label}</p>
              <p className="mt-2 text-xs text-ink-faint">{card.hint}</p>
            </button>
          )
        })}
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Applications queue</PanelTitle>
            <PanelDescription>
              {statusSegment === "all"
                ? desk.queueAllDescription
                : `Filtered to ${applicationStatusLabel(statusSegment as SectorApplicationStatus).toLowerCase()}`}
            </PanelDescription>
          </div>
        </PanelHeader>

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Search applicant, resident ID or tracking number…"
            className="w-full sm:max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[190px] bg-surface" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusFilterOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {applicationStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-xs text-ink-muted tnum">
            {filtered.length} of {applications.length} applications
          </p>
        </TableToolbar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No applications in this view"
            description="Nothing matches the current counter, status filter or search — clear them to see the whole queue."
            action={
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-surface"
                onClick={() => {
                  setStatusSegment("all")
                  setStatusFilter("all")
                  setQuery("")
                  setPage(1)
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Tracking no.</TableHead>
                  <TableHead>Applicant resident</TableHead>
                  <TableHead>Purok</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((application) => (
                  <TableRow
                    key={application.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`${desk.basePath}/applications/${application.id}`)}
                  >
                    <TableCell className="pl-5 text-ink-muted tnum">
                      {application.trackingNumber}
                    </TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        <p className="text-sm font-medium text-ink-strong">
                          {application.applicantName}
                        </p>
                        <p className="text-[11px] text-ink-faint tnum">
                          {application.residentNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-muted">{application.purok}</TableCell>
                    <TableCell className="text-ink-muted">
                      {submissionTypeLabel(application.submissionType)}
                    </TableCell>
                    <TableCell className="text-ink-muted tnum">
                      {formatIsoDate(application.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={applicationStatusLabel(application.status)}
                        tone={statusTone[application.status]}
                      />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-surface"
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`${desk.basePath}/applications/${application.id}`)
                        }}
                      >
                        Review <ArrowRight className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPageChange={setPage}
            />
          </>
        )}
      </Panel>
    </div>
  )
}
