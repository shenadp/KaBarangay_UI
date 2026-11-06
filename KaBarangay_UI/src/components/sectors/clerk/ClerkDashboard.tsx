import { useMemo } from "react"
import { Link } from "react-router-dom"
import { CalendarCheck, Megaphone, Users } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import StatusBadge from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  clerkCategoryLabels,
  clerkOfficer,
  clerkResidents,
  clerkStore,
} from "@/mock/clerkDesk"
import { sectorStatusLabel, type SectorPost } from "@/mock/sectorDesks"

const RECENT_LIMIT = 5

/** Both counters and the table cover the desk's update and program boards. */
const boardKinds = ["update", "program"] as SectorPost["kind"][]

const segmentFor = (post: SectorPost) =>
  post.kind === "update" ? "updates" : "programs"

/**
 * Clerk desk overview — mirrors the backend `Clerk/Dashboard` page: a welcome
 * hero, the three register/board counters and the newest updates and programs.
 * Everything is read from the clerk mock; nothing is fetched.
 */
export default function ClerkDashboard() {
  const stats = useMemo(() => {
    const posts = clerkStore.postsFor(boardKinds)
    return {
      residents: clerkResidents.filter((resident) => resident.status === "Active").length,
      published: posts.filter(
        (post) => post.approvalStatus === "approved" && post.programStatus !== "draft",
      ).length,
      draftPrograms: posts.filter(
        (post) => post.kind === "program" && post.programStatus === "draft",
      ).length,
    }
  }, [])

  const recent = useMemo(
    () =>
      [...clerkStore.postsFor(boardKinds)]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
        .slice(0, RECENT_LIMIT),
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clerk Desk"
        title={`Welcome, ${clerkOfficer}`}
        description="Overview of your barangay's residents, updates, and programs."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Users}
          label="Active residents"
          value={stats.residents}
          hint="With a live record on the barangay register"
        />
        <StatCard
          icon={Megaphone}
          label="Published updates & programs"
          value={stats.published}
          hint="Approved and out of draft"
        />
        <StatCard
          icon={CalendarCheck}
          label="Draft programs"
          value={stats.draftPrograms}
          hint="Awaiting completion before release"
          tone="neutral"
        />
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Recent Updates &amp; Programs</PanelTitle>
            <PanelDescription>The {RECENT_LIMIT} newest updates and programs on this desk</PanelDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8 bg-surface" asChild>
            <Link to="/clerk/updates">Manage updates →</Link>
          </Button>
        </PanelHeader>

        {recent.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No updates or programs yet."
            description="Notices published from this desk appear here as soon as they are filed."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="pr-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((post) => (
                <TableRow key={`${post.kind}-${post.id}`}>
                  <TableCell className="max-w-sm pl-5">
                    <Link
                      to={`/clerk/${segmentFor(post)}/${post.id}`}
                      className="text-sm font-medium text-ink-strong hover:text-brand"
                    >
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-ink-muted">
                    {post.category ? (clerkCategoryLabels[post.category] ?? post.category) : "—"}
                  </TableCell>
                  <TableCell className="pr-5">
                    <StatusBadge status={sectorStatusLabel(post)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
