import { useState } from "react"
import { Download, Gavel, Scale } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatusBadge from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import { Meta, Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { SearchInput, TablePagination, TableToolbar } from "@/components/TableTools"
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
import { complaints, type Complaint } from "@/mock/data"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 7

const segments = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "For Mediation", value: "for mediation" },
  { label: "Under Review", value: "under review" },
  { label: "Settled", value: "settled" },
  { label: "Escalated", value: "escalated" },
  { label: "Closed", value: "closed" },
]

const statusActions: Complaint["status"][] = [
  "Open",
  "For Mediation",
  "Under Review",
  "Settled",
  "Escalated",
]

export default function LuponComplaints() {
  const [records, setRecords] = useState<Complaint[]>(complaints)
  const [segment, setSegment] = useState("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = records.find((record) => record.id === selectedId) ?? null

  const counts = segments.map((entry) => ({
    ...entry,
    count:
      entry.value === "all"
        ? records.length
        : records.filter((record) => record.status.toLowerCase() === entry.value).length,
  }))

  const filtered = records.filter((record) => {
    const matchesSegment = segment === "all" || record.status.toLowerCase() === segment
    const needle = query.trim().toLowerCase()
    const matchesQuery =
      !needle ||
      [record.id, record.complainant, record.respondent, record.subject].some((value) =>
        value.toLowerCase().includes(needle),
      )
    return matchesSegment && matchesQuery
  })

  const pageStart = (page - 1) * PAGE_SIZE
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  const changeStatus = (status: Complaint["status"]) => {
    if (!selected) return
    const targetId = selected.id
    setRecords((current) =>
      current.map((record) => (record.id === targetId ? { ...record, status } : record)),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lupon Tagapamayapa"
        title="Complaints & Mediation"
        description="Docket of disputes referred to the barangay, with hearing schedules and settlement status."
        actions={
          <Button variant="outline" size="sm" className="h-9 bg-surface">
            <Download className="size-4" /> Export case log
          </Button>
        }
      />

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Case docket</PanelTitle>
            <PanelDescription>Disputes filed with the Lupon, newest first</PanelDescription>
          </div>
          <SegmentedTabs value={segment} onChange={setSegment} segments={counts} />
        </PanelHeader>

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Search case number, party or subject…"
            className="w-full sm:max-w-sm"
          />
          <p className="ml-auto text-xs text-ink-muted tnum">
            {filtered.length} of {records.length} cases
          </p>
        </TableToolbar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No cases in this view"
            description="Nothing matches the current status tab or search — try another filter."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Case</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Filed</TableHead>
                  <TableHead>Hearing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="pl-5 text-ink-muted tnum">{record.id}</TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        <p className="text-sm font-medium text-ink-strong">{record.complainant}</p>
                        <p className="text-[11px] text-ink-faint">vs {record.respondent}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[22rem] truncate text-ink">
                      {record.subject}
                    </TableCell>
                    <TableCell className="text-ink-muted tnum">{record.filed}</TableCell>
                    <TableCell className="text-ink-muted tnum">{record.hearing}</TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-surface"
                        onClick={() => setSelectedId(record.id)}
                      >
                        Open
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

      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="mr-2 tnum">{selected.id}</DialogTitle>
                  <StatusBadge status={selected.status} />
                </div>
                <DialogDescription>{selected.subject}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-line-soft bg-canvas/60 p-4">
                  <Meta label="Complainant">{selected.complainant}</Meta>
                  <Meta label="Respondent">{selected.respondent}</Meta>
                  <Meta label="Date filed">
                    <span className="tnum">{selected.filed}</span>
                  </Meta>
                  <Meta label="Hearing schedule">
                    <span className="tnum">{selected.hearing}</span>
                  </Meta>
                </div>

                <div className="rounded-xl border border-line-soft bg-surface p-4 shadow-card">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                    Hearing schedule
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    {selected.hearing === "—"
                      ? "No hearing set — the case has been escalated for action outside the Lupon."
                      : `${selected.hearing} · 2:00 PM · Lupon Room, Barangay Hall`}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                    Both parties are notified through SMS three days before the schedule. A
                    representative may attend with a signed authorisation.
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                    Change status
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {statusActions.map((status) => {
                      const current = selected.status === status
                      return (
                        <Button
                          key={status}
                          type="button"
                          variant={current ? "default" : "outline"}
                          disabled={current}
                          className={cn("justify-start", !current && "bg-surface")}
                          onClick={() => changeStatus(status)}
                        >
                          {status}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  className="bg-surface"
                  onClick={() => setSelectedId(null)}
                >
                  Close
                </Button>
                <Button onClick={() => setSelectedId(null)}>
                  <Gavel className="size-4" /> Save to docket
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
