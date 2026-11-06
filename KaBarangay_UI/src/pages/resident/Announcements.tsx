/**
 * Resident portal — Barangay Updates & Advisories.
 *
 * The read side of `Resident\AnnouncementController::index`, which serves both
 * `/resident/announcements` and `/resident/updates` from this one page. `kind`
 * decides which slice of the notice table the resident sees, and on the updates
 * board `period` splits the informational notices by `completed_at`.
 *
 * Search, category and importance live in the query string exactly as the
 * controller validates them: a typed term only counts once the form is
 * submitted, a dropdown applies on change, and every change restarts page one.
 */
import { useEffect, useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CalendarDays, MapPin, Megaphone, Search } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import { Panel } from "@/components/Panel"
import { TablePagination } from "@/components/TableTools"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ANNOUNCEMENTS_PER_PAGE,
  announcementCategories,
  audienceLabel,
  boardPage,
  categoryLabel,
  formatShortDate,
  formatShortDateTime,
  hasActiveFilters,
  importanceLabel,
  importanceOptions,
  targetAudienceOf,
  type BoardFilters,
  type ResidentAnnouncement,
  type ResidentBoard,
  type ResidentPeriod,
} from "@/mock/resident/announcements"
import { cn } from "@/lib/utils"

/** The two boards this page renders; programs has its own surface. */
export type AnnouncementsKind = Exclude<ResidentBoard, "programs">

const ALL = "all"

const NEUTRAL_CHIP = "bg-canvas text-ink-muted ring-1 ring-inset ring-line-soft"

function readFilters(params: URLSearchParams): BoardFilters {
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    importance: params.get("importance") ?? "",
  }
}

/** `getCategoryBadgeStyle` — the category picks the colour, not the record. */
function categoryTone(category: string) {
  const cat = category.toLowerCase()

  if (/(emergency|urgent|advisory)/.test(cat)) return "bg-danger-soft text-destructive"
  if (/(event|activity)/.test(cat)) return "bg-info-soft text-info"
  if (/(aid|distribution|ayuda|financial)/.test(cat)) return "bg-warning-soft text-warning"

  return "bg-brand-soft text-brand"
}

/** `getImportanceBadgeStyle`. */
function importanceTone(importance: string) {
  switch (importance) {
    case "urgent":
      return "bg-danger-soft text-destructive"
    case "high":
      return "bg-warning-soft text-warning"
    case "low":
      return NEUTRAL_CHIP
    default:
      return "bg-brand-soft text-brand"
  }
}

function Chip({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        "rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase",
        tone,
      )}
    >
      {label}
    </span>
  )
}

export function AnnouncementsBoard({ kind }: { kind: AnnouncementsKind }) {
  const [params, setParams] = useSearchParams()
  const isUpdates = kind === "updates"
  const period: ResidentPeriod = params.get("period") === "past" ? "past" : "current"
  const filters = readFilters(params)
  const requestedPage = Number(params.get("page") ?? 1)

  const [query, setQuery] = useState(filters.q)
  const [filtering, setFiltering] = useState(false)

  /* A new query string — a reset, or the back link from a detail page — always
     wins over whatever the resident has typed in the box. */
  useEffect(() => setQuery(filters.q), [filters.q])

  const categories = announcementCategories(kind, period)
  const board = boardPage(kind, period, filters, Number.isFinite(requestedPage) ? requestedPage : 1)
  const filteringActive = hasActiveFilters(filters)

  const visit = (next: BoardFilters, nextPage = 1, nextPeriod = period) => {
    const search = new URLSearchParams()
    if (next.q.trim()) search.set("q", next.q.trim())
    if (next.category) search.set("category", next.category)
    if (next.importance) search.set("importance", next.importance)
    if (nextPage > 1) search.set("page", String(nextPage))
    if (isUpdates) search.set("period", nextPeriod)

    setParams(search, { replace: true })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFiltering(true)
    visit({ q: query, category: filters.category, importance: filters.importance })
    setFiltering(false)
  }

  const clearFilters = () => {
    setQuery("")
    setFiltering(true)
    visit({ q: "", category: "", importance: "" })
    setFiltering(false)
  }

  const detailHref = (row: ResidentAnnouncement) =>
    `/resident/${kind}/${row.id}${isUpdates ? `?period=${period}` : ""}`

  const title = !isUpdates
    ? "Barangay Updates & Advisories"
    : period === "past"
      ? "Past Updates"
      : "Current Updates"

  const description = !isUpdates
    ? "Stay updated with official news, events, and community distribution schedules."
    : period === "past"
      ? "Browse completed informational updates from your barangay."
      : "Official informational updates currently in effect."

  const noun = isUpdates ? "update" : "announcement"

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-ink-strong">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </section>

      {isUpdates && (
        <SegmentedTabs
          aria-label="Update history"
          segments={[
            { value: "current", label: "Current Updates" },
            { value: "past", label: "Past Updates" },
          ]}
          value={period}
          onChange={(value) =>
            visit({ q: "", category: "", importance: "" }, 1, value === "past" ? "past" : "current")
          }
        />
      )}

      {/* Search and filters */}
      <Panel>
        <form
          onSubmit={handleSubmit}
          aria-label={isUpdates ? "Search and filter updates" : "Search and filter announcements"}
        >
          <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <Label htmlFor="announcement-search" className="mb-1.5 block">
                {isUpdates ? "Search updates" : "Search announcements"}
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
                <Input
                  id="announcement-search"
                  type="search"
                  value={query}
                  maxLength={100}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title or content"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:w-[340px]">
              <div>
                <Label htmlFor="announcement-category" className="mb-1.5 block">
                  Category
                </Label>
                <Select
                  value={filters.category === "" ? ALL : filters.category}
                  onValueChange={(value) =>
                    visit(
                      {
                        q: query,
                        category: value === ALL ? "" : value,
                        importance: filters.importance,
                      },
                      1,
                    )
                  }
                >
                  <SelectTrigger id="announcement-category" className="bg-surface">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {categoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="announcement-importance" className="mb-1.5 block">
                  Importance
                </Label>
                <Select
                  value={filters.importance === "" ? ALL : filters.importance}
                  onValueChange={(value) =>
                    visit(
                      { q: query, category: filters.category, importance: value === ALL ? "" : value },
                      1,
                    )
                  }
                >
                  <SelectTrigger id="announcement-importance" className="bg-surface">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All importance</SelectItem>
                    {importanceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button type="submit" disabled={filtering}>
                {filtering ? "Searching…" : "Search"}
              </Button>

              {filteringActive && (
                <Button type="button" variant="outline" disabled={filtering} onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </form>
      </Panel>

      {/* Results summary — the count itself is the pagination footer's line. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {board.total === 0 && (
          <p className="text-xs text-ink-muted" aria-live="polite">
            {`No ${isUpdates ? (period === "past" ? "past updates" : "current updates") : "announcements"} found`}
          </p>
        )}

        {filteringActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-brand hover:text-brand-hover"
          >
            Reset search and filters
          </button>
        )}
      </div>

      {board.rows.length === 0 ? (
        <Panel className="p-0">
          <EmptyState
            icon={filteringActive ? Search : Megaphone}
            title={
              filteringActive
                ? "No announcements match your search"
                : isUpdates
                  ? period === "past"
                    ? "No past updates"
                    : "No current updates"
                  : "No active announcements"
            }
            description={
              filteringActive
                ? "Try a different keyword, category, or importance level."
                : "Please check back later for official updates from your barangay."
            }
            action={
              filteringActive && (
                <Button size="sm" className="mt-1" onClick={clearFilters}>
                  Clear search and filters
                </Button>
              )
            }
          />
        </Panel>
      ) : (
        <ul className="space-y-3">
          {board.rows.map((row) => (
            <li key={row.id}>
              <article className="rounded-xl border border-line-soft bg-surface p-4 shadow-card sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip label={categoryLabel(row.category)} tone={categoryTone(row.category)} />

                    {row.importance && row.importance !== "normal" && (
                      <Chip
                        label={importanceLabel(row.importance)}
                        tone={importanceTone(row.importance)}
                      />
                    )}

                    {targetAudienceOf(row.audience) !== "all" && (
                      <Chip label={audienceLabel(row)} tone={NEUTRAL_CHIP} />
                    )}
                  </div>

                  <time className="text-xs text-ink-faint tnum">
                    {formatShortDate(row.createdAt)}
                  </time>
                </div>

                <h2 className="text-base font-semibold tracking-tight text-ink-strong sm:text-lg">
                  <Link to={detailHref(row)} className="hover:text-brand">
                    {row.title}
                  </Link>
                </h2>

                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink">
                  {row.content}
                </p>

                {row.eventStartAt && (
                  <div className="mt-4 flex flex-col gap-2 rounded-lg border border-line-soft bg-canvas px-3.5 py-3 text-xs text-ink sm:flex-row sm:items-center sm:gap-6 sm:text-[13px]">
                    <p className="flex items-center gap-2 text-brand-deep">
                      <CalendarDays className="size-4 shrink-0" />
                      <span>
                        <strong>Schedule:</strong> {formatShortDateTime(row.eventStartAt)}
                      </span>
                    </p>

                    {row.location && (
                      <p className="flex items-center gap-2 text-brand-deep">
                        <MapPin className="size-4 shrink-0" />
                        <span>
                          <strong>Venue:</strong> {row.location}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
                  {row.author ? (
                    <p className="text-xs text-ink-faint">
                      Posted by: <span className="font-medium text-ink-muted">{row.author}</span>
                    </p>
                  ) : (
                    <span />
                  )}

                  <Link
                    to={detailHref(row)}
                    className="shrink-0 text-xs font-semibold text-brand hover:text-brand-hover"
                  >
                    View details
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {board.total > 0 && (
        <TablePagination
          page={board.page}
          pageSize={ANNOUNCEMENTS_PER_PAGE}
          total={board.total}
          label={board.total === 1 ? noun : `${noun}s`}
          onPageChange={(next) => visit(filters, next)}
        />
      )}
    </div>
  )
}

export default function Announcements() {
  return <AnnouncementsBoard kind="announcements" />
}
