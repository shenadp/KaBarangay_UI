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
import CertificateIssuanceView from "@/components/sectors/clerk/CertificateIssuanceView"
import { CertificateStatusBadge, type CertificateFlash } from "@/components/sectors/clerk/CertificateStatus"
import {
  certificateCopy,
  type CertificateIssuanceRecord,
  type CertificateRequestRecord,
} from "@/mock/clerk/certificates"

/** The "View" modal on the Issued / Completed tab. */
export default function CertificateIssuedDialog({
  issuance,
  linkedRequest,
  open,
  onOpenChange,
  onFeedback,
}: {
  issuance: CertificateIssuanceRecord | null
  linkedRequest: CertificateRequestRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFeedback: (flash: CertificateFlash) => void
}) {
  if (!issuance) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            Issued Certificate
            <CertificateStatusBadge status={issuance.status} />
          </DialogTitle>
          <DialogDescription>{certificateCopy.readOnlyIssuance}</DialogDescription>
        </DialogHeader>

        <CertificateIssuanceView
          issuance={issuance}
          linkedRequest={linkedRequest}
          onFeedback={onFeedback}
        />

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" size="sm" className="bg-surface" asChild>
            <Link to={`/clerk/certificates/iss-${issuance.id}`}>Open full record</Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-ink-muted" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
