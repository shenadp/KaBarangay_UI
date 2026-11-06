/**
 * The barangay leadership chart, as residents see it.
 *
 * Ports `components/org-chart/BarangayOrgChart` of commit b6030a08: the captain
 * sits alone on top, the legislative branch hangs off the captain's stem, the
 * appointed officials hang off the elbow beneath it, and everything that is
 * neither becomes a grid of "Other Barangay Positions". Nothing about the saved
 * parent links changes — the grouping is a presentation of the same tree — and
 * the canvas keeps a minimum width so the row of Kagawads never wraps, with the
 * sideways-scroll hint on small screens.
 *
 * It is read-only by construction: selecting a card only tells the page which
 * position to describe in its aside.
 */

import type { ReactNode } from "react"

import OrgChartAvatar from "@/components/org-chart/OrgChartAvatar"
import { cn } from "@/lib/utils"
import { groupOrgChart, type OrgChartNode } from "@/mock/orgChart"

type Tone = "leadership" | "legislative" | "support" | "other"

const accents: Record<Tone, string> = {
  leadership: "border-t-success bg-success-soft",
  legislative: "border-t-info bg-info-soft",
  support: "border-t-warning bg-warning-soft",
  other: "border-t-line bg-canvas",
}

const labels: Record<Tone, string> = {
  leadership: "text-success",
  legislative: "text-info",
  support: "text-warning",
  other: "text-ink-muted",
}

const legendDots: Record<Exclude<Tone, "other">, string> = {
  leadership: "bg-success",
  legislative: "bg-info",
  support: "bg-warning",
}

type Props = {
  tree: OrgChartNode[]
  selectedId?: number | null
  onSelect?: (position: OrgChartNode) => void
}

export default function BarangayOrgChart({ tree, selectedId, onSelect }: Props) {
  const chart = groupOrgChart(tree)

  // Keep the legislative row together; the contained canvas may be panned.
  const minimumWidth = Math.max(
    600,
    Math.max(chart.kagawads.length, chart.appointed.length) * 100,
  )

  const card = (position: OrgChartNode, tone: Tone, acting = false) => (
    <OfficialCard
      key={position.id}
      position={position}
      tone={tone}
      acting={acting}
      selected={selectedId === position.id}
      onSelect={onSelect}
    />
  )

  return (
    <section
      aria-label="Barangay organizational hierarchy"
      className="min-w-0 rounded-xl border border-line-soft bg-surface shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-ink-strong">
          Barangay Leadership &amp; Officials
        </h2>
        <div
          className="flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-wider text-ink-muted"
          aria-label="Role colors"
        >
          <Legend color={legendDots.leadership}>Leadership</Legend>
          <Legend color={legendDots.legislative}>Legislative</Legend>
          <Legend color={legendDots.support}>Support</Legend>
        </div>
      </div>

      <div
        role="region"
        aria-label="Scrollable organizational chart"
        tabIndex={0}
        className="scrollbar-slim overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <div className="px-5 py-7 sm:px-7 sm:py-9" style={{ minWidth: minimumWidth }}>
          <div className="mx-auto w-60">
            {chart.captain ? (
              card(chart.captain, "leadership", chart.isActing)
            ) : (
              <div className="rounded-xl border border-dashed border-success/40 bg-success-soft p-6 text-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-success">
                  Punong Barangay
                </h3>
                <p className="mt-2 text-sm text-ink-muted">Not assigned</p>
              </div>
            )}
          </div>

          <div className="relative">
            {/* Continue the captain's branch around the legislative row to support staff. */}
            <span aria-hidden="true" className="absolute top-3 right-1/2 left-0 h-px bg-line" />
            <span aria-hidden="true" className="absolute top-3 bottom-0 left-0 w-px bg-line" />
            <Stem />
            <Branch
              title="Sangguniang Barangay"
              subtitle="Barangay Kagawads"
              positions={chart.kagawads}
              tone="legislative"
              renderCard={card}
              empty="No Kagawad positions to display."
            />
          </div>

          <div aria-hidden="true" className="relative h-6 sm:h-7">
            <span className="absolute top-0 left-0 h-1/2 w-1/2 border-b border-l border-line" />
            <span className="absolute top-1/2 left-1/2 h-1/2 w-px bg-line" />
          </div>

          <Branch
            title="Appointed Officials"
            subtitle="Barangay Secretary & Treasurer"
            positions={chart.appointed}
            tone="support"
            renderCard={card}
            empty="No appointed positions to display."
          />

          {chart.others.length > 0 && (
            <div className="mt-8 border-t border-line-soft pt-6">
              <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-ink-muted">
                Other Barangay Positions
              </h3>
              <ul className="grid grid-cols-3 gap-3 lg:grid-cols-4">
                {chart.others.map((position) => (
                  <li key={position.id}>{card(position, "other")}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <p className="border-t border-line-soft px-5 py-2 text-center text-xs text-ink-muted md:hidden">
        Scroll sideways to view the full chart.
      </p>
    </section>
  )
}

function Branch({
  title,
  subtitle,
  positions,
  tone,
  renderCard,
  empty,
}: {
  title: string
  subtitle: string
  positions: OrgChartNode[]
  tone: Tone
  renderCard: (position: OrgChartNode, tone: Tone) => ReactNode
  empty: string
}) {
  return (
    <section aria-label={title}>
      <div className="text-center">
        <h3 className={cn("text-xs font-extrabold uppercase tracking-[0.18em]", labels[tone])}>
          {title}
        </h3>
        <p className="mt-1 text-[11px] text-ink-muted">{subtitle}</p>
      </div>

      {positions.length ? (
        <>
          <Stem />
          <ul
            className={cn("mx-auto grid", positions.length <= 2 && "max-w-xl")}
            style={{ gridTemplateColumns: `repeat(${positions.length}, minmax(0, 1fr))` }}
          >
            {positions.map((position, index) => (
              <li key={position.id} className="relative flex px-1.5 pt-6">
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-px bg-line"
                  style={{
                    left: index === 0 ? "50%" : 0,
                    right: index === positions.length - 1 ? "50%" : 0,
                  }}
                />
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 h-6 w-px bg-line"
                />
                {renderCard(position, tone)}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-center text-xs italic text-ink-faint">{empty}</p>
      )}
    </section>
  )
}

function OfficialCard({
  position,
  tone,
  acting,
  selected,
  onSelect,
}: {
  position: OrgChartNode
  tone: Tone
  acting: boolean
  selected: boolean
  onSelect?: (position: OrgChartNode) => void
}) {
  const name = position.assignedPerson?.trim()
  const title = tone === "leadership" ? "Punong Barangay" : position.title

  const className = cn(
    "flex h-full w-full min-w-0 flex-col items-center rounded-xl border border-line-soft border-t-4 px-2 py-4 text-center shadow-card transition lg:px-3",
    accents[tone],
    onSelect &&
      "cursor-pointer hover:-translate-y-0.5 hover:shadow-raised motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    selected && "ring-2 ring-brand ring-offset-2 ring-offset-surface",
  )

  const content = (
    <>
      <OrgChartAvatar
        position={position}
        className={tone === "leadership" ? "size-16 border-2 border-surface text-base" : "size-12"}
      />
      <h4 className="mt-3 w-full text-xs leading-snug font-bold break-words text-ink-strong lg:text-sm">
        {name || <span className="font-normal text-ink-faint italic">Vacant</span>}
      </h4>
      <p
        className={cn(
          "mt-1.5 w-full text-[10px] leading-relaxed font-bold uppercase tracking-wide break-words",
          labels[tone],
        )}
      >
        {title}
      </p>
      {acting && (
        <span className="mt-2 rounded-full border border-warning/25 bg-warning-soft px-2.5 py-0.5 text-[10px] font-bold text-warning">
          (Acting)
        </span>
      )}
    </>
  )

  return onSelect ? (
    <button
      type="button"
      className={className}
      aria-pressed={selected}
      onClick={() => onSelect(position)}
    >
      {content}
    </button>
  ) : (
    <article className={className}>{content}</article>
  )
}

function Stem() {
  return <div aria-hidden="true" className="mx-auto h-6 w-px bg-line sm:h-7" />
}

function Legend({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={cn("size-2 rounded-full", color)} />
      {children}
    </span>
  )
}
