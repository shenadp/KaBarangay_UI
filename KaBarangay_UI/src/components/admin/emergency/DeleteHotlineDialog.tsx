import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { emergencyDirectory, type ContactItem } from "@/mock/admin/emergency"

type Props = {
  contact: ContactItem | null
  onOpenChange: (open: boolean) => void
  onDeleted: (message: string) => void
}

/** Deletion is permanent — the reference has no archive state for a hotline. */
export default function DeleteHotlineDialog({ contact, onOpenChange, onDeleted }: Props) {
  const [busy, setBusy] = useState(false)

  return (
    <Dialog
      open={contact !== null}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Barangay Hotline</DialogTitle>
          <DialogDescription>
            {contact && (
              <>
                Are you sure you want to delete <strong>{contact.name}</strong> (
                {contact.phoneNumber})? Residents will no longer see this barangay hotline.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => {
              if (!contact) return

              // UI-only: the backend integration replaces this delay.
              setBusy(true)
              window.setTimeout(() => {
                const result = emergencyDirectory.destroy(contact.id)
                setBusy(false)

                if (result.ok) {
                  onDeleted(result.message)
                  onOpenChange(false)
                }
              }, 500)
            }}
          >
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Deleting…" : "Yes, Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
