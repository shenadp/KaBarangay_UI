import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CertificateWorkflow from "@/components/sectors/clerk/CertificateWorkflow"
import { CertificateStatusBadge, type CertificateFlash } from "@/components/sectors/clerk/CertificateStatus"
import { Meta } from "@/components/Panel"
import {
  certificateNameFor,
  formatIsoDate,
  type CertificateIssuanceRecord,
  type CertificateRequestRecord,
} from "@/mock/clerk/certificates"
import { peso } from "@/mock/resident"

/** The list's "Details" modal: the request summary plus the shared workflow. */
export default function CertificateRequestDialog({
  request,
  issuance,
  open,
  onOpenChange,
  onGenerate,
  onChanged,
  onFeedback,
}: {
  request: CertificateRequestRecord | null
  issuance: CertificateIssuanceRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (request: CertificateRequestRecord) => void
  onChanged: () => void
  onFeedback: (flash: CertificateFlash) => void
}) {
  if (!request) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Certificate Request Details</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{request.reference}</span> ·{" "}
            {certificateNameFor(request.certificateType)}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-1 flex flex-wrap items-center gap-3">
          <CertificateStatusBadge status={request.status} />
          <p className="text-xs text-ink-muted tnum">
            Submitted {formatIsoDate(request.submittedAt)}
          </p>
        </div>

        <div className="grid gap-4 rounded-xl border border-line-soft bg-surface p-4 sm:grid-cols-3">
          <Meta label="Resident">
            {request.residentName}
            <p className="mt-0.5 text-xs text-ink-muted font-mono">
              {request.residentNumber ?? "—"}
            </p>
          </Meta>
          <Meta label="Purok">{request.purok}</Meta>
          <Meta label="Fee">{peso(request.fee)}</Meta>
          <div className="sm:col-span-3">
            <Meta label="Purpose">{request.purpose}</Meta>
          </div>
        </div>

        <CertificateWorkflow
          request={request}
          issuance={issuance}
          onGenerate={onGenerate}
          onChanged={onChanged}
          onFeedback={onFeedback}
        />

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" size="sm" className="bg-surface" asChild>
            <Link to={`/clerk/certificates/${request.id}`}>Open full record</Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-ink-muted" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
