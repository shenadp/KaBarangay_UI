import { cn } from "@/lib/utils"
import {
  formatCharterFileSize,
  formatIsoDate,
  type CharterVersion,
} from "@/mock/clerk/charter"
import { CharterVersionStatusBadge } from "@/components/sectors/clerk/CharterStatus"

type Props = {
  versions: CharterVersion[]
  /** The live version — the one the service currently points at, when published. */
  currentVersionId?: number
  isPublished: boolean
  selectedId?: number
  onSelect: (version: CharterVersion) => void
}

/** Clickable revision cards — the "Version History ({n})" sidebar. */
export default function CharterVersionList({
  versions,
  currentVersionId,
  isPublished,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div className="space-y-2">
      {versions.map((version) => {
        const selected = version.id === selectedId
        const isLive = isPublished && version.id === currentVersionId

        return (
          <button
            key={version.id}
            type="button"
            onClick={() => onSelect(version)}
            className={cn(
              "w-full rounded-xl border p-3.5 text-left transition-colors",
              selected
                ? "border-brand bg-brand-soft/40 ring-1 ring-brand/30"
                : "border-line-soft bg-surface hover:border-line hover:bg-canvas",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-strong">
                Version {version.version_number}
                {isLive && (
                  <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-success">
                    Live
                  </span>
                )}
              </span>
              <CharterVersionStatusBadge status={version.status} />
            </div>

            <p className="mt-1.5 truncate text-xs text-ink-muted">
              {version.original_name} ({formatCharterFileSize(version.file_size)})
            </p>

            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink-faint">
              <span className="tnum">{formatIsoDate(version.created_at)}</span>
              <span>By {version.uploaded_by_name}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
