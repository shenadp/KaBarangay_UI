/**
 * Organizational Chart — shared by the Admin and Clerk portals.
 *
 * The backend renders one page, `OrgChart/Management`, from both portals through
 * the `ManagesOrgChart` concern, and every query is scoped to the signed-in
 * user's `barangay_id`, so both desks edit the same chart. The shapes mirror its
 * props (`tree`, `positions`, `stats`) and the lifecycle: a position is created
 * as a draft, every edit resets it to draft, publishing is a separate controlled
 * action, and only a leaf may be hard-deleted.
 *
 * Nothing is fetched at runtime. A "photo" only ever keeps the browser `File`
 * metadata plus an object-URL preview generated in this tab — no bytes leave the
 * session, and the default state of a position is the no-photo placeholder.
 */

import { formatIsoDate } from "@/mock/sectors"
import { todayIso } from "@/mock/sectorExtras"

/* ------------------------------------------------------------------ */
/* Position record                                                     */
/* ------------------------------------------------------------------ */

/** Stored per position by the backend — there is no separate release step. */
export type OrgChartStatus = "draft" | "published" | "archived"

export type OrgChartPhoto = {
  fileName: string
  /** Bytes, read straight off the picked `File`. */
  size: number
  fileType: string
  /**
   * Object URL for a photo picked in this session; `null` for a file already on
   * record, which the UI renders with the incumbent's initials instead.
   */
  previewUrl: string | null
}

export type OrgChartPosition = {
  id: number
  /** `title` on the backend, max 255 characters. */
  title: string
  /** `assigned_person` — null renders as an italic "Vacant". */
  assignedPerson: string | null
  /** `parent_id` — null is a top-level position. */
  parentId: number | null
  status: OrgChartStatus
  /** `has_photo` / `photo_url`, flattened into the local preview record. */
  photo: OrgChartPhoto | null
  /** `updated_at`, ISO date, formatted with `formatIsoDate`. */
  updatedAt: string
}

/** A position plus its subtree — the `tree` prop the backend defers. */
export type OrgChartNode = OrgChartPosition & { children: OrgChartNode[] }

export type OrgChartStats = {
  total: number
  draft: number
  published: number
  archived: number
}

/** Fields the desk fills in; the lifecycle is never part of the form. */
export type OrgChartPositionInput = {
  title: string
  assignedPerson: string | null
  parentId: number | null
  /** `null` means "keep the photo on record", exactly like an empty upload. */
  photo: OrgChartPhoto | null
}

/** The badge copy the backend writes for each stored status. */
export const orgChartStatusLabel: Record<OrgChartStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
}

/** The backend accepts an official photo up to 2 MB (`max:2048` kilobytes). */
export const orgChartMaxPhotoBytes = 2 * 1024 * 1024

export function formatOrgChartDate(iso: string): string {
  return formatIsoDate(iso)
}

export function formatOrgChartFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < orgChartMaxPhotoBytes) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * The browser `File` is the only source: the name, size and type are read off it
 * and an object URL is minted for the preview. No request is made.
 */
export function orgChartPhotoFromFile(file: File): OrgChartPhoto {
  return {
    fileName: file.name,
    size: file.size,
    fileType: file.type || "image/*",
    previewUrl: URL.createObjectURL(file),
  }
}

/** Seeded photos have no preview to release, so only local uploads are revoked. */
export function releaseOrgChartPhoto(photo: OrgChartPhoto | null): void {
  if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl)
}

/* ------------------------------------------------------------------ */
/* Tree helpers                                                        */
/* ------------------------------------------------------------------ */

const byTitle = (a: OrgChartPosition, b: OrgChartPosition) => a.title.localeCompare(b.title)

/**
 * Same construction as the controller's `chartTree`: the rows arrive sorted by
 * title, unknown parents fall back to root, and a node already on the path is
 * dropped so a bad edit can never make the chart hang.
 */
export function buildOrgChartTree(positions: OrgChartPosition[]): OrgChartNode[] {
  const ordered = [...positions].sort(byTitle)

  const nodes = new Map<number, OrgChartNode>()
  for (const position of ordered) {
    nodes.set(position.id, { ...position, children: [] })
  }

  const roots: OrgChartNode[] = []
  for (const position of ordered) {
    const node = nodes.get(position.id)
    if (!node) continue
    const parent = position.parentId !== null ? nodes.get(position.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  const guard = (node: OrgChartNode, path: number[]): OrgChartNode => {
    if (path.includes(node.id)) return { ...node, children: [] }
    const nextPath = [...path, node.id]
    return { ...node, children: node.children.map((child) => guard(child, nextPath)) }
  }

  return roots.map((root) => guard(root, []))
}

export function findOrgChartNode(nodes: OrgChartNode[], id: number): OrgChartNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const match = findOrgChartNode(node.children, id)
    if (match) return match
  }
  return null
}

/** Every id below `node` — used by the parent picker and the leaf-only delete. */
export function collectDescendantIds(node: OrgChartNode): number[] {
  const ids: number[] = []
  const walk = (parent: OrgChartNode) => {
    for (const child of parent.children) {
      ids.push(child.id)
      walk(child)
    }
  }
  walk(node)
  return ids
}

export type OrgChartRow = { node: OrgChartNode; depth: number }

/** Depth-first flatten — the "Position Structure" list indents by `depth`. */
export function flattenOrgChartTree(nodes: OrgChartNode[], depth = 0): OrgChartRow[] {
  return nodes.flatMap((node) => [{ node, depth }, ...flattenOrgChartTree(node.children, depth + 1)])
}

export function orgChartStatsOf(positions: OrgChartPosition[]): OrgChartStats {
  return {
    total: positions.length,
    draft: positions.filter((position) => position.status === "draft").length,
    published: positions.filter((position) => position.status === "published").length,
    archived: positions.filter((position) => position.status === "archived").length,
  }
}

/** Node-only depth-first flatten — the resident chart counts and selects this. */
export function flattenOrgChartNodes(nodes: OrgChartNode[]): OrgChartNode[] {
  return nodes.flatMap((node) => [node, ...flattenOrgChartNodes(node.children)])
}

/* ------------------------------------------------------------------ */
/* The grouped chart the resident portal draws                         */
/* ------------------------------------------------------------------ */

/**
 * `groupOrgChart()` from `components/org-chart/orgChart.ts`: the rows are
 * re-arranged for display without touching the saved parent links. The captain
 * is the first leader title, preferring an acting/OIC row that already has an
 * incumbent; anyone sharing the captain's name is a duplicate entry and drops
 * out of the rest of the chart.
 */
export function groupOrgChart(tree: OrgChartNode[]) {
  const positions = flattenOrgChartNodes(tree)

  const isLeader = (title: string) =>
    /punong\s+barangay|barangay\s+captain|barangay\s+chair(?:man|person)/i.test(title)
  const isActingTitle = (title: string) => /\bacting\b|\boic\b|officer.in.charge/i.test(title)

  const leaders = positions.filter((node) => isLeader(node.title))
  const captain =
    leaders.find((node) => node.status === "published" && isActingTitle(node.title) && node.assignedPerson?.trim()) ??
    leaders.find((node) => node.status === "published" && !isActingTitle(node.title)) ??
    leaders.find((node) => node.status === "published") ??
    leaders.find((node) => node.status !== "archived") ??
    leaders[0] ??
    null

  const nameKey = (name: string | null) => name?.trim().replace(/\s+/g, " ").toLowerCase() ?? ""
  const remaining = positions.filter(
    (node) =>
      !isLeader(node.title) &&
      node.id !== captain?.id &&
      (!captain?.assignedPerson || nameKey(node.assignedPerson) !== nameKey(captain.assignedPerson)),
  )

  const kagawads = remaining.filter((node) =>
    /kagawad|councilor|sangguniang\s+barangay/i.test(node.title),
  )
  const legislativeIds = new Set(kagawads.map((node) => node.id))

  const appointed = remaining.filter(
    (node) =>
      !legislativeIds.has(node.id) &&
      /secretary|treasurer|kalihim|ingat.?yaman/i.test(node.title),
  )
  const appointedIds = new Set(appointed.map((node) => node.id))

  return {
    captain,
    isActing: Boolean(captain?.assignedPerson?.trim() && isActingTitle(captain.title)),
    kagawads,
    appointed,
    others: remaining.filter(
      (node) => !legislativeIds.has(node.id) && !appointedIds.has(node.id),
    ),
  }
}


/* ------------------------------------------------------------------ */
/* Seed — the officials of Barangay San Isidro                         */
/* ------------------------------------------------------------------ */

function photo(fileName: string, size: number): OrgChartPhoto {
  return { fileName, size, fileType: "image/jpeg", previewUrl: null }
}

/**
 * Names match the barangay roster so the staff and resident charts speak of the
 * same people.
 */
export const orgChartSeed: OrgChartPosition[] = [
  {
    id: 1,
    title: "Punong Barangay",
    assignedPerson: "Hon. Roberto M. Villanueva",
    parentId: null,
    status: "published",
    photo: photo("punong-barangay-villanueva.jpg", 386_144),
    updatedAt: "2026-10-18",
  },
  {
    id: 2,
    title: "Kagawad — Peace and Order",
    assignedPerson: "Hon. Ernesto P. Bautista",
    parentId: 1,
    status: "published",
    photo: photo("kagawad-bautista.jpg", 291_328),
    updatedAt: "2026-10-18",
  },
  {
    id: 3,
    title: "Kagawad — Health and Sanitation",
    assignedPerson: "Hon. Ma. Cecilia D. Ramos",
    parentId: 1,
    status: "published",
    photo: null,
    updatedAt: "2026-10-15",
  },
  {
    id: 4,
    title: "Kagawad — Education and Livelihood",
    assignedPerson: "Hon. Lourdes T. Salvador",
    parentId: 1,
    status: "published",
    photo: null,
    updatedAt: "2026-10-15",
  },
  {
    id: 5,
    title: "Kagawad — Infrastructure and Public Works",
    assignedPerson: "Hon. Ferdinand C. Ocampo",
    parentId: 1,
    status: "published",
    photo: null,
    updatedAt: "2026-10-12",
  },
  {
    id: 6,
    title: "Kagawad — Budget and Appropriations",
    assignedPerson: "Hon. Patricia A. Gomez",
    parentId: 1,
    status: "published",
    photo: null,
    updatedAt: "2026-10-12",
  },
  {
    id: 7,
    title: "Kagawad — Agriculture and Environment",
    assignedPerson: "Hon. Romeo V. Lazaro",
    parentId: 1,
    status: "draft",
    photo: null,
    updatedAt: "2026-10-24",
  },
  {
    id: 8,
    title: "Punong Tagapamayapa — Lupon Tagapamayapa",
    assignedPerson: null,
    parentId: 1,
    status: "published",
    photo: null,
    updatedAt: "2026-10-08",
  },
  {
    id: 9,
    title: "Barangay Secretary",
    assignedPerson: "Ms. Rowena S. Villareal",
    parentId: 1,
    status: "published",
    photo: photo("secretary-villareal.jpg", 204_800),
    updatedAt: "2026-10-19",
  },
  {
    id: 10,
    title: "Barangay Treasurer",
    assignedPerson: "Mr. Nestor B. Salvador",
    parentId: 1,
    status: "published",
    photo: null,
    updatedAt: "2026-10-19",
  },
  {
    id: 11,
    title: "Barangay Clerk",
    assignedPerson: "Elena R. Villamor",
    parentId: 9,
    status: "published",
    photo: null,
    updatedAt: "2026-10-20",
  },
  {
    id: 12,
    title: "Records and Certification Attendant",
    assignedPerson: null,
    parentId: 9,
    status: "draft",
    photo: null,
    updatedAt: "2026-10-26",
  },
  {
    id: 13,
    title: "Barangay Treasurer's Cashier",
    assignedPerson: "Ms. Grace V. Navarro",
    parentId: 10,
    status: "published",
    photo: null,
    updatedAt: "2026-10-16",
  },
  {
    id: 14,
    title: "Barangay Tanod Chief",
    assignedPerson: "Mr. Alfredo A. Pineda",
    parentId: 2,
    status: "published",
    photo: null,
    updatedAt: "2026-10-14",
  },
  {
    id: 15,
    title: "Barangay Justice Enforcer",
    assignedPerson: null,
    parentId: 2,
    status: "archived",
    photo: null,
    updatedAt: "2026-09-28",
  },
  {
    id: 16,
    title: "BHW Coordinator",
    assignedPerson: "Ms. Rowena S. Ilagan",
    parentId: 3,
    status: "published",
    photo: null,
    updatedAt: "2026-10-13",
  },
  {
    id: 17,
    title: "Barangay Nutrition Scholar",
    assignedPerson: null,
    parentId: 3,
    status: "archived",
    photo: null,
    updatedAt: "2026-09-22",
  },
  {
    id: 18,
    title: "SK Chairperson",
    assignedPerson: "Mr. Kevin M. Alvarez",
    parentId: 1,
    status: "published",
    photo: null,
    updatedAt: "2026-10-11",
  },
]

/* ------------------------------------------------------------------ */
/* Session store                                                       */
/* ------------------------------------------------------------------ */

/**
 * Ids the parent select must not offer: the position itself plus everything
 * below it. The server rejects the same move with
 * "A position cannot be placed under itself or one of its descendants."
 */
export function orgChartBlockedParentIds(
  positions: OrgChartPosition[],
  positionId: number | null,
): number[] {
  if (positionId === null) return []
  const node = findOrgChartNode(buildOrgChartTree(positions), positionId)
  return node ? [positionId, ...collectDescendantIds(node)] : [positionId]
}

/**
 * One store for both portals, in the same closure-array style as the sector
 * desks: the chart, the structure list and the four counters all read the same
 * array, so a save on one view is immediately visible on the other.
 */
export function createOrgChartStore(seed: {
  positions: OrgChartPosition[]
  /** Stamp written to `updatedAt` by every mutation. */
  todayIso: string
}) {
  let positions = seed.positions.map((position) => ({ ...position }))

  const replace = (id: number, patch: Partial<OrgChartPosition>) => {
    positions = positions.map((position) =>
      position.id === id ? { ...position, ...patch } : position,
    )
  }

  /** Publishing and archiving are the only writes that touch the status alone. */
  const setStatus = (id: number, status: OrgChartStatus): OrgChartPosition | undefined => {
    const current = positions.find((position) => position.id === id)
    if (!current) return undefined
    const next = { ...current, status, updatedAt: seed.todayIso }
    replace(id, next)
    return next
  }

  return {
    list(): OrgChartPosition[] {
      return positions
    },

    tree(): OrgChartNode[] {
      return buildOrgChartTree(positions)
    },

    byId(id: number): OrgChartPosition | undefined {
      return positions.find((position) => position.id === id)
    },

    stats(): OrgChartStats {
      return orgChartStatsOf(positions)
    },

    nextId(): number {
      return positions.reduce((max, position) => Math.max(max, position.id), 0) + 1
    },

    childrenOf(id: number): OrgChartPosition[] {
      return positions.filter((position) => position.parentId === id)
    },

    hasChildren(id: number): boolean {
      return positions.some((position) => position.parentId === id)
    },

    /** The position itself plus its whole subtree — never a valid parent. */
    blockedParentIds(positionId: number | null): number[] {
      return orgChartBlockedParentIds(positions, positionId)
    },

    /** Parent select: every position the edit may legitimately point at. */
    parentOptions(positionId: number | null): OrgChartPosition[] {
      const blocked = new Set(orgChartBlockedParentIds(positions, positionId))
      return [...positions].sort(byTitle).filter((position) => !blocked.has(position.id))
    },

    /** Leaf-only delete rule, mirrored from the controller's `children()->exists()`. */
    canDelete(positionId: number): boolean {
      return !positions.some((position) => position.parentId === positionId)
    },

    /** `store` on the server: a new position is always created as a draft. */
    createDraft(input: OrgChartPositionInput): OrgChartPosition {
      const created: OrgChartPosition = {
        id: positions.reduce((max, position) => Math.max(max, position.id), 0) + 1,
        title: input.title,
        assignedPerson: input.assignedPerson,
        parentId: input.parentId,
        status: "draft",
        photo: input.photo,
        updatedAt: seed.todayIso,
      }
      positions = [...positions, created]
      return created
    },

    /**
     * `update` — the backend resets the row to draft on every save, so a
     * published position has to be published again after an edit.
     */
    update(id: number, input: OrgChartPositionInput): OrgChartPosition | undefined {
      const current = positions.find((position) => position.id === id)
      if (!current) return undefined

      // A new upload supersedes the file on record, exactly as `deletePhoto` does.
      if (input.photo) releaseOrgChartPhoto(current.photo)

      const next: OrgChartPosition = {
        ...current,
        title: input.title,
        assignedPerson: input.assignedPerson,
        parentId: input.parentId,
        photo: input.photo ?? current.photo,
        status: "draft",
        updatedAt: seed.todayIso,
      }
      replace(id, next)
      return next
    },

    publish(id: number): OrgChartPosition | undefined {
      return setStatus(id, "published")
    },

    archive(id: number): OrgChartPosition | undefined {
      return setStatus(id, "archived")
    },

    /**
     * `destroy` — a hard delete allowed only for leaves. Returns false when the
     * position still carries children, the same guard the controller applies.
     */
    remove(id: number): boolean {
      if (positions.some((position) => position.parentId === id)) return false
      const current = positions.find((position) => position.id === id)
      if (!current) return false
      releaseOrgChartPhoto(current.photo)
      positions = positions.filter((position) => position.id !== id)
      return true
    },
  }
}

export type OrgChartStore = ReturnType<typeof createOrgChartStore>

/** The live chart both portals read and write. */
export const orgChartStore = createOrgChartStore({
  positions: orgChartSeed,
  todayIso,
})
