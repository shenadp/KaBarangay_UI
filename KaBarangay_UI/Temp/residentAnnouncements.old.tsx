import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Bell, CalendarDays, ChevronDown, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import EmptyState from "@/components/EmptyState"
import StatusBadge from "@/components/StatusBadge"
import { announcements } from "@/mock/data"
import { announcementDetail } from "@/mock/resident"
import { cn } from "@/lib/utils"

const filters = [
  { label: "All", value: "all" },
  { label: "Senior", value: "senior" },
  { label: "PWD", value: "pwd" },
  { label: "Youth", value: "youth" },
]

const audienceFor: Record<string, string> = {
  senior: "Senior Citizens",
  pwd: "PWD",
  youth: "Youth",
}

const visibleAnnouncements = announcements.filter(
  (announcement) => announcement.status === "Published" || announcement.status === "Scheduled",
)

export default function Announcements() {
  const [filter, setFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const visible = visibleAnnouncements.filter(
    (announcement) =>
      filter === "all" || announcement.audience === audienceFor[filter],
  )

  return (
    <div className="space-y-4">
      {/* Heading */}
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">Notices</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink-strong">
          Barangay announcements
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Mga paunlak at abiso para sa mga residente.</p>
      </header>

      {/* Audience chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const active = item.value === filter
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-brand bg-brand text-white"
                  : "border-line-soft bg-surface text-ink-muted",
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Cards */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-line-soft bg-surface shadow-card">
          <EmptyState
            icon={Bell}
            title="Walang abiso para rito"
            description="No announcements for this audience right now. Check back soon."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((announcement) => {
            const detail = announcementDetail(announcement.id)
            const expanded = expandedId === announcement.id

            return (
              <li
                key={announcement.id}
                className="rounded-xl border border-line-soft bg-surface p-4 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-brand-soft px-2.5 text-[11px] font-medium text-brand"
                  >
                    {announcement.audience}
                  </Badge>
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint tnum">
                    <CalendarDays className="size-3.5" /> {announcement.date}
                  </span>
                </div>

                <h2 className="mt-2.5 text-sm font-semibold text-ink-strong">
                  {announcement.title}
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  {announcement.summary}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {announcement.status !== "Published" && (
                    <StatusBadge status={announcement.status} />
                  )}
                  <span className="text-[11px] text-ink-faint">By {announcement.author}</span>
                </div>

                {expanded && (
                  <div className="mt-3 space-y-2 border-t border-line-soft pt-3">
                    <p className="flex items-start gap-1.5 text-xs leading-relaxed text-ink-faint">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      {detail.venue} · {detail.schedule}
                    </p>
                    <p className="text-[13px] leading-relaxed text-ink">{detail.body[0]}</p>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : announcement.id)}
                    className="inline-flex h-10 items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                  >
                    {expanded ? "Show less" : "Details"}
                    <ChevronDown
                      className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
                    />
                  </button>
                  <Link
                    to={`/resident/announcements/${announcement.id}`}
                    className="inline-flex h-10 items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    Read full <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
