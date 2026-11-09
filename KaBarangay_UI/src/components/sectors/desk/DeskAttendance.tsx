import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ClipboardCheck, Gift, MapPin, ScanLine, UserPlus } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatusBadge from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import type { DeskBoardSet } from "@/config/sectorDesks"
import {
  formatIsoDate,
  type SectorAttendanceRecord,
  type SectorAttendanceStatus,
} from "@/mock/sectorDesks"

const activityKinds = ["auto", "update", "program"] as const

function nowTime(): string {
  return new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
}

export default function DeskAttendance({ desk }: { desk: DeskBoardSet }) {
  const { id } = useParams<{ id: string }>()
  // Two activities share this route, so the sheet needs its own key per id.
  return <AttendanceSheet key={id} desk={desk} id={id} />
}

function AttendanceSheet({ desk, id }: { desk: DeskBoardSet; id?: string }) {
  const board = desk.store.postsFor([...activityKinds])
  const activity = board.find((entry) => String(entry.id) === id) ?? board[0]

  const pool = useMemo(() => desk.attendancePool(), [desk])
  const [records, setRecords] = useState<SectorAttendanceRecord[]>(() =>
    desk.store.attendanceFor(activity?.id ?? 0),
  )
  const [tab, setTab] = useState<SectorAttendanceStatus>("present")
  const [token, setToken] = useState("")
  const [manualResidentId, setManualResidentId] = useState("")
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null)

  if (!activity) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={desk.eyebrow} title="Attendance sheet" />
        <Panel>
          <EmptyState
            icon={ScanLine}
            title="No activity selected"
            description={`Open the sheet from an approved ${desk.sectorPlural.toLowerCase()} activity or program.`}
          />
        </Panel>
      </div>
    )
  }

  const presentCount = records.filter((record) => record.status === "present").length
  const claimedCount = records.filter((record) => record.status === "claimed").length

  const addRecord = (residentId: number, method: SectorAttendanceRecord["method"]) => {
    const status = tab
    const resident = pool.find((entry) => entry.id === residentId)
    if (!resident) return false
    if (records.some((record) => record.residentId === resident.id && record.status === status)) {
      setFeedback({
        text: `${resident.fullName} is already recorded as ${status} for this activity.`,
        ok: false,
      })
      return false
    }
    const record: SectorAttendanceRecord = {
      id: records.reduce((highest, entry) => Math.max(highest, entry.id), 0) + 1,
      residentId: resident.id,
      residentNumber: resident.residentNumber,
      fullName: resident.fullName,
      status,
      method,
      loggedAt: nowTime(),
    }
    desk.store.addAttendance(activity.id, record)
    setRecords((current) => [record, ...current])
    return true
  }

  const processScan = () => {
    const raw = token.trim()
    if (!raw) {
      setFeedback({ text: "Paste or scan a QR token first.", ok: false })
      return
    }
    // The token is recorded as the status of the tab currently open, so any
    // `|PRESENT` / `|CLAIMED` suffix carried by the printed card is ignored.
    const code = raw.split("|")[0].trim().toUpperCase()

    const resident = pool.find(
      (entry) => entry.residentNumber.toUpperCase() === code || String(entry.id) === code,
    )
    if (!resident) {
      setFeedback({ text: `Walang resident na tugma sa token ${code}.`, ok: false })
      return
    }
    if (!addRecord(resident.id, "qr_scanner")) return
    setFeedback({
      text: `${resident.fullName} — ${tab === "claimed" ? "Aid claimed" : "Present"}, recorded by QR scan.`,
      ok: true,
    })
    setToken("")
  }

  const markManually = () => {
    const residentId = Number(manualResidentId)
    if (!residentId) {
      setFeedback({ text: "Pumili ng resident muna para sa manual entry.", ok: false })
      return
    }
    if (!addRecord(residentId, "manual")) return
    const resident = pool.find((entry) => entry.id === residentId)
    setFeedback({
      text: `${resident?.fullName ?? "Resident"} — ${tab === "claimed" ? "Aid claimed" : "Present"}, encoded manually.`,
      ok: true,
    })
    setManualResidentId("")
  }

  const rows = records.filter((record) => record.status === tab)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={desk.eyebrow}
        title="Attendance sheet"
        description="Scan the resident QR card or encode manually to record attendance and aid claims."
        actions={
          <Button variant="outline" size="sm" className="h-9 bg-surface" asChild>
            <Link
              to={`${desk.basePath}/${activity.kind === "update" ? "updates" : activity.kind === "program" ? "programs" : "announcements"}/${activity.id}`}
            >
              Bumalik sa{" "}
              {activity.kind === "update" ? "Updates" : activity.kind === "program" ? "Programs" : "Announcements"}
            </Link>
          </Button>
        }
      />

      <Panel>
        <PanelHeader>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand">
                {desk.categoryLabels[activity.category]}
              </span>
              <StatusBadge
                status={activity.completedAt ? "Closed" : "Open"}
                tone={activity.completedAt ? "neutral" : "success"}
              />
            </div>
            <PanelTitle className="mt-2">{activity.title}</PanelTitle>
            <PanelDescription>
              {activity.location && (
                <>
                  <MapPin className="mr-1 inline size-3 align-[-2px]" aria-hidden />
                  {activity.location} ·{" "}
                </>
              )}
              {activity.eventDate
                ? formatIsoDate(activity.eventDate)
                : formatIsoDate(activity.createdAt)}
            </PanelDescription>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-lg font-semibold tracking-tight text-ink-strong tnum">
                {presentCount}
              </p>
              <p className="text-[11px] text-ink-muted">Present</p>
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-ink-strong tnum">
                {claimedCount}
              </p>
              <p className="text-[11px] text-ink-muted">Claimed</p>
            </div>
          </div>
        </PanelHeader>

        {feedback && (
          <p
            className={
              feedback.ok
                ? "border-b border-line-soft bg-success-soft px-5 py-2 text-xs text-success"
                : "border-b border-line-soft px-5 py-2 text-xs text-destructive"
            }
          >
            {feedback.text}
          </p>
        )}

        <PanelContent className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-md bg-brand-soft text-brand">
                <ScanLine className="size-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink-strong">QR Scanner</p>
                <p className="text-[11px] text-ink-muted">
                  Kasalukuyang mode: <strong className="uppercase">{tab}</strong>
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label htmlFor="qr-token" className="text-sm font-medium text-ink-strong">
                QR Token Input
              </label>
              <Input
                id="qr-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    processScan()
                  }
                }}
                placeholder={`I-scan para itala bilang ${tab}...`}
                className="h-10 bg-surface tnum"
              />
              <p className="text-[11px] text-ink-faint">
                Halimbawa ng token: <span className="tnum">{pool[0]?.residentNumber ?? "BSI-RES-000001"}</span>.
                I-scan lang ang QR code — awtomatikong itinatala bilang <strong>{tab}</strong>.
              </p>
              <Button className="w-full" onClick={processScan}>
                <ScanLine className="size-4" /> Prosesuhin ang QR Scan ({tab.toUpperCase()})
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-line-soft bg-surface p-4 shadow-card">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-md bg-brand-soft text-brand">
                <UserPlus className="size-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink-strong">Manual Entry</p>
                <p className="text-[11px] text-ink-muted">
                  Mag-record para sa <strong className="uppercase">{tab}</strong> nang walang QR.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <label htmlFor="manual-resident" className="text-sm font-medium text-ink-strong">
                  Piliin ang Residente
                </label>
                <Select value={manualResidentId} onValueChange={setManualResidentId}>
                  <SelectTrigger id="manual-resident" className="w-full bg-surface">
                    <SelectValue placeholder="-- Pumili ng Residente --" />
                  </SelectTrigger>
                  <SelectContent>
                    {pool.map((resident) => (
                      <SelectItem key={resident.id} value={String(resident.id)}>
                        {resident.fullName} — {resident.residentNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-ink-faint">
                  Para sa rehistradong residente na walang ma-scan na QR code.
                </p>
              </div>
              <Button className="w-full" onClick={markManually}>
                <UserPlus className="size-4" /> Itala bilang {tab.toUpperCase()} Manually
              </Button>
            </div>
          </div>
        </PanelContent>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Mga Rekord</PanelTitle>
            <PanelDescription>
              Live tally for this activity — newest entries first
            </PanelDescription>
          </div>
          <SegmentedTabs
            value={tab}
            onChange={(value) => setTab(value as SectorAttendanceStatus)}
            segments={[
              {
                label: "Event Present / Dumalo",
                value: "present",
                count: presentCount,
                icon: ClipboardCheck,
              },
              {
                label: "Aid Claimed / Naka-receive",
                value: "claimed",
                count: claimedCount,
                icon: Gift,
              },
            ]}
          />
        </PanelHeader>

        {rows.length === 0 ? (
          <EmptyState
            icon={ScanLine}
            title={`Wala pang nakatalang rekord para sa tab na ito (${tab})`}
            description="Scan a QR card or encode a resident manually to start the sheet."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Pangalan ng Residente</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paraan</TableHead>
                <TableHead className="pr-5">Oras ng Pagtala</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="pl-5 font-medium text-ink-strong">
                    {record.fullName}
                  </TableCell>
                  <TableCell className="text-ink-muted tnum">{record.residentNumber}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={record.status === "present" ? "Present" : "Claimed"}
                      tone={record.status === "present" ? "success" : "info"}
                    />
                  </TableCell>
                  <TableCell className="text-ink-muted">
                    {record.method === "qr_scanner" ? "QR Scanner" : "Manual Entry"}
                  </TableCell>
                  <TableCell className="pr-5 text-ink-muted tnum">{record.loggedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
