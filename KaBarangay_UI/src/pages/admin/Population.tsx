import { Users } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@/components/Panel"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { residentRegistry } from "@/mock/admin/residents"

/**
 * Population Monitoring mirrors `Admin/PopulationController`: only the residents
 * table is population and only while its status is active, so senior and PWD
 * membership is allowed to overlap and the overlap is surfaced explicitly.
 */

const share = (value: number, max: number) => (max > 0 ? Math.min((value / max) * 100, 100) : 0)

function Bar({ ratio, fill }: { ratio: number; fill: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
      <div
        className={`h-full rounded-full transition-all duration-500 ${fill}`}
        style={{ width: `${ratio}%` }}
      />
    </div>
  )
}

export default function AdminPopulation() {
  const stats = residentRegistry.populationStats()
  const puroks = residentRegistry.populationPuroks()

  const cards = [
    {
      label: "Total residents",
      value: stats.totalResidents,
      hint: "Active permanent records only",
      tone: "bg-brand-soft text-brand",
    },
    {
      label: "Senior citizens",
      value: stats.seniorCitizens,
      hint: "Members of the senior sector",
      tone: "bg-info-soft text-info",
    },
    {
      label: "PWD members",
      value: stats.pwdMembers,
      hint: "Members of the PWD sector",
      tone: "bg-warning-soft text-warning",
    },
    {
      label: "Regular residents",
      value: stats.regularResidents,
      hint: "No sector membership",
      tone: "bg-canvas text-ink-muted",
    },
  ]

  const distribution = [
    { label: "Total residents", value: stats.totalResidents, fill: "bg-brand" },
    { label: "Regular residents (no sector)", value: stats.regularResidents, fill: "bg-ink-faint" },
    { label: "Senior citizens", value: stats.seniorCitizens, fill: "bg-info" },
    { label: "PWD members", value: stats.pwdMembers, fill: "bg-warning" },
  ]

  const excluded = [
    { label: "Inactive residents", value: stats.inactiveResidents },
    { label: "Pending applications", value: stats.pendingRegistrations },
    { label: "Rejected applications", value: stats.rejectedRegistrations },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Population Monitoring"
        description="Demographic overview and purok breakdown"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-line-soft bg-surface p-4 shadow-card"
          >
            <span
              className={`inline-flex size-9 items-center justify-center rounded-lg ${card.tone}`}
            >
              <Users className="size-[18px]" />
            </span>
            <p className="mt-3 text-[13px] font-medium uppercase tracking-wide text-ink-muted">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-strong tnum">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-ink-faint">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader>
            <div>
              <PanelTitle>Purok breakdown</PanelTitle>
              <PanelDescription>Active residents per purok, with sector membership</PanelDescription>
            </div>
          </PanelHeader>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Purok</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Seniors</TableHead>
                <TableHead>PWD</TableHead>
                <TableHead className="pr-5">Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {puroks.map((purok) => {
                const percentage =
                  stats.totalResidents > 0
                    ? Math.round((purok.total / stats.totalResidents) * 100)
                    : 0
                return (
                  <TableRow key={purok.id}>
                    <TableCell className="pl-5 text-sm font-medium text-ink-strong">
                      {purok.name}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-brand tnum">
                      {purok.total}
                    </TableCell>
                    <TableCell className="text-ink-muted tnum">{purok.seniors}</TableCell>
                    <TableCell className="text-ink-muted tnum">{purok.pwd}</TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Bar ratio={percentage} fill="bg-brand" />
                        </div>
                        <span className="w-10 text-right text-xs text-ink-muted tnum">
                          {percentage}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Sector distribution</PanelTitle>
                <PanelDescription>Share of the active population</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent className="space-y-3.5">
              {distribution.map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-ink">{row.label}</span>
                    <span className="text-[13px] font-medium text-ink-strong tnum">
                      {row.value}
                    </span>
                  </div>
                  <Bar ratio={share(row.value, stats.totalResidents)} fill={row.fill} />
                </div>
              ))}
            </PanelContent>
            <PanelFooter>
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Senior and PWD membership can overlap ({stats.seniorAndPwd} resident
                {stats.seniorAndPwd === 1 ? "" : "s"} in both), so category counts are not mutually
                exclusive.
              </p>
            </PanelFooter>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Not counted as population</PanelTitle>
                <PanelDescription>
                  Only active permanent residents are included in the totals above.
                </PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent>
              <dl className="space-y-2.5">
                {excluded.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <dt className="text-[13px] text-ink-muted">{row.label}</dt>
                    <dd className="text-[13px] font-medium text-ink-strong tnum">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </PanelContent>
          </Panel>
        </div>
      </div>
    </div>
  )
}
