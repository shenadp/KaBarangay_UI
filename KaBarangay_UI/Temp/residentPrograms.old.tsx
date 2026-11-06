import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CalendarDays, ClipboardList, MapPin, Users } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import StatusBadge from "@/components/StatusBadge"

type ProgramStatus = "Upcoming" | "Ongoing" | "Completed"

type Program = {
  id: number
  title: string
  summary: string
  date: string
  venue: string
  status: ProgramStatus
  slots: string
}

const programs: Program[] = [
  {
    id: 1,
    title: "Free medical at dental mission",
    summary: "Libreng check-up, gamot at dental extraction para sa lahat ng residente ng barangay.",
    date: "Nov 08, 2026",
    venue: "Barangay covered court",
    status: "Upcoming",
    slots: "120 slots",
  },
  {
    id: 2,
    title: "Senior citizen flu vaccination",
    summary: "Flu vaccine para sa mga senior citizen. Magdala ng senior ID at health record.",
    date: "Nov 12, 2026",
    venue: "Barangay health center",
    status: "Upcoming",
    slots: "80 slots",
  },
  {
    id: 3,
    title: "PWD skills training — basic computer",
    summary: "Tatlong araw na training sa basic computer at online services para sa PWD residents.",
    date: "Nov 15–17, 2026",
    venue: "Barangay e-center",
    status: "Upcoming",
    slots: "25 slots",
  },
  {
    id: 4,
    title: "Purok clean-up drive",
    summary: "Sabay-sabay na paglilinis ng mga purok kasama ang barangay staff at volunteers.",
    date: "Oct 26, 2026",
    venue: "Purok 1–4",
    status: "Ongoing",
    slots: "Walk-in",
  },
  {
    id: 5,
    title: "Feeding program — nutrition month",
    summary: "Nutritious meals para sa mga bata at pregnant residents. Nagsimula noong Oct 20.",
    date: "Oct 20, 2026",
    venue: "Barangay day care center",
    status: "Ongoing",
    slots: "60 slots",
  },
  {
    id: 6,
    title: "Barangay assembly — 3rd quarter",
    summary: "Pagpupulong ng mga residente tungkol sa budget, proyekto at plano ng barangay.",
    date: "Sep 28, 2026",
    venue: "Barangay covered court",
    status: "Completed",
    slots: "Open to all",
  },
]

type Tab = "all" | "Upcoming" | "Ongoing" | "Completed"

export default function Programs() {
  const [tab, setTab] = useState<Tab>("all")

  const visible = tab === "all" ? programs : programs.filter((program) => program.status === tab)

  const count = (status: ProgramStatus) => programs.filter((program) => program.status === status).length

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
            Barangay programs
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink-strong">Programs</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Mga libreng serbisyo, training at aktibidad ng barangay — kasama ang petsa, lugar at
            bilang ng slot.
          </p>
        </div>
        <Link
          to="/resident/updates"
          className="inline-flex h-10 shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          Updates <ArrowRight className="size-3.5" />
        </Link>
      </header>

      <SegmentedTabs
        value={tab}
        onChange={(value) => setTab(value as Tab)}
        segments={[
          { label: "All", value: "all", count: programs.length },
          { label: "Upcoming", value: "Upcoming", count: count("Upcoming") },
          { label: "Ongoing", value: "Ongoing", count: count("Ongoing") },
          { label: "Completed", value: "Completed", count: count("Completed") },
        ]}
      />

      {visible.length === 0 ? (
        <div className="rounded-xl border border-line-soft bg-surface shadow-card">
          <EmptyState
            icon={ClipboardList}
            title="Walang program sa kategoryang ito"
            description="Balikan ang page na ito para sa mga bagong programa at serbisyo ng barangay."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((program) => (
            <li key={program.id}>
              <Link
                to={`/resident/announcements/${program.id}`}
                className="block rounded-xl border border-line-soft bg-surface p-4 shadow-card transition-colors hover:border-brand"
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={program.status} />
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint tnum">
                    <CalendarDays className="size-3.5" /> {program.date}
                  </span>
                </div>

                <h2 className="mt-2.5 text-sm font-semibold text-ink-strong">{program.title}</h2>
                <p className="mt-1 text-[13px] text-ink-muted">{program.summary}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line-soft pt-2.5 text-[11px] text-ink-faint">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {program.venue}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" /> {program.slots}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand">
                    Details <ArrowRight className="size-3.5" />
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
