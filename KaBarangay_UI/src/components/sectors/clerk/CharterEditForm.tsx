import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
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
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/Panel"
import type { CharterDetailsInput } from "@/mock/clerk/charter"

const editSchema = z.object({
  title: z.string().min(1, "Service title is required").max(255, "Keep the title under 255 characters"),
  category: z.string().max(100, "Keep the category under 100 characters").optional(),
  display_order: z.coerce
    .number({ invalid_type_error: "Enter a number from 0 to 9999" })
    .int("Whole numbers only")
    .min(0, "Cannot be negative")
    .max(9999, "Must be 9999 or lower"),
  description: z.string().max(2000, "Keep the description under 2000 characters").optional(),
})

type EditValues = z.infer<typeof editSchema>

type Props = {
  service: { title: string; category?: string; description?: string; display_order: number }
  onSave: (values: CharterDetailsInput) => void
  onCancel: () => void
}

/** Inline "Edit Service Information" form — metadata only, no document. */
export default function CharterEditForm({ service, onSave, onCancel }: Props) {
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: service.title,
      category: service.category ?? "",
      description: service.description ?? "",
      display_order: service.display_order,
    },
  })

  const submit = (values: EditValues) => {
    onSave({
      title: values.title.trim(),
      category: values.category?.trim() || undefined,
      description: values.description?.trim() || undefined,
      display_order: values.display_order,
    })
  }

  return (
    <Panel className="mt-4">
      <PanelHeader>
        <PanelTitle>Edit Service Information</PanelTitle>
      </PanelHeader>
      <PanelContent>
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
                    <Input {...field} />
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
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
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
                  <FormLabel>Description / Summary</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Button type="submit" className="h-9">
                Save Changes
              </Button>
              <Button type="button" variant="outline" className="h-9 bg-surface" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </PanelContent>
    </Panel>
  )
}
