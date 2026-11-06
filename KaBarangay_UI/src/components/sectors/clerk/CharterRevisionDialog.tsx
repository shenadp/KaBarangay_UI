import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CharterFileField from "@/components/sectors/clerk/CharterFileField"
import { charterCopy, type CharterUploadedFile } from "@/mock/clerk/charter"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (file: CharterUploadedFile) => void
}

/** "Upload Replacement Document" modal — always produces an unreleased draft. */
export default function CharterRevisionDialog({ open, onOpenChange, onSubmit }: Props) {
  const [document, setDocument] = useState<CharterUploadedFile | null>(null)
  const [error, setError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setDocument(null)
    setError(undefined)
    setSubmitting(false)
  }

  const submit = () => {
    if (!document) {
      setError("Choose the replacement PDF first.")
      return
    }
    setSubmitting(true)
    // UI-only: the backend integration replaces this timeout.
    window.setTimeout(() => {
      onSubmit(document)
      reset()
      onOpenChange(false)
    }, 500)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Replacement Document</DialogTitle>
          <DialogDescription>The new PDF becomes an unreleased draft revision.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-xl border border-line-soft bg-info-soft px-3.5 py-3 text-xs leading-relaxed text-info">
            {charterCopy.safeVersioning}
          </div>

          <CharterFileField
            label="New PDF Document *"
            helper="PDF only. Max 2 MB per runtime limit."
            value={document}
            error={error}
            onPick={(file) => {
              setDocument(file)
              if (file) setError(undefined)
            }}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="bg-surface" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={submit}>
            {submitting ? "Uploading…" : "Upload Revision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
