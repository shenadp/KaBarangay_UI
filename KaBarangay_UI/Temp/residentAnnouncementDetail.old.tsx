import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Bell, CalendarDays, CalendarPlus, Check, Clock, MapPin, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import EmptyState from "@/components/EmptyState"
import StatusBadge from "@/components/StatusBadge"
import { Panel } from "@/components/Panel"
import { announcements } from "@/mock/data"
import { announcementDetail } from "@/mock/resident"

export default function AnnouncementDetail() {
  const { id } = useParams()
  const [added, setAdded] = useState(false)

  const announcement = announcements.find((item) => String(item.id) === id)

  if (!announcement) {
    return (
      <div className="space-y-4">
        <Link
          to="/resident/announcements"
          className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          <ArrowLeft className="size-4" /> All notices
        </Link>
        <Panel className="p-0">
          <EmptyState
            icon={Bell}
            title="Notice not found"
            description="This announcement may have been unpublished, or the link is no longer valid."
            action={
              <Button asChild size="sm" className="mt-1">
                <Link to="/resident/announcements">Back to notices</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  const detail = announcementDetail(announcement.id)

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        to="/resident/announcements"
        className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="size-4" /> All notices
      </Link>

      {/* Article */}
      <article className="rounded-xl border border-line-soft bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-brand-soft px-2.5 text-[11px] font-medium text-brand"
          >
            {announcement.audience}
          </Badge>
          <StatusBadge status={announcement.status} />
        </div>

        <h1 className="mt-3 text-lg font-semibold tracking-tight text-ink-strong">
          {announcement.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
          <span className="inline-flex items-center gap-1.5 tnum">
            <CalendarDays className="size-3.5" /> {announcement.date}
          </span>
          <span>{announcement.author}</span>
        </div>

        <div className="mt-4 space-y-3 border-t border-line-soft pt-4">
          {detail.body.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-ink">
              {paragraph}
            </p>
          ))}
        </div>

        <dl className="mt-4 space-y-2 border-t border-line-soft pt-4 text-sm">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                Venue
              </dt>
              <dd className="text-ink">{detail.venue}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock className="mt-0.5 size-4 shrink-0 text-brand" />
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                Time
              </dt>
              <dd className="text-ink tnum">{detail.schedule}</dd>
            </div>
          </div>
        </dl>
      </article>

      {/* Add to calendar */}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        onClick={() => setAdded(true)}
        disabled={added}
      >
        {added ? (
          <>
            <Check className="size-4 text-success" /> Added to your calendar
          </>
        ) : (
          <>
            <CalendarPlus className="size-4" /> Add to calendar
          </>
        )}
      </Button>

      {/* Attendance */}
      {announcement.attendees ? (
        <section className="rounded-xl border border-line-soft bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand">
                <Users className="size-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-strong">Attendance</p>
                <p className="text-xs text-ink-muted">Residents who confirmed</p>
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-ink-strong tnum">
              {announcement.attendees}
            </p>
          </div>
          <p className="mt-3 border-t border-line-soft pt-3 text-xs leading-relaxed text-ink-muted">
            Kung ikaw ay dumalo, ipapatala ang iyong attendance sa venue. Dalhin ang barangay ID o
            resident QR para sa mabilis na pila.
          </p>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-surface/70 p-4 text-xs leading-relaxed text-ink-muted">
          Walk-in po ang event na ito — walang kailangang i-confirm na attendance. Dumating lang
          15 minuto bago ang simula.
        </p>
      )}
    </div>
  )
}
