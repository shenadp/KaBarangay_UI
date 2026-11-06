import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Upload } from "lucide-react"

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  disbursementMaxUploadBytes,
  formatFileSize,
  type DisbursementUploadInput,
} from "@/mock/clerk/disbursements"

/** MIME buckets accepted by the backend's `StoreDisbursementDocumentRequest`. */
const pdfMimeTypes = ["application/pdf", "application/x-pdf", "application/octet-stream"]
const csvMimeTypes = ["text/csv", "application/csv", "text/plain", "application/vnd.ms-excel"]

const simulatedFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
})

/**
 * A browser `File` cannot live in a zod schema that also runs during server
 * rendering, so the picked file is reduced to the three fields the mock store
 * records — name, size and type — and validated from those.
 */
const uploadSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "The title field is required.")
      .max(255, "The title may not be greater than 255 characters."),
    description: z
      .string()
      .trim()
      .max(2000, "The description may not be greater than 2000 characters."),
    file: simulatedFileSchema.nullish(),
  })
  .superRefine((values, ctx) => {
    const file = values.file
    if (!file) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["file"], message: "The document field is required." })
      return
    }

    // Rule order follows the backend: size ceiling, then extension, then emptiness.
    if (file.size > disbursementMaxUploadBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: "The document may not be larger than 5 MB.",
      })
      return
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (extension !== "pdf" && extension !== "csv") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: "The document must be a PDF or CSV file.",
      })
      return
    }

    if (file.size === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["file"], message: "The document file is empty." })
      return
    }

    const mimeType = file.type.toLowerCase()
    // Browsers report an empty type when they cannot guess one; the backend
    // sniffs those files, so an empty string is allowed to pass here.
    if (!mimeType) return

    const allowed = extension === "pdf" ? pdfMimeTypes : csvMimeTypes
    if (!allowed.includes(mimeType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: `The ${extension.toUpperCase()} file type could not be verified.`,
      })
    }
  })

type UploadValues = z.infer<typeof uploadSchema>

const blankValues: UploadValues = { title: "", description: "", file: null }

type Props = {
  open: boolean
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (input: DisbursementUploadInput) => void
}

export default function DisbursementUploadDialog({ open, submitting, onOpenChange, onUpload }: Props) {
  const form = useForm<UploadValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: blankValues,
  })

  const selected = form.watch("file")

  useEffect(() => {
    if (open) form.reset(blankValues)
  }, [open, form])

  const submit = (values: UploadValues) => {
    if (!values.file) return
    onUpload({
      title: values.title,
      description: values.description || null,
      file: values.file,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload disbursement document</DialogTitle>
          <DialogDescription>
            PDF or CSV, up to 5 MB. New uploads stay in draft until published.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document title</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      maxLength={255}
                      placeholder="e.g. 2026 Educational Assistance Payout"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description <span className="font-normal text-ink-faint">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      maxLength={2000}
                      placeholder="Add context for staff reviewing this document."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PDF or CSV file</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.csv,application/pdf,text/csv"
                      className="h-auto bg-surface py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-canvas file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const picked = event.target.files?.[0]
                        field.onChange(
                          picked
                            ? { name: picked.name, size: picked.size, type: picked.type }
                            : null,
                        )
                      }}
                    />
                  </FormControl>
                  {selected && (
                    <p className="text-xs text-ink-muted">
                      Selected: {selected.name} ({formatFileSize(selected.size)})
                    </p>
                  )}
                  <FormDescription className="text-xs">
                    The file is never uploaded anywhere — this demo records its name and size only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="bg-surface"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !selected}>
                {submitting ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="size-4" /> Upload draft
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
