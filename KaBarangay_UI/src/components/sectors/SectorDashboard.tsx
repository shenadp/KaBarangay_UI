import { useState } from "react"
import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import {
  Accessibility,
  Bell,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  Gavel,
  HandCoins,
  Inbox,
  ListChecks,
  Percent,
  Scale,
  Stethoscope,
  Users,
  Wrench,
} from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import StatusBadge from "@/components/StatusBadge"
import { BarChart } from "@/components/charts"
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { sectors, type SectorKey } from "@/config/navigation"
import { monthlyActivity, recentActivity, todos } from "@/mock/sectors"

type Stat = {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
  trend?: "up" | "down"
  tone?: "brand" | "neutral"
}

/** Four KPI cards per desk — figures differ because the desks measure different work. */
const statsBySector: Record<SectorKey, Stat[]> = {
  clerk: [
    { icon: Inbox, label: "Pending certificate requests", value: 17, hint: "5 new today", trend: "up" },
    { icon: FileCheck2, label: "Certificates issued this month", value: 121, hint: "+14 vs September", trend: "up" },
    { icon: Bell, label: "Announcements posted", value: 9, hint: "2 awaiting approval", tone: "neutral" },
    { icon: Users, label: "Residents served", value: 486, hint: "Since Oct 1, 2026", trend: "up" },
  ],
  senior: [
    { icon: Users, label: "Registered seniors", value: 486, hint: "+12 this month", trend: "up" },
    { icon: HandCoins, label: "Pension releases", value: 120, hint: "Batch 3 on Oct 29, 2026" },
    { icon: CalendarDays, label: "Assemblies held", value: 4, hint: "This quarter" },
    { icon: Percent, label: "Attendance rate", value: "89%", hint: "+3 pts vs last assembly", trend: "up" },
  ],
  pwd: [
    { icon: Accessibility, label: "Registered PWDs", value: 173, hint: "+6 this month", trend: "up" },
    { icon: Wrench, label: "Assistive devices issued", value: 41, hint: "8 awaiting claim" },
    { icon: Stethoscope, label: "Medical aid requests", value: 23, hint: "+4 this week", trend: "up" },
    { icon: Percent, label: "Attendance rate", value: "82%", hint: "+5 pts vs last distribution", trend: "up" },
  ],
  lupon: [
    { icon: Gavel, label: "Open cases", value: 4, hint: "2 with hearings this week", tone: "neutral" },
    { icon: Scale, label: "Cases for mediation", value: 3, hint: "1 session today" },
    { icon: ClipboardCheck, label: "Settled this month", value: 5, hint: "+2 vs September", trend: "up" },
    { icon: CalendarClock, label: "Upcoming hearings", value: 3, hint: "Next on Oct 27, 2026" },
  ],
}

const chartMeta: Record<SectorKey, { title: string; description: string }> = {
  clerk: { title: "Certificates issued", description: "Documents released per month, last five months" },
  senior: { title: "Assembly attendance", description: "Seniors recorded per monthly activity" },
  pwd: { title: "Members served", description: "Assistance and distributions per month" },
  lupon: { title: "Cases filed", description: "Disputes referred to the Lupon per month" },
}

const headerAction: Record<SectorKey, { label: string; to: string }> = {
  clerk: { label: "New announcement", to: "/clerk/announcements" },
  senior: { label: "New announcement", to: "/senior/announcements" },
  pwd: { label: "New announcement", to: "/pwd/announcements" },
  lupon: { label: "Open case docket", to: "/lupon/complaints" },
}

export default function SectorDashboard({ sector }: { sector: SectorKey }) {
  const meta = sectors[sector]
  const action = headerAction[sector]
  const [checked, setChecked] = useState<number[]>([])

  const items = todos[sector]
  const doneCount = items.filter((item) => checked.includes(item.id)).length

  const toggle = (id: number) =>
    setChecked((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={meta.name}
        title="Dashboard"
        description={meta.description}
        actions={
          <Button size="sm" className="h-9" asChild>
            <Link to={action.to}>{action.label}</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsBySector[sector].map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader>
            <div>
              <PanelTitle>{chartMeta[sector].title}</PanelTitle>
              <PanelDescription>{chartMeta[sector].description}</PanelDescription>
            </div>
            <StatusBadge status="On track" tone="success" />
          </PanelHeader>
          <PanelContent>
            <BarChart data={monthlyActivity[sector]} />
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Recent activity</PanelTitle>
              <PanelDescription>Latest entries on this desk</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent>
            <ul className="space-y-4">
              {recentActivity[sector].map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="text-[13px] font-medium text-ink-strong">{entry.title}</p>
                      <StatusBadge status={entry.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">{entry.meta}</p>
                    <p className="mt-1 text-[11px] text-ink-faint tnum">{entry.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </PanelContent>
        </Panel>
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>To do today</PanelTitle>
            <PanelDescription>Friday, Oct 25, 2026 · Barangay San Isidro</PanelDescription>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand tnum">
            {doneCount} of {items.length} done
          </span>
        </PanelHeader>
        <PanelContent className="grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const isDone = checked.includes(item.id)
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-line-soft bg-canvas/60 p-3.5 transition-colors hover:border-brand/40"
              >
                <Checkbox
                  checked={isDone}
                  onCheckedChange={() => toggle(item.id)}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={
                      isDone
                        ? "block text-sm text-ink-faint line-through"
                        : "block text-sm text-ink"
                    }
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-ink-faint tnum">{item.due}</span>
                </span>
              </label>
            )
          })}
        </PanelContent>
        <PanelContent className="flex items-center gap-2 border-t border-line-soft pt-3">
          <ListChecks className="size-4 text-ink-faint" />
          <p className="text-xs text-ink-muted">
            Items left unchecked move over to tomorrow’s list.
          </p>
        </PanelContent>
      </Panel>
    </div>
  )
}
