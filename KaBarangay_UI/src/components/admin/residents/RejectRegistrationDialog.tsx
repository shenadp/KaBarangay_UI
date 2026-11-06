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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fullNameOf, residentRegistry, type ResidentRegistration } from "@/mock/admin/residents"

const MAX_REASON = 1000

/** The submit gate is the backend's own rule: a note shorter than five characters is no reason. */
const reasonIsInvalid = (reason: string) =>
  reason.trim().length < 5 || reason.trim().length > MAX_REASON

type Props = {
  registration: ResidentRegistration
  onRejected: (message: string) => void
  onClose: () => void
}

export default function RejectRegistrationDialog({ registration, onRejected, onClose }: Props) {
  const [reason, setReason] = useState("")
  const [emailSafeReason, setEmailSafeReason] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = () => {
    if (reasonIsInvalid(reason)) {
      setError("Please enter a clear rejection reason.")
      return
    }

    setBusy(true)
    window.setTimeout(() => {
      const result = residentRegistry.reject(registration.id, reason, emailSafeReason)
      setBusy(false)
      if (!result.ok) {
        setError(result.message)
        return
      }
      onRejected(result.message)
    }, 500)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Registration</DialogTitle>
          <DialogDescription>{fullNameOf(registration)}</DialogDescription>
        </DialogHeader>

        <p className="rounded-lg border border-destructive/30 bg-canvas/60 px-3 py-2.5 text-xs leading-relaxed text-destructive">
          The internal review note is required and visible to authorized staff. The separate
          resident-facing explanation is optional and is the only reason text included in the email.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="rejection-reason">
            Internal review note <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="rejection-reason"
            rows={4}
            maxLength={MAX_REASON}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              if (error) setError("")
            }}
            placeholder="Example: Valid ID is unclear. Please submit a clearer copy."
            aria-invalid={error !== ""}
          />
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium text-destructive">{error}</p>
            <p className="shrink-0 text-[11px] text-ink-faint tnum">{reason.length}/{MAX_REASON}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rejection-email">Resident-facing explanation (optional)</Label>
          <Textarea
            id="rejection-email"
            rows={3}
            maxLength={MAX_REASON}
            value={emailSafeReason}
            onChange={(event) => setEmailSafeReason(event.target.value)}
            placeholder="Write only the explanation appropriate to send to the applicant."
          />
          <p className="text-[11px] text-ink-muted">
            If omitted, the rejection decision is still saved, but no rejection email is sent.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="bg-surface" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy || reasonIsInvalid(reason)}
            onClick={submit}
          >
            {busy ? "Rejecting…" : "Reject Registration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
