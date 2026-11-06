import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type DefaultValues } from "react-hook-form"
import { z } from "zod"
import {
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  LoaderCircle,
  MoreHorizontal,
  Plus,
} from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import StatusBadge from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import { BarChart } from "@/components/charts"
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { SearchInput, TablePagination, TableToolbar } from "@/components/TableTools"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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
  TODAY,
  addDays,
  attendanceOptions,
  flattenHearings,
  formatDate,
  formatMonth,
  formatShortDate,
  hearingTypes,
  luponCases,
  monthLabel,
  outcomeOptions,
  timeSlots,
  venues,
  type FlatHearing,
  type HearingType,
  type LuponCase,
} from "@/mock/luponExtras"

const PAGE_SIZE = 6

const segments = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "All", value: "all" },
]

const weekEnd = addDays(TODAY, 7)

const isUpcoming = (hearing: FlatHearing) => hearing.status === "Scheduled"
const isCompleted = (hearing: FlatHearing) => hearing.status === "Completed"
const isThisWeek = (hearing: FlatHearing) =>
  isUpcoming(hearing) && hearing.date >= TODAY && hearing.date <= weekEnd

const scheduleSchema = z.object({
  caseId: z.string().min(1, "Select a case"),
  date: z
    .string()
    .min(1, "Hearing date is required")
    .refine((value) => value >= TODAY, "Pick today or a later date"),
  time: z.string().min(1, "Select a time slot"),
  venue: z.string().min(1, "Select a venue"),
  type: z.string().min(1, "Select the type of proceeding"),
})
type ScheduleValues = z.infer<typeof scheduleSchema>

const scheduleDefaults: DefaultValues<ScheduleValues> = {
  caseId: "",
  date: "",
  time: "",
  venue: "",
  type: "",
}

const outcomeSchema = z.object({
  attendance: z.string().min(1, "Record who attended"),
  outcome: z.string().min(1, "Select an outcome"),
})
type OutcomeValues = z.infer<typeof outcomeSchema>

const outcomeDefaults: DefaultValues<OutcomeValues> = {
  attendance: "",
  outcome: "",
}

/** Party label used on the calendar rows. */
const partiesLabel = (hearing: FlatHearing) => `${hearing.complainant} vs ${hearing.respondent}`

export default function LuponHearings() {
  const [cases, setCases] = useState<LuponCase[]>(luponCases)
  const [segment, setSegment] = useState("upcoming")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleCaseId, setScheduleCaseId] = useState("")
  const [outcomeId, setOutcomeId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const hearings = flattenHearings(cases)
  const outcomeTarget = hearings.find((hearing) => hearing.id === outcomeId) ?? null

  const counts = segments.map((entry) => ({
    ...entry,
    count:
      entry.value === "upcoming"
        ? hearings.filter(isUpcoming).length
        : entry.value === "completed"
          ? hearings.filter(isCompleted).length
          : hearings.length,
  }))

  const filtered = hearings.filter((hearing) => {
    const matchesSegment =
      segment === "all" ||
      (segment === "upcoming" && isUpcoming(hearing)) ||
      (segment === "completed" && isCompleted(hearing))
    const needle = query.trim().toLowerCase()
    const matchesQuery =
      !needle ||
      [
        hearing.caseNumber ?? "",
        hearing.complaintRef ?? "",
        hearing.venue,
        partiesLabel(hearing),
      ].some((value) => value.toLowerCase().includes(needle))
    return matchesSegment && matchesQuery
  })

  const sorted = [...filtered].sort((a, b) =>
    segment === "completed" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  )

  const pageStart = (page - 1) * PAGE_SIZE
  const visible = sorted.slice(pageStart, pageStart + PAGE_SIZE)

  const upcoming = hearings.filter(isUpcoming).length
  const thisWeek = hearings.filter(isThisWeek).length
  const completed = hearings.filter(isCompleted).length

  const weekList = hearings
    .filter(isThisWeek)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const weekGroups = weekList.reduce<{ date: string; items: FlatHearing[] }[]>(
    (groups, hearing) => {
      const last = groups[groups.length - 1]
      if (last && last.date === hearing.date) last.items.push(hearing)
      else groups.push({ date: hearing.date, items: [hearing] })
      return groups
    },
    [],
  )

  const monthly = (() => {
    const totals = new Map<string, number>()
    for (const hearing of hearings) {
      const key = hearing.date.slice(0, 7)
      totals.set(key, (totals.get(key) ?? 0) + 1)
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ label: monthLabel(`${key}-01`), value }))
  })()

  const schedulable = cases.filter((record) => record.caseNumber !== null)

  const scheduleFor = (caseId: string) => {
    setScheduleCaseId(caseId)
    setScheduleOpen(true)
  }

  const handleScheduled = (values: ScheduleValues) => {
    const target = cases.find((record) => record.id === values.caseId)
    if (!target) return
    setCases((current) =>
      current.map((record) => {
        if (record.id !== values.caseId) return record
        const hearing = {
          id: `hr-${record.id}-${record.hearings.length + 1}`,
          hearingNo: record.hearings.length + 1,
          date: values.date,
          time: values.time,
          venue: values.venue,
          type: values.type as HearingType,
          status: "Scheduled" as const,
          attendance: "Awaiting parties" as const,
          outcome: "Pending" as const,
        }
        return { ...record, hearings: [...record.hearings, hearing] }
      }),
    )
    setFlash(
      `${target.caseNumber} set for ${formatDate(values.date)} at ${values.time} — ${values.venue}.`,
    )
  }

  const handleOutcome = (values: OutcomeValues) => {
    const target = outcomeTarget
    if (!target) return
    setCases((current) =>
      current.map((record) =>
        record.id === target.caseId
          ? {
              ...record,
              hearings: record.hearings.map((hearing) =>
                hearing.id === target.id
                  ? {
                      ...hearing,
                      attendance: values.attendance as FlatHearing["attendance"],
                      outcome: values.outcome as FlatHearing["outcome"],
                      status: "Completed" as const,
                    }
                  : hearing,
              ),
            }
          : record,
      ),
    )
    setFlash(`Outcome recorded for ${target.caseNumber ?? target.complaintRef}: ${values.outcome}.`)
    setOutcomeId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lupon Tagapamayapa"
        title="Hearing calendar"
        description="Every mediation and conciliation session on the docket, with attendance and recorded outcomes."
        actions={
          <Button size="sm" className="h-9" onClick={() => scheduleFor("")}>
            <Plus className="size-4" /> Schedule hearing
          </Button>
        }
      />

      {flash && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line-soft bg-success-soft px-4 py-3">
          <p className="text-sm text-success">{flash}</p>
          <button
            type="button"
            onClick={() => setFlash(null)}
            className="text-xs font-medium text-success/80 hover:text-success"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={CalendarDays}
          label="Upcoming hearings"
          value={upcoming}
          hint={`Scheduled from ${formatMonth(TODAY)}`}
        />
        <StatCard
          icon={Clock}
          label="This week"
          value={thisWeek}
          hint={`Within seven days of ${formatShortDate(TODAY)}`}
        />
        <StatCard
          icon={Check}
          label="Completed"
          value={completed}
          hint="Attendance and outcome recorded"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader>
            <div>
              <PanelTitle>Scheduled sessions</PanelTitle>
              <PanelDescription>Chronological view of the Lupon's calendar</PanelDescription>
            </div>
            <SegmentedTabs value={segment} onChange={setSegment} segments={counts} />
          </PanelHeader>

          <TableToolbar>
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value)
                setPage(1)
              }}
              placeholder="Search case number, party or venue…"
              className="w-full sm:max-w-sm"
            />
            <p className="ml-auto text-xs text-ink-muted tnum">
              {filtered.length} of {hearings.length} hearings
            </p>
          </TableToolbar>

          {filtered.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No hearings in this view"
              description="Nothing matches the current tab or search — schedule a session from a case row."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-5 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((hearing) => (
                    <TableRow key={hearing.id}>
                      <TableCell className="pl-5 text-ink tnum">
                        {formatDate(hearing.date)}
                      </TableCell>
                      <TableCell className="text-ink-muted tnum">{hearing.time}</TableCell>
                      <TableCell>
                        <Link
                          to={`/lupon/cases/${hearing.caseId}`}
                          className="font-medium text-brand hover:underline tnum"
                        >
                          {hearing.caseNumber ?? hearing.complaintRef}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[15rem] truncate text-ink-muted">
                        {partiesLabel(hearing)}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-ink-muted">
                        {hearing.venue}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-ink-muted ring-1 ring-inset ring-line-soft">
                          {hearing.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={hearing.status} />
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for hearing on ${formatShortDate(hearing.date)}`}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-surface">
                            <DropdownMenuLabel className="tnum text-ink-faint">
                              {hearing.caseNumber ?? hearing.complaintRef} · Hearing #
                              {hearing.hearingNo}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => scheduleFor(hearing.caseId)}>
                              <CalendarPlus className="size-4" /> Schedule hearing
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setOutcomeId(hearing.id)}>
                              <Check className="size-4" /> Record attendance & outcome
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
              />
            </>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Hearings per month</PanelTitle>
                <PanelDescription>Sessions booked across the docket</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent>
              <BarChart data={monthly} height={150} />
            </PanelContent>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>This week</PanelTitle>
                <PanelDescription>
                  {formatShortDate(TODAY)} to {formatShortDate(weekEnd)}
                </PanelDescription>
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand tnum">
                {thisWeek}
              </span>
            </PanelHeader>
            <PanelContent>
              {weekGroups.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line-soft px-4 py-6 text-center text-xs leading-relaxed text-ink-muted">
                  No sessions fall in the next seven days. Schedule one from a case row.
                </p>
              ) : (
                <div className="space-y-4">
                  {weekGroups.map((group) => (
                    <div key={group.date}>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint tnum">
                        {formatShortDate(group.date)}
                      </p>
                      <ul className="mt-2 space-y-2">
                        {group.items.map((hearing) => (
                          <li
                            key={hearing.id}
                            className="rounded-lg border border-line-soft bg-canvas/60 px-3 py-2.5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-ink-strong tnum">
                                {hearing.time}
                              </span>
                              <span className="text-[11px] text-ink-faint">{hearing.type}</span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-ink-muted">
                              <Link
                                to={`/lupon/cases/${hearing.caseId}`}
                                className="font-medium text-brand hover:underline tnum"
                              >
                                {hearing.caseNumber ?? hearing.complaintRef}
                              </Link>{" "}
                              · {hearing.venue}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </PanelContent>
          </Panel>
        </div>
      </div>

      <ScheduleHearingDialog
        open={scheduleOpen}
        cases={schedulable}
        defaultCaseId={scheduleCaseId}
        onOpenChange={(open) => {
          if (!open) setScheduleOpen(false)
        }}
        onScheduled={(values) => {
          handleScheduled(values)
          setScheduleOpen(false)
          setScheduleCaseId("")
        }}
      />

      <RecordOutcomeDialog
        open={outcomeId !== null}
        hearing={outcomeTarget}
        onOpenChange={(open) => {
          if (!open) setOutcomeId(null)
        }}
        onSaved={handleOutcome}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dialogs                                                             */
/* ------------------------------------------------------------------ */

function ScheduleHearingDialog({
  open,
  cases,
  defaultCaseId,
  onOpenChange,
  onScheduled,
}: {
  open: boolean
  cases: LuponCase[]
  defaultCaseId: string
  onOpenChange: (open: boolean) => void
  onScheduled: (values: ScheduleValues) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: scheduleDefaults,
  })

  // Pre-select the case whenever the sheet is opened.
  useEffect(() => {
    if (open) form.reset({ ...scheduleDefaults, caseId: defaultCaseId })
  }, [open])

  const handleOpen = (next: boolean) => {
    onOpenChange(next)
    if (!next) setSubmitting(false)
  }

  const onSubmit = (values: ScheduleValues) => {
    setSubmitting(true)
    // UI-only: replaced by the hearings API on integration.
    window.setTimeout(() => {
      onScheduled(values)
      setSubmitting(false)
      form.reset(scheduleDefaults)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule a hearing</DialogTitle>
          <DialogDescription>
            Add a mediation or hearing session to a case and notify both parties.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="caseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a case" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cases.map((record) => {
                        const complainant = record.parties.find(
                          (party) => party.role === "Complainant",
                        )
                        const respondent = record.parties.find(
                          (party) => party.role === "Respondent",
                        )
                        return (
                          <SelectItem key={record.id} value={record.id}>
                            {record.caseNumber} · {complainant?.name ?? "—"} vs{" "}
                            {respondent?.name ?? "—"}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-10 bg-surface" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a slot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a venue" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {venues.map((venue) => (
                          <SelectItem key={venue} value={venue}>
                            {venue}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of proceeding</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hearingTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="bg-surface"
                onClick={() => handleOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" /> Scheduling…
                  </>
                ) : (
                  <>
                    <CalendarPlus className="size-4" /> Schedule
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function RecordOutcomeDialog({
  open,
  hearing,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  hearing: FlatHearing | null
  onOpenChange: (open: boolean) => void
  onSaved: (values: OutcomeValues) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<OutcomeValues>({
    resolver: zodResolver(outcomeSchema),
    defaultValues: outcomeDefaults,
  })

  // Pre-fill the last known attendance and outcome.
  useEffect(() => {
    if (!open) return
    form.reset({
      attendance: hearing && hearing.attendance !== "Awaiting parties" ? hearing.attendance : "",
      outcome: hearing && hearing.outcome !== "Pending" ? hearing.outcome : "",
    })
  }, [open])

  const handleOpen = (next: boolean) => {
    onOpenChange(next)
    if (!next) setSubmitting(false)
  }

  const onSubmit = (values: OutcomeValues) => {
    setSubmitting(true)
    // UI-only: replaced by the hearings API on integration.
    window.setTimeout(() => {
      onSaved(values)
      setSubmitting(false)
      form.reset(outcomeDefaults)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record attendance & outcome</DialogTitle>
          <DialogDescription>
            {hearing
              ? `Hearing #${hearing.hearingNo} of ${hearing.caseNumber ?? hearing.complaintRef} on the calendar.`
              : "Attendance and outcome of the session."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="attendance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attendance</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Who attended?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {attendanceOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="How did it end?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {outcomeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="rounded-lg border border-line-soft bg-canvas/60 px-3 py-2 text-xs leading-relaxed text-ink-muted">
              Saving marks the session as completed and keeps the record in the case history.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="bg-surface"
                disabled={submitting}
                onClick={() => handleOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> Save record
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
