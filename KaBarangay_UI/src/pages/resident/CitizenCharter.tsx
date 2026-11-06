/**
 * Resident portal — Citizen's Charter directory.
 *
 * The `Resident/CitizenCharter` page of commit b6030a08: a searchable,
 * category-filtered grid of the published service standards, twelve to a page,
 * each card carrying its category, the size of its official PDF, its published
 * date and a link to the document. The filter form is what the reference's
 * `router.get(..., only: ['services', 'filters'])` round-trip becomes here —
 * filter state in the page, rows from the mock store.
 */

import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Download, FileText } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import { Panel, PanelContent } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { TablePagination } from "@/components/TableTools"
import { formatCharterDate, formatCharterFileSize } from "@/mock/clerk/charter"
import {
  CHARTER_SERVICES_PER_PAGE,
  charterCategories,
  charterServicesPage,
  trimCharterSearch,
  type ResidentCharterService,
} from "@/mock/resident/charter"
import { cn } from "@/lib/utils"

type Filters = { search: string; category: string }

export default function CitizenCharter() {
  const [filters, setFilters] = useState<Filters>({ search: "", category: "" })
  const [draft, setDraft] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  const categories = charterCategories()
  const services = charterServicesPage(filters)

  const apply = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next }

    // A fresh query is a fresh page, which is what `withQueryString()` drops.
    setFilters({ search: trimCharterSearch(merged.search), category: merged.category })
    setDraft(merged.search)
    setNotice(null)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    apply({ search: draft })
  }

  const download = (service: ResidentCharterService) => {
    const version = service.current_version
    if (!version) return

    setNotice(
      `${version.original_name} is simulated in this demo — only its name and size are on file, so there is nothing to download.`,
    )
  }

  const isFiltered = filters.search !== "" || filters.category !== ""

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink-strong">
          Citizen&apos;s Charter
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          Official barangay service directory, requirements, fees, and procedures.
        </p>
      </header>

      <Panel className="p-0">
        <PanelContent className="space-y-3">
          <form onSubmit={submit} className="flex gap-2">
            <label className="sr-only" htmlFor="charter-search">
              Search services
            </label>
            <input
              id="charter-search"
              type="text"
              placeholder="Search barangay services, procedures..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <Button type="submit" className="h-10 shrink-0 px-4">
              Search
            </Button>
          </form>

          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <CategoryPill
                label="All Categories"
                active={filters.category === ""}
                onSelect={() => apply({ category: "" })}
              />
              {categories.map((category) => (
                <CategoryPill
                  key={category}
                  label={category}
                  active={filters.category === category}
                  onSelect={() => apply({ category })}
                />
              ))}
            </div>
          )}
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

      {services.data.length === 0 ? (
        <Panel className="p-0">
          <EmptyState
            icon={FileText}
            title="No Published Services Available"
            description={
              isFiltered
                ? "No services match your search criteria. Try clearing the filter."
                : "The barangay has not published any Citizen's Charter services yet."
            }
            action={
              isFiltered ? (
                <Button variant="secondary" size="sm" className="h-9" onClick={() => apply({ search: "", category: "" })}>
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {services.data.map((service) => (
              <CharterCard key={service.id} service={service} onDownload={download} />
            ))}
          </div>

          <TablePagination
            page={services.current_page}
            pageSize={CHARTER_SERVICES_PER_PAGE}
            total={services.total}
            label="services"
            className="rounded-xl border border-line-soft bg-surface"
          />
        </>
      )}
    </div>
  )
}

function CategoryPill({
  label,
  active,
  onSelect,
}: {
  label: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "min-h-8 rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
        active ? "bg-brand text-white shadow-card" : "bg-canvas text-ink-muted hover:bg-brand-soft",
      )}
    >
      {label}
    </button>
  )
}

function CharterCard({
  service,
  onDownload,
}: {
  service: ResidentCharterService
  onDownload: (service: ResidentCharterService) => void
}) {
  return (
    <Panel className="flex h-full flex-col p-0">
      <PanelContent className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full border border-brand-muted bg-brand-soft px-2.5 py-0.5 text-[10px] font-bold text-brand-deep">
            {service.category || "General Service"}
          </span>
          {service.current_version && (
            <span className="text-[10px] text-ink-faint tnum">
              {formatCharterFileSize(service.current_version.file_size)} PDF
            </span>
          )}
        </div>

        <h2 className="mt-3 line-clamp-2 text-base font-semibold tracking-tight text-ink-strong">
          {service.title}
        </h2>

        {service.description && (
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-muted">
            {service.description}
          </p>
        )}
      </PanelContent>

      <div className="flex items-center justify-between gap-2 border-t border-line-soft px-5 py-3">
        <span className="text-[10px] text-ink-faint">
          Published: {formatCharterDate(service.published_at ?? undefined)}
        </span>

        <div className="flex items-center gap-2">
          {service.download_url && (
            <button
              type="button"
              onClick={() => onDownload(service)}
              aria-label={`Download the PDF of ${service.title}`}
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-line-soft bg-surface text-ink-muted transition-colors hover:border-brand hover:text-brand"
            >
              <Download className="size-4" />
            </button>
          )}
          <Button size="sm" className="h-8" asChild>
            <Link to={service.detail_url}>
              View Details <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Panel>
  )
}
