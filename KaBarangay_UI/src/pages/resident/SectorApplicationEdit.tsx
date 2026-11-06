/**
 * Resident portal — correct and resubmit a sector application.
 *
 * `Resident\SectorApplicationController::edit()` renders
 * `resources/js/pages/Resident/SectorApplications/Edit.tsx`; the resubmission
 * rules come from `SectorApplicationService::residentResubmitCorrection()`.
 *
 * UI-only: the resubmit lands in `@/mock/resident/sector-applications` and the
 * success flash rides back to the queue the way Laravel carries it in the session.
 */
import { useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, FileText, Paperclip } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Textarea } from "@/components/ui/textarea"
import {
  applicationForCorrection,
  resubmitCorrection,
  resubmittedFlash,
} from "@/mock/resident/sector-applications"

export default function SectorApplicationEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const application = applicationForCorrection(Number(id))

  const [notes, setNotes] = useState(application?.notes ?? "")
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  if (!application) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Panel className="p-0">
          <EmptyState
            icon={FileText}
            title="Application not available"
            description="This application is not part of your resident record."
            action={
              <Button asChild size="sm" variant="outline" className="mt-1 h-9 bg-surface">
                <Link to="/resident/sector-applications">Back to Sector Memberships</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError("")

    const outcome = resubmitCorrection(application.id, {
      notes,
      files: files.map((file) => ({ name: file.name, size: file.size })),
    })

    setSubmitting(false)

    if (!outcome.ok) {
      setSubmitError(outcome.message)
      return
    }

    navigate("/resident/sector-applications", {
      state: { flash: resubmittedFlash(outcome.trackingNumber) },
    })
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Link
        to="/resident/sector-applications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink-strong"
      >
        <ArrowLeft className="size-4" /> Sector Memberships &amp; Services
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-strong">
          Correct Application #{application.trackingNumber}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Sector: {application.sectorName}</p>
      </div>

      {application.correctionNotes && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft/60 p-4">
          <p className="text-sm font-semibold text-warning">Correction Instructions:</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">
            {application.correctionNotes}
          </p>
        </div>
      )}

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Resubmit for review</PanelTitle>
            <PanelDescription>
              Add what the desk asked for. Your original remarks and documents stay on file.
            </PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-1.5">
              <Label htmlFor="correction-notes">Notes (optional)</Label>
              <Textarea
                id="correction-notes"
                className="min-h-24 bg-surface text-sm"
                placeholder="Add any additional information needed for correction"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="documents">Replace / Add Documents</Label>
              <Input
                id="documents"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="h-10 bg-surface text-sm"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
              <p className="text-xs leading-relaxed text-ink-faint">
                <Paperclip className="mr-1 inline size-3.5" />
                Accepts PDF, JPG or PNG up to 10240 kilobytes each.
              </p>
            </div>

            {application.documents.length > 0 && (
              <div className="grid gap-2">
                <p className="text-sm font-medium text-ink">Existing Documents:</p>
                <ul className="list-inside list-disc space-y-1">
                  {application.documents.map((doc) => (
                    <li key={doc.id} className="text-sm text-ink-muted">
                      {doc.title} ({doc.type})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {submitError && (
              <p className="text-sm leading-relaxed whitespace-pre-line text-destructive">
                {submitError}
              </p>
            )}

            <Button type="submit" className="h-10" disabled={submitting}>
              {submitting ? "Submitting…" : "Resubmit Correction"}
            </Button>
          </form>
        </PanelContent>
      </Panel>
    </div>
  )
}
