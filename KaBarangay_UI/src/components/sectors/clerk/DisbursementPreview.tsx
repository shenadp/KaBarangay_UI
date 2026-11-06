import { Download, Eye } from "lucide-react"

import { Panel, PanelContent, PanelHeader } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { barangay } from "@/mock/data"
import { peso } from "@/mock/resident"
import {
  CSV_PREVIEW_MAX_CELL_LENGTH,
  disbursementFileKind,
  disbursementIsCsv,
  disbursementIsPdf,
  disbursementTotal,
  formatDisbursementDate,
  formatFileSize,
  parseDisbursementCsv,
  type ClerkDisbursementDocument,
} from "@/mock/clerk/disbursements"
import { DisbursementFileChip, DisbursementSheetField } from "./DisbursementIndicators"

type Props = {
  document: ClerkDisbursementDocument
  onDownload: (document: ClerkDisbursementDocument) => void
}

/**
 * Staff-only view of the uploaded original. There is no server file to stream,
 * so a PDF renders a mock voucher sheet built from the recorded line items and
 * a CSV is parsed from the mock contents the seed carries.
 */
export default function DisbursementPreview({ document, onDownload }: Props) {
  const kind = disbursementFileKind(document)
  const preview = kind === "CSV" ? parseDisbursementCsv(document.csv) : null

  return (
    <Panel>
      <PanelHeader>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DisbursementFileChip document={document} />
            <span className="text-xs text-ink-muted tnum">{formatFileSize(document.fileSize)}</span>
          </div>
          <p className="mt-1.5 truncate text-sm font-medium text-ink-strong">{document.originalName}</p>
        </div>

        <Button variant="outline" size="sm" className="h-8 bg-surface" onClick={() => onDownload(document)}>
          <Download className="size-4" /> Download original
        </Button>
      </PanelHeader>

      {disbursementIsPdf(document) && <MockVoucherSheet document={document} />}

      {disbursementIsCsv(document) &&
        (document.csv ? (
          preview && <CsvPreviewTable preview={preview} />
        ) : (
          <PanelContent>
            <p className="rounded-lg border border-dashed border-line-soft bg-canvas/60 px-4 py-8 text-center text-xs leading-relaxed text-ink-muted">
              This upload is simulated — only the file name and size were recorded, so there are no
              rows to parse. In the production build the CSV is read from storage and previewed here.
            </p>
          </PanelContent>
        ))}

      {kind === "File" && (
        <PanelContent>
          <p className="py-10 text-center text-sm text-ink-muted">
            Preview is not available for this file type.
          </p>
        </PanelContent>
      )}

      {disbursementIsCsv(document) && document.csv && (
        <p className="border-t border-line-soft bg-warning-soft px-5 py-2.5 text-xs leading-relaxed text-warning">
          Preview limited to {preview?.rowLimit} rows, {preview?.columnLimit} columns, and{" "}
          {CSV_PREVIEW_MAX_CELL_LENGTH} characters per cell. Download the original for the complete
          file.
        </p>
      )}
    </Panel>
  )
}

/** The placeholder sheet standing in for the scanned PDF. */
function MockVoucherSheet({ document }: { document: ClerkDisbursementDocument }) {
  const total = disbursementTotal(document)

  return (
    <PanelContent className="bg-canvas/60">
      <div className="mx-auto max-w-2xl rounded-xl border border-line-soft bg-surface p-6 shadow-card">
        <div className="text-center">
          <p className="text-[10px] font-semibold tracking-wider text-ink-faint uppercase">
            Republic of the Philippines · Province of {barangay.province}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-strong">
            {barangay.name}, {barangay.city}
          </p>
          <p className="mt-3 text-[10px] font-semibold tracking-wider text-brand uppercase">
            Disbursement voucher {document.reference}
          </p>
        </div>

        <div className="mt-5 grid gap-3 border-y border-dashed border-line-soft py-4 sm:grid-cols-2">
          <DisbursementSheetField label="Particulars" value={document.title} />
          <DisbursementSheetField label="Payee" value={document.payee} />
          <DisbursementSheetField label="Fund source" value={document.fund} />
          <DisbursementSheetField label="Covered period" value={document.period} />
        </div>

        {document.lines.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-line-soft px-4 py-6 text-center text-xs leading-relaxed text-ink-muted">
            No line items were captured for this scan.
          </p>
        ) : (
          <Table className="mt-4 text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-2 py-2 font-semibold">Particulars</TableHead>
                <TableHead className="px-2 py-2 text-right font-semibold">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {document.lines.map((line) => (
                <TableRow key={line.particulars} className="hover:bg-transparent">
                  <TableCell className="px-2 py-2 align-top whitespace-normal text-ink">
                    {line.particulars}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right align-top whitespace-nowrap text-ink tnum">
                    {peso(line.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <tr className="border-t border-line">
                <TableCell className="px-2 py-2 text-sm font-semibold text-ink-strong">
                  Total disbursed
                </TableCell>
                <TableCell className="px-2 py-2 text-right text-sm font-semibold text-ink-strong tnum">
                  {peso(total)}
                </TableCell>
              </tr>
            </TableBody>
          </Table>
        )}

        <p className="mt-5 text-center text-[11px] text-ink-faint">
          Prepared by {document.uploadedBy} · {formatDisbursementDate(document.uploadedAt)}
        </p>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-faint">
        <Eye className="size-3.5" /> Mock sheet — this demo records the file name and size, not the
        PDF bytes.
      </p>
    </PanelContent>
  )
}

function CsvPreviewTable({ preview }: { preview: NonNullable<ReturnType<typeof parseDisbursementCsv>> }) {
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
                  className="max-w-64 px-3 py-2 align-top whitespace-normal break-words text-ink"
                >
                  {row[columnIndex] || " "}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {preview.rows.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-ink-muted">This CSV file has no data rows.</p>
      )}
    </div>
  )
}
