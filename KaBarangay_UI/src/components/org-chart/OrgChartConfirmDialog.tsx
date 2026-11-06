import { Archive, Globe, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { OrgChartPosition } from "@/mock/orgChart"

/** The three controlled actions the backend exposes for a position. */
export type OrgChartAction = "publish" | "archive" | "delete"

export type OrgChartActionRequest = {
  action: OrgChartAction
  position: OrgChartPosition
}

const actionCopy: Record<
  OrgChartAction,
  { heading: string; confirmLabel: string; destructive: boolean; icon: typeof Globe }
> = {
  publish: {
    heading: "Publish position?",
    confirmLabel: "Publish",
    destructive: false,
    icon: Globe,
  },
  archive: {
    heading: "Archive position?",
    confirmLabel: "Archive",
    destructive: false,
    icon: Archive,
  },
  delete: {
    heading: "Delete position?",
    confirmLabel: "Delete",
    destructive: true,
    icon: Trash2,
  },
}

/** The question the backend asks through `window.confirm`, kept verbatim. */
export function orgChartActionQuestion(action: OrgChartAction, title: string): string {
  switch (action) {
    case "publish":
      return `Publish "${title}" to the resident organizational chart?`
    case "archive":
      return `Archive "${title}"? It will be hidden from residents.`
    case "delete":
      return `Delete "${title}"? This cannot be undone.`
  }
}

type Props = {
  request: OrgChartActionRequest | null
  /** Extra context shown under the question — the leaf-only delete hint. */
  note?: string
  busy: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export default function OrgChartConfirmDialog({ request, note, busy, onOpenChange, onConfirm }: Props) {
  const action = request?.action
  const Icon = action ? actionCopy[action].icon : Globe

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action ? actionCopy[action].heading : "Position action"}</DialogTitle>
          <DialogDescription>
            {request
              ? orgChartActionQuestion(request.action, request.position.title)
              : "Select a position to continue."}
          </DialogDescription>
        </DialogHeader>

        {note && (
          <p className="rounded-lg border border-line-soft bg-canvas/60 px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted">
            {note}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" className="bg-surface" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={action && actionCopy[action].destructive ? "destructive" : "default"}
            className={action === "archive" ? "bg-warning text-white hover:bg-warning/90" : undefined}
            disabled={busy}
            onClick={onConfirm}
          >
            <Icon className="size-4" />
            {action ? actionCopy[action].confirmLabel : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
