import { Archive, Globe, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import OrgChartAvatar from "./OrgChartAvatar"
import OrgChartStatusBadge from "./OrgChartStatusBadge"
import { formatOrgChartDate, type OrgChartPosition } from "@/mock/orgChart"

/** Cumulative indent per tree level — the flat equivalent of nesting the rows. */
const indents = ["ml-0", "ml-3 sm:ml-5", "ml-6 sm:ml-10", "ml-9 sm:ml-15", "ml-12 sm:ml-20"]

type Props = {
  position: OrgChartPosition
  depth: number
  childCount: number
  onEdit: (position: OrgChartPosition) => void
  onPublish: (position: OrgChartPosition) => void
  onArchive: (position: OrgChartPosition) => void
  onDelete: (position: OrgChartPosition) => void
}

/**
 * One row of the "Position Structure" list. The actions follow the controller:
 * publishing is offered unless the row is already published, archiving unless it
 * is already archived, and a hard delete only for a leaf position.
 */
export default function OrgChartPositionCard({
  position,
  depth,
  childCount,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
}: Props) {
  const isLeaf = childCount === 0

  return (
    <div
      className={cn(
        indents[Math.min(depth, indents.length - 1)],
        depth > 0 && "border-l border-line-soft pl-3 sm:pl-5",
      )}
    >
      <article className="rounded-xl border border-line-soft bg-surface p-3 shadow-card sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <OrgChartAvatar position={position} />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-ink-strong">{position.title}</h3>
                <OrgChartStatusBadge status={position.status} />
              </div>

              <p className="mt-0.5 text-xs font-medium text-ink">
                {position.assignedPerson ? (
                  position.assignedPerson
                ) : (
                  <span className="text-ink-faint italic">Vacant</span>
                )}
              </p>

              <p className="mt-1 text-[11px] text-ink-faint">
                {position.photo ? "Official photo on file" : "No photo on file"}
                {" · "}
                Updated <span className="tnum">{formatOrgChartDate(position.updatedAt)}</span>
              </p>

              {!isLeaf && (
                <p className="mt-1 text-[11px] text-ink-faint tnum">
                  {childCount} position{childCount === 1 ? "" : "s"} reporting here
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="xs" variant="outline" className="bg-surface" onClick={() => onEdit(position)}>
              <Pencil className="size-3.5" /> Edit
            </Button>

            {position.status !== "published" && (
              <Button size="xs" onClick={() => onPublish(position)}>
                <Globe className="size-3.5" />
                {position.status === "archived" ? "Republish" : "Publish"}
              </Button>
            )}

            {position.status !== "archived" && (
              <Button
                size="xs"
                variant="outline"
                className="border-transparent bg-warning-soft text-warning hover:bg-warning-soft/70"
                onClick={() => onArchive(position)}
              >
                <Archive className="size-3.5" /> Archive
              </Button>
            )}

            {/* Disabled buttons swallow their own tooltips, so the hint lives on the wrapper. */}
            <span
              className="inline-flex"
              title={isLeaf ? "Delete position" : "Reassign or remove child positions first."}
            >
              <Button
                size="xs"
                variant="outline"
                className="border-transparent bg-canvas text-destructive hover:bg-canvas/80"
                disabled={!isLeaf}
                onClick={() => onDelete(position)}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </span>
          </div>
        </div>
      </article>
    </div>
  )
}
