import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  FolderOpen,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatusBadge, { type Tone } from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import { Meta, Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { SectorDesk } from "@/config/sectorDesks"
import {
  applicationStatusLabel,
  formatIsoDate,
  submissionTypeLabel,
  type SectorApplication,
  type SectorApplicationStatus,
} from "@/mock/sectorDesks"

const statusTone: Record<SectorApplicationStatus, Tone> = {
  pending_staff_review: "warning",
  under_admin_review: "info",
  approved: "success",
  rejected: "danger",
  needs_correction: "danger",
}

const documentTone: Record<SectorApplication["documents"][number]["verificationStatus"], Tone> = {
  Verified: "success",
  Pending: "warning",
  Rejected: "danger",
}

type ChecklistKey = "identity" | "residency" | "documents" | "eligibility"

type ChecklistItem = { key: ChecklistKey; label: string }

export default function DeskApplicationDetail({ desk }: { desk: SectorDesk }) {
  const { id } = useParams<{ id: string }>()
  // Two filings share this route, so the checklist and remarks of the previous
  // one would otherwise carry over when the id changes.
  return <ApplicationReview key={id} desk={desk} id={id} />
}

function ApplicationReview({ desk, id }: { desk: SectorDesk; id?: string }) {
  const [applications, setApplications] = useState<SectorApplication[]>(
    () => desk.store.applicationQueue(),
  )
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    identity: true,
    residency: true,
    documents: true,
    eligibility: false,
  })
  const [remarks, setRemarks] = useState(
    () => applications.find((entry) => String(entry.id) === id)?.staffReviewNotes ?? "",
  )
  const [rejectionReason, setRejectionReason] = useState("")
  const [acting, setActing] = useState<"approve" | "reject" | "correction" | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; tone: Tone } | null>(null)

  const checklistItems = useMemo<ChecklistItem[]>(
    () => [
      { key: "identity", label: "Identity matches the active resident register record" },
      { key: "residency", label: "Verified residency in Barangay San Isidro" },
      { key: "documents", label: "Proof of eligibility is legible and complete" },
      { key: "eligibility", label: desk.eligibilityLine },
    ],
    [desk.eligibilityLine],
  )

  // Unknown ids fall back to the first filing so the route never crashes.
  const application = applications.find((entry) => String(entry.id) === id) ?? applications[0]

  const isStaffStage = application.status === "pending_staff_review"
  const isChecked = useMemo(
    () => checklistItems.every((item) => checklist[item.key]),
    [checklist, checklistItems],
  )

  const decide = (
    status: SectorApplicationStatus,
    patch: Partial<SectorApplication>,
    note: string,
    tone: Tone,
  ) => {
    const decided: Partial<SectorApplication> = {
      status,
      reviewedByStaffName: desk.officerName,
      ...patch,
    }
    desk.store.decideApplication(application.id, decided)
    setApplications((current) =>
      current.map((entry) =>
        entry.id === application.id ? { ...entry, ...decided } : entry,
      ),
    )
    setActing(null)
    setFeedback({ text: note, tone })
  }

  const approve = () => {
    if (!isChecked) return
    setActing("approve")
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      decide(
        "under_admin_review",
        {
          staffReviewNotes: remarks.trim() || "Completeness checklist signed off at the desk.",
          staffChecklistCompleted: true,
        },
        desk.approveMessage,
        "success",
      )
    }, 600)
  }

  const requestCorrection = () => {
    if (!remarks.trim()) return
    setActing("correction")
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      decide(
        "needs_correction",
        { staffReviewNotes: remarks.trim(), staffChecklistCompleted: false },
        "Correction request recorded and applicant notified.",
        "info",
      )
    }, 600)
  }

  const confirmReject = () => {
    if (rejectionReason.trim().length < 3) return
    setActing("reject")
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      decide(
        "rejected",
        { staffReviewNotes: rejectionReason.trim(), staffChecklistCompleted: false },
        "Application rejected and the reason recorded.",
        "danger",
      )
      setRejectOpen(false)
      setRejectionReason("")
    }, 600)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={application.trackingNumber}
        title="Staff Completeness Review"
        description="Verify document completeness, residency and sector eligibility before the filing reaches the barangay captain."
        actions={
          <>
            <StatusBadge
              status={applicationStatusLabel(application.status)}
              tone={statusTone[application.status]}
            />
            <Button variant="outline" size="sm" className="h-9 bg-surface" asChild>
              <Link to={`${desk.basePath}/applications`}>
                <ArrowLeft className="size-4" /> Back to Queue
              </Link>
            </Button>
          </>
        }
      />

      {feedback && (
        <p
          className={
            feedback.tone === "success"
              ? "rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
              : feedback.tone === "danger"
                ? "rounded-xl border border-destructive/30 bg-surface px-4 py-3 text-sm text-destructive"
                : "rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-sm text-info"
          }
        >
          {feedback.text}
        </p>
      )}

      {isStaffStage && (
        <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-[13px] leading-relaxed text-warning">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-semibold">Sector Staff Decision Stage:</span> verify document
            completeness, residency, and sector eligibility. Approving this application forwards it
            for the final sector activation — rejections require a recorded reason.
          </span>
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Applicant Information</PanelTitle>
                <PanelDescription>Register record this filing is matched against</PanelDescription>
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand tnum">
                {application.residentNumber}
              </span>
            </PanelHeader>
            <PanelContent className="grid gap-4 sm:grid-cols-3">
              <Meta label="Full name">{application.applicantName}</Meta>
              <Meta label="Resident number">
                <span className="tnum">{application.residentNumber}</span>
              </Meta>
              <Meta label="Purok">{application.purok}</Meta>
              <Meta label="Submission mode">
                {submissionTypeLabel(application.submissionType)}
                {application.submissionType === "staff_assisted" &&
                  ` (${application.submittedByName})`}
              </Meta>
              <Meta label="Date submitted">
                <span className="tnum">{formatIsoDate(application.submittedAt)}</span>
              </Meta>
              <Meta label="Target sector">{desk.sectorPlural}</Meta>
            </PanelContent>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Submitted Proofs &amp; Documents</PanelTitle>
                <PanelDescription>
                  {application.documents.length} file(s) attached at intake
                </PanelDescription>
              </div>
            </PanelHeader>
            {application.documents.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No documents attached"
                description="The applicant has not uploaded any proof yet — request a correction so they can complete the filing."
              />
            ) : (
              <PanelContent className="space-y-3">
                {application.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line-soft bg-canvas/60 p-3.5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink-strong">
                          {document.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-muted tnum">
                          {document.fileName} · {document.fileSize}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" className="h-8 bg-surface" asChild>
                        <a href="#documents" onClick={(event) => event.preventDefault()}>
                          Inspect
                        </a>
                      </Button>
                      <StatusBadge
                        status={document.verificationStatus}
                        tone={documentTone[document.verificationStatus]}
                      />
                    </div>
                  </div>
                ))}
              </PanelContent>
            )}
          </Panel>

          {isStaffStage ? (
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Completeness Checklist</PanelTitle>
                  <PanelDescription>
                    All four checks must be signed before the application can be approved
                  </PanelDescription>
                </div>
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand tnum">
                  {checklistItems.filter((item) => checklist[item.key]).length} of{" "}
                  {checklistItems.length} signed
                </span>
              </PanelHeader>
              <PanelContent className="space-y-3">
                {checklistItems.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-line-soft bg-canvas/60 p-3.5 transition-colors hover:border-brand/40"
                  >
                    <Checkbox
                      checked={checklist[item.key]}
                      onCheckedChange={(checked) =>
                        setChecklist((current) => ({
                          ...current,
                          [item.key]: checked === true,
                        }))
                      }
                      className="mt-0.5"
                    />
                    <span className="text-[13px] leading-relaxed text-ink">{item.label}</span>
                  </label>
                ))}
              </PanelContent>
            </Panel>
          ) : (
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Recorded decision</PanelTitle>
                  <PanelDescription>
                    This filing has already left the staff completeness stage
                  </PanelDescription>
                </div>
              </PanelHeader>
              <PanelContent className="grid gap-4 sm:grid-cols-2">
                <Meta label="Reviewed by">
                  {application.reviewedByStaffName ?? "Not yet reviewed"}
                </Meta>
                <Meta label="Checklist completed">
                  {application.staffChecklistCompleted ? "Yes" : "No"}
                </Meta>
                <div className="sm:col-span-2">
                  <Meta label="Staff review notes">
                    {application.staffReviewNotes ?? "No staff remarks recorded."}
                  </Meta>
                </div>
                {application.adminDecisionByName && (
                  <div className="sm:col-span-2">
                    <Meta label={`Decision by ${application.adminDecisionByName}`}>
                      {application.adminDecisionNotes}
                      {application.adminDecidedAt && (
                        <span className="mt-1 block text-xs text-ink-faint tnum">
                          {formatIsoDate(application.adminDecidedAt)}
                        </span>
                      )}
                    </Meta>
                  </div>
                )}
                {application.registrationNo && (
                  <Meta label={desk.registrationLabel}>
                    <span className="tnum">{application.registrationNo}</span>
                  </Meta>
                )}
              </PanelContent>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          {isStaffStage && (
            <>
              <Panel>
                <PanelHeader>
                  <div>
                    <PanelTitle>Staff Review Remarks</PanelTitle>
                    <PanelDescription>Visible to the applicant and the approving authority</PanelDescription>
                  </div>
                </PanelHeader>
                <PanelContent>
                  <Textarea
                    rows={5}
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    placeholder="Which documents were verified, what is missing, and any endorsement remarks…"
                  />
                </PanelContent>
              </Panel>

              <Panel>
                <PanelHeader>
                  <div>
                    <PanelTitle>Rejection Reason</PanelTitle>
                    <PanelDescription>Required only when rejecting the filing</PanelDescription>
                  </div>
                </PanelHeader>
                <PanelContent>
                  <Textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="e.g. No proof of residency submitted and the ID does not match the register."
                  />
                </PanelContent>
              </Panel>

              <Panel>
                <PanelContent className="space-y-3">
                  <Button className="w-full" disabled={!isChecked || acting !== null} onClick={approve}>
                    <CheckCircle2 className="size-4" />
                    {acting === "approve" ? "Recording…" : "Approve & Activate Membership"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-surface"
                    disabled={!remarks.trim() || acting !== null}
                    onClick={requestCorrection}
                  >
                    <RotateCcw className="size-4" />
                    {acting === "correction" ? "Recording…" : "Request Correction from Applicant"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-destructive/40 bg-surface text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={!rejectionReason.trim() || acting !== null}
                    onClick={() => setRejectOpen(true)}
                  >
                    <XCircle className="size-4" /> Reject Application
                  </Button>
                  <p className="flex items-start gap-2 pt-1 text-[11px] leading-relaxed text-ink-faint">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                    All decisions are recorded in the audit trail.
                  </p>
                </PanelContent>
              </Panel>
            </>
          )}

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Filing summary</PanelTitle>
                <PanelDescription>Audit references for this application</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent className="grid gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                  <FileText className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-ink-strong">Tracking number</p>
                  <p className="mt-0.5 text-xs text-ink-muted tnum">
                    {application.trackingNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                  <ShieldCheck className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-ink-strong">Current stage</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                    {application.status === "pending_staff_review" &&
                      "Awaiting the desk completeness review."}
                    {application.status === "under_admin_review" &&
                      "Forwarded to the barangay captain for the final decision."}
                    {application.status === "approved" &&
                      "Membership activated — the resident is on the sector roster."}
                    {application.status === "needs_correction" &&
                      "Returned to the applicant for the missing or invalid proofs."}
                    {application.status === "rejected" &&
                      "Closed with a recorded rejection reason."}
                  </p>
                </div>
              </div>
            </PanelContent>
          </Panel>
        </div>
      </div>

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {application.trackingNumber}?</DialogTitle>
            <DialogDescription>
              The filing is closed and {application.applicantName} is notified of the reason you
              record here.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="rejection-reason" className="text-sm font-medium text-ink-strong">
              Rejection reason
            </label>
            <Textarea
              id="rejection-reason"
              rows={4}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="State why the application cannot be approved."
            />
            <p className="text-xs text-ink-faint">Between 3 and 1,000 characters.</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="bg-surface"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={rejectionReason.trim().length < 3 || acting !== null}
              onClick={confirmReject}
            >
              {acting === "reject" ? "Rejecting…" : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
