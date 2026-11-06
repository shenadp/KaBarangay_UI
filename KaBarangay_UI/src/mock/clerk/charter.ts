/**
 * Citizen's Charter — Clerk desk mock data and in-memory store.
 *
 * This mirrors the Laravel `Clerk\CitizenCharterController` payload and its
 * safe-versioning lifecycle. Service *status* is never stored directly: the
 * backend derives it from `is_published` / `archived_at`, and each document
 * revision carries its own *version* status. The resident portal and this desk
 * must agree, so the seeded service titles come from the resident-side
 * `charterServices` dataset (`@/mock/resident`).
 *
 * Nothing here is fetched at runtime — `createClerkCharterStore` keeps the
 * services in a closure so a revision or publish made on the list page is still
 * visible when the management page opens.
 */

import { charterServices } from "@/mock/resident"
import { formatIsoDate } from "@/mock/sectors"

export { formatIsoDate }

/* ------------------------------------------------------------------ */
/* Types (mirrors CitizenCharterServiceData / CitizenCharterVersionData) */
/* ------------------------------------------------------------------ */

export type CharterServiceStatus = "draft" | "published" | "archived"

export type CharterVersionStatus = "draft" | "published" | "superseded" | "archived"

export type CharterVersion = {
  id: number
  version_number: number
  /** The filename as the uploader provided it. */
  original_name: string
  mime_type: string
  /** Size in bytes — rendered with `formatCharterFileSize`. */
  file_size: number
  status: CharterVersionStatus
  uploaded_by_name: string
  created_at: string
  published_at?: string
  archived_at?: string
}

export type CharterService = {
  id: number
  title: string
  category?: string
  description?: string
  display_order: number
  is_published: boolean
  archived_at?: string
  created_at: string
  published_at?: string
  created_by_name: string
  updated_by_name?: string
  current_version_id?: number
  versions: CharterVersion[]
}

/** Browser `File` reduced to the fields the store keeps — no bytes are stored. */
export type CharterUploadedFile = {
  original_name: string
  file_size: number
  mime_type: string
}

export type CharterDraftInput = {
  title: string
  category?: string
  description?: string
  display_order: number
  document: CharterUploadedFile
}

export type CharterDetailsInput = {
  title: string
  category?: string
  description?: string
  display_order: number
}

/* ------------------------------------------------------------------ */
/* Flash + copy strings lifted verbatim from the backend              */
/* ------------------------------------------------------------------ */

export type CharterFlashTone = "success" | "info" | "error"
export type CharterFlash = { text: string; tone: CharterFlashTone }

export const charterCopy = {
  createFlash: "Citizen's Charter service created as a draft.",
  updateFlash: "Service details updated.",
  revisionFlash: (n: number) =>
    `New document version (v${n}) uploaded as a draft. You may preview and publish it when ready.`,
  publishFlash: (n: number) =>
    `Citizen's Charter service published (Version ${n} is now live for residents).`,
  archiveFlash: "Citizen's Charter service archived and removed from resident visibility.",
  alreadyArchived: "The service is already archived.",
  publishWithoutDoc: "Cannot publish a service without an uploaded document.",
  publishArchived: "Archived services cannot be published.",
  editArchived: "Archived services cannot be edited.",
  revisionArchived: "Cannot add document revisions to an archived service.",
  confirmPublish:
    "Are you sure you want to publish this Citizen's Charter service? The latest draft document revision will become immediately visible to all residents.",
  confirmArchive:
    "Are you sure you want to archive this service? It will be immediately removed from the resident portal while preserving all historical revisions.",
  safeVersioning:
    "Safe Versioning: Uploading a new PDF creates an unreleased draft revision. Your current published document remains accessible to residents until you explicitly choose to publish the new version.",
  pdfHelper: "PDF file only. Max 2 MB per runtime upload limit. Scanned PDFs supported.",
  noPreview: "No document version selected for preview.",
  placeholderPreview:
    "Preview is a UI-only placeholder. No file is loaded from a server in this mock.",
} as const

/* ------------------------------------------------------------------ */
/* Presentation helpers                                                */
/* ------------------------------------------------------------------ */

/** Status is computed, never stored — exactly like `computeStatus()` upstream. */
export function charterServiceStatus(service: CharterService): CharterServiceStatus {
  if (service.archived_at) return "archived"
  return service.is_published ? "published" : "draft"
}

export function currentCharterVersion(service: CharterService): CharterVersion | undefined {
  return service.versions.find((version) => version.id === service.current_version_id)
}

export function charterServiceStatusLabel(status: CharterServiceStatus): string {
  return status === "published" ? "Published" : status === "draft" ? "Draft" : "Archived"
}

export function charterVersionStatusLabel(status: CharterVersionStatus): string {
  switch (status) {
    case "published":
      return "Published"
    case "draft":
      return "Draft"
    case "superseded":
      return "Superseded"
    case "archived":
      return "Archived"
  }
}

/** "1536000" → "1.5 MB". Byte counts stay `tnum`-friendly. */
export function formatCharterFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Dates in the table/preview; an unset published date reads as an em dash. */
export function formatCharterDate(iso: string | undefined): string {
  return iso ? formatIsoDate(iso) : "—"
}

/* ------------------------------------------------------------------ */
/* Upload rules                                                        */
/* ------------------------------------------------------------------ */

export const CHARTER_MAX_UPLOAD_BYTES = 2 * 1024 * 1024

/**
 * Client-side stand-in for the backend's PDF validation: type, size and a `%PDF-`
 * magic-byte sniff on the first five bytes. Returns `undefined` when the file is
 * acceptable, otherwise the message to show. Awaiting it reads only the header,
 * so the real bytes never leave the browser.
 */
export async function validateCharterUpload(file: File): Promise<string | undefined> {
  const looksPdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name)
  if (!looksPdf) return "Only PDF files are accepted."
  if (file.size > CHARTER_MAX_UPLOAD_BYTES) return "The document must be 2 MB or smaller."
  if (file.size === 0) return "The document is empty."

  try {
    const header = await file.slice(0, 5).text()
    if (header !== "%PDF-") return "The file is not a valid PDF document."
  } catch {
    return "The file could not be read. Please try again."
  }
  return undefined
}

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

// The desk officer for the Clerk portal; seeded uploads are attributed to it or
// to the historical editors so the resident and clerk portals stay consistent.
const CLERK = "Elena R. Villamor"
const SECRETARY = "Barangay Secretary"
const TREASURER = "Barangay Treasurer"
const LUPON = "Lupon Secretary"
const REGISTRAR = "Records Section"

/** A fixed "today" so mutations are deterministic (and SSR-stable). */
const CHARTER_TODAY = "2026-11-03"

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function categoryFor(title: string): string {
  if (/business permit/i.test(title)) return "Business Permits"
  if (/blotter/i.test(title)) return "Justice & Peace"
  if (/id endorsement|psa|scholarship/i.test(title)) return "Registration"
  return "Certificates"
}

let seedVersionId = 0

function seedVersion(
  serviceId: number,
  n: number,
  status: CharterVersionStatus,
  opts: {
    size: number
    by: string
    created: string
    published?: string
    archived?: string
    slug: string
  },
): CharterVersion {
  seedVersionId += 1
  return {
    id: seedVersionId,
    version_number: n,
    original_name: `charter-${opts.slug}-v${n}.pdf`,
    mime_type: "application/pdf",
    file_size: opts.size,
    status,
    uploaded_by_name: opts.by,
    created_at: opts.created,
    published_at: opts.published,
    archived_at: opts.archived,
  }
}

type SeedPlan = {
  id: number
  display_order: number
  status: CharterServiceStatus
  by: string
  /** Newest is a draft sitting on top of a live version. */
  draftOnTop?: boolean
  versions: { size: number; by: string; at: string }[]
}

// The lifecycle cases the brief requires are all represented here:
//  - Barangay Clearance: several versions, newest (v3) still an unpublished draft.
//  - Certificate of Good Moral Character: a draft service that was never published.
//  - Blotter Report / Barangay ID Endorsement: archived services.
const seedPlan: Record<string, SeedPlan> = {
  "Barangay Clearance": {
    id: 1,
    display_order: 0,
    status: "published",
    by: CLERK,
    draftOnTop: true,
    versions: [
      { size: 420_000, by: SECRETARY, at: "2026-01-06" },
      { size: 486_400, by: CLERK, at: "2026-07-12" },
      { size: 512_000, by: CLERK, at: "2026-10-28" },
    ],
  },
  "Certificate of Residency": {
    id: 2,
    display_order: 1,
    status: "published",
    by: CLERK,
    versions: [
      { size: 268_000, by: SECRETARY, at: "2026-04-09" },
      { size: 302_500, by: CLERK, at: "2026-09-18" },
    ],
  },
  "Certificate of Indigency": {
    id: 3,
    display_order: 2,
    status: "published",
    by: CLERK,
    versions: [{ size: 244_000, by: CLERK, at: "2026-08-22" }],
  },
  "Business Permit": {
    id: 4,
    display_order: 3,
    status: "published",
    by: TREASURER,
    versions: [
      { size: 540_000, by: TREASURER, at: "2026-01-06" },
      { size: 615_000, by: TREASURER, at: "2026-09-02" },
    ],
  },
  "Certificate of Good Moral Character": {
    id: 5,
    display_order: 4,
    status: "draft",
    by: CLERK,
    versions: [{ size: 198_000, by: CLERK, at: CHARTER_TODAY }],
  },
  "Certificate of Low Income": {
    id: 6,
    display_order: 5,
    status: "published",
    by: CLERK,
    versions: [{ size: 226_400, by: CLERK, at: "2026-06-11" }],
  },
  "Barangay ID Endorsement": {
    id: 7,
    display_order: 6,
    status: "archived",
    by: REGISTRAR,
    versions: [
      { size: 356_000, by: REGISTRAR, at: "2026-01-08" },
      { size: 402_000, by: REGISTRAR, at: "2026-06-04" },
    ],
  },
  "Delayed PSA Registration": {
    id: 8,
    display_order: 7,
    status: "published",
    by: REGISTRAR,
    versions: [{ size: 476_000, by: REGISTRAR, at: "2026-05-19" }],
  },
  "Scholarship Endorsement": {
    id: 9,
    display_order: 8,
    status: "published",
    by: CLERK,
    versions: [{ size: 188_800, by: CLERK, at: "2026-07-30" }],
  },
  "Marriage / Cohabitation Certificate": {
    id: 10,
    display_order: 9,
    status: "published",
    by: SECRETARY,
    versions: [{ size: 254_000, by: SECRETARY, at: "2026-03-17" }],
  },
  "Blotter Report": {
    id: 11,
    display_order: 10,
    status: "archived",
    by: LUPON,
    versions: [{ size: 312_000, by: LUPON, at: "2026-02-11" }],
  },
}

function buildSeed(): CharterService[] {
  return charterServices.map((resident) => {
    const title = resident.name
    const plan = seedPlan[title]
    const slug = slugify(title)
    const description = `${resident.turnaround} · Fee ${resident.fee}. ${resident.requirements[0]} and supporting documents are verified at the ${categoryFor(title).toLowerCase()} window before release.`

    // Assemble the version chain, tagging statuses to match the plan.
    const last = plan.versions.length - 1
    let publishedDate: string | undefined
    const versions = plan.versions.map((entry, index) => {
      const n = index + 1
      const isTop = index === last
      let status: CharterVersionStatus

      if (plan.status === "draft") {
        // Never published: the only (or newest) version is a draft.
        status = "draft"
      } else if (plan.status === "archived") {
        status = isTop ? "archived" : "superseded"
      } else if (plan.draftOnTop && isTop) {
        // Live version stays published; a fresh draft revision sits on top.
        status = "draft"
      } else if (plan.draftOnTop && index === last - 1) {
        status = "published"
      } else {
        status = "superseded"
      }

      const publishedAt =
        status === "published" || status === "superseded" ? entry.at : undefined
      if (status === "published") publishedDate = entry.at
      return seedVersion(plan.id, n, status, {
        size: entry.size,
        by: entry.by,
        created: entry.at,
        published: publishedAt,
        archived: status === "archived" ? "2026-09-30" : undefined,
        slug,
      })
    })

    const archivedAt = plan.status === "archived" ? "2026-09-30" : undefined

    let currentVersion: CharterVersion | undefined
    if (plan.status === "published") {
      currentVersion = versions.find((version) => version.status === "published")
    } else if (plan.status === "draft") {
      // A never-published draft still points at its first (draft) version.
      currentVersion = versions[0]
    } else {
      currentVersion = versions[last]
    }

    return {
      id: plan.id,
      title,
      category: categoryFor(title),
      description,
      display_order: plan.display_order,
      is_published: plan.status === "published",
      archived_at: archivedAt,
      created_at: versions[0].created_at,
      published_at: archivedAt ? publishedDate : plan.status === "draft" ? undefined : publishedDate,
      created_by_name: plan.by,
      current_version_id: currentVersion?.id,
      versions: [...versions].reverse(), // newest first, as the controller orders them
    } satisfies CharterService
  })
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

/**
 * One in-memory store for the whole Clerk charter flow. The list page and the
 * management page share this singleton, so publishing or uploading a revision on
 * one screen is reflected on the other without any network round-trip.
 */
export function createClerkCharterStore(seed: CharterService[] = buildSeed()) {
  let services = [...seed]

  const find = (id: number) => services.find((service) => service.id === id)

  /** Replace one service with the result of `mutate`, keeping array identity fresh. */
  const replace = (id: number, mutate: (service: CharterService) => CharterService) => {
    services = services.map((service) => (service.id === id ? mutate(service) : service))
  }

  const nextVersionNumber = (service: CharterService) =>
    service.versions.reduce((max, version) => Math.max(max, version.version_number), 0) + 1

  return {
    /* Reads -------------------------------------------------------- */
    list(): CharterService[] {
      return services
    },

    byId(id: number): CharterService | undefined {
      return find(id)
    },

    stats() {
      const statusOf = (service: CharterService) => charterServiceStatus(service)
      return {
        total: services.length,
        draft: services.filter((s) => statusOf(s) === "draft").length,
        published: services.filter((s) => statusOf(s) === "published").length,
        archived: services.filter((s) => statusOf(s) === "archived").length,
      }
    },

    nextServiceId(): number {
      return services.reduce((max, service) => Math.max(max, service.id), 0) + 1
    },

    /* Mutations -------------------------------------------------- */
    /** A new service always opens as a draft with version 1, mirroring `store()`. */
    createDraft(input: CharterDraftInput): { id: number; flash: CharterFlash } {
      const id = this.nextServiceId()
      const version: CharterVersion = {
        id: Math.max(...services.flatMap((s) => s.versions.map((v) => v.id)), 0) + 1,
        version_number: 1,
        original_name: input.document.original_name,
        mime_type: input.document.mime_type,
        file_size: input.document.file_size,
        status: "draft",
        uploaded_by_name: CLERK,
        created_at: CHARTER_TODAY,
      }

      const service: CharterService = {
        id,
        title: input.title,
        category: input.category?.trim() || undefined,
        description: input.description?.trim() || undefined,
        display_order: input.display_order,
        is_published: false,
        created_at: CHARTER_TODAY,
        created_by_name: CLERK,
        current_version_id: version.id,
        versions: [version],
      }

      services = [service, ...services]
      return { id, flash: { text: charterCopy.createFlash, tone: "success" } }
    },

    updateDetails(id: number, input: CharterDetailsInput): CharterFlash {
      const service = find(id)
      if (!service) return { text: "Citizen's Charter service not found.", tone: "error" }
      if (service.archived_at) return { text: charterCopy.editArchived, tone: "error" }

      replace(id, (entry) => ({
        ...entry,
        title: input.title,
        category: input.category?.trim() || undefined,
        description: input.description?.trim() || undefined,
        display_order: input.display_order,
        updated_by_name: CLERK,
      }))
      return { text: charterCopy.updateFlash, tone: "success" }
    },

    /** Upload a replacement document. Never touches the live pointer — safe versioning. */
    addRevision(id: number, file: CharterUploadedFile): CharterFlash {
      const service = find(id)
      if (!service) return { text: "Citizen's Charter service not found.", tone: "error" }
      if (service.archived_at) return { text: charterCopy.revisionArchived, tone: "error" }

      const number = nextVersionNumber(service)
      const version: CharterVersion = {
        id: Math.max(...services.flatMap((s) => s.versions.map((v) => v.id)), 0) + 1,
        version_number: number,
        original_name: file.original_name,
        mime_type: file.mime_type,
        file_size: file.file_size,
        status: "draft",
        uploaded_by_name: CLERK,
        created_at: CHARTER_TODAY,
      }

      replace(id, (entry) => ({ ...entry, versions: [version, ...entry.versions] }))
      return { text: charterCopy.revisionFlash(number), tone: "info" }
    },

    /** Promote the newest draft (or the current pointer) and retire the old one. */
    publish(id: number): CharterFlash {
      const service = find(id)
      if (!service) return { text: "Citizen's Charter service not found.", tone: "error" }
      if (service.archived_at) return { text: charterCopy.publishArchived, tone: "error" }

      const newestDraft = [...service.versions]
        .filter((version) => version.status === "draft")
        .sort((a, b) => b.version_number - a.version_number)[0]
      const target =
        newestDraft ?? service.versions.find((version) => version.id === service.current_version_id)

      if (!target) return { text: charterCopy.publishWithoutDoc, tone: "error" }

      const previousId = service.current_version_id
      replace(id, (entry) => {
        const versions = entry.versions.map((version) => {
          if (version.id === target.id) {
            return { ...version, status: "published" as const, published_at: CHARTER_TODAY }
          }
          if (previousId && version.id === previousId) {
            return { ...version, status: "superseded" as const }
          }
          return version
        })
        return {
          ...entry,
          versions,
          current_version_id: target.id,
          is_published: true,
          published_at: entry.published_at ?? CHARTER_TODAY,
        }
      })

      return { text: charterCopy.publishFlash(target.version_number), tone: "success" }
    },

    /** Archive pulls the service down and freezes its current version. */
    archive(id: number): CharterFlash {
      const service = find(id)
      if (!service) return { text: "Citizen's Charter service not found.", tone: "error" }
      if (service.archived_at) return { text: charterCopy.alreadyArchived, tone: "info" }

      const currentId = service.current_version_id
      replace(id, (entry) => ({
        ...entry,
        is_published: false,
        archived_at: CHARTER_TODAY,
        versions: entry.versions.map((version) =>
          version.id === currentId
            ? { ...version, status: "archived" as const, archived_at: CHARTER_TODAY }
            : version,
        ),
      }))

      return { text: charterCopy.archiveFlash, tone: "success" }
    },
  }
}

export type ClerkCharterStore = ReturnType<typeof createClerkCharterStore>

/** Shared singleton so the list page and the management page stay in step. */
export const clerkCharterStore = createClerkCharterStore()
