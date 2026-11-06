import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { FileText, SearchX } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import EmptyState from "@/components/EmptyState"
import StatusBadge from "@/components/StatusBadge"
import { cn } from "@/lib/utils"
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { SearchInput, TablePagination, TableToolbar } from "@/components/TableTools"
import { Button } from "@/components/ui/button"
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
import {
  CERTIFICATES_PAGE_SIZE,
  certificateRequestPage,
  certificateStats,
  certificateStatusFilter,
  certificateStatusTone,
  formatPeso,
} from "@/mock/admin/certificates"
import { certificateStatuses } from "@/mock/clerk/certificates"

/**
 * Certificate Requests mirrors `Admin/CertificateRequestController`: an
 * aggregate monitor only. Search, status filter and paging reach the read
 * model, the four tiles always count the whole barangay, and there is no way
 * to change a request here — processing belongs to the Clerk desk.
 */

function Tile({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-card",
        highlight ? "border-brand bg-brand text-white" : "border-line-soft bg-surface",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-wide",
          highlight ? "text-white/80" : "text-ink-faint",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tnum",
          highlight ? "text-white" : "text-ink-strong",
        )}
      >
        {value}
      </p>
    </div>
  )
}

export default function AdminCertificates() {
  const [params, setParams] = useSearchParams()

  const appliedSearch = params.get("search") ?? ""
  const appliedStatus = params.get("status") ?? ""
  const status = certificateStatusFilter(appliedStatus)
  const requestedPage = Number(params.get("page")) || 1

  // The box holds what is typed; the list follows it once the pause is over.
  const [query, setQuery] = useState(appliedSearch)
  const lastApplied = useRef(appliedSearch)

  const push = (patch: { search?: string; status?: string; page?: string | number }) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      const text = String(value ?? "")
      if (text === "") next.delete(key)
      else next.set(key, text)
    }
    setParams(next, { replace: true })
  }

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed === lastApplied.current) return

    const timer = window.setTimeout(() => {
      lastApplied.current = trimmed
      push({ search: trimmed, page: "" })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query])

  const page = useMemo(
    () => certificateRequestPage(appliedSearch, status, requestedPage),
    // The queue is a live store, so every render re-reads it.
    [appliedSearch, status, requestedPage],
  )

  const stats = certificateStats()
  const hasFilters = appliedSearch.trim() !== "" || status !== null
  const rows = page.data

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Certificate Requests"
        description="Monitor aggregate certificate request activity submitted by residents."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Tile label="Total" value={stats.total} highlight />
        <Tile label="Pending" value={stats.byStatus.Pending} />
        <Tile label="Processing" value={stats.byStatus.Processing} />
        <Tile label="Ready for Claim" value={stats.byStatus["Ready for Claim"]} />
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Request queue</PanelTitle>
            <PanelDescription>
              Read-only monitoring. Statuses are set by the Clerk certificate desk.
            </PanelDescription>
          </div>
        </PanelHeader>

        <TableToolbar>
          <div className="w-full max-w-md">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by reference, resident, resident no., certificate, or purpose…"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-ink-faint">Status</span>
            <Select
              value={appliedStatus === "" ? "all" : appliedStatus}
              onValueChange={(value) =>
                push({ status: value === "all" ? "" : value, page: "" })
              }
            >
              <SelectTrigger size="sm" className="h-9 w-48 bg-surface" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {certificateStatuses.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {entry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-ink-muted"
                onClick={() => {
                  setQuery("")
                  lastApplied.current = ""
                  push({ search: "", status: "", page: "" })
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </TableToolbar>

        {rows.length === 0 ? (
          <EmptyState
            icon={hasFilters ? SearchX : FileText}
            title={hasFilters ? "No requests match the current filters." : "No certificate requests found."}
            description="Requests filed from the resident portal appear here as soon as they are submitted."
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 bg-surface"
                  onClick={() => {
                    setQuery("")
                    lastApplied.current = ""
                    push({ search: "", status: "", page: "" })
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Reference</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead className="pr-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="pl-5">
                    <div className="leading-tight">
                      <p className="text-sm font-medium text-ink-strong tnum">{request.reference}</p>
                      <p className="text-[11px] text-ink-faint tnum">{request.submittedAt}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="leading-tight">
                      <p className="text-sm text-ink-strong">{request.residentName}</p>
                      {request.residentNumber && (
                        <p className="text-[11px] text-ink-faint tnum">{request.residentNumber}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="leading-tight">
                      <p className="text-sm text-ink">{request.certificate}</p>
                      <p className="text-[11px] text-ink-faint">{request.purpose}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-ink-muted tnum">{formatPeso(request.fee)}</TableCell>
                  <TableCell className="pr-5">
                    <StatusBadge status={request.status} tone={certificateStatusTone[request.status]} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {rows.length > 0 && (
          <TablePagination
            page={page.currentPage}
            pageSize={CERTIFICATES_PAGE_SIZE}
            total={page.total}
            label={hasFilters ? "matching requests" : "requests"}
            onPageChange={(value) => push({ page: value })}
          />
        )}
      </Panel>
    </div>
  )
}
