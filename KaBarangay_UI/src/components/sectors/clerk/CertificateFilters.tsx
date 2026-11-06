import { useEffect, useState } from "react"
import { ListFilter } from "lucide-react"

import { Meta } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  certificateStatuses,
  certificateTypes,
  type CertificateAllRecordRow,
  type CertificateIssuanceRecord,
  type CertificateRequestRecord,
  type CertificateTab,
} from "@/mock/clerk/certificates"

export type CertificateFilterState = {
  /** `all` or a certificate type value. */
  certificateType: string
  /** Only offered on the Requests tab, where every row carries a workflow status. */
  status: string
  dateFrom: string
  dateTo: string
}

export const emptyCertificateFilters: CertificateFilterState = {
  certificateType: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
}

export function activeCertificateFilterCount(
  filters: CertificateFilterState,
): number {
  return [
    filters.certificateType !== "all",
    filters.status !== "all",
    filters.dateFrom !== "",
    filters.dateTo !== "",
  ].filter(Boolean).length
}

/** ISO dates compare correctly as text, which is all a date range needs. */
function inRange(iso: string, from: string, to: string): boolean {
  if (from && iso < from) return false
  if (to && iso > to) return false
  return true
}

/**
 * The backend splits the search on whitespace, strips the LIKE wildcards, and
 * requires every token to hit at least one indexed column. Wildcard-only input
 * therefore matches nothing, which `[]` and "no filter" (`null`) must not share.
 */
function searchTokens(needle: string): string[] | null {
  if (needle === "") return null
  const tokens = needle
    .split(/\s+/)
    .map((token) => token.replace(/[%_]/g, ""))
    .filter((token) => token !== "")
  return tokens.length > 0 ? tokens : []
}

/** Each searchable column, reduced to the whole words the backend can match. */
function searchableFields(...columns: Array<string | null | undefined>): string[] {
  return columns
    .filter((column): column is string => typeof column === "string")
    .flatMap((column) => column.split(/\s+/))
    .filter((fragment) => fragment !== "")
    .map((fragment) => fragment.toLowerCase())
}

function matchesEveryToken(needle: string, columns: string[]): boolean {
  const tokens = searchTokens(needle)
  if (tokens === null) return true
  return tokens.every((token) => columns.some((column) => column.includes(token)))
}

export function requestMatchesFilters(
  row: CertificateRequestRecord,
  filters: CertificateFilterState,
  needle: string,
): boolean {
  if (filters.certificateType !== "all" && row.certificateType !== filters.certificateType) return false
  if (filters.status !== "all" && row.status !== filters.status) return false
  if (!inRange(row.submittedAt, filters.dateFrom, filters.dateTo)) return false
  return matchesEveryToken(
    needle,
    searchableFields(row.reference, row.residentName, row.residentNumber),
  )
}

export function issuanceMatchesFilters(
  row: CertificateIssuanceRecord,
  filters: CertificateFilterState,
  needle: string,
): boolean {
  if (filters.certificateType !== "all" && row.certificateType !== filters.certificateType) return false
  if (!inRange(row.issuedAt, filters.dateFrom, filters.dateTo)) return false
  return matchesEveryToken(
    needle,
    searchableFields(row.reference, row.residentName, row.residentNumber),
  )
}

export function recordMatchesFilters(
  row: CertificateAllRecordRow,
  filters: CertificateFilterState,
  needle: string,
): boolean {
  if (filters.certificateType !== "all" && row.certificateType !== filters.certificateType) return false
  if (!inRange(row.occurredAt, filters.dateFrom, filters.dateTo)) return false
  return matchesEveryToken(
    needle,
    searchableFields(row.reference, row.residentName, row.residentNumber),
  )
}

const tabOptions: { value: CertificateTab; label: string }[] = [
  { value: "all", label: "All Records" },
  { value: "requests", label: "Requests" },
  { value: "issued", label: "Issued / Completed" },
]

/**
 * The filter popover behind the table toolbar. Fields follow the active tab:
 * Record Type switches tab, Status only exists where statuses do.
 */
export default function CertificateFilters({
  tab,
  filters,
  onApply,
  onRecordTypeChange,
}: {
  tab: CertificateTab
  filters: CertificateFilterState
  onApply: (next: CertificateFilterState) => void
  onRecordTypeChange: (tab: CertificateTab) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<CertificateFilterState>(filters)

  // Re-opening the popover always starts from the filters actually in force.
  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  const active = activeCertificateFilterCount(filters)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 bg-surface font-medium">
          <ListFilter className="size-4" /> Filters
          {active > 0 && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold leading-none text-surface tnum">
              {active}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-0 p-4">
        <div className="space-y-3">
          <Meta label="Certificate Type">
            <Select
              value={draft.certificateType}
              onValueChange={(value) => setDraft((current) => ({ ...current, certificateType: value }))}
            >
              <SelectTrigger className="w-full bg-surface" aria-label="Filter by certificate type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {certificateTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.certificate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Meta>

          <Meta label="Record Type">
            <Select
              value={tab}
              onValueChange={(value) => onRecordTypeChange(value as CertificateTab)}
            >
              <SelectTrigger className="w-full bg-surface" aria-label="Switch record type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tabOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Meta>

          {tab === "requests" && (
            <Meta label="Status">
              <Select
                value={draft.status}
                onValueChange={(value) => setDraft((current) => ({ ...current, status: value }))}
              >
                <SelectTrigger className="w-full bg-surface" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {certificateStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Meta>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Meta label="From">
              <Input
                type="date"
                aria-label="Filter from date"
                className="bg-surface tnum"
                value={draft.dateFrom}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, dateFrom: event.target.value }))
                }
              />
            </Meta>
            <Meta label="To">
              <Input
                type="date"
                aria-label="Filter to date"
                className="bg-surface tnum"
                value={draft.dateTo}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, dateTo: event.target.value }))
                }
              />
            </Meta>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-line-soft pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-ink-muted"
            onClick={() => {
              setDraft(emptyCertificateFilters)
              onApply(emptyCertificateFilters)
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onApply(draft)
              setOpen(false)
            }}
          >
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
