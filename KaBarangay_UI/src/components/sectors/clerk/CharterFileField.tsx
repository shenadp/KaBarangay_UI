import { useRef, useState } from "react"
import { FileText, UploadCloud } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  formatCharterFileSize,
  validateCharterUpload,
  type CharterUploadedFile,
} from "@/mock/clerk/charter"

type Props = {
  /** Rendered above the picker; the label element the input is tied to. */
  label: string
  helper: string
  value: CharterUploadedFile | null
  error?: string
  onPick: (file: CharterUploadedFile | null) => void
}

/**
 * A UI-only document picker. It reads only the browser `File` object (name,
 * size, type and the `%PDF-` magic bytes) — no bytes are stored or uploaded.
 */
export default function CharterFileField({ label, helper, value, error, onPick }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  // Local validation message takes priority over the caller-supplied form error.
  const [override, setErrorOverride] = useState<string | undefined>(undefined)
  const shown = override ?? error

  const handle = async (file: File | undefined) => {
    if (!file) {
      onPick(null)
      return
    }
    setBusy(true)
    const message = await validateCharterUpload(file)
    setBusy(false)
    if (message) {
      // Surface the rejection through the caller so it renders under the field.
      onPick(null)
      setErrorOverride(message)
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setErrorOverride(undefined)
    onPick({ original_name: file.name, file_size: file.size, mime_type: file.type || "application/pdf" })
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-dashed px-3 py-3 transition-colors",
          shown ? "border-destructive bg-canvas" : "border-line bg-canvas hover:border-brand",
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          {value ? <FileText className="size-[18px]" /> : <UploadCloud className="size-[18px]" />}
        </span>
        <div className="min-w-0 flex-1">
          {value ? (
            <>
              <p className="truncate text-sm font-medium text-ink-strong">{value.original_name}</p>
              <p className="text-xs text-ink-muted tnum">{formatCharterFileSize(value.file_size)}</p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Choose a PDF to attach…</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          aria-label={label}
          className="sr-only"
          onChange={(event) => void handle(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-8 shrink-0 rounded-md border border-line-soft bg-surface px-3 text-xs font-medium text-ink transition-colors hover:text-brand"
        >
          {busy ? "Reading…" : value ? "Replace" : "Browse"}
        </button>
      </div>
      <p className="text-xs text-ink-faint">{helper}</p>
      {shown && <p className="text-sm text-destructive">{shown}</p>}
    </div>
  )
}
