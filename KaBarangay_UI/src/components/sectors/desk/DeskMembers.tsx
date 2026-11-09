import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarCheck, Lock, QrCode, Search, ShieldCheck, UserPlus, Users } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import StatusBadge, { type Tone } from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
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
import type { SectorDesk } from "@/config/sectorDesks"
import {
  formatIsoDate,
  type SectorResident,
} from "@/mock/sectorDesks"

const PAGE_SIZE = 8

const statusTone: Record<SectorResident["status"], Tone> = {
  Active: "success",
  Pending: "warning",
  Inactive: "neutral",
}

export default function DeskMembers({ desk }: { desk: SectorDesk }) {
  const [residents] = useState<SectorResident[]>(desk.residents)
  const [query, setQuery] = useState("")
  const [purokFilter, setPurokFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const selected = residents.find((resident) => resident.id === selectedId) ?? null

  /**
   * The directory is the sector roster, not the whole barangay register — the
   * backend `SeniorController::residents` filters on the sector classification
   * before handing the list to `ResidentDirectoryTable`.
   */
  const members = useMemo(
    () => residents.filter((resident) => resident.sectors.includes(desk.memberTag)),
    [residents, desk.memberTag],
  )

  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((resident) => resident.status === "Active").length,
      pending: members.filter((resident) => resident.status === "Pending").length,
      qrIssued: members.filter((resident) => resident.hasQr).length,
    }
  }, [members])

  const filtered = members.filter((resident) => {
    const matchesPurok = purokFilter === "all" || resident.purok === purokFilter
    const needle = query.trim().toLowerCase()
    const matchesQuery =
      !needle ||
      [resident.fullName, resident.residentNumber, resident.purok].some((value) =>
        value.toLowerCase().includes(needle),
      )
    return matchesPurok && matchesQuery
  })

  const pageStart = (page - 1) * PAGE_SIZE
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={desk.eyebrow}
        title={desk.membersTitle}
        description={desk.membersDescription}
        actions={
          <Button size="sm" className="h-9" asChild>
            <Link to={`${desk.basePath}/applications/create`}>
              <UserPlus className="size-4" /> New sector application
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={desk.registeredLabel} value={stats.total} hint="On this desk's roster" />
        <StatCard icon={ShieldCheck} label="Active membership" value={stats.active} hint="Cleared for programme benefits" />
        <StatCard
          icon={CalendarCheck}
          label="Pending verification"
          value={stats.pending}
          hint="Awaiting a decision"
          tone="neutral"
        />
        <StatCard
          icon={QrCode}
          label="QR cards issued"
          value={stats.qrIssued}
          hint="Usable for attendance and claims"
          tone="neutral"
        />
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Member directory</PanelTitle>
            <PanelDescription>{desk.directoryDescription}</PanelDescription>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand tnum">
            {filtered.length} of {members.length} members
          </span>
        </PanelHeader>

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Search by name or resident ID (e.g. BSI-RES-000001)…"
            className="w-full sm:max-w-sm"
          />
          <Select
            value={purokFilter}
            onValueChange={(value) => {
              setPurokFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[132px] bg-surface" aria-label="Filter by purok">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All puroks</SelectItem>
              {desk.puroks.map((purok) => (
                <SelectItem key={purok} value={purok}>
                  {purok}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto flex items-center gap-1.5 text-[11px] text-ink-faint">
            <Lock className="size-3.5" />
            Authorised identifying information only
          </p>
        </TableToolbar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No resident matches this view"
            description="Nothing matches the current purok or search — try another combination."
            action={
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-surface"
                onClick={() => {
                  setQuery("")
                  setPurokFilter("all")
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
                  <TableHead className="pl-5">Resident ID</TableHead>
                  <TableHead>Full name</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Purok</TableHead>
                  <TableHead>Sector classifications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5">QR card</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((resident) => (
                  <TableRow
                    key={resident.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(resident.id)}
                  >
                    <TableCell className="pl-5 text-ink-muted tnum">
                      {resident.residentNumber}
                    </TableCell>
                    <TableCell className="font-medium text-ink-strong">{resident.fullName}</TableCell>
                    <TableCell className="text-ink-muted">{resident.sex}</TableCell>
                    <TableCell className="text-ink-muted">{resident.purok}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {resident.sectors.map((sector) => (
                          <span
                            key={sector}
                            className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand"
                          >
                            {sector}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={resident.status} tone={statusTone[resident.status]} />
                    </TableCell>
                    <TableCell className="pr-5">
                      {resident.hasQr ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                          <QrCode className="size-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-ink-faint">—</span>
                      )}
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

      <Panel>
        <PanelContent className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
            <Lock className="size-4" />
          </span>
          <div>
            <p className="text-[13px] font-medium text-ink-strong">
              Authorised identifying information
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
              Resident numbers, names, sex and purok on this roster are disclosed only to desk staff
              for sector verification. Do not photograph or redistribute the list.
            </p>
          </div>
        </PanelContent>
      </Panel>

      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="mr-2">{selected.fullName}</DialogTitle>
                  <StatusBadge status={selected.status} tone={statusTone[selected.status]} />
                </div>
                <DialogDescription>
                  Resident record · <span className="tnum">{selected.residentNumber}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-line-soft bg-canvas/60 p-4">
                  <Meta label="Sex">{selected.sex}</Meta>
                  <Meta label="Purok">{selected.purok}</Meta>
                  <Meta label="Birthdate">
                    <span className="tnum">
                      {selected.birthdate ? formatIsoDate(selected.birthdate) : "To be verified"}
                    </span>
                  </Meta>
                  <Meta label="Mobile">
                    <span className="tnum">{selected.mobile ?? "Not on file"}</span>
                  </Meta>
                  <div className="col-span-2">
                    <Meta label="Address">{selected.address ?? "Not recorded"}</Meta>
                  </div>
                </div>

                <div className="rounded-xl border border-line-soft bg-surface p-4 shadow-card">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                    Sector records
                  </p>
                  <div className="mt-2 space-y-2">
                    {selected.sectors.map((sector) => (
                      <div
                        key={sector}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line-soft bg-canvas/60 px-3 py-2"
                      >
                        <span className="text-[13px] text-ink-strong">{sector}</span>
                        {sector === desk.memberTag && (
                          <span className="text-xs text-ink-muted tnum">
                            {selected.registrationNo ?? desk.noRegistrationLabel}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" className="bg-surface" onClick={() => setSelectedId(null)}>
                  Close
                </Button>
                <Button asChild>
                  <Link to={`${desk.basePath}/applications/create`}>
                    <UserPlus className="size-4" /> File sector application
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
