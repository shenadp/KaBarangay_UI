/**
 * Resident portal — reading one notice.
 *
 * `Resident\AnnouncementController::show` re-runs the board's own visibility
 * query for the id, so a notice opens only from the board it belongs to and the
 * back link returns to exactly where the resident came from — including the
 * `period` of the updates board.
 *
 * The shared backend component renders the approval, attendance and completion
 * blocks only for the desks that pass those flags. A resident passes none, so
 * this page stays read-only: header, body, event details and the sidebar.
 */
import { Link, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, Megaphone } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import { Meta, Panel } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import {
  audienceLabel,
  categoryLabel,
  findAnnouncement,
  formatShortDateTime,
} from "@/mock/resident/announcements"
import type { AnnouncementsKind } from "./Announcements"

const NEUTRAL_CHIP = "bg-canvas text-ink-muted ring-1 ring-inset ring-line-soft"

function Chip({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase ${tone}`}
    >
      {label}
    </span>
  )
}

export default function AnnouncementDetail({ kind = "announcements" }: { kind?: AnnouncementsKind }) {
  const { id } = useParams()
  const [params] = useSearchParams()
  const period = params.get("period") === "past" ? "past" : "current"

  const backHref =
    kind === "updates" ? `/resident/updates?period=${period}` : "/resident/announcements"
  const row = id ? findAnnouncement(kind, period, id) : null

  if (!row) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Link
          to={backHref}
          className="inline-flex h-10 items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-hover"
        >
          <ArrowLeft className="size-3.5" /> Back to announcements
        </Link>

        <Panel className="p-0">
          <EmptyState
            icon={Megaphone}
            title="Announcement not found"
            description="This notice is no longer on your board."
            action={
              <Button asChild size="sm" variant="outline" className="mt-1 h-9 bg-surface">
                <Link to={backHref}>Back to announcements</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  const isEvent = row.type === "event"
  const typeLabel = isEvent ? "Event" : "Informational Update"

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Link
        to={backHref}
        className="inline-flex text-xs font-semibold text-brand hover:text-brand-hover"
      >
        Back to announcements
      </Link>

      <Panel>
        <div className="flex flex-col gap-4 border-b border-line-soft pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Chip
                label={typeLabel}
                tone={isEvent ? "bg-info-soft text-info" : "bg-brand-soft text-brand"}
              />
              <Chip label={categoryLabel(row.category)} tone={NEUTRAL_CHIP} />
              <Chip label={audienceLabel(row)} tone={NEUTRAL_CHIP} />
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-ink-strong sm:text-2xl">
              {row.title}
            </h1>

            <p className="mt-2 text-xs text-ink-muted">
              Posted {formatShortDateTime(row.createdAt)}
              {row.author ? ` by ${row.author}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink">{row.content}</p>

            {isEvent && (row.eventStartAt || row.location) && (
              <div className="mt-6 rounded-lg border border-line-soft bg-canvas p-4">
                <h2 className="text-xs font-semibold tracking-wider text-brand-deep uppercase">
                  Event details
                </h2>

                <dl className="mt-3 space-y-2 text-sm text-ink">
                  {row.eventStartAt && (
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 font-medium text-ink-muted">Schedule</dt>
                      <dd className="tnum">{formatShortDateTime(row.eventStartAt)}</dd>
                    </div>
                  )}

                  {row.location && (
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 font-medium text-ink-muted">Venue</dt>
                      <dd>{row.location}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          <aside>
            <div className="rounded-lg border border-line-soft bg-canvas p-4">
              <h2 className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
                Announcement information
              </h2>

              <div className="mt-3 space-y-3 text-xs">
                <Meta label="Type">{typeLabel}</Meta>
                <Meta label="Category">{categoryLabel(row.category)}</Meta>
                <Meta label="Audience">{audienceLabel(row)}</Meta>
                {row.author && <Meta label="Posted by">{row.author}</Meta>}
              </div>
            </div>
          </aside>
        </div>
      </Panel>
    </div>
  )
}
