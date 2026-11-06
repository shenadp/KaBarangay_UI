import { useEffect, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ImagePlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  formatOrgChartFileSize,
  orgChartMaxPhotoBytes,
  orgChartPhotoFromFile,
  releaseOrgChartPhoto,
  type OrgChartPhoto,
  type OrgChartPosition,
} from "@/mock/orgChart"

/** Radix selects reject an empty value, so the top level gets its own token. */
const TOP_LEVEL = "none"

const formValuesSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Position title is required")
    .max(255, "Use at most 255 characters"),
  assignedPerson: z.string().trim().max(255, "Use at most 255 characters"),
  parentId: z.string(),
})

type FormValues = z.infer<typeof formValuesSchema>

/** The payload the desk writes to the store — `photo: null` keeps the file on record. */
export type OrgChartPositionDraft = {
  title: string
  assignedPerson: string | null
  parentId: number | null
  photo: OrgChartPhoto | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Null opens the form as "Add Position". */
  position: OrgChartPosition | null
  /** Already stripped of the position itself and its descendants. */
  parentOptions: OrgChartPosition[]
  blockedParentIds: number[]
  submitting: boolean
  onSubmit: (draft: OrgChartPositionDraft) => void
}

export default function OrgChartPositionDialog({
  open,
  onOpenChange,
  position,
  parentOptions,
  blockedParentIds,
  submitting,
  onSubmit,
}: Props) {
  const [photo, setPhoto] = useState<OrgChartPhoto | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const pendingPhoto = useRef<OrgChartPhoto | null>(null)
  /** Set when a submit hands the preview URL over to the store. */
  const handedOff = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const schema = useMemo(
    () =>
      formValuesSchema.superRefine((values, ctx) => {
        if (values.parentId === TOP_LEVEL) return
        // Server rule, re-checked client-side: a position cannot be its own parent.
        if (blockedParentIds.includes(Number(values.parentId))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["parentId"],
            message: "A position cannot be placed under itself or one of its descendants.",
          })
        }
      }),
    [blockedParentIds],
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", assignedPerson: "", parentId: TOP_LEVEL },
  })

  const clearPendingPhoto = () => {
    if (!handedOff.current) releaseOrgChartPhoto(pendingPhoto.current)
    handedOff.current = false
    pendingPhoto.current = null
    setPhoto(null)
    setPhotoError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  useEffect(() => {
    if (open) {
      form.reset({
        title: position?.title ?? "",
        assignedPerson: position?.assignedPerson ?? "",
        parentId: position?.parentId != null ? String(position.parentId) : TOP_LEVEL,
      })
    }
    // Leaving the dialog — closed, cancelled or submitted — releases any preview
    // the store did not take ownership of.
    clearPendingPhoto()
  }, [open, position, form])

  const pickPhoto = (file: File | null | undefined) => {
    releaseOrgChartPhoto(pendingPhoto.current)
    pendingPhoto.current = null
    setPhoto(null)

    if (!file) {
      setPhotoError(null)
      return
    }
    if (!file.type.startsWith("image/")) {
      setPhotoError("Select an image file for the official photo.")
      return
    }
    if (file.size > orgChartMaxPhotoBytes) {
      setPhotoError(
        `${file.name} is ${formatOrgChartFileSize(file.size)} — official photos are capped at 2 MB.`,
      )
      return
    }

    // Simulated upload: only the File metadata and a session object URL are kept.
    const next = orgChartPhotoFromFile(file)
    pendingPhoto.current = next
    setPhoto(next)
    setPhotoError(null)
  }

  const handleSubmit = (values: FormValues) => {
    if (photoError) return

    handedOff.current = pendingPhoto.current !== null
    onSubmit({
      title: values.title.trim(),
      assignedPerson: values.assignedPerson.trim() || null,
      parentId: values.parentId === TOP_LEVEL ? null : Number(values.parentId),
      photo: pendingPhoto.current,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{position ? "Edit Position" : "Add Position"}</DialogTitle>
          <DialogDescription>
            {position
              ? "Edits are saved as a draft and must be published again for residents to see them."
              : "New positions land as a draft. Publishing is a separate, deliberate action."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Punong Barangay" maxLength={255} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned person (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Hon. Juan Dela Cruz" maxLength={255} {...field} />
                  </FormControl>
                  <p className="text-xs text-ink-faint">
                    Leave empty if the position is currently vacant.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent position (optional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full bg-surface">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TOP_LEVEL}>None — top-level position</SelectItem>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-2">
              {/* The photo is not a form field — it only ever becomes a File preview. */}
              <Label htmlFor="org-chart-photo">Official photo (optional)</Label>
              <Input
                id="org-chart-photo"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="bg-surface"
                onChange={(event) => pickPhoto(event.target.files?.[0])}
              />
              <p className="text-xs text-ink-faint">
                Stored privately. Maximum 2 MB. Leave empty to keep the current photo, or to show a
                neutral placeholder.
              </p>
              {photoError && <p className="text-xs text-destructive">{photoError}</p>}

              {photo?.previewUrl && (
                <div className="flex items-center gap-3 rounded-lg border border-line-soft bg-canvas/60 p-3">
                  <img
                    src={photo.previewUrl}
                    alt="Selected official photo preview"
                    className="size-11 shrink-0 rounded-full border border-line object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink-strong">{photo.fileName}</p>
                    <p className="text-[11px] text-ink-faint tnum">
                      {formatOrgChartFileSize(photo.size)} · {photo.fileType}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Discard the selected photo"
                    className="ml-auto text-ink-muted"
                    onClick={clearPendingPhoto}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              )}

              {!photo && position?.photo && (
                <p className="flex items-center gap-2 rounded-lg border border-line-soft bg-canvas/60 px-3 py-2 text-[11px] text-ink-muted">
                  <ImagePlus className="size-3.5 text-brand" />
                  Current file on record: {position.photo.fileName} ·{" "}
                  <span className="tnum">{formatOrgChartFileSize(position.photo.size)}</span>
                </p>
              )}
            </div>

            {position?.status === "published" && (
              <p className="rounded-lg border border-line-soft bg-info-soft px-3.5 py-2.5 text-xs leading-relaxed text-info">
                This position is currently published. Saving changes will return it to draft so the
                revised version must be published explicitly.
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="bg-surface"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : position ? "Save as draft" : "Create draft"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
