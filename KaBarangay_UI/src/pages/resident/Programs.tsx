/**
 * Resident portal — Barangay Programs.
 *
 * `Resident\Programs` is a read-only shelf of the published events: the board
 * sorts them by their own start time, prints eligibility as a pill, and offers
 * no links, filters or pagination — a program has no resident-facing detail
 * page to open.
 */
import { Megaphone } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import { Panel } from "@/components/Panel"
import {
  eligibilityLabel,
  formatShortDateTime,
  programRows,
} from "@/mock/resident/announcements"

function ProgramDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 font-medium text-ink-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  )
}

export default function Programs() {
  const programs = programRows()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header className="border-b border-line-soft pb-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
          Community Services
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink-strong sm:text-2xl">
          Barangay Programs
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Explore published community programs, projects, and events available to you.
        </p>
      </header>

      {programs.length === 0 ? (
        <Panel className="p-0">
          <EmptyState
            icon={Megaphone}
            title="No active programs right now"
            description="Check back for newly published barangay initiatives and events."
          />
        </Panel>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <li key={program.id}>
              <article className="flex h-full flex-col rounded-xl border border-line-soft bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold tracking-tight text-ink-strong">
                    {program.title}
                  </h2>
                  <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-deep">
                    {eligibilityLabel(program)}
                  </span>
                </div>

                <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line text-ink">
                  {program.content}
                </p>

                <dl className="mt-4 space-y-2 border-t border-line-soft pt-4 text-sm">
                  <ProgramDetail
                    label="Schedule"
                    value={
                      program.eventStartAt
                        ? formatShortDateTime(program.eventStartAt)
                        : "Schedule to be announced"
                    }
                  />
                  <ProgramDetail
                    label="Location"
                    value={program.location || "Location to be announced"}
                  />
                  <ProgramDetail
                    label="Participation"
                    value={program.requiresAttendance ? "Attendance is required" : "Open participation"}
                  />
                </dl>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
