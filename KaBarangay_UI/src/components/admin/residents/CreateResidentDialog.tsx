import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import BirthdateInput from "@/components/BirthdateInput"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  civilStatusOptions,
  puroks,
  residentRegistry,
  type AdminHousehold,
  type CreateResidentInput,
} from "@/mock/admin/residents"

type HouseholdMatch = AdminHousehold & { members_count: number }

const formValuesSchema = z
  .object({
    purokId: z.string().min(1, "Select a purok"),
    firstName: z.string().trim().min(1, "First name is required").max(60, "Use at most 60 characters"),
    middleName: z.string().trim().max(60, "Use at most 60 characters"),
    lastName: z.string().trim().min(1, "Last name is required").max(60, "Use at most 60 characters"),
    suffix: z.string().trim().max(20, "Use at most 20 characters"),
    birthdate: z.string(),
    sex: z.string().min(1, "Select a sex"),
    civilStatus: z.string().min(1, "Select a civil status"),
    mobile: z
      .string()
      .trim()
      .regex(/^09\d{9}$/, "Use the format 09XXXXXXXXX"),
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address")]),
    householdMode: z.enum(["none", "new", "existing"]),
    householdId: z.string(),
    householdRelationship: z.string().trim(),
    addressLine: z.string().trim().min(1, "Address is required"),
  })
  .superRefine((values, ctx) => {
    const today = new Date().toISOString().slice(0, 10)
    // The three selects write into one field, so a part still open is incomplete.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.birthdate)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["birthdate"], message: "Birthdate is required" })
    } else if (values.birthdate > today) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["birthdate"], message: "Birthdate cannot be in the future." })
    }
    if (values.householdMode !== "none" && values.householdRelationship.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["householdRelationship"],
        message: "Record the relationship to the household head.",
      })
    }
    if (values.householdMode === "existing" && values.householdId.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["householdId"],
        message: "Choose the household to attach this resident to.",
      })
    }
  })

type FormValues = z.infer<typeof formValuesSchema>

const defaults: FormValues = {
  purokId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  birthdate: "",
  sex: "",
  civilStatus: "",
  mobile: "",
  email: "",
  householdMode: "none",
  householdId: "",
  householdRelationship: "",
  addressLine: "",
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (message: string) => void
}

export default function CreateResidentDialog({ open, onOpenChange, onCreated }: Props) {
  const [householdSearch, setHouseholdSearch] = useState("")
  const [matches, setMatches] = useState<HouseholdMatch[]>([])
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formValuesSchema),
    defaultValues: defaults,
  })

  const householdMode = form.watch("householdMode")

  // Same rule the search endpoint applies: two characters before anything is listed.
  useEffect(() => {
    const needle = householdSearch.trim()
    if (householdMode !== "existing" || needle.length < 2) {
      setMatches([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = window.setTimeout(() => {
      setMatches(residentRegistry.searchHouseholds(needle))
      setSearching(false)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [householdSearch, householdMode])

  const handleSubmit = (values: FormValues) => {
    const input: CreateResidentInput = {
      purokId: Number(values.purokId),
      firstName: values.firstName,
      middleName: values.middleName || null,
      lastName: values.lastName,
      suffix: values.suffix || null,
      birthdate: values.birthdate,
      sex: values.sex,
      civilStatus: values.civilStatus,
      addressLine: values.addressLine,
      mobile: values.mobile,
      email: values.email || null,
      householdMode: values.householdMode,
      householdId: values.householdMode === "existing" ? Number(values.householdId) : null,
      householdRelationship: values.householdRelationship || null,
    }

    // UI-only: the backend integration replaces this delay.
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      const result = residentRegistry.createResident(input)
      if (!result.ok) {
        const field = result.field as keyof FormValues | undefined
        if (field) {
          form.setError(field, { message: result.message })
          return
        }
        form.setError("root", { message: result.message })
        return
      }
      form.reset(defaults)
      setHouseholdSearch("")
      setMatches([])
      onCreated(result.message)
      onOpenChange(false)
    }, 600)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Resident</DialogTitle>
          <DialogDescription>
            Create a canonical Resident record without creating a portal account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="purokId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purok</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-surface">
                          <SelectValue placeholder="Select purok" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {puroks.map((purok) => (
                          <SelectItem key={purok.id} value={String(purok.id)}>
                            {purok.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="householdMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Household</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue("householdId", "")
                        setHouseholdSearch("")
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-surface">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No household assignment</SelectItem>
                        <SelectItem value="new">Create household, set as head</SelectItem>
                        <SelectItem value="existing">Attach to existing household</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input className="bg-surface" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle name</FormLabel>
                    <FormControl>
                      <Input className="bg-surface" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input className="bg-surface" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suffix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suffix</FormLabel>
                    <FormControl>
                      <Input className="bg-surface" placeholder="e.g. Jr." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Birthdate</FormLabel>
                    <BirthdateInput value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-surface">
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="civilStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Civil status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-surface">
                          <SelectValue placeholder="Select civil status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {civilStatusOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile number</FormLabel>
                    <FormControl>
                      <Input className="bg-surface" inputMode="numeric" placeholder="09XXXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" className="bg-surface" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {householdMode === "existing" && (
              <div className="space-y-2 rounded-xl border border-line-soft bg-canvas/60 p-3.5">
                <FormField
                  control={form.control}
                  name="householdId"
                  render={() => (
                    <FormItem>
                      <FormLabel>Search household head or code</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-surface"
                          placeholder="Name or HH code"
                          value={householdSearch}
                          onChange={(event) => {
                            setHouseholdSearch(event.target.value)
                            form.setValue("householdId", "")
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {searching && (
                  <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Loader2 className="size-3.5 animate-spin" /> Searching households…
                  </p>
                )}
                {!searching && householdSearch.trim().length >= 2 && matches.length === 0 && (
                  <p className="text-xs text-ink-faint">No household matches that search.</p>
                )}
                <div className="space-y-1">
                  {matches.map((household) => (
                    <button
                      key={household.id}
                      type="button"
                      onClick={() => {
                        form.setValue("householdId", String(household.id))
                        setHouseholdSearch(`${household.code} · ${household.head}`)
                        setMatches([])
                        form.clearErrors("householdId")
                      }}
                      className="block w-full rounded-lg border border-line-soft bg-surface px-3 py-2 text-left text-xs text-ink transition-colors hover:border-brand hover:text-ink-strong"
                    >
                      {household.code} · {household.head} · {household.members_count} member(s)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {householdMode !== "none" && (
              <FormField
                control={form.control}
                name="householdRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship to household head</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-surface"
                        placeholder={householdMode === "new" ? "Head" : "e.g. Spouse, Child"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="addressLine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea rows={3} className="bg-surface" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root?.message && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <p className="rounded-lg border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-xs leading-relaxed text-warning">
              An invitation is sent when an email address is provided. The QR code is not emailed;
              deliver it securely from the Resident details view.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="bg-surface"
                disabled={busy}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Creating…" : "Create Resident"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
