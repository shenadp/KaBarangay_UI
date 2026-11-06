import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { CalendarDays, CheckCheck, QrCode, Search } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatusBadge from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import { BarList } from "@/components/charts"
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
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { sectors, type SectorKey } from "@/config/navigation"
import {
  announcementsFor,
  formatIsoDate,
  rosters,
  type AttendanceRow,
} from "@/mock/sectors"

const PAGE_SIZE = 6

function currentTime(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export default function AttendanceView({ sector }: { sector: SectorKey }) {
  const meta = sectors[sector]
  const { id } = useParams()

  const list = useMemo(() => announcementsFor(sector), [sector])
  const eventId = Number(id)
  const event = list.find((item) => item.id === eventId) ?? list[0]

  const [rows, setRows] = useState<AttendanceRow[]>(() => rosters[sector])
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [scanOpen, setScanOpen] = useState(false)
  const [scanCode, setScanCode] = useState("")
  const [scanNote, setScanNote] = useState<{ text: string; ok: boolean } | null>(null)

  const filtered = rows.filter((row) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return [row.name, row.residentNo, row.purok, row.sector].some((value) =>
      value.toLowerCase().includes(needle),
    )
  })

  const pageStart = (page - 1) * PAGE_SIZE
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  const present = rows.filter((row) => row.status === "Present").length
  const absent = rows.filter((row) => row.status === "Absent").length
  const excused = rows.filter((row) => row.status === "Excused").length
  const total = rows.length
  const rate = total === 0 ? 0 : Math.round((present / total) * 100)

  const setStatus = (residentNo: string, status: AttendanceRow["status"]) =>
    setRows((current) =>
      current.map((row) =>
        row.residentNo === residentNo
          ? {
              ...row,
              status,
              arrivedAt: status === "Present" ? (row.arrivedAt ?? currentTime()) : null,
            }
          : row,
      ),
    )

  const markListedPresent = () => {
    const targets = new Set(filtered.map((row) => row.residentNo))
    setRows((current) =>
      current.map((row) =>
        targets.has(row.residentNo)
          ? { ...row, status: "Present", arrivedAt: row.arrivedAt ?? currentTime() }
          : row,
      ),
    )
  }

  const checkIn = () => {
    const code = scanCode.trim().toUpperCase()
    if (!code) {
      setScanNote({ text: "Enter a resident number first.", ok: false })
      return
    }
    const match = rows.find((row) => row.residentNo.toUpperCase() === code)
    if (!match) {
      setScanNote({ text: `No roster entry matches ${code}.`, ok: false })
      return
    }
    setStatus(match.residentNo, "Present")
    setScanNote({ text: `${match.name} checked in at ${currentTime()}.`, ok: true })
    setScanCode("")
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={meta.name} title="Attendance" />
        <Panel>
          <EmptyState
            icon={CalendarDays}
            title="No assembly found"
            description="Publish an announcement that requires attendance to open its roster."
          />
        </Panel>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={meta.name}
        title="Assembly attendance"
        description="Record arrivals, scan QR credentials and close the roster once the activity ends."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader>
            <div>
              <PanelTitle>{event.title}</PanelTitle>
              <PanelDescription>{event.audience}</PanelDescription>
            </div>
            <StatusBadge status={event.status} />
          </PanelHeader>
          <PanelContent className="grid gap-4 sm:grid-cols-2">
            <Meta label="Date">
              <span className="tnum">{formatIsoDate(event.date)}</span>
            </Meta>
            <Meta label="Venue">{event.venue}</Meta>
            <Meta label="Expected attendees">
              <span className="tnum">{event.expected || "—"} residents</span>
            </Meta>
            <Meta label="Posted by">{event.author}</Meta>
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Attendance summary</PanelTitle>
              <PanelDescription>Live count for this roster</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-line-soft bg-canvas/60 p-3">
                <p className="text-xl font-semibold tracking-tight text-ink-strong tnum">{present}</p>
                <p className="text-[11px] text-ink-muted">Present</p>
              </div>
              <div className="rounded-lg border border-line-soft bg-canvas/60 p-3">
                <p className="text-xl font-semibold tracking-tight text-ink-strong tnum">{absent}</p>
                <p className="text-[11px] text-ink-muted">Absent</p>
              </div>
              <div className="rounded-lg border border-line-soft bg-canvas/60 p-3">
                <p className="text-xl font-semibold tracking-tight text-ink-strong tnum">{excused}</p>
                <p className="text-[11px] text-ink-muted">Excused</p>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs text-ink-muted">Attendance rate</p>
                <p className="text-sm font-semibold text-ink-strong tnum">{rate}%</p>
              </div>
              <BarList
                className="mt-3"
                suffix="%"
                data={[
                  { label: "Present", value: rate },
                  { label: "Absent", value: total === 0 ? 0 : Math.round((absent / total) * 100) },
                  { label: "Excused", value: total === 0 ? 0 : Math.round((excused / total) * 100) },
                ]}
              />
            </div>
          </PanelContent>
        </Panel>
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Attendance roster</PanelTitle>
            <PanelDescription>
              {rows.length} residents listed for this activity
            </PanelDescription>
          </div>
          <StatusBadge
            status={rate >= 75 ? "Quorum met" : "Below quorum"}
            tone={rate >= 75 ? "success" : "warning"}
          />
        </PanelHeader>

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Search name, resident number or purok…"
            className="w-full sm:max-w-xs"
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 bg-surface"
              onClick={markListedPresent}
              title="Mark everyone in the current list as present"
            >
              <CheckCheck className="size-4" /> Mark present
            </Button>
            <Button size="sm" className="h-9" onClick={() => setScanOpen(true)}>
              <QrCode className="size-4" /> Scan QR
            </Button>
          </div>
        </TableToolbar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No resident matches this search"
            description="Check the spelling or search by resident number instead."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Resident</TableHead>
                  <TableHead>Purok</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Arrived at</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Present</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={row.residentNo}>
                    <TableCell className="pl-5">
                      <div className="leading-tight">
                        <p className="text-sm font-medium text-ink-strong">{row.name}</p>
                        <p className="text-[11px] text-ink-faint tnum">{row.residentNo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-muted">{row.purok}</TableCell>
                    <TableCell className="text-ink-muted">{row.sector}</TableCell>
                    <TableCell className="text-ink-muted tnum">
                      {row.arrivedAt ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex justify-end">
                        <Switch
                          checked={row.status === "Present"}
                          onCheckedChange={(checked) =>
                            setStatus(
                              row.residentNo,
                              checked ? "Present" : row.status === "Excused" ? "Excused" : "Absent",
                            )
                          }
                          aria-label={`Mark ${row.name} present`}
                        />
                      </div>
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

      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR check-in</DialogTitle>
            <DialogDescription>
              Simulates scanning a resident’s QR credential at the assembly entrance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-6 text-center">
              <QrCode className="mx-auto size-9 text-ink-faint" />
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                Hold the resident’s QR ID up to the scanner, or type the resident number below.
              </p>
            </div>

            <Input
              value={scanCode}
              onChange={(event) => setScanCode(event.target.value)}
              placeholder="RES-2026-04182"
              className="h-10 bg-surface tnum"
              aria-label="Resident number"
            />

            {scanNote && (
              <p
                className={
                  scanNote.ok ? "text-sm text-success" : "text-sm text-destructive"
                }
              >
                {scanNote.text}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" className="bg-surface" onClick={() => setScanOpen(false)}>
              Close
            </Button>
            <Button onClick={checkIn}>Scan and check in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
