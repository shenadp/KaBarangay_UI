import { useState } from "react"
import { Check } from "lucide-react"

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
import {
  correctionDocumentLabels,
  correctionFieldLabels,
  residentRegistry,
  type ResidentRegistration,
} from "@/mock/admin/residents"

type Props = {
  registration: ResidentRegistration
  /** Runs the store call and reports the outcome back to this dialog. */
  onSent: (message: string) => void
  onClose: () => void
}

const toggle = (list: string[], key: string) =>
  list.includes(key) ? list.filter((item) => item !== key) : [...list, key]

function CheckRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
        checked
          ? "border-brand bg-brand-soft text-ink-strong"
          : "border-line-soft bg-surface text-ink-muted hover:border-line"
      }`}
    >
      <span
        className={`grid size-4 shrink-0 place-items-center rounded border ${
          checked ? "border-brand bg-brand text-white" : "border-line bg-surface"
        }`}
      >
        {checked && <Check className="size-3" />}
      </span>
      {label}
    </button>
  )
}

export default function CorrectionRequestDialog({ registration, onSent, onClose }: Props) {
  const [instructions, setInstructions] = useState("")
  const [fieldTargets, setFieldTargets] = useState<string[]>([])
  const [documentTargets, setDocumentTargets] = useState<string[]>([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  // Only the labels the backend recognises are offered, in the order it sends them.
  const availableFields = registration.correctionFieldOptions.filter(
    (field) => field in correctionFieldLabels,
  )
  const availableDocuments = registration.correctionDocumentOptions.filter(
    (document) => document in correctionDocumentLabels,
  )

  const submit = () => {
    if (instructions.trim().length === 0) {
      setError("Write the instructions the applicant will see.")
      return
    }

    setBusy(true)
    window.setTimeout(() => {
      const result = residentRegistry.requestCorrection(registration.id, {
        instructions,
        fieldTargets,
        documentTargets,
      })
      setBusy(false)
      if (!result.ok) {
        setError(result.message)
        return
      }
      onSent(result.message)
    }, 500)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Request Applicant Correction</DialogTitle>
          <DialogDescription>
            {`Select only the information or documents this applicant should correct (${registration.reference}).`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="correction-instructions">Instructions for applicant</Label>
          <Textarea
            id="correction-instructions"
            rows={4}
            value={instructions}
            onChange={(event) => {
              setInstructions(event.target.value)
              if (error) setError("")
            }}
            placeholder="Tell the applicant exactly what to fix and how."
            aria-invalid={error !== ""}
          />
          {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-ink-strong">Applicant fields</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {availableFields.map((field) => (
              <CheckRow
                key={field}
                label={correctionFieldLabels[field]}
                checked={fieldTargets.includes(field)}
                onToggle={() => setFieldTargets((current) => toggle(current, field))}
              />
            ))}
          </div>
        </fieldset>

        {availableDocuments.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-ink-strong">Existing documents</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {availableDocuments.map((document) => (
                <CheckRow
                  key={document}
                  label={correctionDocumentLabels[document]}
                  checked={documentTargets.includes(document)}
                  onToggle={() => setDocumentTargets((current) => toggle(current, document))}
                />
              ))}
            </div>
          </fieldset>
        )}

        <p className="rounded-lg border border-line-soft bg-canvas/60 px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted">
          Sectors, Resident identity, account details, QR credentials, and application status cannot
          be changed through this request.
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" className="bg-surface" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={submit}>
            {busy ? "Saving…" : "Send correction request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
