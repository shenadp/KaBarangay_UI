import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BellRing, ChevronDown, Megaphone } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import EmptyState from "@/components/EmptyState"
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  dashboardActiveStaff,
  dashboardAnnouncements,
  dashboardNotifications,
  dashboardPuroks,
  dashboardStats,
  type DashboardNotification,
} from "@/mock/admin/dashboard"

export default function AdminDashboard() {
  const [puroksOpen, setPuroksOpen] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])

  /* The controller resolves all five props in one cached pass; the demo derives
     them from the stores the detailed pages use, so a decision there moves the
     number here. */
  const stats = useMemo(() => dashboardStats(), [])
  const puroks = useMemo(() => dashboardPuroks(), [])
  const announcements = useMemo(() => dashboardAnnouncements(), [])
  const notifications = useMemo(() => dashboardNotifications(), [])
  const activeStaff = useMemo(() => dashboardActiveStaff(), [])

  const toggleAnnouncement = (id: string) =>
    setExpanded((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Admin Dashboard" description="Barangay records and activity" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Residents"
          value={stats.residents}
          hint="Registered Residents"
          to="/admin/residents"
        />

        <div className="relative max-w-xs">
          <button
            type="button"
            onClick={() => setPuroksOpen((current) => !current)}
            aria-expanded={puroksOpen}
            className="w-full rounded-xl border border-brand bg-brand p-5 text-left text-white transition-colors hover:bg-brand/90"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/80">Puroks</p>
            <p className="mt-3 text-3xl font-semibold text-white tnum">{stats.puroks}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-white/70">
              Total Puroks · View list
              <ChevronDown
                className={cn("size-3.5 transition-transform", puroksOpen && "rotate-180")}
              />
            </p>
          </button>

          {puroksOpen && (
            <div className="absolute inset-x-3 top-full z-20 mt-2 max-h-48 overflow-auto rounded-lg border border-line bg-surface py-1 text-xs text-ink shadow-raised">
              {puroks.length ? (
                puroks.map((purok) => (
                  <div key={purok.id} className="border-b border-line-soft px-3 py-2 last:border-0">
                    {purok.name}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-ink-faint">No puroks found</div>
              )}
            </div>
          )}
        </div>

        <SummaryCard
          label="Cases"
          value={stats.cases}
          hint="Lupon cases"
          to="/admin/sectors?tab=lupon"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Barangay Announcements</PanelTitle>
              <PanelDescription>Published announcements and programs</PanelDescription>
            </div>

            <p className="text-xs font-medium text-brand tnum">
              Total Programs: {stats.totalPrograms} · Total Announcements: {stats.totalAnnouncements}
            </p>
          </PanelHeader>

          {announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No published announcements."
              description="Approved notices from the barangay and sector desks appear here."
              className="py-10"
            />
          ) : (
            <PanelContent className="divide-y divide-line-soft p-0">
              {announcements.map((announcement) => {
                const open = expanded.includes(announcement.id)
                const meta = [announcement.category, announcement.eventStartAt, announcement.location]
                  .filter(Boolean)
                  .join(" · ")

                return (
                  <article key={announcement.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-strong">{announcement.title}</p>
                        <p className="mt-1 text-xs text-ink-muted">{meta}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleAnnouncement(announcement.id)}
                        aria-expanded={open}
                        className="shrink-0 text-xs font-medium text-brand hover:underline"
                      >
                        {open ? "Hide details" : "View details"}
                      </button>
                    </div>

                    {open && (
                      <p className="mt-3 text-sm whitespace-pre-line text-ink">{announcement.content}</p>
                    )}
                  </article>
                )
              })}
            </PanelContent>
          )}
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Notifications</PanelTitle>
              <PanelDescription>Recent system activity</PanelDescription>
            </div>

            <Button variant="ghost" size="sm" className="h-8 text-brand" asChild>
              <Link to="/admin/audit-log">View all</Link>
            </Button>
          </PanelHeader>

          {notifications.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="No recent notifications."
              description="Filings and requests that need attention appear here."
              className="py-10"
            />
          ) : (
            <PanelContent className="divide-y divide-line-soft p-0">
              {notifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))}
            </PanelContent>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Activity Summary</PanelTitle>
            <PanelDescription>Current barangay records</PanelDescription>
          </div>

          <Button variant="ghost" size="sm" className="h-8 text-brand" asChild>
            <Link to="/admin/reports">View Reports</Link>
          </Button>
        </PanelHeader>

        <PanelContent className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Active Staff"
            value={activeStaff}
            hint="Currently active"
            tone="neutral"
            to="/admin/staff"
          />
        </PanelContent>
      </Panel>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Tiles                                                                      */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
  hint,
  to,
  tone = "brand",
}: {
  label: string
  value: number
  hint: string
  to: string
  tone?: "brand" | "neutral"
}) {
  return (
    <Link
      to={to}
      className={cn(
        "max-w-xs rounded-xl border p-5 transition-colors",
        tone === "brand"
          ? "border-brand bg-brand text-white hover:bg-brand/90"
          : "border-line-soft bg-surface hover:border-brand/40",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-wide",
          tone === "brand" ? "text-white/80" : "text-ink-faint",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tnum",
          tone === "brand" ? "text-white" : "text-ink-strong",
        )}
      >
        {value}
      </p>
      <p className={cn("mt-1 text-xs", tone === "brand" ? "text-white/70" : "text-ink-muted")}>{hint}</p>
    </Link>
  )
}

function NotificationRow({ notification }: { notification: DashboardNotification }) {
  return (
    <Link
      to={notification.href}
      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-canvas/60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
          {notification.icon}
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-strong">{notification.title}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{notification.description}</p>
        </div>
      </div>

      <span className="shrink-0 text-[11px] text-ink-faint tnum">{notification.time}</span>
    </Link>
  )
}
