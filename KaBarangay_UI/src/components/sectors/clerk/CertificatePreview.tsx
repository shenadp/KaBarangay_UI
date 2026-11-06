import { formatIsoDate } from "@/mock/sectorDesks"
import { barangay } from "@/mock/data"
import { peso } from "@/mock/resident"
import type { CertificateDetailRow } from "@/mock/clerk/certificates"

export type CertificatePreviewData = {
  certificate: string
  residentName: string
  residentNumber?: string | null
  purok?: string | null
  purpose: string
  controlNo?: string | null
  fee?: number | null
  signatoryName: string
  signatoryTitle: string
  issuedBy?: string | null
  issuedAt?: string | null
  detailRows?: CertificateDetailRow[]
}

const dash = "—"

/** The document body as the template would state it, built only from UI state. */
export function certificateDocumentLines(data: CertificatePreviewData): string[] {
  const lines = [
    `This certifies that ${data.residentName.toUpperCase() || dash},` +
      (data.purok ? ` a resident of ${data.purok}, ${barangay.name},` : ` a resident of ${barangay.name},`) +
      (data.residentNumber ? ` registered under ${data.residentNumber},` : "") +
      " has requested this certificate for the following purpose:",
    data.purpose.trim() ? data.purpose.trim().toUpperCase() : dash,
  ]

  for (const row of data.detailRows ?? []) {
    lines.push(`${row.label}: ${row.value}`)
  }

  if (data.fee !== null && data.fee !== undefined) {
    lines.push(`Fee collected: ${peso(data.fee)}`)
  }

  return lines
}

/** Plain-text rendering used by the simulated download — nothing is fetched. */
export function certificateDocumentText(data: CertificatePreviewData): string {
  const stamp = data.issuedAt ? formatIsoDate(data.issuedAt) : dash

  return [
    "REPUBLIC OF THE PHILIPPINES",
    `${barangay.province.toUpperCase()} — ${barangay.city.toUpperCase()}`,
    barangay.name.toUpperCase(),
    "".padEnd(60, "="),
    data.certificate.toUpperCase(),
    "".padEnd(60, "="),
    `Reference: ${data.controlNo ?? dash}`,
    `Date issued: ${stamp}`,
    "",
    ...certificateDocumentLines(data),
    "",
    "".padEnd(40, "_"),
    data.signatoryName,
    data.signatoryTitle,
    "",
    `Prepared by: ${data.issuedBy ?? dash}, Barangay Clerk`,
    barangay.code,
  ].join("\n")
}

/**
 * The “download” is generated locally: a Blob of the same text the preview
 * renders, handed to the browser through an object URL.
 */
export function downloadCertificateDocument(data: CertificatePreviewData): string {
  const fileName = `Certificate_${data.controlNo ?? data.certificate.replace(/\s+/g, "-")}.txt`
  const blob = new Blob([certificateDocumentText(data)], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)

  return fileName
}

/** A4-ish document surface so the desk reads as the certificate itself. */
export default function CertificatePreview({ data }: { data: CertificatePreviewData }) {
  const lines = certificateDocumentLines(data)

  return (
    <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
      <div className="border-b border-line pb-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
          Republic of the Philippines
        </p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink">
          {barangay.province} — {barangay.city}
        </p>
        <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-brand">
          {barangay.name}
        </p>
      </div>

      <p className="mt-4 text-center text-base font-semibold uppercase tracking-wide text-ink-strong">
        {data.certificate}
      </p>

      <div className="mt-4 space-y-2 text-xs leading-relaxed text-ink">
        {lines.map((line, index) => (
          <p key={`${index}-${line.slice(0, 24)}`} className={index <= 1 ? "" : "font-medium"}>
            {line}
          </p>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border-t border-line pt-2 text-[11px] text-ink-muted">
          <p className="font-medium text-ink-strong">{data.signatoryName}</p>
          <p>{data.signatoryTitle}</p>
        </div>
        <div className="border-t border-line pt-2 text-[11px] text-ink-muted">
          <p className="font-medium text-ink-strong">{data.issuedBy ?? dash}</p>
          <p>Barangay Clerk</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[11px] text-ink-muted">
        <span>
          Control No.:{" "}
          <span className="font-medium text-ink tnum">{data.controlNo ?? dash}</span>
        </span>
        <span>
          Issued: <span className="tnum">{data.issuedAt ? formatIsoDate(data.issuedAt) : dash}</span>
          {data.fee !== null && data.fee !== undefined && (
            <>
              {" "}
              · Fee <span className="tnum">{peso(data.fee)}</span>
            </>
          )}
        </span>
      </div>
    </div>
  )
}
