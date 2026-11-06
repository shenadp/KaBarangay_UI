import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CalendarDays, Megaphone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import { residentUpdates, type UpdateKind } from "@/mock/residentExtras"
import { cn } from "@/lib/utils"

const chipTone: Record<UpdateKind, string> = {
  urgent: "bg-warning-soft text-warning",
  services: "bg-info-soft text-info",
  advisory: "bg-brand-soft text-brand",
}

type Tab = UpdateKind | "all"

const emptyCopy: Record<Tab, { title: string; description: string }> = {
  all: {
    title: "Walang update pa ngayon",
    description: "Ang mga bagong abiso, serbisyo at paalala ng barangay ay lalabas dito.",
  },
  urgent: {
    title: "Walang urgent update ngayon",
    description: "Ipadadalhan ka ng abiso rito kapag may kailangang gawin kaagad.",
  },
  services: {
    title: "Walang service notice ngayon",
    description: "Mga serbisyo at pamamahagi ng barangay ang lalabas dito. Balikan mo mamaya.",
  },
  advisory: {
    title: "Walang advisory ngayon",
    description: "Mga pangkalahatang paalala at anunsyo ng barangay ang lalabas dito.",
  },
}

export default function Updates() {
  const [tab, setTab] = useState<Tab>("all")

  const counts = {
    all: residentUpdates.length,
    urgent: residentUpdates.filter((update) => update.kind === "urgent").length,
    services: residentUpdates.filter((update) => update.kind === "services").length,
  }

  const visible = tab === "all" ? residentUpdates : residentUpdates.filter((update) => update.kind === tab)

  return (
    <div className="space-y-4">
      {/* Heading */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
            Barangay updates
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink-strong">
            Updates and advisories
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Maikling abiso, serbisyo at paalala mula sa barangay.
          </p>
        </div>
        <Link
          to="/resident/announcements"
          className="inline-flex h-10 shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          Notices <ArrowRight className="size-3.5" />
        </Link>
      </header>

      {/* Filter */}
      <SegmentedTabs
        value={tab}
        onChange={(value) => setTab(value as Tab)}
        segments={[
          { label: "All", value: "all", count: counts.all },
          { label: "Urgent", value: "urgent", count: counts.urgent },
          { label: "Services", value: "services", count: counts.services },
        ]}
      />

      {/* Cards */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-line-soft bg-surface shadow-card">
          <EmptyState
            icon={Megaphone}
            title={emptyCopy[tab].title}
            description={emptyCopy[tab].description}
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((update) => (
            <li key={update.id}>
              <Link
                to={`/resident/announcements/${update.id}`}
                className="block rounded-xl border border-line-soft bg-surface p-4 shadow-card transition-colors hover:border-brand"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className={cn("px-2.5 text-[11px] font-medium", chipTone[update.kind])}
                  >
                    {update.label}
                  </Badge>
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint tnum">
                    <CalendarDays className="size-3.5" /> {update.date}
                  </span>
                </div>

                <h2 className="mt-2.5 text-sm font-semibold text-ink-strong">{update.title}</h2>
                <p className="mt-1 line-clamp-1 text-[13px] text-ink-muted">{update.summary}</p>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
                  <span className="min-w-0 truncate text-[11px] text-ink-faint">
                    {update.source}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand">
                    Read <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
