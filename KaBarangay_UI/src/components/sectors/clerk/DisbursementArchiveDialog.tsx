import { Archive } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ClerkDisbursementDocument } from "@/mock/clerk/disbursements"

type Props = {
  document: ClerkDisbursementDocument | null
  busy: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

/**
 * Archiving is permanent in the backend — an archived document can never be
 * republished — so both the list and the detail page route it through this
 * confirmation instead of a bare window.confirm.
 */
export default function DisbursementArchiveDialog({ document, busy, onConfirm, onOpenChange }: Props) {
  return (
    <Dialog open={document !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archive document?</DialogTitle>
          <DialogDescription>
            Archive &ldquo;{document?.title}&rdquo;? Residents will no longer see this document.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" className="bg-surface" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={onConfirm}>
            <Archive className="size-4" /> {busy ? "Updating…" : "Archive document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
