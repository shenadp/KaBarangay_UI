import { useState } from "react"
import { Link } from "react-router-dom"
import { Download, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Meta } from "@/components/Panel"
import CertificatePreview, {
  downloadCertificateDocument,
  type CertificatePreviewData,
} from "@/components/sectors/clerk/CertificatePreview"
import {
  DetailRowTable,
  SectionLabel,
} from "@/components/sectors/clerk/CertificateDetailFields"
import type { CertificateFlash } from "@/components/sectors/clerk/CertificateStatus"
import {
  certificateCopy,
  certificateTypeOption,
  clerkCertificateStore,
  detailRowsFor,
  formatIsoDate,
  issuedStamp,
  type CertificateIssuanceRecord,
  type CertificateRequestRecord,
} from "@/mock/clerk/certificates"
import { peso } from "@/mock/resident"

/** The document state an issuance carries, shared by the view and the reprint. */
export function issuancePreviewData(issuance: CertificateIssuanceRecord): CertificatePreviewData {
  return {
    certificate: issuance.certificate,
    residentName: issuance.residentName,
    residentNumber: issuance.residentNumber,
    purok: issuance.purok,
    purpose: issuance.purpose,
    controlNo: issuance.controlNo,
    fee: issuance.fee,
    signatoryName: issuance.signatoryName,
    signatoryTitle: issuance.signatoryTitle,
    issuedBy: issuance.issuedBy,
    issuedAt: issuance.issuedAt,
    detailRows: detailRowsFor(issuance.certificateType, issuance.detailValues),
  }
}

/**
 * Read-only rendering of an issuance. Re-printing re-reads the stored record and
 * produces the local copy again; it never writes a new issuance.
 */
export default function CertificateIssuanceView({
  issuance,
  linkedRequest,
  onFeedback,
}: {
  issuance: CertificateIssuanceRecord
  linkedRequest: CertificateRequestRecord | null
  onFeedback: (flash: CertificateFlash) => void
}) {
  const [busy, setBusy] = useState<"print" | "download" | null>(null)
  const templateAvailable = certificateTypeOption(issuance.certificateType)?.available ?? false
  const detailRows = detailRowsFor(issuance.certificateType, issuance.detailValues)

  const reprint = (mode: "print" | "download") => {
    if (!templateAvailable) {
      onFeedback({ text: certificateCopy.noTemplate, tone: "error" })
      return
    }
    setBusy(mode)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      const stored = clerkCertificateStore.reprint(issuance.id)
      setBusy(null)
      if (!stored) {
        onFeedback({ text: "Issued certificate not found.", tone: "error" })
        return
      }
      if (mode === "print") {
        onFeedback({ text: `Reprint of ${stored.controlNo} sent to the desk printer.`, tone: "info" })
        return
      }
      const fileName = downloadCertificateDocument(issuancePreviewData(stored))
      onFeedback({ text: `Reprint copy saved as ${fileName}.`, tone: "success" })
    }, 600)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-soft bg-canvas/60 px-4 py-3">
        <p className="text-xs text-ink-muted">{certificateCopy.readOnlyIssuance}</p>
        <p className="font-mono text-xs text-ink-strong">{issuance.reference}</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-line-soft bg-surface p-4 sm:grid-cols-3">
        <Meta label="Resident">
          {issuance.residentName}
          <p className="mt-0.5 text-xs text-ink-muted font-mono">
            {issuance.residentNumber ?? "—"}
          </p>
        </Meta>
        <Meta label="Purok">{issuance.purok ?? "—"}</Meta>
        <Meta label="Control No.">
          <span className="font-mono tnum">{issuance.controlNo}</span>
        </Meta>
        <Meta label="Issued">{issuedStamp(issuance)}</Meta>
        <Meta label="Issued By">{issuance.issuedBy}</Meta>
        <Meta label="Fee">
          {issuance.fee === null ? "No fee snapshot (walk-in)" : peso(issuance.fee)}
        </Meta>
        <div className="sm:col-span-3">
          <Meta label="Purpose">{issuance.purpose}</Meta>
        </div>
        <div className="sm:col-span-3">
          <Meta label="Signatory">
            {issuance.signatoryName} — {issuance.signatoryTitle}
          </Meta>
        </div>
      </div>

      <section>
        <SectionLabel>Certificate Document</SectionLabel>
        <CertificatePreview data={issuancePreviewData(issuance)} />
      </section>

      {detailRows.length > 0 && (
        <section>
          <SectionLabel>Certificate Details</SectionLabel>
          <DetailRowTable rows={detailRows} />
        </section>
      )}

      {(issuance.businessName || issuance.businessAddress) && (
        <section>
          <SectionLabel>Business</SectionLabel>
          <DetailRowTable
            rows={[
              { label: "Business Name", value: issuance.businessName ?? "—" },
              { label: "Business Address", value: issuance.businessAddress ?? "—" },
            ]}
          />
        </section>
      )}

      {linkedRequest && (
        <section>
          <SectionLabel>Linked Request</SectionLabel>
          <div className="rounded-xl border border-line-soft bg-surface px-4 py-3 text-sm">
            <Link
              to={`/clerk/certificates/${linkedRequest.id}`}
              className="font-mono text-xs font-medium text-brand hover:underline"
            >
              {linkedRequest.reference}
            </Link>
            <p className="mt-1 text-xs text-ink-muted tnum">
              Submitted {formatIsoDate(linkedRequest.submittedAt)}
            </p>
          </div>
        </section>
      )}

      {issuance.notes && (
        <section>
          <SectionLabel>Resident Notes</SectionLabel>
          <p className="rounded-xl border border-line-soft bg-canvas/60 p-4 text-sm whitespace-pre-wrap text-ink">
            {issuance.notes}
          </p>
        </section>
      )}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-soft bg-canvas/60 px-4 py-3">
        <p className="text-[11px] text-ink-muted">{certificateCopy.reprintNote}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-surface"
            disabled={!templateAvailable || busy !== null}
            onClick={() => reprint("print")}
          >
            <Printer className="size-4" /> {busy === "print" ? "Preparing reprint…" : "Re-Print"}
          </Button>
          <Button
            size="sm"
            className="h-8"
            disabled={!templateAvailable || busy !== null}
            onClick={() => reprint("download")}
          >
            <Download className="size-4" />
            {busy === "download" ? "Saving…" : "Download copy"}
          </Button>
        </div>
      </section>

      {!templateAvailable && (
        <p className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning">
          The original template for this certificate is not available in this environment, so a
          reprint cannot be produced.
        </p>
      )}
    </div>
  )
}
