/**
 * Resident portal — the barangay organizational chart.
 *
 * Mirrors `Resident/OrgChart` of commit b6030a08: the published positions are
 * drawn as the leadership chart, and selecting a card fills the aside beneath it
 * with that position's photo, incumbent and direct reports. Only published rows
 * ever reach this page, so the chart collapses to the empty state until staff
 * publish something.
 */

import { useState } from "react"
import { Building2, UsersRound } from "lucide-react"

import BarangayOrgChart from "@/components/org-chart/BarangayOrgChart"
import EmptyState from "@/components/EmptyState"
import OrgChartAvatar from "@/components/org-chart/OrgChartAvatar"
import { Panel, PanelContent } from "@/components/Panel"
import { flattenOrgChartNodes, type OrgChartNode } from "@/mock/orgChart"
import { residentOrgChartTree } from "@/mock/resident/orgChart"
import { sessionResident } from "@/mock/resident/session"

export default function OrgChart() {
  const tree = residentOrgChartTree()
  const positions = flattenOrgChartNodes(tree)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = positions.find((position) => position.id === selectedId) ?? null

  const resident = sessionResident()

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink-strong sm:text-2xl">
          Barangay Organizational Chart
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Official structure of barangay positions and offices. Select a position to view its
          details and official photo.
        </p>
      </header>

      {positions.length === 0 ? (
        <Panel className="p-0">
          <EmptyState
            icon={Building2}
            title="Organizational chart not yet published"
            description="The barangay has not published its organizational chart yet. Please check back later."
          />
        </Panel>
      ) : (
        <div className="grid gap-5">
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between border-b border-line-soft pb-3">
              <h2 className="text-sm font-semibold tracking-tight text-ink-strong">
                Published Positions
              </h2>
              <span className="text-xs font-medium text-ink-faint tnum">
                {positions.length} position{positions.length === 1 ? "" : "s"}
              </span>
            </div>

            <BarangayOrgChart
              tree={tree}
              selectedId={selectedId}
              onSelect={(position) => setSelectedId(position.id)}
            />
          </div>

          <Panel className="h-fit p-0">
            <PanelContent className="space-y-5">
              {selected ? (
                <PositionDetails position={selected} />
              ) : (
                <EmptyState
                  icon={UsersRound}
                  title="Select a position"
                  description="Choose any position in the chart to see its official photo and reporting structure."
                  className="py-6"
                />
              )}

              <p className="border-t border-line-soft pt-4 text-[11px] leading-relaxed text-ink-faint">
                Only positions published by barangay staff appear here. No personal information is
                displayed unless an official photo is on file.
              </p>
            </PanelContent>
          </Panel>
        </div>
      )}

      <p className="text-center text-[11px] text-ink-faint">Viewed as {resident.fullName}</p>
    </div>
  )
}

function PositionDetails({ position }: { position: OrgChartNode }) {
  const name = position.assignedPerson?.trim()

  return (
    <div>
      <div className="flex justify-center">
        <OrgChartAvatar position={position} className="size-24 border text-lg" />
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
          Published Position
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-ink-strong">
          {position.title}
        </h2>
        <p className="mt-1 text-sm font-medium text-ink-strong">
          {name || <span className="text-ink-faint italic">Vacant</span>}
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          {position.photo
            ? "Official photo on file."
            : "No official photo is on file for this position."}
        </p>
      </div>

      {position.children.length > 0 && (
        <div className="mt-5 border-t border-line-soft pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            Directly under this position
          </p>
          <ul className="mt-2 space-y-1.5">
            {position.children.map((child) => (
              <li key={child.id} className="flex items-start gap-2 text-xs text-ink-muted">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                <span>
                  <span className="font-medium text-ink-strong">{child.title}</span>
                  {" — "}
                  {child.assignedPerson?.trim() || (
                    <span className="text-ink-faint italic">Vacant</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}


