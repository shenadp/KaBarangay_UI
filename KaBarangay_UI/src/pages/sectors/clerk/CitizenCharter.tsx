import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Archive,
  ArrowRight,
  BookOpenCheck,
  FilePenLine,
  Globe,
  LibraryBig,
  Plus,
} from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { SearchInput, TablePagination, TableToolbar } from "@/components/TableTools"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import CharterCreateDialog, {
  type CharterDraftPayload,
} from "@/components/sectors/clerk/CharterCreateDialog"
import {
  CharterFlashBanner,
  CharterServiceStatusBadge,
} from "@/components/sectors/clerk/CharterStatus"
import {
  charterServiceStatus,
  clerkCharterStore,
  currentCharterVersion,
  formatCharterDate,
  type CharterFlash,
  type CharterService,
} from "@/mock/clerk/charter"

const PAGE_SIZE = 15

export default function ClerkCitizenCharter() {
  const [services, setServices] = useState<CharterService[]>(() => clerkCharterStore.list())
  const [tab, setTab] = useState("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [flash, setFlash] = useState<CharterFlash | null>(null)

  const stats = useMemo(() => clerkCharterStore.stats(), [services])

  const segments = [
    { label: "All Services", value: "all", count: stats.total },
    { label: "Drafts", value: "draft", count: stats.draft },
    { label: "Published", value: "published", count: stats.published },
    { label: "Archived", value: "archived", count: stats.archived },
  ]

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...services]
      .sort((a, b) => a.display_order - b.display_order || b.id - a.id)
      .filter((service) => {
        const matchesTab = tab === "all" || charterServiceStatus(service) === tab
        const matchesQuery =
          !needle ||
          [service.title, service.category ?? "", service.description ?? ""].some((value) =>
            value.toLowerCase().includes(needle),
          )
        return matchesTab && matchesQuery
      })
  }, [services, tab, query])

  const pageStart = (page - 1) * PAGE_SIZE
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  const handleCreate = (payload: CharterDraftPayload) => {
    const { flash: result } = clerkCharterStore.createDraft({
      title: payload.title.trim(),
      category: payload.category,
      description: payload.description,
      display_order: payload.display_order,
      document: payload.document,
    })
    setServices(clerkCharterStore.list())
    setTab("draft")
    setPage(1)
    setFlash(result)
  }

  const filtersActive = query.trim() !== "" || tab !== "all"

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Office of the Barangay Clerk"
        title="Citizen's Charter Directory"
        description="Upload, publish, and manage official barangay service standards and procedures."
        actions={
          <Button size="sm" className="h-9" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Add New Service
          </Button>
        }
      />

      {flash && <CharterFlashBanner flash={flash} onDismiss={() => setFlash(null)} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={LibraryBig} label="Total Services" value={stats.total} tone="brand" />
        <StatCard icon={FilePenLine} label="Draft Revisions" value={stats.draft} tone="neutral" />
        <StatCard icon={Globe} label="Published Live" value={stats.published} tone="brand" />
        <StatCard icon={Archive} label="Archived" value={stats.archived} tone="neutral" />
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Charter services</PanelTitle>
            <PanelDescription>Official service standards, lowest display order first</PanelDescription>
          </div>
          <SegmentedTabs
            value={tab}
            onChange={(value) => {
              setTab(value)
              setPage(1)
            }}
            segments={segments}
          />
        </PanelHeader>

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Search service title, category…"
            className="w-full sm:max-w-xs"
          />
          <p className="ml-auto text-xs text-ink-muted tnum">
            {filtered.length} of {services.length} services
          </p>
        </TableToolbar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={BookOpenCheck}
            title="No Citizen's Charter services found"
            description={
              filtersActive
                ? "Try adjusting your search query or status filter."
                : "Get started by adding an official service and uploading its corresponding PDF."
            }
            action={
              <Button size="sm" className="mt-1" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> Add New Service
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Service Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published Date</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((service) => {
                  const versionNumber = currentCharterVersion(service)?.version_number ?? 1
                  return (
                    <TableRow key={service.id}>
                      <TableCell className="max-w-sm pl-5">
                        <Link
                          to={`/clerk/citizen-charter/${service.id}`}
                          className="text-sm font-medium text-ink-strong hover:text-brand"
                        >
                          {service.title}
                        </Link>
                        {service.description && (
                          <p className="mt-0.5 line-clamp-1 max-w-md text-[11px] text-ink-faint">
                            {service.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {service.category || <span className="text-ink-faint">Uncategorized</span>}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-md bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink ring-1 ring-inset ring-line-soft tnum">
                          v{versionNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <CharterServiceStatusBadge status={charterServiceStatus(service)} />
                      </TableCell>
                      <TableCell className="text-ink-muted tnum">
                        {formatCharterDate(service.published_at)}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button asChild variant="outline" size="sm" className="h-8 bg-surface">
                          <Link to={`/clerk/citizen-charter/${service.id}`}>
                            Manage <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
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

      <CharterCreateDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
    </div>
  )
}
