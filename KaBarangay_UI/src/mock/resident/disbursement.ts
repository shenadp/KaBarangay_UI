/**
 * Resident portal — the read-only view of the clerk's disbursement ledger.
 *
 * Mirrors `Resident/DisbursementDocumentController` of commit b6030a08: a
 * document reaches a resident only when it is published and not archived
 * (`authorizeVisible()`), the list is ordered by newest `published_at` then id
 * with no filters at all, and it paginates twelve per page. `show()` 404s on
 * anything the index would not list, so the detail page reads through the same
 * guard. The payload keeps the backend's snake_case shape, including the
 * `is_pdf` / `is_csv` flags the preview branches on and the three URLs.
 *
 * Rows come from `clerkDisbursementStore`, so a publish at the clerk desk is
 * immediately what this portal lists.
 */

import {
  clerkDisbursementStore,
  disbursementFileKind,
  formatFileSize,
  parseDisbursementCsv,
  type ClerkDisbursementDocument,
  type ClerkDisbursementStatus,
  type DisbursementCsvPreview,
} from "@/mock/clerk/disbursements"

/** `paginate(12)` on the index query. */
export const DISBURSEMENT_DOCUMENTS_PER_PAGE = 12

export type ResidentDisbursementDocument = {
  id: number
  title: string
  description: string | null
  original_name: string
  mime_type: string
  file_size: number
  is_pdf: boolean
  is_csv: boolean
  status: ClerkDisbursementStatus
  is_published: boolean
  published_at: string | null
  archived_at: string | null
  created_at: string | null
  preview_url: string
  file_url: string
  download_url: string
}

export type DisbursementPaginator<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export { formatFileSize }

/** `route('resident.disbursement.show', $document)` and friends. */
function urlsFor(id: number) {
  const base = `/resident/disbursement/${id}`
  return { preview_url: base, file_url: `${base}/file`, download_url: `${base}/download` }
}

function documentPayload(document: ClerkDisbursementDocument): ResidentDisbursementDocument {
  const kind = disbursementFileKind(document)

  return {
    id: document.id,
    title: document.title,
    description: document.description,
    original_name: document.originalName,
    mime_type: document.mimeType,
    file_size: document.fileSize,
    is_pdf: kind === "PDF",
    is_csv: kind === "CSV",
    status: document.archivedAt
      ? "archived"
      : document.isPublished
        ? "published"
        : "draft",
    is_published: document.isPublished,
    published_at: document.publishedAt,
    archived_at: document.archivedAt,
    created_at: document.uploadedAt,
    ...urlsFor(document.id),
  }
}

/** `visibleToResidents()` — published and never archived. */
function visibleDocuments(): ClerkDisbursementDocument[] {
  return clerkDisbursementStore
    .documents()
    .filter((document) => document.isPublished && !document.archivedAt)
}

/**
 * `DisbursementDocumentController::index()` — `orderByDesc('published_at')`
 * then `orderByDesc('id')`, twelve per page, with no filtering of any kind.
 */
export function disbursementDocumentsPage(
  page = 1,
): DisbursementPaginator<ResidentDisbursementDocument> {
  const matched = visibleDocuments().sort((a, b) => {
    const left = a.publishedAt ?? ""
    const right = b.publishedAt ?? ""
    if (left !== right) return left < right ? 1 : -1
    return b.id - a.id
  })

  const lastPage = Math.max(1, Math.ceil(matched.length / DISBURSEMENT_DOCUMENTS_PER_PAGE))
  const current = Math.min(Math.max(1, page), lastPage)
  const from = (current - 1) * DISBURSEMENT_DOCUMENTS_PER_PAGE
  const slice = matched.slice(from, from + DISBURSEMENT_DOCUMENTS_PER_PAGE)

  return {
    data: slice.map(documentPayload),
    current_page: current,
    last_page: lastPage,
    per_page: DISBURSEMENT_DOCUMENTS_PER_PAGE,
    total: matched.length,
    from: matched.length === 0 ? null : from + 1,
    to: matched.length === 0 ? null : from + slice.length,
  }
}

/** `authorizeVisible()` + `show()` — null stands in for the server's 404. */
export function disbursementDocumentById(id: number): ResidentDisbursementDocument | null {
  const document = visibleDocuments().find((entry) => entry.id === id)

  return document ? documentPayload(document) : null
}

/**
 * `csvPreview($document)` — null for anything that is not a CSV. A seeded
 * document carries its contents, so the table is really parsed; a file only
 * recorded by name reports the same message the backend uses for a missing
 * object on disk.
 */
export function disbursementCsvPreview(
  document: ResidentDisbursementDocument,
): DisbursementCsvPreview | null {
  if (!document.is_csv) return null

  return parseDisbursementCsv(clerkDisbursementStore.documentById(document.id)?.csv)
}
