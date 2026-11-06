import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight, BadgeCheck, FilePlus2, HandCoins, PlayCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DetailFieldInputs,
  DetailRowTable,
  SectionLabel,
  hasDetailErrors,
  validateDetailValues,
  type DetailErrors,
} from "@/components/sectors/clerk/CertificateDetailFields"
import type {
  CertificateFlash,
  CertificateFlashTone,
} from "@/components/sectors/clerk/CertificateStatus"
import {
  certificateCopy,
  clerkCertificateStore,
  detailFieldsForType,
  detailRowsFor,
  formatIsoDate,
  type CertificateAction,
  type CertificateIssuanceRecord,
  type CertificateRequestRecord,
  type CertificateStatus,
} from "@/mock/clerk/certificates"
import { peso } from "@/mock/resident"

/**
 * The request workflow shared by the list dialog and the detail page, so both
 * surfaces expose exactly the same moves and both write through the store.
 */
export default function CertificateWorkflow({
  request,
  issuance,
  onGenerate,
  onChanged,
  onFeedback,
}: {
  request: CertificateRequestRecord
  issuance: CertificateIssuanceRecord | null
  onGenerate: (request: CertificateRequestRecord) => void
  onChanged: () => void
  onFeedback: (flash: CertificateFlash) => void
}) {
  const fields = detailFieldsForType(request.certificateType)
  const allowedStatuses = clerkCertificateStore.allowedStatuses(request.status)

  const [statusDraft, setStatusDraft] = useState<string>(allowedStatuses[0] ?? request.status)
  const [noteDraft, setNoteDraft] = useState(request.adminNote ?? "")
  const [detailDraft, setDetailDraft] = useState<Record<string, string>>(request.detailValues)
  const [detailErrors, setDetailErrors] = useState<DetailErrors>({})
  const [confirmRelease, setConfirmRelease] = useState(false)
  const [busy, setBusy] = useState(false)

  // A write from another surface replaces the drafts, but never mid-submit.
  useEffect(() => {
    if (busy) return
    setStatusDraft(clerkCertificateStore.allowedStatuses(request.status)[0] ?? request.status)
    setNoteDraft(request.adminNote ?? "")
    setDetailDraft(request.detailValues)
    setConfirmRelease(false)
  }, [request.id, request.status, request.adminNote, request.detailValues, request.reviewedAt, busy])

  const run = (action: () => CertificateAction, tone: CertificateFlashTone = "success") => {
    if (busy) return
    setBusy(true)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      const result = action()
      setBusy(false)
      onFeedback({ text: result.message, tone: result.ok ? tone : "error" })
      if (result.ok) {
        onChanged()
        if (result.status) setStatusDraft(result.status)
        setConfirmRelease(false)
      }
    }, 500)
  }

  const startProcessing = () =>
    run(() => clerkCertificateStore.startProcessing(request.id, noteDraft))

  const saveStatus = () =>
    run(() => clerkCertificateStore.setStatus(request.id, statusDraft as CertificateStatus, noteDraft))

  const saveDetails = () => {
    const errors = validateDetailValues(fields, detailDraft)
    setDetailErrors(errors)
    if (hasDetailErrors(errors)) {
      onFeedback({ text: "Correct the highlighted details before saving.", tone: "error" })
      return
    }
    run(() => clerkCertificateStore.patchReviewedDetails(request.id, detailDraft))
  }

  const detailsWereRevised = fields.some(
    (field) => (request.detailValues[field.key] ?? "") !== (request.originalDetailValues[field.key] ?? ""),
  )

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-brand/30 bg-canvas/60 p-4">
        <SectionLabel>Workflow Action</SectionLabel>

        {request.status === "Pending" && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-muted">{certificateCopy.pendingReview}</p>
            <Button size="sm" className="h-8 shrink-0" disabled={busy} onClick={startProcessing}>
              <PlayCircle className="size-4" /> {busy ? "Updating…" : "Start Processing"}
            </Button>
          </div>
        )}

        {(request.status === "Processing" || request.status === "Needs Action") && !issuance && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-muted">{certificateCopy.processingReady}</p>
            <Button size="sm" className="h-8 shrink-0" onClick={() => onGenerate(request)}>
              <FilePlus2 className="size-4" /> Issue Certificate
            </Button>
          </div>
        )}

        {request.status === "For Payment" && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-ink-strong tnum">
                Fee Due: {peso(request.fee)}
              </p>
              <p className="text-[11px] text-ink-muted">{certificateCopy.paymentHint}</p>
            </div>
            <Button size="sm" className="h-8 shrink-0" disabled={busy} onClick={() => run(() => clerkCertificateStore.confirmPayment(request.id, noteDraft))}>
              <HandCoins className="size-4" /> {busy ? "Confirming…" : "Confirm Payment Received"}
            </Button>
          </div>
        )}

        {request.status === "Ready for Claim" && (
          <div className="space-y-2">
            <p className="text-xs text-ink-muted">{certificateCopy.readyForClaim}</p>
            {!confirmRelease ? (
              <Button size="sm" className="h-8" onClick={() => setConfirmRelease(true)}>
                <BadgeCheck className="size-4" /> Confirm Physical Handover (Release)
              </Button>
            ) : (
              <div className="space-y-2 rounded-lg border border-warning/40 bg-warning-soft p-3">
                <p className="text-xs font-medium text-warning">{certificateCopy.releaseQuestion}</p>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8" disabled={busy} onClick={() => run(() => clerkCertificateStore.confirmRelease(request.id, noteDraft))}>
                    {busy ? "Releasing…" : "Yes, Confirm Handover"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 bg-surface"
                    onClick={() => setConfirmRelease(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {request.status === "Released" && (
          <p className="flex items-center gap-2 text-xs font-medium text-success">
            <BadgeCheck className="size-4" /> {certificateCopy.released}
          </p>
        )}

        {request.status === "Rejected" && (
          <p className="flex items-center gap-2 text-xs font-medium text-destructive">
            <XCircle className="size-4" /> {certificateCopy.rejected}
          </p>
        )}

        {issuance && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line-soft bg-surface px-3 py-2">
            <p className="text-[11px] text-ink-muted">
              Issued as{" "}
              <span className="font-mono text-ink-strong">{issuance.reference}</span> · Control No.{" "}
              <span className="font-mono text-ink-strong tnum">{issuance.controlNo}</span>
            </p>
            <Button variant="outline" size="xs" className="bg-surface" asChild>
              <Link to={`/clerk/certificates/iss-${issuance.id}`}>
                Issued record <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-line-soft bg-canvas/60 p-4">
        <SectionLabel>Processing Status</SectionLabel>
        <div className="space-y-3">
          <Select value={statusDraft} onValueChange={setStatusDraft}>
            <SelectTrigger className="w-full bg-surface" aria-label="Certificate request status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            rows={2}
            aria-label="Note shown to the resident"
            placeholder={
              statusDraft === "Rejected"
                ? "Reason for rejection (required)"
                : "Optional note shown to the resident"
            }
            className="bg-surface"
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
          />

          <Button size="sm" className="h-8" disabled={busy || statusDraft === ""} onClick={saveStatus}>
            {busy ? "Saving…" : "Save Status"}
          </Button>

          <p className="text-[11px] leading-relaxed text-ink-faint">
            For Payment, Ready for Claim and Released are set by the workflow itself, never by this
            select.
          </p>
        </div>
      </section>

      {fields.length > 0 && (
        <section>
          <SectionLabel>Reviewed Certificate Details</SectionLabel>
          <div className="rounded-xl border border-line-soft bg-surface p-4">
            <DetailFieldInputs
              fields={fields}
              values={detailDraft}
              errors={detailErrors}
              onChange={(key, value) =>
                setDetailDraft((current) => ({ ...current, [key]: value }))
              }
            />
            <Button size="sm" className="mt-3 h-8" disabled={busy} onClick={saveDetails}>
              {busy ? "Saving…" : "Save Details"}
            </Button>
          </div>

          {detailsWereRevised && (
            <div className="mt-3 rounded-xl border border-line-soft bg-canvas/60 p-4">
              <SectionLabel>Originally Submitted</SectionLabel>
              <DetailRowTable rows={detailRowsFor(request.certificateType, request.originalDetailValues)} />
            </div>
          )}
        </section>
      )}

      {fields.length === 0 && (
        <section>
          <SectionLabel>Certificate Details</SectionLabel>
          <DetailRowTable
            rows={[
              { label: "Resident", value: request.residentName },
              { label: "Resident No.", value: request.residentNumber ?? "—" },
              { label: "Purok", value: request.purok },
              { label: "Purpose", value: request.purpose },
              { label: "Fee", value: peso(request.fee) },
              { label: "Submitted", value: formatIsoDate(request.submittedAt) },
            ]}
          />
        </section>
      )}

      {(request.businessName || request.businessAddress) && (
        <section>
          <SectionLabel>Business</SectionLabel>
          <DetailRowTable
            rows={[
              { label: "Business Name", value: request.businessName ?? "—" },
              { label: "Business Address", value: request.businessAddress ?? "—" },
            ]}
          />
        </section>
      )}

      {request.notes && (
        <section>
          <SectionLabel>Resident Notes</SectionLabel>
          <p className="rounded-xl border border-line-soft bg-canvas/60 p-4 text-sm whitespace-pre-wrap text-ink">
            {request.notes}
          </p>
        </section>
      )}

      {request.adminNote && (
        <section>
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            Desk Note
          </Label>
          <p className="mt-2 rounded-xl border border-line-soft bg-canvas/60 p-4 text-sm whitespace-pre-wrap text-ink">
            {request.adminNote}
          </p>
        </section>
      )}
    </div>
  )
}
