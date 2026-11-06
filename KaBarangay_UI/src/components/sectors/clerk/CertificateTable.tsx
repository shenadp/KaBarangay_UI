import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ExternalLink,
  FileCheck2,
  FileText,
  FolderSearch,
  MoreHorizontal,
  Plus,
} from "lucide-react"

import EmptyState from "@/components/EmptyState"
import { Panel } from "@/components/Panel"
import { SearchInput, TablePagination, TableToolbar } from "@/components/TableTools"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import CertificateFilters, {
  activeCertificateFilterCount,
  issuanceMatchesFilters,
  recordMatchesFilters,
  requestMatchesFilters,
  type CertificateFilterState,
} from "@/components/sectors/clerk/CertificateFilters"
import { CertificateStatusBadge } from "@/components/sectors/clerk/CertificateStatus"
import {
  certificateCopy,
  formatIsoDate,
  issuedStamp,
  type CertificateAllRecordRow,
  type CertificateIssuanceRecord,
  type CertificateRequestRecord,
  type CertificateTab,
} from "@/mock/clerk/certificates"

const PAGE_SIZES = [10, 25, 50]

const searchPlaceholders: Record<CertificateTab, string> = {
  requests: "Search resident, resident no., or reference...",
  issued: "Search resident, resident no., or issuance reference...",
  all: "Search all records by resident, resident no., or reference...",
}

const emptyCopy: Record<CertificateTab, { filtered: string; plain: string }> = {
  requests: {
    filtered: certificateCopy.filteredRequests,
    plain: certificateCopy.noRequests,
  },
  issued: {
    filtered: certificateCopy.filteredIssuances,
    plain: certificateCopy.noIssuances,
  },
  all: {
    filtered: certificateCopy.filteredRecords,
    plain: certificateCopy.noRecords,
  },
}

/**
 * One table for all three tabs of the certificates desk. Column sets, search
 * placeholder and empty copy follow the active tab, exactly as the backend's
 * listing does.
 */
export default function CertificateTable({
  tab,
  requests,
  issuances,
  records,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  onTabChange,
  onOpenRequest,
  onOpenIssuance,
  onIssue,
}: {
  tab: CertificateTab
  requests: CertificateRequestRecord[]
  issuances: CertificateIssuanceRecord[]
  records: CertificateAllRecordRow[]
  query: string
  onQueryChange: (value: string) => void
  filters: CertificateFilterState
  onFiltersChange: (next: CertificateFilterState) => void
  onTabChange: (tab: CertificateTab) => void
  onOpenRequest: (request: CertificateRequestRecord) => void
  onOpenIssuance: (issuance: CertificateIssuanceRecord) => void
  onIssue: (request: CertificateRequestRecord | null) => void
}) {
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const needle = query.trim().toLowerCase()

  const visibleRequests = useMemo(
    () => requests.filter((row) => requestMatchesFilters(row, filters, needle)),
    [requests, filters, needle],
  )
  const visibleIssuances = useMemo(
    () => issuances.filter((row) => issuanceMatchesFilters(row, filters, needle)),
    [issuances, filters, needle],
  )
  const visibleRecords = useMemo(
    () => records.filter((row) => recordMatchesFilters(row, filters, needle)),
    [records, filters, needle],
  )

  const rows: number =
    tab === "requests"
      ? visibleRequests.length
      : tab === "issued"
        ? visibleIssuances.length
        : visibleRecords.length

  const hasFilters = activeCertificateFilterCount(filters) > 0 || needle !== ""

  useEffect(() => {
    setPage(1)
  }, [tab, query, filters, pageSize])

  const pageStart = (page - 1) * pageSize
  const requestRows = visibleRequests.slice(pageStart, pageStart + pageSize)
  const issuanceRows = visibleIssuances.slice(pageStart, pageStart + pageSize)
  const recordRows = visibleRecords.slice(pageStart, pageStart + pageSize)

  return (
    <Panel>
      <TableToolbar>
        <SearchInput
          value={query}
          onChange={onQueryChange}
          placeholder={searchPlaceholders[tab]}
          className="w-full sm:max-w-xs"
        />
        <CertificateFilters
          tab={tab}
          filters={filters}
          onApply={onFiltersChange}
          onRecordTypeChange={onTabChange}
        />
        <div className="ml-auto flex items-center gap-3">
          <p className="text-xs text-ink-muted tnum">
            {rows} of{" "}
            {tab === "requests"
              ? requests.length
              : tab === "issued"
                ? issuances.length
                : records.length}{" "}
            {tab === "requests" ? "requests" : tab === "issued" ? "issuances" : "records"}
          </p>
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            Rows per page
            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[74px] bg-surface" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </TableToolbar>

      {tab === "all" && (
        <p className="border-b border-line-soft bg-info-soft px-5 py-2 text-xs text-info">
          {certificateCopy.allBanner}
        </p>
      )}

      {rows === 0 ? (
        <EmptyState
          icon={tab === "issued" ? FileCheck2 : FileText}
          title={hasFilters ? emptyCopy[tab].filtered : emptyCopy[tab].plain}
          description={
            hasFilters
              ? "Clear the filters or switch the record type to see the rest of the desk."
              : tab === "requests"
                ? "Requests filed from the resident portal land here for review."
                : tab === "issued"
                  ? "Generated certificates are archived here for reprinting."
                  : "Nothing has been filed or issued yet."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-surface"
                onClick={() => {
                  onFiltersChange({ certificateType: "all", status: "all", dateFrom: "", dateTo: "" })
                  onQueryChange("")
                }}
              >
                <FolderSearch className="size-4" /> Clear search &amp; filters
              </Button>
            ) : tab === "requests" ? (
              <Button size="sm" className="h-8" onClick={() => onIssue(null)}>
                <Plus className="size-4" /> Issue New Certificate
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            {tab === "requests" && (
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Reference</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="pr-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
            )}
            {tab === "issued" && (
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Reference</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Purok</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead className="pr-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
            )}
            {tab === "all" && (
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Purok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5">Date</TableHead>
                </TableRow>
              </TableHeader>
            )}

            <TableBody>
              {tab === "requests" &&
                requestRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-5">
                      <Link
                        to={`/clerk/certificates/${row.id}`}
                        className="font-mono text-xs font-medium text-ink-strong hover:text-brand"
                      >
                        {row.reference}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-ink-strong">{row.residentName}</p>
                      <p className="text-xs text-ink-muted font-mono">
                        {row.residentNumber ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-ink">{row.certificate}</TableCell>
                    <TableCell>
                      <CertificateStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-ink-muted tnum">
                      {formatIsoDate(row.submittedAt)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          className="bg-surface"
                          onClick={() => onOpenRequest(row)}
                        >
                          Details
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Actions for ${row.reference}`}
                              className="inline-grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-canvas hover:text-brand"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onOpenRequest(row)}>
                              <FileText className="size-4" /> Request details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/clerk/certificates/${row.id}`}>
                                <ExternalLink className="size-4" /> Open full record
                              </Link>
                            </DropdownMenuItem>
                            {row.issuanceId === null &&
                              (row.status === "Processing" || row.status === "Needs Action") && (
                                <DropdownMenuItem onSelect={() => onIssue(row)}>
                                  <Plus className="size-4" /> Issue Certificate
                                </DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {tab === "issued" &&
                issuanceRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-5">
                      <Link
                        to={`/clerk/certificates/iss-${row.id}`}
                        className="font-mono text-xs font-medium text-ink-strong hover:text-brand"
                      >
                        {row.reference}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-ink-strong">{row.residentName}</p>
                      <p className="text-xs text-ink-muted font-mono">
                        {row.residentNumber ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-ink">{row.certificate}</TableCell>
                    <TableCell className="text-ink-muted">{row.purok ?? "—"}</TableCell>
                    <TableCell className="text-ink-muted tnum">{issuedStamp(row)}</TableCell>
                    <TableCell className="text-ink-muted">{row.issuedBy}</TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        className="bg-surface"
                        onClick={() => onOpenIssuance(row)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

              {tab === "all" &&
                recordRows.map((row) => (
                  <TableRow key={`${row.recordType}-${row.id}`}>
                    <TableCell className="pl-5">
                      <CertificateStatusBadge
                        status={row.recordType === "issuance" ? "Issued" : "Request"}
                        tone={row.recordType === "issuance" ? "success" : "neutral"}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={
                          row.recordType === "issuance"
                            ? `/clerk/certificates/iss-${row.id}`
                            : `/clerk/certificates/${row.id}`
                        }
                        className="font-mono text-xs font-medium text-ink-strong hover:text-brand"
                      >
                        {row.reference}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-ink-strong">{row.residentName}</p>
                      <p className="text-xs text-ink-muted font-mono">
                        {row.residentNumber ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-ink">{row.certificate}</TableCell>
                    <TableCell className="text-ink-muted">{row.purok ?? "—"}</TableCell>
                    <TableCell>
                      <CertificateStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-ink-muted tnum">
                      {formatIsoDate(row.occurredAt)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={rows}
            onPageChange={setPage}
          />
        </>
      )}
    </Panel>
  )
}
