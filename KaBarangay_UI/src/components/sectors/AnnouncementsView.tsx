import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Bell, CalendarDays, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatusBadge from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import { Meta, Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { SearchInput, TableToolbar } from "@/components/TableTools"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { sectors, type SectorKey } from "@/config/navigation"
import {
  announcementsFor,
  formatIsoDate,
  sectorAudience,
  sectorStaff,
  type AnnouncementKind,
  type SectorAnnouncement,
} from "@/mock/sectors"
import { announcementSchema, type AnnouncementValues } from "@/schemas/forms"

const audiences: AnnouncementValues["audience"][] = [
  "All residents",
  "Senior Citizens",
  "PWD",
  "Youth",
  "Barangay officials",
]

/** Copy for each board a sector desk can open: the merged Announcements queue (notices + updates), or Programs. */
const boardCopy: Record<
  AnnouncementKind,
  {
    title: string
    description: string
    panelTitle: string
    panelDescription: string
    newLabel: string
    noun: string
    emptyTitle: string
    emptyDescription: string
    dialogDescription: string
    searchPlaceholder: string
    draftStatus: SectorAnnouncement["status"]
  }
> = {
  announcement: {
    title: "Announcements",
    description: "Notices and updates for residents, drafted and published from one queue.",
    panelTitle: "Notice queue",
    panelDescription: "Drafts, scheduled and published notices and updates for this desk",
    newLabel: "New announcement",
    noun: "announcements",
    emptyTitle: "No announcements in this view",
    emptyDescription: "Try another status tab or clear the search to see the rest of the queue.",
    dialogDescription: "It will be filed as pending until the barangay captain approves it.",
    searchPlaceholder: "Search title, venue or author…",
    draftStatus: "Pending",
  },
  update: {
    title: "Updates",
    description: "Short advisories and service notices pushed to residents' update feed.",
    panelTitle: "Update queue",
    panelDescription: "Drafts, scheduled and published updates for this desk",
    newLabel: "New update",
    noun: "updates",
    emptyTitle: "No updates in this view",
    emptyDescription: "Try another status tab or clear the search to see the rest of the queue.",
    dialogDescription: "It will be filed as pending until the barangay captain approves it.",
    searchPlaceholder: "Search title, venue or author…",
    draftStatus: "Pending",
  },
  program: {
    title: "Programs",
    description: "Barangay programs and activities, from proposal through to publication.",
    panelTitle: "Program queue",
    panelDescription: "Drafts, scheduled and published programs for this desk",
    newLabel: "New program",
    noun: "programs",
    emptyTitle: "No programs in this view",
    emptyDescription: "Try another status tab or clear the search to see the rest of the queue.",
    dialogDescription: "It will be filed as pending until the barangay captain approves it.",
    searchPlaceholder: "Search title, venue or author…",
    draftStatus: "Pending",
  },
}

/**
 * Board view shared by every sector desk. The default board is the merged
 * **Announcements** queue — notices and updates are one and the same, so both
 * kinds are listed together. Only Programs is a board of its own.
 */
export default function AnnouncementsView({
  sector,
  kind = ["announcement", "update"],
}: {
  sector: SectorKey
  kind?: AnnouncementKind | AnnouncementKind[]
}) {
  const meta = sectors[sector]
  const kinds = Array.isArray(kind) ? kind : [kind]
  const copy = boardCopy[kinds[0]]
  const [items, setItems] = useState<SectorAnnouncement[]>(() => announcementsFor(sector, kinds))
  const [segment, setSegment] = useState("all")
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      summary: "",
      audience: sectorAudience[sector],
      date: "",
      venue: "",
      requiresAttendance: false,
      body: "",
    },
  })

  const blank: AnnouncementValues = {
    title: "",
    summary: "",
    audience: sectorAudience[sector],
    date: "",
    venue: "",
    requiresAttendance: false,
    body: "",
  }

  const openCreate = () => {
    setEditingId(null)
    form.reset(blank)
    setOpen(true)
  }

  const openEdit = (item: SectorAnnouncement) => {
    setEditingId(item.id)
    form.reset({
      title: item.title,
      summary: item.summary,
      audience: item.audience,
      date: item.date,
      venue: item.venue,
      requiresAttendance: item.requiresAttendance,
      body: item.body,
    })
    setOpen(true)
  }

  const onSubmit = (values: AnnouncementValues) => {
    setSubmitting(true)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      if (editingId !== null) {
        setItems((current) =>
          current.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  title: values.title,
                  summary: values.summary,
                  body: values.body,
                  audience: values.audience,
                  date: values.date,
                  venue: values.venue,
                  requiresAttendance: values.requiresAttendance === true,
                }
              : item,
          ),
        )
      } else {
        const nextId = Math.max(0, ...items.map((item) => item.id)) + 1
        setItems((current) => [
          {
            id: nextId,
            kind: kinds[0],
            title: values.title,
            summary: values.summary,
            body: values.body,
            audience: values.audience,
            date: values.date,
            venue: values.venue,
            requiresAttendance: values.requiresAttendance === true,
            status: "Pending",
            author: sectorStaff[sector],
            expected: 0,
            sectors: [sector],
          },
          ...current,
        ])
      }
      setSubmitting(false)
      setOpen(false)
      setEditingId(null)
    }, 500)
  }

  const counts = useMemo(() => {
    const byStatus = (status: string) =>
      items.filter((item) => item.status.toLowerCase() === status).length
    return {
      all: items.length,
      published: byStatus("published"),
      pending: byStatus("pending"),
      draft: byStatus("draft"),
      scheduled: byStatus("scheduled"),
    }
  }, [items])

  const filtered = items.filter((item) => {
    const matchesSegment = segment === "all" || item.status.toLowerCase() === segment
    const needle = query.trim().toLowerCase()
    const matchesQuery =
      !needle ||
      [item.title, item.summary, item.venue, item.author].some((value) =>
        value.toLowerCase().includes(needle),
      )
    return matchesSegment && matchesQuery
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={meta.name}
        title={copy.title}
        description={copy.description}
        actions={
          <Button size="sm" className="h-9" onClick={openCreate}>
            <Plus className="size-4" /> {copy.newLabel}
          </Button>
        }
      />

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>{copy.panelTitle}</PanelTitle>
            <PanelDescription>{copy.panelDescription}</PanelDescription>
          </div>
          <SegmentedTabs
            value={segment}
            onChange={setSegment}
            segments={[
              { label: "All", value: "all", count: counts.all },
              { label: "Published", value: "published", count: counts.published },
              { label: "Pending", value: "pending", count: counts.pending },
              { label: "Draft", value: "draft", count: counts.draft },
              { label: "Scheduled", value: "scheduled", count: counts.scheduled },
            ]}
          />
        </PanelHeader>

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={copy.searchPlaceholder}
            className="w-full sm:max-w-xs"
          />
          <p className="ml-auto text-xs text-ink-muted tnum">
            {filtered.length} of {items.length} {copy.noun}
          </p>
        </TableToolbar>

        <PanelContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={copy.emptyTitle}
              description={copy.emptyDescription}
              action={
                <Button variant="outline" size="sm" className="bg-surface" onClick={openCreate}>
                  <Plus className="size-4" /> {copy.newLabel}
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col rounded-xl border border-line-soft bg-canvas/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-ink-muted">{item.audience}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold tracking-tight text-ink-strong">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                        {item.summary}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Actions for ${item.title}`}
                          className="grid size-8 shrink-0 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface hover:text-brand"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(item)}>
                          <Pencil className="size-4" /> Edit announcement
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            setItems((current) =>
                              current.filter((entry) => entry.id !== item.id),
                            )
                          }
                        >
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
                    <Meta label="Date">
                      <span className="tnum">{formatIsoDate(item.date)}</span>
                    </Meta>
                    <Meta label="Expected">
                      <span className="tnum">
                        {item.expected > 0 ? `${item.expected} residents` : "To be confirmed"}
                      </span>
                    </Meta>
                    <div className="col-span-2">
                      <Meta label="Venue">{item.venue}</Meta>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
                    <p className="text-[11px] text-ink-faint">
                      Posted by <span className="text-ink-muted">{item.author}</span>
                    </p>
                    {item.kind === "announcement" &&
                      item.requiresAttendance &&
                      sector !== "lupon" && (
                      <Button variant="outline" size="sm" className="h-8 bg-surface" asChild>
                        <Link to={`/${sector}/announcements/${item.id}/attendance`}>
                          <CalendarDays className="size-4" /> Take attendance
                        </Link>
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </PanelContent>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId !== null ? `Edit ${copy.noun.slice(0, -1)}` : copy.newLabel}
            </DialogTitle>
            <DialogDescription>
              {editingId !== null
                ? "Update the entry and save it back to the queue."
                : copy.dialogDescription}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior citizens quarterly assembly" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="One-line summary shown on the notice card."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full bg-surface">
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {audiences.map((audience) => (
                            <SelectItem key={audience} value={audience}>
                              {audience}
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
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-surface" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="Barangay Hall Session Hall" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full notice</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="What residents need to know, bring and do…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiresAttendance"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-lg border border-line-soft bg-canvas/60 p-3.5">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-ink">
                      Track attendance for this activity
                    </FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-surface"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving…" : editingId !== null ? "Save changes" : "Submit for review"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
