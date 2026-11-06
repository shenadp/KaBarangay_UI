import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, FileQuestion } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import PageHeader from "@/components/PageHeader"
import { Meta, Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import CertificateGenerateDialog from "@/components/sectors/clerk/CertificateGenerateDialog"
import CertificateIssuanceView from "@/components/sectors/clerk/CertificateIssuanceView"
import {
  CertificateFlashBanner,
  CertificateStatusBadge,
} from "@/components/sectors/clerk/CertificateStatus"
import CertificateWorkflow from "@/components/sectors/clerk/CertificateWorkflow"
import { useCertificateStore } from "@/components/sectors/clerk/useCertificateStore"
import { Button } from "@/components/ui/button"
import {
  certificateNameFor,
  formatIsoDate,
} from "@/mock/clerk/certificates"
import { peso } from "@/mock/resident"

/** Deep-linked record view: `/clerk/certificates/:id` (issuances use `iss-<id>`). */
export default function ClerkCertificateDetail() {
  const { id } = useParams<{ id: string }>()
  // Requests and issuances share this route, so the previous record's drafts
  // would otherwise carry over when only the id changes.
  return <CertificateRecord key={id ?? "none"} rawId={id} />
}

function CertificateRecord({ rawId }: { rawId?: string }) {
  const { store, revision, flash, setFlash, refresh } = useCertificateStore()
  const [generateOpen, setGenerateOpen] = useState(false)

  const record = useMemo(() => store.recordByRouteId(rawId), [rawId, revision, store])

  const back = (
    <Button variant="outline" size="sm" className="h-9 bg-surface" asChild>
      <Link to="/clerk/certificates">
        <ArrowLeft className="size-4" /> Back to Certificates
      </Link>
    </Button>
  )

  if (!record) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Office of the Barangay Clerk"
          title="Certificate Record"
          actions={back}
        />
        <Panel>
          <PanelContent className="p-0">
            <EmptyState
              icon={FileQuestion}
              title="Certificate record not found"
              description={`No request or issued certificate matches “${rawId ?? "nothing"}” at this desk.`}
              action={
                <Button variant="outline" size="sm" className="h-8 bg-surface" asChild>
                  <Link to="/clerk/certificates">Open the certificates desk</Link>
                </Button>
              }
            />
          </PanelContent>
        </Panel>
      </div>
    )
  }

  if (record.kind === "issuance") {
    const issuance = record.issuance
    const linkedRequest = issuance.requestId === null ? null : store.requestById(issuance.requestId)

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Issued Certificate"
          title={issuance.certificate}
          description={`${issuance.reference} · Control No. ${issuance.controlNo}`}
          actions={
            <>
              <CertificateStatusBadge status={issuance.status} />
              {back}
            </>
          }
        />

        {flash && <CertificateFlashBanner flash={flash} onDismiss={() => setFlash(null)} />}

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Archival Record</PanelTitle>
              <PanelDescription>Issued by {issuance.issuedBy} on {formatIsoDate(issuance.issuedAt)}</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent>
            <CertificateIssuanceView
              issuance={issuance}
              linkedRequest={linkedRequest}
              onFeedback={setFlash}
            />
          </PanelContent>
        </Panel>
      </div>
    )
  }

  const request = record.request
  const issuance = store.issuanceForRequest(request.id)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Certificate Request · ${request.reference}`}
        title={certificateNameFor(request.certificateType)}
        description={request.purpose}
        actions={
          <>
            <CertificateStatusBadge status={request.status} />
            {back}
          </>
        }
      />

      {flash && <CertificateFlashBanner flash={flash} onDismiss={() => setFlash(null)} />}

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Request Summary</PanelTitle>
            <PanelDescription>Filed by the resident through the barangay portal</PanelDescription>
          </div>
          <p className="text-xs text-ink-muted tnum">
            Submitted {formatIsoDate(request.submittedAt)}
            {request.reviewedAt ? ` · Reviewed ${formatIsoDate(request.reviewedAt)}` : ""}
          </p>
        </PanelHeader>
        <PanelContent className="grid gap-4 sm:grid-cols-3">
          <Meta label="Resident">
            {request.residentName}
            <p className="mt-0.5 text-xs text-ink-muted font-mono">
              {request.residentNumber ?? "—"}
            </p>
          </Meta>
          <Meta label="Purok">{request.purok}</Meta>
          <Meta label="Fee">{peso(request.fee)}</Meta>
        </PanelContent>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Issuance Workflow</PanelTitle>
            <PanelDescription>
              Every action here is visible on the desk list, and the other way round.
            </PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent>
          <CertificateWorkflow
            request={request}
            issuance={issuance}
            onGenerate={() => setGenerateOpen(true)}
            onChanged={refresh}
            onFeedback={setFlash}
          />
        </PanelContent>
      </Panel>

      <CertificateGenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        request={request}
        onFeedback={setFlash}
        onCommitted={refresh}
      />
    </div>
  )
}
