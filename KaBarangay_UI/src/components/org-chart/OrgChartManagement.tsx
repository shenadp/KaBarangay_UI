/**
 * The one `OrgChart/Management` page the backend renders for both portals.
 * The Admin and Clerk controllers both render it through the shared
 * `ManagesOrgChart` concern, so the portal changes only the surrounding chrome —
 * layout, `user.department` and the endpoint the form posts to. This body keeps
 * one copy of everything else and takes the portal for the header label alone.
 * Both desks edit the same rows because every query is scoped to the signed-in
 * user's `barangay_id`.
 */
import { useMemo, useState } from "react"
import { Archive, Building2, Globe, NotebookPen, Plus, X } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import OrgChartConfirmDialog, {
  type OrgChartAction,
  type OrgChartActionRequest,
} from "./OrgChartConfirmDialog"
import OrgChartPositionCard from "./OrgChartPositionCard"
import OrgChartPositionDialog, {
  type OrgChartPositionDraft,
} from "./OrgChartPositionDialog"
import OrgChartTree from "./OrgChartTree"
import {
  buildOrgChartTree,
  orgChartStore,
  flattenOrgChartTree,
  orgChartStatsOf,
  orgChartStatusLabel,
  type OrgChartPosition,
  type OrgChartStatus,
} from "@/mock/orgChart"

/** The backend flashes these through `session('flash')`; here they are local state. */
type Flash = { text: string; tone: "success" | "error" }

const flashStyles: Record<Flash["tone"], string> = {
  success: "border-line-soft bg-success-soft text-success",
  error: "border-line bg-canvas text-destructive",
}

const actionFlash: Record<Exclude<OrgChartAction, "delete">, string> = {
  publish: "Position published to the resident chart.",
  archive: "Position archived and hidden from residents.",
}

const actionNote: Record<OrgChartAction, string> = {
  publish: "Only published positions appear on the resident organizational chart.",
  archive: "The position stays in this chart for staff and is hidden from residents.",
  delete: "Deletion is permanent, and only a position with nothing reporting to it can be deleted.",
}

export type OrgChartPortal = "admin" | "clerk"

/** The reference's `ucfirst($this->portal())`, shown here as the header eyebrow. */
const portalEyebrow: Record<OrgChartPortal, string> = {
  admin: "Admin",
  clerk: "Office of the Barangay Clerk",
}

export default function OrgChartManagement({ portal }: { portal: OrgChartPortal }) {
  const [positions, setPositions] = useState<OrgChartPosition[]>(() => orgChartStore.list())
  const [statusTab, setStatusTab] = useState<"all" | OrgChartStatus>("all")
  const [flash, setFlash] = useState<Flash | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  /** A snapshot taken when the form opens, so the dialog keeps stable defaults. */
  const [editing, setEditing] = useState<OrgChartPosition | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [actionRequest, setActionRequest] = useState<OrgChartActionRequest | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  const tree = useMemo(() => buildOrgChartTree(positions), [positions])
  const rows = useMemo(() => flattenOrgChartTree(tree), [tree])
  const stats = useMemo(() => orgChartStatsOf(positions), [positions])

  const editingId = editing?.id ?? null
  const blockedParentIds = useMemo(
    () => orgChartStore.blockedParentIds(editingId),
    [positions, editingId],
  )
  const parentOptions = useMemo(
    () => orgChartStore.parentOptions(editingId),
    [positions, editingId],
  )

  const visibleRows =
    statusTab === "all" ? rows : rows.filter((row) => row.node.status === statusTab)

  /** The store owns the chart, so every mutation is followed by a re-read. */
  const sync = () => setPositions(orgChartStore.list())

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (position: OrgChartPosition) => {
    setEditing(orgChartStore.byId(position.id) ?? position)
    setDialogOpen(true)
  }

  const submitDraft = (draft: OrgChartPositionDraft) => {
    setSubmitting(true)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      if (editing) {
        orgChartStore.update(editing.id, draft)
        setFlash({ text: "Position updated and returned to draft for review.", tone: "success" })
      } else {
        orgChartStore.createDraft(draft)
        setFlash({ text: "Position saved as a draft.", tone: "success" })
      }
      sync()
      setSubmitting(false)
      setDialogOpen(false)
      setEditing(null)
    }, 500)
  }

  const runAction = () => {
    if (!actionRequest) return
    const { action, position } = actionRequest

    setActionBusy(true)
    window.setTimeout(() => {
      if (action === "delete") {
        // The controller refuses a delete while children still hang off the row.
        setFlash(
          orgChartStore.remove(position.id)
            ? { text: "Position deleted.", tone: "success" }
            : {
                text: "This position cannot be deleted while it has child positions.",
                tone: "error",
              },
        )
      } else {
        if (action === "publish") orgChartStore.publish(position.id)
        else orgChartStore.archive(position.id)
        setFlash({ text: actionFlash[action], tone: "success" })
      }

      sync()
      setActionBusy(false)
      setActionRequest(null)
    }, 400)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={portalEyebrow[portal]}
        title="Organizational Chart"
        description="Maintain the barangay position structure, photos, and published resident chart."
        actions={
          <Button size="sm" className="h-9" onClick={openCreate}>
            <Plus className="size-4" /> Add position
          </Button>
        }
      />

      {flash && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${flashStyles[flash.tone]}`}
        >
          <span>{flash.text}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setFlash(null)}
            className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Total positions"
          value={stats.total}
          hint="Across every branch of the chart"
        />
        <StatCard
          icon={NotebookPen}
          label="Drafts"
          value={stats.draft}
          tone="neutral"
          hint="Not visible to residents yet"
        />
        <StatCard
          icon={Globe}
          label="Published"
          value={stats.published}
          hint="Live on the resident chart"
        />
        <StatCard
          icon={Archive}
          label="Archived"
          value={stats.archived}
          tone="neutral"
          hint="Hidden from residents"
        />
      </div>

      {rows.length > 0 && (
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Chart view</PanelTitle>
              <PanelDescription>
                Select a position on the chart to edit it — scroll sideways to follow every branch.
              </PanelDescription>
            </div>
            <span className="text-xs text-ink-faint tnum">
              {stats.published} of {stats.total} published
            </span>
          </PanelHeader>
          <PanelContent>
            <OrgChartTree nodes={tree} selectedId={editingId} onSelect={openEdit} />
          </PanelContent>
        </Panel>
      )}

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Position Structure</PanelTitle>
            <PanelDescription>
              Saving a published position returns it to draft so changes can be reviewed before
              republishing.
            </PanelDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedTabs
              value={statusTab}
              onChange={(value) => setStatusTab(value as "all" | OrgChartStatus)}
              segments={[
                { label: "All", value: "all", count: stats.total },
                { label: "Draft", value: "draft", count: stats.draft },
                { label: "Published", value: "published", count: stats.published },
                { label: "Archived", value: "archived", count: stats.archived },
              ]}
            />
            <span className="text-xs text-ink-faint tnum">
              {stats.total} position{stats.total === 1 ? "" : "s"}
            </span>
          </div>
        </PanelHeader>

        <PanelContent className="space-y-3">
          {rows.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No positions yet"
              description="Add the first position to begin building the barangay organizational chart."
              action={
                <Button size="sm" className="mt-1" onClick={openCreate}>
                  <Plus className="size-4" /> Add position
                </Button>
              }
            />
          ) : visibleRows.length === 0 ? (
            <EmptyState
              icon={NotebookPen}
              title={`No ${orgChartStatusLabel[statusTab as OrgChartStatus].toLowerCase()} positions`}
              description="Switch back to All to review the whole chart."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 bg-surface"
                  onClick={() => setStatusTab("all")}
                >
                  Show all positions
                </Button>
              }
            />
          ) : (
            visibleRows.map(({ node, depth }) => (
              <OrgChartPositionCard
                key={node.id}
                position={node}
                depth={depth}
                childCount={node.children.length}
                onEdit={openEdit}
                onPublish={(position) => setActionRequest({ action: "publish", position })}
                onArchive={(position) => setActionRequest({ action: "archive", position })}
                onDelete={(position) => setActionRequest({ action: "delete", position })}
              />
            ))
          )}
        </PanelContent>
      </Panel>

      <OrgChartPositionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        position={editing}
        parentOptions={parentOptions}
        blockedParentIds={blockedParentIds}
        submitting={submitting}
        onSubmit={submitDraft}
      />

      <OrgChartConfirmDialog
        request={actionRequest}
        note={actionRequest ? actionNote[actionRequest.action] : undefined}
        busy={actionBusy}
        onOpenChange={(open) => {
          if (!open) setActionRequest(null)
        }}
        onConfirm={runAction}
      />
    </div>
  )
}
