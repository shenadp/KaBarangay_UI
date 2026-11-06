import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import { Textarea } from "@/components/ui/textarea"
import CharterFileField from "@/components/sectors/clerk/CharterFileField"
import { charterCopy, type CharterUploadedFile } from "@/mock/clerk/charter"

const createSchema = z.object({
  title: z
    .string()
    .min(1, "Service title is required")
    .max(255, "Keep the title under 255 characters"),
  category: z.string().max(100, "Keep the category under 100 characters").optional(),
  display_order: z.coerce
    .number({ invalid_type_error: "Enter a number from 0 to 9999" })
    .int("Whole numbers only")
    .min(0, "Cannot be negative")
    .max(9999, "Must be 9999 or lower"),
  description: z.string().max(2000, "Keep the description under 2000 characters").optional(),
})

type CreateValues = z.infer<typeof createSchema>

export type CharterDraftPayload = CreateValues & { document: CharterUploadedFile }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CharterDraftPayload) => void
}

/** "Add Citizen's Charter Service" modal — always saves as a draft. */
export default function CharterCreateDialog({ open, onOpenChange, onSubmit }: Props) {
  const [document, setDocument] = useState<CharterUploadedFile | null>(null)
  const [documentError, setDocumentError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: "", category: "", description: "", display_order: 0 },
  })

  const reset = () => {
    form.reset({ title: "", category: "", description: "", display_order: 0 })
    setDocument(null)
    setDocumentError(undefined)
    setSubmitting(false)
  }

  const submit = (values: CreateValues) => {
    if (!document) {
      setDocumentError("Attach the official service document (PDF).")
      return
    }
    setSubmitting(true)
    // UI-only: the backend integration replaces this timeout.
    window.setTimeout(() => {
      onSubmit({ ...values, document })
      reset()
      onOpenChange(false)
    }, 500)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Citizen&apos;s Charter Service</DialogTitle>
          <DialogDescription>
            New services are saved as a draft. Upload its official PDF and publish it when ready.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Service Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Issuance of Barangay Clearance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Certificates, Social Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={9999} className="tnum" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Summary (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Short summary of who may avail and what this service covers…"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <CharterFileField
                label="Official Service Document (PDF only) *"
                helper={charterCopy.pdfHelper}
                value={document}
                error={documentError}
                onPick={(file) => {
                  setDocument(file)
                  if (file) setDocumentError(undefined)
                }}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="bg-surface" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save Service as Draft"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
