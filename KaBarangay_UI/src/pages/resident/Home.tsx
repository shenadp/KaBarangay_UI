import { useMemo } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, FileText, Megaphone, Scale } from "lucide-react"

import AssistancePanel from "@/components/resident/AssistancePanel"
import { Panel } from "@/components/Panel"
import EmptyState from "@/components/EmptyState"
import { sessionResident } from "@/mock/resident/session"
import { latestAnnouncement } from "@/mock/resident/announcements"

const quickServices = [
  {
    to: "/resident/certificates",
    icon: FileText,
    title: "Request Certificate",
    description: "Request barangay documents and track your request.",
  },
  {
    to: "/resident/lupon",
    icon: Scale,
    title: "File a Complaint",
    description: "Submit a concern or view your Lupon case.",
  },
]

export default function ResidentHome() {
  const resident = useMemo(sessionResident, [])
  const announcement = useMemo(latestAnnouncement, [])

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-ink-strong">
          Good day, {resident.firstName}!
        </h1>
        <p className="mt-1 text-sm text-ink-muted">How can we help you today?</p>
      </section>

      <section aria-labelledby="quick-services-heading" className="space-y-3">
        <h2 id="quick-services-heading" className="sr-only">
          Quick Services
        </h2>
        {quickServices.map((service) => (
          <Link
            key={service.to}
            to={service.to}
            className="flex items-center gap-3 rounded-xl border border-line-soft bg-surface p-4 shadow-card transition-colors hover:border-brand"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <service.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink-strong">{service.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                {service.description}
              </span>
            </span>
            <ArrowRight className="ml-auto size-4 shrink-0 text-ink-faint" />
          </Link>
        ))}
      </section>

      <section aria-labelledby="latest-announcement-heading">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2 id="latest-announcement-heading" className="text-sm font-semibold text-ink-strong">
            Latest Announcement
          </h2>
          <Link
            to="/resident/announcements"
            className="shrink-0 text-xs font-semibold text-brand hover:underline"
          >
            View All
          </Link>
        </div>

        {announcement ? (
          <Link
            to="/resident/announcements"
            className="flex min-h-[68px] items-center gap-3 rounded-xl border border-line-soft bg-surface p-4 shadow-card transition-colors hover:border-brand"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <Megaphone className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink-strong">
                {announcement.title}
              </span>
              <span className="mt-0.5 block text-xs text-ink-muted">{announcement.createdAt}</span>
            </span>
          </Link>
        ) : (
          <Panel className="p-0">
            <EmptyState
              icon={Megaphone}
              title="No active announcements at this time."
              className="py-8"
            />
          </Panel>
        )}
      </section>

      <AssistancePanel />
    </div>
  )
}
