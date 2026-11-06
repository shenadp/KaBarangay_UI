import { useMemo, useState } from "react"
import { SearchX } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs, { type Segment } from "@/components/SegmentedTabs"
import StatusBadge from "@/components/StatusBadge"
import { Panel } from "@/components/Panel"
import { SearchInput } from "@/components/TableTools"
import { adminPrograms, matchesProgram, programCount, programTabs } from "@/mock/admin/programs"

/**
 * Programs mirrors the reference `Admin/AnnouncementApprovals` list: events and
 * attendance-required notices published by the Clerk, PWD and Senior desks,
 * browsed by lifecycle. Nothing here is approved — staff publish programs
 * directly, and the backend refuses an admin decision on one.
 */

export default function AdminAnnouncementApprovals() {
  const [tab, setTab] = useState<"all" | "draft" | "ongoing" | "done">("all")
  const [search, setSearch] = useState("")

  const programs = useMemo(() => adminPrograms(), [])

  const segments: Segment[] = programTabs.map((option) => ({
    label: option.label,
    value: option.value,
    count: programCount(option.value, programs),
  }))

  const visible = programs.filter(
    (program) => (tab === "all" || program.bucket === tab) && matchesProgram(program, search),
  )

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Programs"
        description="Programs are published directly by Clerk, PWD, and Senior staff."
      />

      <SegmentedTabs
        segments={segments}
        value={tab}
        onChange={(value) => setTab(value as typeof tab)}
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search programs…"
        className="max-w-2xl"
      />

      {visible.length === 0 ? (
        <Panel className="p-6">
          <EmptyState
            icon={SearchX}
            title="No programs found"
            description="Nothing matches the current tab and search."
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          {visible.map((program) => (
            <Panel key={program.key} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-ink-strong">{program.title}</h2>
                <StatusBadge status={program.statusLabel} />
              </div>

              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink">
                {program.content}
              </p>

              <p className="mt-3 text-xs text-ink-muted">
                {[program.author, program.location, program.eventStart].filter(Boolean).join(" · ")}
              </p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
