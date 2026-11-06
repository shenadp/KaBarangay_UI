import OrgChartAvatar from "./OrgChartAvatar"
import OrgChartStatusBadge from "./OrgChartStatusBadge"
import { cn } from "@/lib/utils"
import { formatOrgChartDate, type OrgChartNode, type OrgChartPosition } from "@/mock/orgChart"

type BranchProps = {
  node: OrgChartNode
  selectedId: number | null
  onSelect: (position: OrgChartPosition) => void
}

/** The horizontal segment that ties a row of siblings to the parent above them. */
function siblingConnector(index: number, total: number): string {
  if (total === 1) return "hidden"
  if (index === 0) return "left-1/2 right-0"
  if (index === total - 1) return "left-0 right-1/2"
  return "left-0 right-0"
}

function ChartNode({
  node,
  active,
  onSelect,
}: {
  node: OrgChartNode
  active: boolean
  onSelect: BranchProps["onSelect"]
}) {
  const isRoot = node.parentId === null

  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      aria-label={`Edit ${node.title}`}
      className={cn(
        "flex w-[190px] shrink-0 flex-col items-center gap-1.5 rounded-xl border bg-surface p-3 text-center shadow-card transition-colors hover:border-brand hover:shadow-raised",
        isRoot ? "border-brand/50 bg-brand-soft/50" : "border-line-soft",
        node.status !== "published" && "bg-canvas/70",
        node.status === "archived" && "opacity-70",
        active && "border-brand ring-1 ring-brand/30",
      )}
    >
      <OrgChartAvatar position={node} size="md" />

      <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink-strong">
        {node.title}
      </span>

      <span
        className={cn(
          "line-clamp-1 text-xs",
          node.assignedPerson ? "text-ink-muted" : "text-ink-faint italic",
        )}
      >
        {node.assignedPerson ?? "Vacant"}
      </span>

      <OrgChartStatusBadge status={node.status} />

      <span className="text-[11px] text-ink-faint tnum">
        {node.children.length > 0
          ? `${node.children.length} direct report${node.children.length === 1 ? "" : "s"}`
          : `Updated ${formatOrgChartDate(node.updatedAt)}`}
      </span>
    </button>
  )
}

/** Recursive branch: the node, a stem, then its children joined by a rail. */
function OrgChartBranch({ node, selectedId, onSelect }: BranchProps) {
  return (
    <div className="flex flex-col items-center">
      <ChartNode node={node} active={selectedId === node.id} onSelect={onSelect} />

      {node.children.length > 0 && (
        <>
          <span aria-hidden="true" className="h-5 w-px bg-line" />
          <div className="flex items-start">
            {node.children.map((child, index) => (
              <div key={child.id} className="relative flex flex-col items-center px-2 pt-5">
                <span
                  aria-hidden="true"
                  className={cn("absolute top-0 h-px bg-line", siblingConnector(index, node.children.length))}
                />
                <span aria-hidden="true" className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-line" />
                <OrgChartBranch node={child} selectedId={selectedId} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * The desk's chart view — the same tree the backend hands to `BarangayOrgChart`,
 * drawn with flex rows and hairline connectors so no diagramming library is
 * needed. Selecting a node opens the edit form for that position.
 */
export default function OrgChartTree({
  nodes,
  selectedId = null,
  onSelect,
}: {
  nodes: OrgChartNode[]
  selectedId?: number | null
  onSelect: (position: OrgChartPosition) => void
}) {
  return (
    <div className="scrollbar-slim overflow-x-auto pb-1">
      <div className="flex min-w-max flex-col items-center gap-8 px-1 py-1">
        {nodes.map((root) => (
          <OrgChartBranch key={root.id} node={root} selectedId={selectedId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
