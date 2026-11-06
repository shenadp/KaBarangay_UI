import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  CalendarDays,
  CheckCheck,
  MapPin,
  Megaphone,
  QrCode,
  Users,
} from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatusBadge, { type Tone } from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import { Meta, Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import type { DeskBoardSet } from "@/config/sectorDesks"
import {
  canMarkSectorDone,
  formatIsoDate,
  isSectorAttendanceAvailable,
  isSectorEvent,
  sectorImportanceLabels,
  sectorStatusLabel,
  type SectorPost,
  type SectorPostKind,
} from "@/mock/sectorDesks"

const importanceTone: Record<string, Tone> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "danger",
}

const boardSegment = (postKind: SectorPostKind) =>
  postKind === "update" ? "updates" : postKind === "program" ? "programs" : "announcements"

/**
 * Detail view of one desk posting — mirrors the backend
 * `Sector/Announcements/Show` page: status header, body, event schedule and the
 * desk actions (attendance sheet, mark as done).
 */
export default function DeskPostDetail(props: { desk: DeskBoardSet; id: string; kind: SectorPostKind }) {
  // Only the route param changes when moving between two postings, so the form
  // state of the previous one would otherwise carry over.
  return <PostDetail key={props.id} {...props} />
}

function PostDetail({
  desk,
  id,
  kind,
}: {
  desk: DeskBoardSet
  id: string
  kind: SectorPostKind
}) {
  const board = desk.store.postsFor(kind)
  const initial = board.find((item) => String(item.id) === id) ?? board[0]

  const [item, setItem] = useState<SectorPost | undefined>(initial)
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!item) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={desk.eyebrow}
          title="Posting not found"
          description="This entry is no longer on the board."
          actions={
            <Button variant="outline" size="sm" className="h-9 bg-surface" asChild>
              <Link to={`${desk.basePath}/${boardSegment(kind)}`}>
                <ArrowLeft className="size-4" /> Back to the board
              </Link>
            </Button>
          }
        />
        <Panel>
          <EmptyState
            icon={Megaphone}
            title="Nothing to show"
            description="Choose another entry from the board to read its details."
          />
        </Panel>
      </div>
    )
  }

  const boardCopy = desk.boards[item.kind === "auto" ? "auto,update" : item.kind]
  const meta = {
    backLabel: `Back to ${boardCopy.title}`,
    backTo: `${desk.basePath}/${boardSegment(item.kind)}`,
  }
  const records = desk.store.attendanceFor(item.id)
  const presentCount = records.filter((record) => record.status === "present").length
  const claimedCount = records.filter((record) => record.status === "claimed").length

  const markDone = () => {
    desk.store.patchPost(item.id, { completedAt: desk.todayIso })
    setItem((current) => (current ? { ...current, completedAt: desk.todayIso } : current))
    setFeedback("Announcement marked as done.")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={desk.eyebrow}
        title={item.title}
        description={`Posted ${formatIsoDate(item.createdAt)} by ${item.author}`}
        actions={
          <Button variant="outline" size="sm" className="h-9 bg-surface" asChild>
            <Link to={meta.backTo}>
              <ArrowLeft className="size-4" /> {meta.backLabel}
            </Link>
          </Button>
        }
      />

      {feedback && (
        <p className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          {feedback}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel>
            <PanelHeader>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={sectorStatusLabel(item)} />
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand">
                  {desk.categoryLabels[item.category]}
                </span>
                {isSectorEvent(item) && item.location && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                    <MapPin className="size-3.5" /> {item.location}
                  </span>
                )}
              </div>
            </PanelHeader>
            <PanelContent className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight text-ink-strong">{item.title}</h2>

              {item.rejectionReason && (
                <p className="rounded-lg border border-destructive/30 bg-surface px-3.5 py-3 text-[13px] leading-relaxed text-destructive">
                  <span className="font-semibold">Rejection reason:</span> {item.rejectionReason}
                </p>
              )}

              <p className="text-sm leading-relaxed text-ink">{item.content}</p>

              {isSectorEvent(item) && (
                <div className="grid gap-4 border-t border-line-soft pt-4 sm:grid-cols-2">
                  <Meta label="Schedule">
                    <span className="tnum">
                      {item.eventDate ? formatIsoDate(item.eventDate) : "To be announced"}
                      {item.eventTime ? ` · ${item.eventTime}` : ""}
                    </span>
                  </Meta>
                  <Meta label="Venue">{item.location ?? "To be announced"}</Meta>
                </div>
              )}
            </PanelContent>
          </Panel>

          {isSectorAttendanceAvailable(item) && (
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Attendance snapshot</PanelTitle>
                  <PanelDescription>Records captured on this activity’s sheet</PanelDescription>
                </div>
                <StatusBadge
                  status={item.completedAt ? "Closed" : "Open"}
                  tone={item.completedAt ? "neutral" : "success"}
                />
              </PanelHeader>
              <PanelContent className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-line-soft bg-canvas/60 p-3">
                  <p className="text-xl font-semibold tracking-tight text-ink-strong tnum">
                    {presentCount}
                  </p>
                  <p className="text-[11px] text-ink-muted">Present / Dumalo</p>
                </div>
                <div className="rounded-lg border border-line-soft bg-canvas/60 p-3">
                  <p className="text-xl font-semibold tracking-tight text-ink-strong tnum">
                    {claimedCount}
                  </p>
                  <p className="text-[11px] text-ink-muted">Claimed / Naka-receive</p>
                </div>
                <div className="rounded-lg border border-line-soft bg-canvas/60 p-3">
                  <p className="text-xl font-semibold tracking-tight text-ink-strong tnum">
                    {records.length}
                  </p>
                  <p className="text-[11px] text-ink-muted">Total records</p>
                </div>
              </PanelContent>
              <PanelContent className="flex flex-wrap gap-2 border-t border-line-soft pt-3">
                <Button size="sm" className="h-8" asChild>
                  <Link to={`${desk.basePath}/announcements/${item.id}/attendance`}>
                    <QrCode className="size-4" /> Open attendance sheet
                  </Link>
                </Button>
                {canMarkSectorDone(item) && (
                  <Button variant="outline" size="sm" className="h-8 bg-surface" onClick={markDone}>
                    <CheckCheck className="size-4" /> Mark as done
                  </Button>
                )}
              </PanelContent>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Announcement information</PanelTitle>
                <PanelDescription>Filed by the {desk.sectorPlural.toLowerCase()} desk</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent className="grid gap-4">
              <Meta label="Type">
                <span className="capitalize">{item.type}</span>
              </Meta>
              <Meta label="Category">{desk.categoryLabels[item.category]}</Meta>
              <Meta label="Importance">
                <StatusBadge
                  status={sectorImportanceLabels[item.importance]}
                  tone={importanceTone[item.importance]}
                />
              </Meta>
              <Meta label="Audience">{item.audience}</Meta>
              <Meta label="Attendance">
                {isSectorEvent(item)
                  ? item.requiresAttendance
                    ? "QR sheet enabled"
                    : "Not tracked"
                  : "Not applicable"}
              </Meta>
              <Meta label="Posted by">{item.author}</Meta>
              {item.completedAt && (
                <Meta label="Done on">
                  <span className="tnum">{formatIsoDate(item.completedAt)}</span>
                </Meta>
              )}
            </PanelContent>
          </Panel>

          <Panel>
            <PanelContent className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                <Users className="size-4" />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink-strong">
                  Visible to {item.audience || desk.audience}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  Approved posts from this desk appear on the {desk.sectorPlural.toLowerCase()}{" "}
                  update feed in the resident app.
                </p>
              </div>
            </PanelContent>
          </Panel>

          <Panel>
            <PanelContent className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                <CalendarDays className="size-4" />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink-strong">Board</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  {item.kind === "auto"
                    ? "Announcements (notices)"
                    : item.kind === "update"
                      ? "Updates feed"
                      : "Programs board"}
                </p>
              </div>
            </PanelContent>
          </Panel>
        </div>
      </div>
    </div>
  )
}
