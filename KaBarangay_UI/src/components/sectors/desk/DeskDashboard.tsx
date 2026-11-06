import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarCheck, ClipboardCheck, Megaphone, QrCode, Users } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import StatusBadge from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import { BarChart } from "@/components/charts"
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { monthlyActivity, recentActivity, todos } from "@/mock/sectors"
import {
  isSectorAttendanceAvailable,
  sectorStatusLabel,
  type SectorPost,
} from "@/mock/sectorDesks"
import type { SectorDesk } from "@/config/sectorDesks"

export default function DeskDashboard({ desk }: { desk: SectorDesk }) {
  const [checked, setChecked] = useState<number[]>([])

  const stats = useMemo(() => {
    const registered = desk.residents.filter((resident) =>
      resident.sectors.includes(desk.memberTag),
    ).length
    const queue = desk.store.postsFor(["update", "program"])
    return {
      registered,
      queue: queue.length,
      drafts: queue.filter((item) => item.programStatus === "draft").length,
      published: queue.filter((item) => item.approvalStatus === "approved").length,
      waiting: desk.store
        .applicationQueue()
        .filter((item) => item.status === "pending_staff_review").length,
    }
  }, [desk])

  const items = todos[desk.key]
  const doneCount = items.filter((item) => checked.includes(item.id)).length

  const toggle = (id: number) =>
    setChecked((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )

  const board: SectorPost[] = desk.store.postsFor(["update", "program"]).slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={desk.eyebrow}
        title="Dashboard"
        description={desk.dashboardDescription}
        actions={
          <Button size="sm" className="h-9" asChild>
            <Link to={`${desk.basePath}/updates`}>View Updates</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label={desk.registeredLabel}
          value={stats.registered}
          hint="On the sector roster"
        />
        <StatCard
          icon={Megaphone}
          label="Updates & programs"
          value={stats.queue}
          hint="Across both boards"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Draft programs"
          value={stats.drafts}
          hint="Awaiting completion"
          tone="neutral"
        />
        <StatCard
          icon={CalendarCheck}
          label="Published updates & programs"
          value={stats.published}
          hint="Approved by the barangay captain"
          tone="neutral"
        />
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>{desk.dashboardBoardTitle}</PanelTitle>
            <PanelDescription>Latest posts on this desk with their approval standing</PanelDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8 bg-surface" asChild>
            <Link to={`${desk.basePath}/updates`}>View all →</Link>
          </Button>
        </PanelHeader>

        {board.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Nothing published yet"
            description="Updates and programs posted from this desk appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Approval status</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {board.map((item) => (
                <TableRow key={`${item.kind}-${item.id}`}>
                  <TableCell className="max-w-sm pl-5">
                    <Link
                      to={`${desk.basePath}/${item.kind === "update" ? "updates" : "programs"}/${item.id}`}
                      className="text-sm font-medium text-ink-strong hover:text-brand"
                    >
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-ink-muted">
                    {desk.categoryLabels[item.category]}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sectorStatusLabel(item)} />
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    {isSectorAttendanceAvailable(item) ? (
                      <Button variant="outline" size="sm" className="h-8 bg-surface" asChild>
                        <Link to={`${desk.basePath}/announcements/${item.id}/attendance`}>
                          <QrCode className="size-4" /> QR attendance sheet
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-ink-faint">No attendance sheet</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader>
            <div>
              <PanelTitle>Members served</PanelTitle>
              <PanelDescription>Assistance, assemblies and pay-outs per month</PanelDescription>
            </div>
            <StatusBadge status="On track" tone="success" />
          </PanelHeader>
          <PanelContent>
            <BarChart data={monthlyActivity[desk.key]} />
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Applications awaiting review</PanelTitle>
              <PanelDescription>Staff completeness stage</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <p className="text-2xl font-semibold tracking-tight text-ink-strong tnum">
              {stats.waiting}
            </p>
            <p className="text-xs leading-relaxed text-ink-muted">
              Filings waiting for a document completeness check by this desk.
            </p>
            <Button variant="outline" size="sm" className="h-8 w-full bg-surface" asChild>
              <Link to={`${desk.basePath}/applications`}>Open applications queue</Link>
            </Button>
          </PanelContent>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Recent activity</PanelTitle>
              <PanelDescription>Latest entries on this desk</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent>
            <ul className="space-y-4">
              {recentActivity[desk.key].map((entry) => (
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
        </Panel>
      </div>
    </div>
  )
}
