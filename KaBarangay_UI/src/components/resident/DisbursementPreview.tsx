/**
 * Resident portal — the preview pane of `Resident/DisbursementShow`.
 *
 * Same three branches as the backend's shared component: a PDF is embedded, a
 * CSV is a parsed table under a sticky header, anything else says the type has
 * no preview, and a truncated table admits its limits. There is no stored file
 * to stream here, so the PDF branch paints the placeholder page the viewer
 * would have loaded and Open/Download only report what they would do.
 */

import { Download, ExternalLink, FileText } from "lucide-react"

import { Panel, PanelContent } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CSV_PREVIEW_MAX_CELL_LENGTH,
  formatFileSize,
  type DisbursementCsvPreview,
} from "@/mock/clerk/disbursements"
import type { ResidentDisbursementDocument } from "@/mock/resident/disbursement"

type Props = {
  document: ResidentDisbursementDocument
  csvPreview: DisbursementCsvPreview | null
  onSelect: (action: string) => void
}

export function disbursementFileType(document: ResidentDisbursementDocument): string {
  if (document.is_pdf) return "PDF"
  if (document.is_csv) return "CSV"
  return "File"
}

export default function DisbursementPreview({ document, csvPreview, onSelect }: Props) {
  const previewLimited =
    csvPreview !== null &&
    (csvPreview.rowsTruncated || csvPreview.columnsTruncated || csvPreview.cellsTruncated)

  return (
    <Panel className="p-0">
      <div className="flex flex-col gap-3 border-b border-line-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-line-soft bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
              {disbursementFileType(document)}
            </span>
            <span className="text-xs text-ink-muted tnum">{formatFileSize(document.file_size)}</span>
          </div>

          <p className="mt-2 truncate text-sm font-medium text-ink-strong">{document.original_name}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-surface"
            onClick={() => onSelect("Open file")}
          >
            <ExternalLink className="size-4" /> Open file
          </Button>
          <Button size="sm" className="h-9" onClick={() => onSelect("Download original")}>
            <Download className="size-4" /> Download original
          </Button>
        </div>
      </div>

      {document.is_pdf && (
        <div>
          <MockPdfViewer document={document} />

          <p className="border-t border-line-soft px-4 py-3 text-xs leading-relaxed text-ink-muted sm:px-5">
            If the PDF preview does not load, use Open file or download the original.
          </p>
        </div>
      )}

      {document.is_csv && csvPreview && <CsvPreviewTable preview={csvPreview} />}

      {previewLimited && (
        <p className="border-t border-warning/20 bg-warning-soft px-4 py-3 text-xs leading-relaxed text-warning sm:px-5">
          Preview limited to {csvPreview?.rowLimit} rows, {csvPreview?.columnLimit} columns, and{" "}
          {CSV_PREVIEW_MAX_CELL_LENGTH} characters per cell. Download the original for the complete
          file.
        </p>
      )}

      {!document.is_pdf && !document.is_csv && (
        <p className="px-4 py-12 text-center text-sm text-ink-muted">
          Preview is not available for this file type.
        </p>
      )}
    </Panel>
  )
}

/** The pane an embedded PDF viewer would fill — no bytes are served in this demo. */
function MockPdfViewer({ document }: { document: ResidentDisbursementDocument }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 bg-canvas/60 px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-xl bg-brand-soft text-brand">
        <FileText className="size-7" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink-strong">{document.original_name}</p>
        <p className="text-xs text-ink-muted tnum">
          {document.mime_type} · {formatFileSize(document.file_size)}
        </p>
      </div>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-faint">
        Rendered placeholder for the mock PDF — this demo records the file name, type and size, not
        the document bytes.
      </p>
    </div>
  )
}

function CsvPreviewTable({ preview }: { preview: DisbursementCsvPreview }) {
  if (preview.error) {
    return (
      <PanelContent>
        <p className="py-10 text-center text-sm text-ink-muted">{preview.error}</p>
      </PanelContent>
    )
  }

  return (
    <div className="scrollbar-slim max-h-[32rem] overflow-auto">
      <Table className="min-w-full text-xs">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {preview.columns.map((column, index) => (
              <TableHead
                key={`${index}-${column}`}
                className="max-w-64 bg-canvas px-3 py-2 font-semibold whitespace-normal text-ink-strong"
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} className="hover:bg-transparent">
              {preview.columns.map((_, columnIndex) => (
                <TableCell
                  key={columnIndex}
                  className="max-w-64 px-3 py-2 align-top break-words whitespace-pre-wrap text-ink"
                >
                  {row[columnIndex] || " "}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {preview.rows.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-ink-muted">This CSV file has no data rows.</p>
      )}
    </div>
  )
}
