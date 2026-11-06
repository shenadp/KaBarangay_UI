import { useState } from "react"
import { Download, ExternalLink, FileText } from "lucide-react"

import {
  charterCopy,
  formatCharterFileSize,
  formatIsoDate,
  type CharterVersion,
} from "@/mock/clerk/charter"

/**
 * Mock "Document Preview". There is no stored file and nothing is fetched from a
 * server, so the pane renders a placeholder page and the Open/Download buttons
 * are UI-only affordances that echo what they would do.
 */
export default function CharterDocumentPreview({
  serviceTitle,
  version,
}: {
  serviceTitle: string
  version?: CharterVersion
}) {
  const [notice, setNotice] = useState<string | null>(null)

  const placeholder = (action: string) =>
    setNotice(`${action} — ${charterCopy.placeholderPreview}`)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-ink-strong">
          Document Preview
          {version && <span className="text-ink-muted"> (Version {version.version_number})</span>}
        </h2>

        {version && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => placeholder("Open in New Tab")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-soft bg-surface px-2.5 text-xs font-medium text-ink transition-colors hover:text-brand"
            >
              <ExternalLink className="size-3.5" /> Open in New Tab
            </button>
            <button
              type="button"
              onClick={() => placeholder("Download PDF")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <Download className="size-3.5" /> Download PDF
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-line-soft bg-surface shadow-card">
        {version ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-canvas px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-xl bg-brand-soft text-brand">
              <FileText className="size-7" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink-strong">{version.original_name}</p>
              <p className="text-xs text-ink-muted tnum">
                {formatCharterFileSize(version.file_size)} · uploaded {formatIsoDate(version.created_at)}
              </p>
              <p className="text-xs text-ink-faint">Citizen&apos;s Charter — {serviceTitle}</p>
            </div>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-faint">
              This is a rendered placeholder for the mock PDF. No document is streamed from a server.
            </p>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-xs text-ink-muted">{charterCopy.noPreview}</div>
        )}
      </div>

      {notice && (
        <p className="rounded-lg border border-line-soft bg-canvas px-3 py-2 text-xs text-ink-muted">
          {notice}
        </p>
      )}
    </div>
  )
}
