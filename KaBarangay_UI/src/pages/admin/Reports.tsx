import { useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import {
  Accessibility,
  Download,
  FileBadge,
  Loader2,
  PersonStanding,
  Scale,
  UserRound,
  Users,
} from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import {
  Meta,
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  buildReport,
  categoryLabels,
  categoryOptions,
  defaultFilters,
  downloadReportCsv,
  periodOptions,
  validateFilters,
  windowBoundary,
  type CountPoint,
  type ReportCategory,
  type ReportFilters,
  type ReportPeriod,
} from "@/mock/admin/reports"

/**
 * Admin Reports mirrors `Admin/ReportsController`: the filters are only
 * consulted when the form is submitted, population is always a current
 * snapshot, and the selected category narrows the detail sections and the CSV
 * export while the KPI summary stays complete.
 */

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold tracking-tight text-ink-strong">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{subtitle}</p>
    </div>
  )
}

/** Ranked rows scaled against the tallest bar; every zero means "no data". */
function ChartCard({ title, points, empty }: { title: string; points: CountPoint[]; empty: string }) {
  const max = Math.max(1, ...points.map((point) => point.count))

  return (
    <Panel>
      <PanelHeader className="px-4 py-3.5">
        <PanelTitle>{title}</PanelTitle>
      </PanelHeader>
      <PanelContent className="p-4">
        {points.every((point) => point.count === 0) ? (
          <p className="rounded-lg bg-canvas px-3 py-4 text-sm text-ink-muted">{empty}</p>
        ) : (
          <ol
            aria-label={title}
            className="max-h-72 space-y-2.5 overflow-auto pr-1.5"
          >
            {points.map((point) => (
              <li
                key={point.label}
                className="grid grid-cols-[minmax(5rem,8rem)_1fr_3.25rem] items-center gap-2 text-xs"
              >
                <span className="truncate text-ink-muted" title={point.label}>
                  {point.label}
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                  <span
                    className="block h-full rounded-full bg-brand transition-all duration-500"
                    style={{ width: `${(point.count / max) * 100}%` }}
                  />
                </span>
                <span className="text-right font-semibold text-ink-strong tnum">{point.count}</span>
              </li>
            ))}
          </ol>
        )}
      </PanelContent>
    </Panel>
  )
}

/** A note the controller prints verbatim; the amber tone flags "read me first". */
function Advisory({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-xs leading-relaxed text-warning">
      {children}
    </p>
  )
}

/* ------------------------------------------------------------------ */
/* Date anchor control                                                 */
/* ------------------------------------------------------------------ */

const anchorLabel: Record<Exclude<ReportPeriod, "range">, string> = {
  daily: "Day",
  weekly: "Any day in week",
  monthly: "Month",
  yearly: "Year",
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminReports() {
  // The reference keeps the form in local state and only sends it on submit,
  // so the printed report always describes the *applied* filters.
  const [draft, setDraft] = useState<ReportFilters>(defaultFilters)
  const [applied, setApplied] = useState<ReportFilters>(defaultFilters)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)

  // Desks are live in-memory stores, so each generation re-reads them.
  const [revision, setRevision] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const report = useMemo(() => buildReport(applied), [applied, revision])
  const draftErrors = validateFilters(draft)
  const isDraftValid = Object.keys(draftErrors).length === 0

  const generate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isDraftValid) {
      // A rejected request leaves the previous report on screen.
      setErrors(draftErrors)
      return
    }
    setErrors({})
    setGenerating(true)
    timer.current = window.setTimeout(() => {
      setApplied(draft)
      setRevision((current) => current + 1)
      setGenerating(false)
    }, 500)
  }

  const set = (patch: Partial<ReportFilters>) => setDraft((current) => ({ ...current, ...patch }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Management overview"
        title="Admin Reports"
        description="Barangay-scoped summaries for planning and monitoring."
      />

      <Panel>
        <PanelContent className="space-y-4 p-4">
          <form onSubmit={generate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Meta label="Reporting period">
                <Select
                  value={draft.period}
                  onValueChange={(value) => set({ period: value as ReportPeriod })}
                >
                  <SelectTrigger className="w-full bg-surface" aria-label="Reporting period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Meta>

              {draft.period === "range" ? (
                <>
                  <Meta label="From">
                    <Input
                      type="date"
                      aria-label="From date"
                      className="bg-surface tnum"
                      value={draft.date_from}
                      onChange={(event) => set({ date_from: event.target.value })}
                    />
                    {errors.date_from && (
                      <p className="mt-1 text-xs text-danger">{errors.date_from}</p>
                    )}
                  </Meta>
                  <Meta label="To">
                    <Input
                      type="date"
                      aria-label="To date"
                      className="bg-surface tnum"
                      value={draft.date_to}
                      onChange={(event) => set({ date_to: event.target.value })}
                    />
                    {errors.date_to && <p className="mt-1 text-xs text-danger">{errors.date_to}</p>}
                  </Meta>
                </>
              ) : (
                <Meta label={anchorLabel[draft.period]}>
                  {draft.period === "yearly" ? (
                    <Input
                      type="number"
                      min="2000"
                      max="2100"
                      aria-label="Year"
                      className="bg-surface tnum"
                      value={draft.date.slice(0, 4)}
                      onChange={(event) => set({ date: `${event.target.value}-01-01` })}
                    />
                  ) : (
                    <Input
                      type={draft.period === "monthly" ? "month" : "date"}
                      aria-label={anchorLabel[draft.period]}
                      className="bg-surface tnum"
                      value={draft.period === "monthly" ? draft.date.slice(0, 7) : draft.date}
                      onChange={(event) =>
                        set({
                          date:
                            draft.period === "monthly" ? `${event.target.value}-01` : event.target.value,
                        })
                      }
                    />
                  )}
                  {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}
                </Meta>
              )}

              <Meta label="Report category">
                <Select
                  value={draft.category}
                  onValueChange={(value) => set({ category: value as ReportCategory })}
                >
                  <SelectTrigger className="w-full bg-surface" aria-label="Report category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Meta>
            </div>

            {errors.period && (
              <p role="alert" className="text-sm text-danger">
                {errors.period}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={generating}>
                {generating && <Loader2 className="size-4 animate-spin" />}
                {generating ? "Generating…" : "Generate report"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!isDraftValid}
                onClick={() => downloadReportCsv(draft)}
                title={isDraftValid ? undefined : "Fix the filters to enable the export"}
              >
                <Download />
                Export aggregate CSV
              </Button>
              {!isDraftValid && (
                <span className="text-xs text-ink-faint">
                  {Object.values(draftErrors)[0]}
                </span>
              )}
            </div>
          </form>

          <p className="text-[11px] leading-relaxed text-ink-faint">
            Activity: {report.window.label} · {report.window.timezone}. Population cards are current
            snapshots. Category selection filters detail sections and export; the KPI summary stays
            complete. {windowBoundary}
          </p>
        </PanelContent>
      </Panel>

      <section aria-labelledby="summary-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="summary-heading" className="text-sm font-semibold tracking-tight text-ink-strong">
              Management summary
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Resident totals match the approved Residents directory; service totals use the selected
              period.
            </p>
          </div>
          <span className="text-xs text-ink-faint">{categoryLabels[applied.category]}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={Users}
            label="Total active Residents"
            value={report.population.metrics["Total active Residents"] ?? 0}
            hint="Approved residents with active accounts"
          />
          <StatCard
            icon={UserRound}
            label="General Residents"
            value={report.population.metrics["General Residents"] ?? 0}
            hint="Approved residents with no sector membership"
            tone="neutral"
          />
          <StatCard
            icon={Accessibility}
            label="PWD"
            value={report.population.metrics.PWD ?? 0}
            hint="Distinct approved resident members"
            tone="neutral"
          />
          <StatCard
            icon={PersonStanding}
            label="Senior Citizens"
            value={report.population.metrics["Senior Citizens"] ?? 0}
            hint="Distinct approved resident members"
            tone="neutral"
          />
          <StatCard
            icon={FileBadge}
            label="Certificate issuances"
            value={report.certificates.count}
            hint="Generated/recorded in period"
            tone="neutral"
          />
          <StatCard
            icon={Scale}
            label="Lupon cases filed"
            value={report.lupon.count}
            hint="By filed date in period"
            tone="neutral"
          />
        </div>

        <Advisory>{report.population.distribution_note}</Advisory>
      </section>

      {(applied.category === "all" || applied.category === "population") && (
        <section aria-labelledby="population-heading">
          <SectionHeading
            title="Population reports"
            subtitle="Current approved residents with active accounts; not affected by activity date filters."
          />
          <ChartCard
            title="Sector membership breakdown"
            points={report.population.sectors}
            empty="No sectors are configured."
          />
        </section>
      )}

      {(applied.category === "all" || applied.category === "certificates") && (
        <section aria-labelledby="certificate-heading" className="space-y-3">
          <SectionHeading title="Certificate reports" subtitle={report.certificates.meaning} />
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Certificate issuance activity"
              points={report.certificates.trend}
              empty="No certificate issuances in this period."
            />
            <ChartCard
              title="Generated issuances by certificate type"
              points={report.certificates.by_type}
              empty="No certificate types were issued in this period."
            />
          </div>
        </section>
      )}

      {(applied.category === "all" || applied.category === "lupon") && (
        <section aria-labelledby="lupon-heading" className="space-y-3">
          <SectionHeading title="Lupon reports" subtitle={report.lupon.meaning} />
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Cases filed activity"
              points={report.lupon.trend}
              empty="No cases were filed in this period."
            />
            <ChartCard
              title="Cases by type"
              points={report.lupon.by_type}
              empty="No case types were filed in this period."
            />
          </div>
        </section>
      )}

      {(applied.category === "all" || applied.category === "programs") && (
        <section aria-labelledby="program-heading" className="space-y-3">
          <SectionHeading
            title="Programs & attendance reports"
            subtitle="Only approved, published Event or attendance-required announcements with an event date are included."
          />
          <Panel>
            <PanelContent className="p-4 text-sm text-ink">
              <span className="font-semibold text-brand tnum">{report.programs.count}</span>{" "}
              approved and published programs in the selected period.
            </PanelContent>
          </Panel>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Program activity by event date"
              points={report.programs.trend}
              empty="No eligible programs in this period."
            />
            <ChartCard
              title="Programs by category"
              points={report.programs.by_category}
              empty="No program categories in this period."
            />
            <ChartCard
              title="Attendance records by status"
              points={report.programs.attendance}
              empty="No attendance records for eligible programs in this period."
            />
          </div>
        </section>
      )}

      {(applied.category === "all" || applied.category === "financial") && (
        <section aria-labelledby="financial-heading" className="space-y-3">
          <SectionHeading
            title="Financial reports"
            subtitle="Unavailable until an authoritative revenue and expense source is established."
          />
          <Panel>
            <PanelContent className="p-5">
              <Advisory>
                {report.financial.message} Certificate fee snapshots and payment statuses are not
                treated as collected revenue.
              </Advisory>
            </PanelContent>
          </Panel>
        </section>
      )}
    </div>
  )
}
