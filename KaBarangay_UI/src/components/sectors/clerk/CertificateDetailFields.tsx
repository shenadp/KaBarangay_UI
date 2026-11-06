import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CertificateDetailField, CertificateDetailRow } from "@/mock/clerk/certificates"

export type DetailErrors = Record<string, string | undefined>

/** The same required / range rules the backend applies to the detail payload. */
export function validateDetailValues(
  fields: CertificateDetailField[],
  values: Record<string, string>,
): DetailErrors {
  const errors: DetailErrors = {}

  for (const field of fields) {
    const raw = (values[field.key] ?? "").trim()

    if (field.required && raw === "") {
      errors[field.key] = `${field.label} is required.`
      continue
    }
    if (raw === "") continue

    if (field.kind === "integer") {
      if (!/^\d+$/.test(raw)) {
        errors[field.key] = `${field.label} must be a whole number.`
        continue
      }
      const parsed = Number(raw)
      if (field.min !== undefined && parsed < field.min) {
        errors[field.key] = `${field.label} must be ${field.min} or higher.`
        continue
      }
      if (field.max !== undefined && parsed > field.max) {
        errors[field.key] = `${field.label} must be ${field.max} or lower.`
        continue
      }
    }

    if (field.kind === "numeric") {
      const parsed = Number(raw)
      if (!Number.isFinite(parsed)) {
        errors[field.key] = `${field.label} must be a number.`
      } else if (field.min !== undefined && parsed < field.min) {
        errors[field.key] = `${field.label} must be at least ${field.min}.`
      }
    }
  }

  return errors
}

export function hasDetailErrors(errors: DetailErrors): boolean {
  return Object.values(errors).some((message) => message !== undefined)
}

/** One renderer for every per-type detail field, driven by the descriptor. */
export function DetailFieldInputs({
  fields,
  values,
  errors,
  onChange,
  className,
}: {
  fields: CertificateDetailField[]
  values: Record<string, string>
  errors?: DetailErrors
  onChange: (key: string, value: string) => void
  className?: string
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {fields.map((field) => {
        const error = errors?.[field.key]
        const inputId = `certificate-detail-${field.key}`

        return (
          <div key={field.key} className={cn("grid gap-1.5", field.type === "text" && field.key === "parents_marriage_details" && "sm:col-span-2")}>
            <Label htmlFor={inputId} className="text-[11px] uppercase tracking-wider text-ink-faint">
              {field.label}
            </Label>
            {field.type === "select" ? (
              <Select
                value={values[field.key] ?? ""}
                onValueChange={(value) => onChange(field.key, value)}
              >
                <SelectTrigger id={inputId} className="w-full bg-surface">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={inputId}
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                min={field.min}
                max={field.max}
                step={field.kind === "numeric" ? "0.01" : field.kind === "integer" ? "1" : undefined}
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(event) => onChange(field.key, event.target.value)}
                aria-invalid={error ? true : undefined}
                className={cn("bg-surface", field.type === "number" && "tnum", error && "border-destructive")}
              />
            )}
            {field.help && <p className="text-[11px] text-ink-muted">{field.help}</p>}
            {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
          </div>
        )
      })}
    </div>
  )
}

/** Read-only label/value rows, as used by the request, issuance and detail views. */
export function DetailRowTable({ rows }: { rows: CertificateDetailRow[] }) {
  return (
    <div className="divide-y divide-line-soft overflow-hidden rounded-lg border border-line-soft bg-surface">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <span className="text-ink-muted">{row.label}</span>
          <span className="font-medium text-ink-strong">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

/** Section caption matching the backend's uppercase block headings. */
export function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
      {children}
    </p>
  )
}
