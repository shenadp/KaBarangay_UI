import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

import { cn } from "@/lib/utils"

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-line-soft bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </div>
  )
}

/** Search + optional filters/actions row that sits at the top of a table panel. */
export function TableToolbar({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3",
        className,
      )}
    >
      {children}
    </div>
  )
}

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  /** Row kind, so the footer can read "of 16 general residents". */
  label?: string
  onPageChange?: (page: number) => void
  className?: string
}

export function TablePagination({
  page,
  pageSize,
  total,
  label,
  onPageChange,
  className,
}: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-5 py-3 text-xs text-ink-muted",
        className,
      )}
    >
      <p>
        Showing <span className="font-medium text-ink tnum">{from}–{to}</span> of{" "}
        <span className="font-medium text-ink tnum">{total}</span>
        {label ? ` ${label}` : ""}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          aria-label="Previous page"
          className="grid size-8 place-items-center rounded-md border border-line-soft bg-surface text-ink-muted transition-colors hover:text-brand disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="px-1 text-ink tnum">
          {page} / {lastPage}
        </span>
        <button
          type="button"
          disabled={page >= lastPage}
          onClick={() => onPageChange?.(page + 1)}
          aria-label="Next page"
          className="grid size-8 place-items-center rounded-md border border-line-soft bg-surface text-ink-muted transition-colors hover:text-brand disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
