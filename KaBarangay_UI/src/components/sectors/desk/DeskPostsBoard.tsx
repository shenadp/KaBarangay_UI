import { useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type UseFormReturn } from "react-hook-form"
import { z } from "zod"
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatusBadge, { type Tone } from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { SearchInput, TablePagination, TableToolbar } from "@/components/TableTools"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deskBoardKey, type DeskAudienceOption, type DeskBoardSet } from "@/config/sectorDesks"
import {
  canMarkSectorDone,
  canMarkSectorUpdateCompleted,
  formatIsoDate,
  isSectorAttendanceAvailable,
  isSectorEvent,
  sectorImportanceLabels,
  sectorLifecycleBucket,
  sectorStatusLabel,
  type SectorImportance,
  type SectorPost,
  type SectorPostKind,
  type SectorProgramStatus,
} from "@/mock/sectorDesks"

const PAGE_SIZE = 8

const importances: SectorImportance[] = ["low", "normal", "high", "urgent"]

const importanceTone: Record<SectorImportance, Tone> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "danger",
}

/** Built per desk so the category enum validates against that desk's options. */
function createPostSchema(categoryOptions: string[], audienceOptions?: DeskAudienceOption[]) {
  return z
    .object({
      title: z.string().min(5, "Title must be at least 5 characters"),
      content: z.string().min(20, "Write at least 20 characters"),
      type: z.enum(["informational", "event"]),
      category: z.enum(categoryOptions as [string, ...string[]]),
      importance: z.enum(["low", "normal", "high", "urgent"]),
      eventDate: z.string().optional(),
      eventTime: z.string().optional(),
      location: z.string().optional(),
      enableAttendance: z.boolean().optional(),
      programStatus: z.enum(["draft", "ongoing"]).optional(),
      // Only a desk that can post past its own sector asks who should read it.
      audience: audienceOptions?.length
        ? z.enum(audienceOptions.map((option) => option.value) as [string, ...string[]])
        : z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (values.type !== "event") return
      if (!values.eventDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["eventDate"], message: "Date is required" })
      }
      if (!values.eventTime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["eventTime"], message: "Time is required" })
      }
      if (!values.location?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["location"],
          message: "Location is required for an activity",
        })
      }
    })
}

type PostFormValues = z.infer<ReturnType<typeof createPostSchema>>

type PostsForm = UseFormReturn<PostFormValues>

/**
 * Kind-aware posts list for any sector desk — mirrors the backend
 * `Sector/Announcements/Index` page: lifecycle tabs, type/category/importance
 * filters, the posting table, the create/edit modal and the delete confirmation.
 * One component serves the Announcements, Updates and Programs boards.
 */
export default function DeskPostsBoard({
  desk,
  kind,
}: {
  desk: DeskBoardSet
  kind: SectorPostKind | SectorPostKind[]
}) {
  const kinds = useMemo(
    () => (Array.isArray(kind) ? kind : [kind]),
    [kind],
  )
  const copy = desk.boards[deskBoardKey(kind)]
  const showsType = kinds.includes("auto")
  const showsLifecycleTabs = kinds.includes("auto") || kinds.includes("program")
  // Only the Updates board publishes without approval; a merged board can also
  // file notices, which go through the captain.
  const updatesOnly = kinds.length === 1 && kinds[0] === "update"
  // A desk without audience choices always posts to its own sector.
  const audienceChoices = desk.audienceOptions?.length ? desk.audienceOptions : undefined

  const schema = useMemo(
    () => createPostSchema(desk.categoryOptions, audienceChoices),
    [desk.categoryOptions, audienceChoices],
  )
  const blankForm = useMemo<PostFormValues>(
    () => ({
      title: "",
      content: "",
      type: "informational",
      category: desk.categoryOptions[0] ?? "",
      importance: "normal",
      eventDate: "",
      eventTime: "",
      location: "",
      enableAttendance: false,
      programStatus: "draft",
      audience: desk.audience,
    }),
    [desk.categoryOptions, desk.audience],
  )

  const audienceLabels = useMemo(
    () => Object.fromEntries((audienceChoices ?? []).map((option) => [option.value, option.label])),
    [audienceChoices],
  )

  const [items, setItems] = useState<SectorPost[]>(() => desk.store.postsFor(kinds))
  const [tab, setTab] = useState("all")
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [importanceFilter, setImportanceFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SectorPost | null>(null)
  const [doneTarget, setDoneTarget] = useState<SectorPost | null>(null)
  const [completing, setCompleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; tone: Tone } | null>(null)

  const form = useForm<PostFormValues>({
    resolver: zodResolver(schema),
    defaultValues: blankForm,
  })

  const lifecycleCounts = useMemo(() => {
    const byBucket = (bucket: string) =>
      items.filter((item) => sectorLifecycleBucket(item) === bucket).length
    return {
      all: items.length,
      ongoing: byBucket("ongoing"),
      draft: byBucket("draft"),
      done: byBucket("done"),
    }
  }, [items])

  const filtered = items.filter((item) => {
    const matchesTab = tab === "all" || sectorLifecycleBucket(item) === tab
    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesImportance = importanceFilter === "all" || item.importance === importanceFilter
    const needle = query.trim().toLowerCase()
    const matchesQuery = !needle || item.title.toLowerCase().includes(needle)
    return matchesTab && matchesType && matchesCategory && matchesImportance && matchesQuery
  })

  const pageStart = (page - 1) * PAGE_SIZE
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  const openCreate = () => {
    setEditingId(null)
    form.reset(blankForm)
    setOpen(true)
  }

  const openEdit = (item: SectorPost) => {
    setEditingId(item.id)
    form.reset({
      title: item.title,
      content: item.content,
      type: item.type,
      category: item.category,
      importance: item.importance,
      eventDate: item.eventDate ?? "",
      eventTime: item.eventTime ?? "",
      location: item.location ?? "",
      enableAttendance: item.requiresAttendance,
      programStatus: item.programStatus ?? "draft",
      audience: item.audience || desk.audience,
    })
    setOpen(true)
  }

  const detailPathFor = (item: SectorPost) =>
    `${desk.basePath}/${item.kind === "update" ? "updates" : item.kind === "program" ? "programs" : "announcements"}/${item.id}`

  const onSubmit = (values: PostFormValues) => {
    setSubmitting(true)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      const isEvent = values.type === "event"

      if (editingId !== null) {
        const changes: Partial<SectorPost> = {
          title: values.title.trim(),
          content: values.content.trim(),
          type: values.type,
          category: values.category,
          importance: values.importance,
          eventDate: isEvent ? values.eventDate : undefined,
          eventTime: isEvent ? values.eventTime : undefined,
          location: isEvent ? values.location?.trim() : undefined,
          requiresAttendance: isEvent && values.enableAttendance === true,
          programStatus: isEvent ? (values.programStatus as SectorProgramStatus) : undefined,
          // Sector desks keep the audience the post was filed with.
          ...(audienceChoices ? { audience: values.audience ?? desk.audience } : {}),
        }
        desk.store.patchPost(editingId, changes)
        setItems((current) =>
          current.map((item) => (item.id === editingId ? { ...item, ...changes } : item)),
        )
        setSubmitting(false)
        setOpen(false)
        setEditingId(null)
        setFeedback({ text: "Announcement updated successfully.", tone: "success" })
        return
      }

      const nextId = desk.store.nextPostId()
      const createdKind: SectorPostKind =
        kinds[0] === "auto" && isEvent ? "program" : kinds[0]

      const record: SectorPost = {
        id: nextId,
        kind: createdKind,
        title: values.title.trim(),
        content: values.content.trim(),
        type: values.type,
        category: values.category,
        importance: values.importance,
        audience: audienceChoices ? (values.audience ?? desk.audience) : desk.audience,
        approvalStatus: createdKind === "update" ? "approved" : "pending",
        programStatus: isEvent ? (values.programStatus as SectorProgramStatus) : undefined,
        eventDate: isEvent ? values.eventDate : undefined,
        eventTime: isEvent ? values.eventTime : undefined,
        location: isEvent ? values.location?.trim() : undefined,
        requiresAttendance: isEvent && values.enableAttendance === true,
        createdAt: desk.todayIso,
        author: desk.officerName,
      }

      desk.store.addPost(record)
      setItems((current) => [record, ...current])
      setSubmitting(false)
      setOpen(false)
      setFeedback({
        text:
          createdKind === "update"
            ? desk.updatePublishedMessage
            : isEvent
              ? desk.programSubmittedMessage
              : "Announcement submitted for admin approval.",
        tone: createdKind === "update" ? "success" : "info",
      })
    }, 600)
  }

  const isInformational = (item: SectorPost) => !isSectorEvent(item)

  const runMarkDone = () => {
    const item = doneTarget
    if (!item || completing) return
    setCompleting(true)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      setCompleting(false)
      setDoneTarget(null)
      if (item.completedAt) {
        setFeedback({
          text: isSectorEvent(item)
            ? "This announcement has already been marked as done."
            : "This update has already been marked as completed.",
          tone: "warning",
        })
        return
      }
      desk.store.patchPost(item.id, { completedAt: desk.todayIso })
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, completedAt: desk.todayIso } : entry,
        ),
      )
      setFeedback({
        text: isSectorEvent(item) ? "Announcement marked as done." : "Update marked as completed.",
        tone: "success",
      })
    }, 500)
  }

  const tryEdit = (item: SectorPost) => {
    if (item.completedAt) {
      setFeedback({ text: "Completed announcements cannot be edited.", tone: "warning" })
      return
    }
    openEdit(item)
  }

  const confirmDelete = () => {
    const item = deleteTarget
    if (!item) return
    if (item.completedAt && isInformational(item)) {
      setFeedback({ text: "Completed updates cannot be deleted.", tone: "warning" })
      setDeleteTarget(null)
      return
    }
    desk.store.removePost(item.id)
    setItems((current) => current.filter((entry) => entry.id !== item.id))
    setFeedback({ text: "Announcement deleted successfully.", tone: "success" })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={desk.eyebrow}
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
          {showsLifecycleTabs && (
            <SegmentedTabs
              value={tab}
              onChange={(value) => {
                setTab(value)
                setPage(1)
              }}
              segments={[
                { label: "All", value: "all", count: lifecycleCounts.all },
                { label: "Ongoing", value: "ongoing", count: lifecycleCounts.ongoing },
                { label: "Draft", value: "draft", count: lifecycleCounts.draft },
                { label: "Done", value: "done", count: lifecycleCounts.done },
              ]}
            />
          )}
        </PanelHeader>

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder={copy.searchPlaceholder}
            className="w-full sm:max-w-xs"
          />
          {showsType && (
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px] bg-surface" aria-label="Filter by type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="informational">Informational</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[170px] bg-surface" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {desk.categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {desk.categoryLabels[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={importanceFilter}
            onValueChange={(value) => {
              setImportanceFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[150px] bg-surface" aria-label="Filter by importance">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All importance</SelectItem>
              {importances.map((importance) => (
                <SelectItem key={importance} value={importance}>
                  {sectorImportanceLabels[importance]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-xs text-ink-muted tnum">
            {filtered.length} of {items.length} {copy.noun}
          </p>
        </TableToolbar>

        {feedback && (
          <p
            className={
              feedback.tone === "success"
                ? "border-b border-line-soft bg-success-soft px-5 py-2 text-xs text-success"
                : feedback.tone === "info"
                  ? "border-b border-line-soft bg-info-soft px-5 py-2 text-xs text-info"
                  : "border-b border-warning/30 bg-warning-soft px-5 py-2 text-xs text-warning"
            }
          >
            {feedback.text}
          </p>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={copy.title === "Programs" ? CalendarCheck : Megaphone}
            title={copy.emptyTitle}
            description="Try another tab or clear the filters to see the rest of the board."
            action={
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-surface"
                onClick={openCreate}
              >
                <Plus className="size-4" /> {copy.newLabel}
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Title</TableHead>
                  {showsType && <TableHead>Type</TableHead>}
                  {audienceChoices && <TableHead>Audience</TableHead>}
                  <TableHead>Category</TableHead>
                  <TableHead>Importance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>{kinds.includes("program") ? "Schedule" : "Posted"}</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((item) => (
                  <TableRow key={`${item.kind}-${item.id}`}>
                    <TableCell className="max-w-sm pl-5">
                      <Link
                        to={detailPathFor(item)}
                        className="text-sm font-medium text-ink-strong hover:text-brand"
                      >
                        {item.title}
                      </Link>
                      {item.rejectionReason && (
                        <p className="mt-1 truncate text-[11px] text-destructive" title={item.rejectionReason}>
                          Rejected — {item.rejectionReason}
                        </p>
                      )}
                    </TableCell>
                    {showsType && (
                      <TableCell className="text-ink-muted capitalize">{item.type}</TableCell>
                    )}
                    {audienceChoices && (
                      <TableCell className="text-ink-muted">
                        {audienceLabels[item.audience] ?? item.audience}
                      </TableCell>
                    )}
                    <TableCell className="text-ink-muted">
                      {desk.categoryLabels[item.category]}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={sectorImportanceLabels[item.importance]}
                        tone={importanceTone[item.importance]}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sectorStatusLabel(item)} />
                    </TableCell>
                    <TableCell className="text-ink-muted tnum">
                      {formatIsoDate(item.eventDate ?? item.createdAt)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Actions for ${item.title}`}
                            className="inline-grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-canvas hover:text-brand"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={detailPathFor(item)}>
                              <Bell className="size-4" /> Details
                            </Link>
                          </DropdownMenuItem>
                          {isSectorAttendanceAvailable(item) && (
                            <DropdownMenuItem asChild>
                              <Link to={`${desk.basePath}/announcements/${item.id}/attendance`}>
                                <QrCode className="size-4" /> Attendance sheet
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {canMarkSectorDone(item) && (
                            <DropdownMenuItem onSelect={() => setDoneTarget(item)}>
                              <CheckCheck className="size-4" /> Mark as Done
                            </DropdownMenuItem>
                          )}
                          {canMarkSectorUpdateCompleted(item) && (
                            <DropdownMenuItem onSelect={() => setDoneTarget(item)}>
                              <CheckCheck className="size-4" /> Mark Completed
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onSelect={() => tryEdit(item)}>
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={item.completedAt !== undefined && isInformational(item)}
                            onSelect={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="size-4" /> Delete
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId !== null ? `Edit ${copy.noun.replace(/s$/, "")}` : copy.newLabel}
            </DialogTitle>
            <DialogDescription>
              {editingId !== null
                ? "Changes are saved back to this board."
                : updatesOnly
                  ? "Updates are published immediately — this desk does not need approval for them."
                  : "Posts are queued for the barangay captain’s approval."}
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
                      <Input placeholder="Batch 4 social pension release" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Announcement type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-surface">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="informational">Informational notice</SelectItem>
                        <SelectItem value="event">Event or activity</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={field.value as SectorPost["category"]}
                        onValueChange={(value) => field.onChange(value as SectorPost["category"])}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full bg-surface">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {desk.categoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>
                              {desk.categoryLabels[category]}
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
                  name="importance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importance</FormLabel>
                      <Select
                        value={field.value as SectorImportance}
                        onValueChange={(value) => field.onChange(value as SectorImportance)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full bg-surface">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {importances.map((importance) => (
                            <SelectItem key={importance} value={importance}>
                              {sectorImportanceLabels[importance]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {audienceChoices && (
                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target audience</FormLabel>
                      <Select
                        value={field.value ?? desk.audience}
                        onValueChange={(value) => field.onChange(value as string)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full bg-surface">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {audienceChoices.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormWatchType form={form}>
                {(isEvent) =>
                  isEvent && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="eventDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event date</FormLabel>
                              <FormControl>
                                <Input type="date" className="bg-surface tnum" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="eventTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start time</FormLabel>
                              <FormControl>
                                <Input type="time" className="bg-surface tnum" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Barangay Hall Session Hall"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="enableAttendance"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 rounded-lg border border-line-soft bg-canvas/60 p-3.5">
                            <FormControl>
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={(checked) => field.onChange(checked === true)}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-ink">
                              Enable the QR attendance sheet for this activity
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      {!updatesOnly && (
                        <FormField
                          control={form.control}
                          name="programStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Program status</FormLabel>
                              <Select
                                value={field.value as SectorProgramStatus}
                                onValueChange={(value) => field.onChange(value as SectorProgramStatus)}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full bg-surface">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ongoing">Ongoing</SelectItem>
                                  <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )
                }
              </FormWatchType>

              {!updatesOnly && (
                <p className="rounded-lg border border-line-soft bg-canvas/60 px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted">
                  Review summary: {showsType ? "notices and events" : "programs"} filed here are
                  queued for the barangay captain. Approved posts appear on the residents’ sector
                  feed and can open a QR attendance sheet.
                </p>
              )}

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
                  {submitting
                    ? "Saving…"
                    : editingId !== null
                      ? "Save changes"
                      : updatesOnly
                        ? "Publish update"
                        : "Submit for approval"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Announcement?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="bg-surface"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={doneTarget !== null}
        onOpenChange={(open) => {
          if (!open && !completing) setDoneTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {doneTarget && isSectorEvent(doneTarget) ? "Mark as Done" : "Mark Update Completed"}
            </DialogTitle>
            <DialogDescription>
              {doneTarget && isSectorEvent(doneTarget)
                ? `Mark “${doneTarget.title}” as done? This records completion and locks the announcement from further editing.`
                : `Mark “${doneTarget?.title ?? ""}” as completed? It will move to Past Updates and be locked from editing.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="bg-surface"
              disabled={completing}
              onClick={() => setDoneTarget(null)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={completing} onClick={runMarkDone}>
              {completing
                ? "Saving…"
                : doneTarget && isSectorEvent(doneTarget)
                  ? "Mark as Done"
                  : "Mark Completed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Renders its children only when the watched `type` field is an event. */
function FormWatchType({
  form,
  children,
}: {
  form: PostsForm
  children: (isEvent: boolean) => ReactNode
}) {
  const type = form.watch("type")
  return <>{children(type === "event")}</>
}
