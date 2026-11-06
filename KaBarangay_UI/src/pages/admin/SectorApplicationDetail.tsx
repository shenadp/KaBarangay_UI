import type { ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, FileCheck2, FileWarning, SearchX } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import EmptyState from "@/components/EmptyState"
import StatusBadge from "@/components/StatusBadge"
import { Meta, Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { adminBarangay } from "@/mock/admin/residents"
import {
  sectorApplicationById,
  sectorApplicationOversightBody,
  sectorApplicationOversightLead,
  submissionOrigin,
} from "@/mock/admin/sector-applications"

/**
 * The admin's view of one sector application. `Admin/SectorApplicationController`
 * exposes an index and a show and nothing else, so this page reports the
 * decision the sector desk already recorded instead of offering a new one.
 */

export default function AdminSectorApplicationDetail() {
  const { id } = useParams()
  const application = sectorApplicationById(Number(id))

  if (!application) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Admin / Sector Applications" title="Application not found" />
        <Panel>
          <EmptyState
            icon={SearchX}
            title="No application with that number"
            description="The application belongs to another barangay or was never filed."
            action={
              <Button asChild variant="outline" size="sm" className="h-9 bg-surface">
                <Link to="/admin/sector-applications">Back to All Applications</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  const workflow = [
    { title: "Submitted", note: `${application.submittedAt} — Initial intake` },
    {
      title: "Sector Staff Review",
      note: application.reviewedByStaffName
        ? `Recorded by ${application.reviewedByStaffName}`
        : "Awaiting sector staff decision",
    },
    { title: "Current Status", note: application.status },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin / Sector Applications"
        title="Sector Application Oversight"
        description={application.trackingNumber}
        actions={
          <Button asChild variant="ghost" size="sm" className="h-9 text-ink-muted">
            <Link to="/admin/sector-applications">
              <ArrowLeft className="size-4" /> Back to All Applications
            </Link>
          </Button>
        }
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-sm text-info">
        <p>
          <span className="font-semibold">{sectorApplicationOversightLead}</span>{" "}
          {sectorApplicationOversightBody}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel>
            <PanelHeader>
              <PanelTitle>Applicant Resident Profile</PanelTitle>
              <StatusBadge status={application.status} />
            </PanelHeader>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Meta label="Full Name">
                <span className="font-medium text-ink-strong">{application.applicantName}</span>
              </Meta>
              <Meta label="Resident ID">
                <span className="tnum">{application.residentNumber}</span>
              </Meta>
              <Meta label="Barangay & Purok">{`${adminBarangay} (${application.purok})`}</Meta>
              <Meta label="Target Sector">
                <span className="font-medium text-ink-strong">{application.sectorName}</span>
              </Meta>
              <Meta label="Submission Origin">{submissionOrigin(application)}</Meta>
              <Meta label="Submitted On">
                <span className="tnum">{application.submittedAt}</span>
              </Meta>
            </div>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Sector Staff Review</PanelTitle>
                <PanelDescription>
                  What the desk recorded when it handled the application.
                </PanelDescription>
              </div>
            </PanelHeader>
            <div className="rounded-xl border border-line-soft bg-canvas/60 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 text-ink-muted">
                <span>
                  Reviewed by:{" "}
                  <strong className="font-medium text-ink-strong">
                    {application.reviewedByStaffName || "Sector Staff"}
                  </strong>
                </span>
                {application.staffChecklistCompleted && (
                  <span className="text-[11px] font-semibold text-success">Checklist completed</span>
                )}
              </div>
              <p className="mt-2 text-ink italic">
                “{application.staffReviewNotes || "No staff review remarks recorded."}”
              </p>
            </div>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Supporting Evidentiary Documents</PanelTitle>
                <PanelDescription>
                  Files the applicant or the desk attached to the application.
                </PanelDescription>
              </div>
            </PanelHeader>
            <div className="space-y-3 p-5">
              {application.documents.length === 0 ? (
                <p className="text-xs text-ink-muted">No documents attached.</p>
              ) : (
                application.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line-soft bg-canvas/60 p-3.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-strong">{document.title}</p>
                      <p className="text-[11px] text-ink-faint tnum">{document.fileName}</p>
                    </div>
                    <span
                      className={
                        document.verification === "Received"
                          ? "inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-medium text-success"
                          : "inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-medium text-destructive"
                      }
                    >
                      {document.verification === "Received" ? (
                        <FileCheck2 className="size-3.5" />
                      ) : (
                        <FileWarning className="size-3.5" />
                      )}
                      {document.verification}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Recorded Workflow</PanelTitle>
              <PanelDescription>
                The trail the sector desk left on this application.
              </PanelDescription>
            </div>
          </PanelHeader>
          <ol className="space-y-4 p-5">
            {workflow.map((step) => (
              <li key={step.title}>
                <p className="text-sm font-medium text-ink-strong">{step.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{step.note}</p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  )
}
