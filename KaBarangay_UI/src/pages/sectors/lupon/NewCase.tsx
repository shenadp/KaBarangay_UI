import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type DefaultValues } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, CalendarDays, CheckCircle2, FileUp, Scale, ShieldCheck } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import { Meta, Panel, PanelContent, PanelFooter, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { barangay } from "@/mock/data"
import { TODAY, caseNatures, luponCases, nextCaseNumber, puroks, venues } from "@/mock/luponExtras"

const newCaseSchema = z.object({
  complainant: z.string().trim().min(2, "Complainant name is required"),
  respondent: z.string().trim().min(2, "Respondent name is required"),
  nature: z.string().min(1, "Select the nature of the dispute"),
  purok: z.string().min(1, "Select a purok"),
  filed: z
    .string()
    .min(1, "Date filed is required")
    .refine((value) => value <= TODAY, "The filing date cannot be in the future"),
  description: z.string().trim().min(20, "Describe the dispute in at least 20 characters"),
})

type NewCaseValues = z.infer<typeof newCaseSchema>

const defaults: DefaultValues<NewCaseValues> = {
  complainant: "",
  respondent: "",
  nature: "",
  purok: "",
  filed: TODAY,
  description: "",
}

export default function NewCase() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<{ number: string; values: NewCaseValues } | null>(null)

  const form = useForm<NewCaseValues>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: defaults,
  })

  const onSubmit = (values: NewCaseValues) => {
    setSubmitting(true)
    // UI-only: replaced by the case API on integration.
    window.setTimeout(() => {
      setSubmitting(false)
      setCreated({ number: nextCaseNumber(luponCases), values })
    }, 600)
  }

  if (created) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Lupon Tagapamayapa"
          title="Case encoded"
          description="Naitala na ang walk-in case sa docket at ready na para sa mediation notice."
          actions={
            <Button asChild variant="outline" size="sm" className="h-9">
              <Link to="/lupon/cases">
                <ArrowLeft className="size-4" /> Back to docket
              </Link>
            </Button>
          }
        />

        <Panel>
          <PanelContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="size-6" />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-ink-strong">
                Case {created.number} is on the docket
              </h2>
              <p className="max-w-md text-sm text-ink-muted">
                {created.values.complainant} vs. {created.values.respondent} ·{" "}
                {created.values.nature} · {created.values.purok}. The parties will be notified of
                the mediation schedule.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild className="h-9">
                <Link to="/lupon/cases">Open the docket</Link>
              </Button>
              <Button
                variant="outline"
                className="h-9 bg-surface"
                onClick={() => {
                  setCreated(null)
                  form.reset(defaults)
                }}
              >
                Encode another case
              </Button>
            </div>
          </PanelContent>
        </Panel>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lupon Tagapamayapa"
        title="Encode a new case"
        description="Direct walk-in case recorded at the Lupon desk, without a prior online complaint."
        actions={
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link to="/lupon/cases">
              <ArrowLeft className="size-4" /> Cancel
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Case details</PanelTitle>
              <p className="mt-0.5 text-xs text-ink-muted">
                All fields are required unless marked optional.
              </p>
            </div>
          </PanelHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <PanelContent className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="complainant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complainant</FormLabel>
                        <FormControl>
                          <Input className="h-10 bg-surface" placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="respondent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Respondent</FormLabel>
                        <FormControl>
                          <Input className="h-10 bg-surface" placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nature of dispute</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a case type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {caseNatures.map((nature) => (
                              <SelectItem key={nature} value={nature}>
                                {nature}
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
                    name="purok"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barangay / purok</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a purok" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {puroks.map((purokName) => (
                              <SelectItem key={purokName} value={purokName}>
                                {purokName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="filed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date filed</FormLabel>
                        <FormControl>
                          <Input type="date" max={TODAY} className="h-10 bg-surface" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <p className="rounded-lg border border-line-soft bg-canvas/60 px-3 py-2 text-xs leading-relaxed text-ink-muted">
                      Filing at {barangay.name} starts the 15-day mediation period under the
                      Katarungang Pambarangay rules.
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statement of the dispute</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-28 bg-surface text-sm"
                          placeholder="What happened, when it happened, and what the complainant is asking for…"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PanelContent>

              <PanelFooter>
                <p className="text-xs text-ink-faint">The case number is assigned on save.</p>
                <div className="flex items-center gap-2">
                  <Button asChild type="button" variant="outline" className="h-9 bg-surface">
                    <Link to="/lupon/cases">Cancel</Link>
                  </Button>
                  <Button type="submit" className="h-9" disabled={submitting}>
                    {submitting ? (
                      <>
                        <FileUp className="size-4 animate-pulse" /> Encoding…
                      </>
                    ) : (
                      <>
                        <Scale className="size-4" /> Open case
                      </>
                    )}
                  </Button>
                </div>
              </PanelFooter>
            </form>
          </Form>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <PanelTitle>Case defaults</PanelTitle>
            </PanelHeader>
            <PanelContent className="grid gap-4">
              <Meta label="Barangay">{barangay.name}</Meta>
              <Meta label="Venue">{venues[0]}</Meta>
              <Meta label="Mediation period">15 days from filing</Meta>
              <Meta label="Next case number">{nextCaseNumber(luponCases)}</Meta>
            </PanelContent>
          </Panel>

          <Panel>
            <PanelContent className="space-y-3 text-sm text-ink-muted">
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                Kapag hindi nagkasundo sa mediation, awtomatikong isasagawa ang conciliation.
              </p>
              <p className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand" />
                I-schedule ang hearing mula sa case detail pagkatapos ma-encode.
              </p>
              <p className="flex items-start gap-2">
                <Scale className="mt-0.5 size-4 shrink-0 text-brand" />
                Ang mga partido ay may karapatang magdala ng saksi at dokumento.
              </p>
            </PanelContent>
          </Panel>
        </div>
      </div>
    </div>
  )
}
