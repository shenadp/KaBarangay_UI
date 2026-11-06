import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
} from "lucide-react"

import { Meta, Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { SectorDesk } from "@/config/sectorDesks"
import { submissionTypeLabel, type SectorResident } from "@/mock/sectorDesks"

const residencyProofLabel = "Barangay Residency Certification / Valid ID"

function formatFileSize(file: File | null): string {
  if (!file) return "—"
  const kb = file.size / 1024
  return kb < 1 ? `${file.size} B` : `${Math.round(kb)} KB`
}

type IntakeDocument = {
  key: "sector_proof" | "valid_id"
  label: string
  hint: string
  file: File | null
}

const acceptedFormats = "PDF, JPG or PNG · max 10 MB"

function isAccepted(file: File): boolean {
  const okType = ["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(
    file.type.toLowerCase(),
  )
  return okType && file.size <= 10 * 1024 * 1024
}

export default function DeskApplicationCreate({ desk }: { desk: SectorDesk }) {
  const intakeDocuments = useMemo<IntakeDocument[]>(
    () => [
      {
        key: "sector_proof",
        label: desk.proofLabel,
        hint: desk.proofHint,
        file: null,
      },
      {
        key: "valid_id",
        label: residencyProofLabel,
        hint: desk.validIdHint,
        file: null,
      },
    ],
    [desk.proofLabel, desk.proofHint, desk.validIdHint],
  )

  const placeholderResident = desk.residents[0]?.residentNumber ?? "BSI-RES-000001"

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [identifier, setIdentifier] = useState("")
  const [resident, setResident] = useState<SectorResident | null>(null)
  const [lookupError, setLookupError] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [documents, setDocuments] = useState<IntakeDocument[]>(() => intakeDocuments)
  const [notes, setNotes] = useState("")
  const [detailValues, setDetailValues] = useState<string[]>(() =>
    desk.detailFields.map(() => ""),
  )
  const [documentError, setDocumentError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [reference, setReference] = useState("")

  const alreadyMember =
    resident !== null &&
    resident.sectors.includes(desk.memberTag) &&
    resident.status === "Active"

  const verifyResident = () => {
    const needle = identifier.trim().toUpperCase()
    if (!needle) {
      setLookupError("Scan a resident QR code or type a resident ID to continue.")
      setResident(null)
      setConfirmed(false)
      return
    }
    const match = desk.residents.find(
      (entry) =>
        entry.residentNumber.toUpperCase() === needle || String(entry.id) === needle,
    )
    if (!match) {
      setLookupError(`No active resident record matches ${needle}.`)
      setResident(null)
      setConfirmed(false)
      return
    }
    setLookupError("")
    setResident(match)
    setConfirmed(false)
  }

  const setDocument = (key: IntakeDocument["key"], file: File | null) => {
    setDocuments((current) =>
      current.map((document) => (document.key === key ? { ...document, file } : document)),
    )
    if (file && !isAccepted(file)) {
      setDocumentError(`${file.name} was skipped — ${acceptedFormats}.`)
      setDocuments((current) =>
        current.map((document) =>
          document.key === key ? { ...document, file: null } : document,
        ),
      )
      return
    }
    setDocumentError("")
  }

  const setDetailValue = (index: number, value: string) =>
    setDetailValues((current) =>
      current.map((entry, position) => (position === index ? value : entry)),
    )

  const staffReviewNotes = () => {
    const details = desk.detailFields
      .map((field, index) => {
        const value = (detailValues[index] ?? "").trim()
        return value ? `${field.label}: ${value}` : ""
      })
      .filter(Boolean)
      .join(" ")
    return details || notes.trim()
  }

  const submit = () => {
    if (documents.some((document) => document.file === null)) {
      setDocumentError("Attach both required proofs before submitting the application.")
      return
    }
    setDocumentError("")
    setSubmitting(true)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      if (!resident) return
      const id = desk.store.nextApplicationId()
      const tracking = desk.store.nextTrackingNumber()
      const remarks = staffReviewNotes()
      desk.store.recordIntake({
        id,
        trackingNumber: tracking,
        residentId: resident.id,
        residentNumber: resident.residentNumber,
        applicantName: resident.fullName,
        purok: resident.purok,
        submissionType: "staff_assisted",
        submittedByName: desk.officerName,
        status: "pending_staff_review",
        submittedAt: desk.todayIso,
        staffChecklistCompleted: false,
        staffReviewNotes: remarks || undefined,
        documents: documents.map((document, index) => ({
          id: id * 100 + index + 1,
          title: `${desk.proofTitlePrefix} #${index + 1}`,
          type: document.key,
          fileName: document.file?.name ?? "document",
          fileSize: formatFileSize(document.file),
          verificationStatus: "Pending",
        })),
      })
      setReference(tracking)
      setSubmitting(false)
      setStep(3)
    }, 700)
  }

  const reset = () => {
    setStep(1)
    setIdentifier("")
    setResident(null)
    setLookupError("")
    setConfirmed(false)
    setDocuments(intakeDocuments)
    setDocumentError("")
    setNotes("")
    setDetailValues(desk.detailFields.map(() => ""))
    setReference("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
            {desk.intakeEyebrow}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink-strong">
            {step === 3 ? "Application Intake Completed" : desk.intakeHeading}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {step === 1 && "Step 1 of 2 — identify and verify the resident before encoding the filing."}
            {step === 2 && "Step 2 of 2 — attach the sector proofs and record the staff intake notes."}
            {step === 3 && `Tracking number ${reference} has been queued for completeness review.`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-9 bg-surface" asChild>
          <Link to={`${desk.basePath}/applications`}>
            <ArrowLeft className="size-4" /> Back to Applications
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Resident identification" },
          { n: 2, label: "Details & documents" },
        ].map((stage, index) => {
          const done = step > stage.n
          const active = step === stage.n
          return (
            <div key={stage.n} className="flex items-center gap-2">
              {index > 0 && <span className="h-px w-8 bg-line-soft" />}
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                  active
                    ? "bg-brand-soft text-brand"
                    : done
                      ? "bg-success-soft text-success"
                      : "bg-canvas text-ink-muted",
                )}
              >
                <span className="tnum">{done ? "✓" : stage.n}</span>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      {step === 1 && (
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Resident Identification &amp; Verification</PanelTitle>
              <PanelDescription>
                Match the walk-in resident against the barangay register before filing.
              </PanelDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-medium text-success">
              <ScanLine className="size-3.5" /> USB / Bluetooth scanner ready
            </span>
          </PanelHeader>

          <PanelContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="space-y-2">
                <label htmlFor="resident-lookup" className="text-sm font-medium text-ink-strong">
                  Scan Resident QR Code or Type Resident ID
                </label>
                <Input
                  id="resident-lookup"
                  value={identifier}
                  onChange={(event) => {
                    setIdentifier(event.target.value)
                    setLookupError("")
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      verifyResident()
                    }
                  }}
                  placeholder={placeholderResident}
                  className="h-10 bg-surface tnum"
                />
              </div>
              <Button className="h-10 sm:mt-6" onClick={verifyResident}>
                <ShieldCheck className="size-4" /> Verify Resident
              </Button>
            </div>

            {lookupError && (
              <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-surface px-3.5 py-3 text-[13px] text-destructive">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                {lookupError}
              </p>
            )}

            {resident && (
              <div className="rounded-xl border border-line-soft bg-canvas/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-strong">{resident.fullName}</p>
                    <p className="mt-0.5 text-xs text-ink-muted tnum">{resident.residentNumber}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Barangay San Isidro · Purok: {resident.purok.replace("Purok ", "")} · Sex:{" "}
                      {resident.sex}
                    </p>
                  </div>
                  {alreadyMember ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-0.5 text-[11px] font-medium text-warning">
                      <ShieldAlert className="size-3.5" /> {desk.alreadyMemberBadge}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-medium text-success">
                      <ShieldCheck className="size-3.5" /> Active Resident Verified
                    </span>
                  )}
                </div>

                {alreadyMember && (
                  <p className="mt-3 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs leading-relaxed text-warning">
                    {desk.alreadyMemberWarning}
                  </p>
                )}

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-line-soft bg-surface p-3.5">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(checked === true)}
                    className="mt-0.5"
                  />
                  <span className="text-[13px] leading-relaxed text-ink">
                    {desk.confirmStatement}
                  </span>
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
              <p className="text-xs text-ink-faint">
                Verified residents unlock the document intake in the next step.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-surface" asChild>
                  <Link to={`${desk.basePath}/applications`}>Cancel</Link>
                </Button>
                <Button disabled={!resident || !confirmed} onClick={() => setStep(2)}>
                  Continue to documents <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </PanelContent>
        </Panel>
      )}

      {step === 2 && resident && (
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Application Details &amp; Supporting Documents</PanelTitle>
              <PanelDescription>
                Filed for {resident.fullName} ·{" "}
                <span className="tnum">{resident.residentNumber}</span> ·{" "}
                {submissionTypeLabel("staff_assisted")} intake
              </PanelDescription>
            </div>
          </PanelHeader>

          <PanelContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {documents.map((document) => (
                <div
                  key={document.key}
                  className="rounded-xl border border-dashed border-line bg-canvas/60 p-4"
                >
                  <p className="text-[13px] font-semibold text-ink-strong">
                    {document.label} <span className="text-destructive">*</span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{document.hint}</p>
                  <p className="mt-2 text-[11px] text-ink-faint">{acceptedFormats}</p>
                  <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line-soft bg-surface px-3 py-2.5 text-xs text-ink-muted transition-colors hover:border-brand/50">
                    <span className="flex min-w-0 items-center gap-2">
                      <FileUp className="size-4 shrink-0 text-brand" />
                      <span className="truncate">
                        {document.file ? document.file.name : "Choose file"}
                      </span>
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(event) =>
                        setDocument(document.key, event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>
              ))}
            </div>

            {documentError && <p className="text-sm text-destructive">{documentError}</p>}

            <div className="space-y-4">
              {desk.detailFields.map((field, index) => (
                <div key={field.label} className="space-y-2">
                  <label
                    htmlFor={`intake-detail-${index}`}
                    className="text-sm font-medium text-ink-strong"
                  >
                    {field.label} <span className="text-ink-faint">(optional)</span>
                  </label>
                  <Input
                    id={`intake-detail-${index}`}
                    value={detailValues[index] ?? ""}
                    onChange={(event) => setDetailValue(index, event.target.value)}
                    placeholder={field.placeholder}
                    className="h-10 bg-surface"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label htmlFor="intake-notes" className="text-sm font-medium text-ink-strong">
                Staff Intake Notes &amp; Initial Remarks <span className="text-ink-faint">(optional)</span>
              </label>
              <Textarea
                id="intake-notes"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Documents presented at the counter, applicant remarks, endorsements…"
              />
            </div>

            <div className="grid gap-4 rounded-xl border border-line-soft bg-canvas/60 p-4 sm:grid-cols-3">
              <Meta label="Resident ID">
                <span className="tnum">{resident.residentNumber}</span>
              </Meta>
              <Meta label="Purok">{resident.purok}</Meta>
              <Meta label="Intake officer">{desk.officerName}</Meta>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
              <Button variant="outline" className="bg-surface" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4" /> Back to identification
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-surface" asChild>
                  <Link to={`${desk.basePath}/applications`}>Cancel</Link>
                </Button>
                <Button disabled={submitting} onClick={submit}>
                  {submitting ? "Submitting…" : "Submit Application for Review"}
                </Button>
              </div>
            </div>
          </PanelContent>
        </Panel>
      )}

      {step === 3 && (
        <Panel>
          <PanelContent className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="size-7" />
            </span>
            <div className="space-y-1">
              <p className="text-base font-semibold tracking-tight text-ink-strong">
                Application Intake Completed
              </p>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-muted">
                {resident?.fullName} was filed as {reference} and is now queued for the staff
                completeness review.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button variant="outline" className="bg-surface" onClick={reset}>
                <UserPlus className="size-4" /> Process Another Resident
              </Button>
              <Button asChild>
                <Link to={`${desk.basePath}/applications`}>
                  View Applications Queue <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </PanelContent>
        </Panel>
      )}
    </div>
  )
}
