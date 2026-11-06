/**
 * Resident portal — one published Citizen's Charter standard.
 *
 * Mirrors `Resident/CitizenCharterShow` of commit b6030a08: the service header,
 * its official document actions, and the embedded viewer that is the whole point
 * of the page. There is no server file to stream, so the viewer paints the mock
 * sheet of the current version instead of an `<iframe>`, and Open/Download answer
 * with what they would really do. A service the index would not list is what the
 * backend's 404 looks like here.
 */

import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ExternalLink, FileText } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import { Panel, PanelContent } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { formatCharterDate, formatCharterFileSize } from "@/mock/clerk/charter"
import {
  charterServiceById,
  type ResidentCharterService,
  type ResidentCharterVersion,
} from "@/mock/resident/charter"
import { barangay } from "@/mock/data"

export default function CitizenCharterDetail() {
  const { id } = useParams()
  const serviceId = Number(id)
  const service = Number.isInteger(serviceId) ? charterServiceById(serviceId) : null

  const [notice, setNotice] = useState<string | null>(null)

  if (!service) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <BackLink />
        <Panel className="p-0">
          <EmptyState
            icon={FileText}
            title="Citizen's Charter service not found"
            description="This service is not published for your barangay, or its document has been withdrawn. Return to the directory to pick another service."
            action={
              <Button asChild variant="outline" size="sm" className="h-9 bg-surface">
                <Link to="/resident/citizen-charter">Back to Citizen&apos;s Charter</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  const version = service.current_version

  const simulate = (action: string) => {
    if (!version) {
      setNotice("Document file is currently unavailable.")
      return
    }

    setNotice(
      `${action} — ${version.original_name} is simulated in this demo. Only its name, type and size are on file, so no bytes are served.`,
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <nav className="flex items-center gap-2 text-xs text-ink-muted">
        <Link to="/resident/citizen-charter" className="transition-colors hover:text-brand">
          Citizen&apos;s Charter
        </Link>
        <span aria-hidden="true">/</span>
        <span className="line-clamp-1 font-semibold text-ink-strong">{service.title}</span>
      </nav>

      <Panel className="p-0">
        <PanelContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-brand-muted bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand-deep">
                  {service.category || "Barangay Service"}
                </span>
                {version && (
                  <span className="text-xs text-ink-faint tnum">
                    Official Document ({formatCharterFileSize(version.file_size)})
                  </span>
                )}
              </div>

              <h1 className="text-xl font-semibold tracking-tight text-ink-strong sm:text-2xl">
                {service.title}
              </h1>

              {service.description && (
                <p className="text-sm leading-relaxed text-ink-muted">{service.description}</p>
              )}

              <p className="pt-1 text-xs text-ink-faint">
                Published standard as of {formatCharterDate(service.published_at ?? undefined)}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {service.file_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 bg-surface"
                  onClick={() => simulate("Open in New Tab")}
                >
                  <ExternalLink className="size-4" /> Open in New Tab
                </Button>
              )}
              {service.download_url && (
                <Button size="sm" className="h-9" onClick={() => simulate("Download PDF")}>
                  <FileText className="size-4" /> Download PDF
                </Button>
              )}
            </div>
          </div>
        </PanelContent>
      </Panel>

      {notice && (
        <p
          role="status"
          className="rounded-xl border border-line-soft bg-canvas px-4 py-3 text-xs leading-relaxed text-ink-muted"
        >
          {notice}
        </p>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-ink-strong">
            Official Charter Document
          </h2>
          <span className="text-xs text-ink-faint">Authorized Barangay Service Standard</span>
        </div>

        <CharterSheet service={service} version={version} />
      </section>

      <p className="rounded-xl border border-line-soft bg-canvas/70 p-3.5 text-xs leading-relaxed text-ink-muted">
        <span className="font-semibold text-ink-strong">Mobile notice:</span> If your device or
        browser cannot display embedded PDF previews, use the{" "}
        <InlineAction
          available={Boolean(service.download_url)}
          label="Download PDF"
          onSelect={simulate}
        />{" "}
        or{" "}
        <InlineAction
          available={Boolean(service.file_url)}
          label="Open in New Tab"
          onSelect={simulate}
        />{" "}
        button above to view the complete official document.
      </p>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/resident/citizen-charter"
      className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-brand hover:underline"
    >
      <ArrowLeft className="size-4" /> Citizen&apos;s Charter
    </Link>
  )
}

/** The reference's in-text action, rendered as an underlined control. */
function InlineAction({
  available,
  label,
  onSelect,
}: {
  available: boolean
  label: string
  onSelect: (action: string) => void
}) {
  if (!available) return <span className="font-semibold text-ink-faint">{label}</span>

  return (
    <button
      type="button"
      onClick={() => onSelect(label)}
      className="font-semibold text-brand underline underline-offset-2"
    >
      {label}
    </button>
  )
}

/** The page the embedded viewer would paint, drawn from the current version. */
function CharterSheet({
  service,
  version,
}: {
  service: ResidentCharterService
  version: ResidentCharterVersion | null
}) {
  if (!version) {
    return (
      <Panel className="p-0">
        <p className="px-6 py-12 text-center text-xs text-ink-muted">
          Document file is currently unavailable.
        </p>
      </Panel>
    )
  }

  return (
    <Panel className="p-0">
      <PanelContent className="bg-canvas/60">
        <div className="mx-auto max-w-xl rounded-xl border border-line-soft bg-surface px-5 py-8 shadow-card sm:px-8">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              Republic of the Philippines · Province of {barangay.province}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-strong">
              {barangay.name}, {barangay.city}
            </p>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-brand">
              Citizen&apos;s Charter · Version {version.version_number}
            </p>
          </div>

          <div className="mt-6 border-t border-dashed border-line-soft pt-5">
            <h3 className="text-base font-semibold text-ink-strong">{service.title}</h3>
            <p className="mt-1 text-[11px] text-ink-muted">
              {service.category || "General Service"} · Published{" "}
              {formatCharterDate(service.published_at ?? undefined)}
            </p>
            {service.description && (
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink">
                {service.description}
              </p>
            )}
          </div>

          <p className="mt-6 border-t border-dashed border-line-soft pt-4 text-[10px] leading-relaxed text-ink-faint">
            {version.original_name} · {version.mime_type} ·{" "}
            {formatCharterFileSize(version.file_size)} · Page 1 of 1
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-faint">
          Mock sheet — this demo records the document name, type and size, not the PDF bytes.
        </p>
      </PanelContent>
    </Panel>
  )
}

