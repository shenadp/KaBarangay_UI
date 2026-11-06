/**
 * Citizen's Charter — the resident's read-only view of the same catalogue the
 * Clerk desk manages.
 *
 * Mirrors `Resident\CitizenCharterController` of commit b6030a08: only services
 * that are published, not archived and holding a current document version are
 * visible (`CitizenCharterService::scopeVisibleToResidents`), the search matches
 * title, category or description, the category pills come from the visible set
 * alone, and the list is ordered by `display_order` then newest id and paginated
 * twelve per page. `show()` aborts 404 for anything the index would not list, so
 * the detail page reads through the same guard.
 *
 * Nothing is fetched: the rows come from `clerkCharterStore`, so publishing a
 * service at the clerk desk is immediately what this page shows.
 */

import {
  charterServiceStatus,
  clerkCharterStore,
  currentCharterVersion,
  type CharterService,
  type CharterServiceStatus,
  type CharterVersion,
} from "@/mock/clerk/charter"

/** `paginate(12)` on the index query. */
export const CHARTER_SERVICES_PER_PAGE = 12

/** `route('resident.citizen-charter.show', $service)` and friends. */
export function charterServiceUrl(id: number): string {
  return `/resident/citizen-charter/${id}`
}

export type ResidentCharterVersion = {
  id: number
  version_number: number
  original_name: string
  mime_type: string
  file_size: number
  status: CharterVersion["status"]
  is_current: boolean
  published_at: string | null
  created_at: string | null
}

/** `servicePayload($service, false)` — the staff-only keys are never present. */
export type ResidentCharterService = {
  id: number
  title: string
  category: string | null
  description: string | null
  display_order: number
  status: CharterServiceStatus
  is_published: boolean
  published_at: string | null
  archived_at: string | null
  created_at: string | null
  current_version: ResidentCharterVersion | null
  detail_url: string
  file_url: string | null
  download_url: string | null
}

function versionPayload(
  version: CharterVersion,
  currentVersionId: number | undefined,
): ResidentCharterVersion {
  return {
    id: version.id,
    version_number: version.version_number,
    original_name: version.original_name,
    mime_type: version.mime_type,
    file_size: version.file_size,
    status: version.status,
    is_current: currentVersionId !== undefined && version.id === currentVersionId,
    published_at: version.published_at ?? null,
    created_at: version.created_at,
  }
}

function servicePayload(service: CharterService): ResidentCharterService {
  const version = currentCharterVersion(service)

  return {
    id: service.id,
    title: service.title,
    category: service.category ?? null,
    description: service.description ?? null,
    display_order: service.display_order,
    status: charterServiceStatus(service),
    is_published: service.is_published,
    published_at: service.published_at ?? null,
    archived_at: service.archived_at ?? null,
    created_at: service.created_at,
    current_version: version ? versionPayload(version, service.current_version_id) : null,
    detail_url: charterServiceUrl(service.id),
    file_url: version ? `${charterServiceUrl(service.id)}/file` : null,
    download_url: version ? `${charterServiceUrl(service.id)}/download` : null,
  }
}

/** `visibleToResidents()` — the one filter every resident-facing charter read shares. */
function visibleServices(): CharterService[] {
  return clerkCharterStore
    .list()
    .filter(
      (service) =>
        service.is_published && !service.archived_at && service.current_version_id !== undefined,
    )
}

/** `mb_substr(trim($search), 0, 100)`. */
export function trimCharterSearch(search: string): string {
  return search.trim().slice(0, 100)
}

export type CharterPaginator<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

/**
 * `CitizenCharterController::index()` — search, category filter, ordering and
 * the twelve-per-page window, in one pass.
 */
export function charterServicesPage(
  filters: { search?: string; category?: string; page?: number } = {},
): CharterPaginator<ResidentCharterService> {
  const search = trimCharterSearch(filters.search ?? "").toLowerCase()
  const category = (filters.category ?? "").trim()

  const matched = visibleServices()
    .filter((service) => (category === "" ? true : service.category === category))
    .filter((service) =>
      search === ""
        ? true
        : [service.title, service.category ?? "", service.description ?? ""].some((field) =>
            field.toLowerCase().includes(search),
          ),
    )
    .sort((a, b) => a.display_order - b.display_order || b.id - a.id)

  const page = Math.min(Math.max(1, filters.page ?? 1), Math.max(1, Math.ceil(matched.length / CHARTER_SERVICES_PER_PAGE)) || 1)
  const from = (page - 1) * CHARTER_SERVICES_PER_PAGE
  const slice = matched.slice(from, from + CHARTER_SERVICES_PER_PAGE)

  return {
    data: slice.map(servicePayload),
    current_page: page,
    last_page: Math.max(1, Math.ceil(matched.length / CHARTER_SERVICES_PER_PAGE)),
    per_page: CHARTER_SERVICES_PER_PAGE,
    total: matched.length,
    from: matched.length === 0 ? null : from + 1,
    to: matched.length === 0 ? null : from + slice.length,
  }
}

/** Distinct non-blank categories of the visible services, alphabetical. */
export function charterCategories(): string[] {
  const names = new Set<string>()

  for (const service of visibleServices()) {
    const category = service.category?.trim()
    if (category) names.add(category)
  }

  return [...names].sort()
}

/** `CitizenCharterController::show()` — null stands in for the server's 404. */
export function charterServiceById(id: number): ResidentCharterService | null {
  const service = visibleServices().find((entry) => entry.id === id)

  return service ? servicePayload(service) : null
}
