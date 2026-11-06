/**
 * Admin Programs — the read model behind `Admin/AnnouncementApprovalController`.
 *
 * The page no longer approves anything: events and attendance-required posts go
 * live the moment staff publish them, so the administrator only monitors them.
 * The approve and reject routes refuse an event outright, and the guard says so
 * in one sentence.
 */

import { clerkStore } from "@/mock/clerkDesk"
import { pwdStore } from "@/mock/pwd"
import { seniorStore } from "@/mock/senior"
import {
  sectorLifecycleBucket,
  sectorStatusLabel,
  type SectorDeskStore,
  type SectorPost,
} from "@/mock/sectorDesks"
import { formatIsoDate } from "@/mock/sectors"

export type ProgramTab = "all" | "draft" | "ongoing" | "done"

export const programTabs: { value: ProgramTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "ongoing", label: "Ongoing" },
  { value: "done", label: "Done" },
]

/** The copy the backend raises when an administrator tries to review a program. */
export const programsNeedNoApproval =
  "Programs are published directly by staff and do not require admin approval."

export type AdminProgram = {
  /** Post ids repeat between desks, so the desk travels with the key. */
  key: string
  title: string
  content: string
  category: string
  /** The program's own lifecycle, which is what the desk renders. */
  statusLabel: string
  bucket: "draft" | "ongoing" | "done"
  author: string
  location: string | null
  eventStart: string | null
  postedAt: string
}

const desks: { key: string; store: SectorDeskStore }[] = [
  { key: "clerk", store: clerkStore },
  { key: "senior", store: seniorStore },
  { key: "pwd", store: pwdStore },
]

/** Events, and anything else that still opens an attendance sheet. */
const isProgram = (post: SectorPost): boolean => post.category === "Event" || post.requiresAttendance

const stamp = (iso: string, time?: string) =>
  time ? `${formatIsoDate(iso)} · ${time}` : formatIsoDate(iso)

function toProgram(deskKey: string, post: SectorPost): AdminProgram {
  return {
    key: `${deskKey}-${post.id}`,
    title: post.title,
    content: post.content,
    category: post.category,
    statusLabel: sectorStatusLabel(post),
    bucket: sectorLifecycleBucket(post),
    author: post.author || "Staff",
    location: post.location ?? null,
    eventStart: post.eventDate ? stamp(post.eventDate, post.eventTime) : null,
    postedAt: formatIsoDate(post.createdAt),
  }
}

/** Newest first, the way the controller lists them. */
export function adminPrograms(): AdminProgram[] {
  const rows = desks.flatMap(({ key, store }) =>
    store
      .postsFor(["auto", "update", "program"])
      .filter(isProgram)
      .map((post) => ({
        program: toProgram(key, post),
        createdAt: post.createdAt,
        id: post.id,
      })),
  )

  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .map((row) => row.program)
}

/** The tab counts are taken from the unfiltered program list. */
export function programCount(tab: ProgramTab, programs: AdminProgram[]): number {
  return tab === "all" ? programs.length : programs.filter((program) => program.bucket === tab).length
}

/** Title and body only — the same two columns the reference searches. */
export function matchesProgram(program: AdminProgram, search: string): boolean {
  if (search === "") return true
  return `${program.title} ${program.content}`.toLowerCase().includes(search.toLowerCase())
}
