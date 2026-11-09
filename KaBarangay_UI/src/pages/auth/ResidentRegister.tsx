import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type DefaultValues, type FieldErrors, type FieldPath } from "react-hook-form"
import { z } from "zod"
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Info,
  Loader2,
  Mail,
  MapPin,
  PersonStanding,
  RotateCcw,
  Send,
  ShieldCheck,
  Upload,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import AuthLayout from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Panel } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { barangay as primaryBarangay, barangayOptions } from "@/mock/data"
import {
  residentRegistrationBaseSchema,
  residentRegistrationSchema,
  type ResidentRegistrationValues,
} from "@/schemas/forms"
import { submitRegistration } from "@/mock/resident/registration"

/**
 * Resident registration mirrors the backend's six-step wizard:
 * Barangay → Personal Information → Sector Information → Identity Verification
 * → Account Security → Review & Submit. The email must be verified with a
 * one-time code before the account step and submit unlock, exactly like
 * `Resident/Register.tsx` + `EmailVerificationSection`. Everything is mock:
 * submitting writes into the same registry the barangay desk reads from.
 */
const steps = [
  {
    title: "Barangay",
    description: "Choose the barangay where you currently reside.",
  },
  {
    title: "Personal Information",
    description: "Enter your personal information and select your purok.",
  },
  {
    title: "Sector Information",
    description: "Choose Regular Resident, Senior Citizen, PWD, or both Senior Citizen and PWD.",
  },
  {
    title: "Identity Verification",
    description: "Upload your valid ID and supporting proof, then capture a live identity photo.",
  },
  {
    title: "Account Security",
    description: "Add your contact information and create your password.",
  },
  {
    title: "Review & Submit",
    description: "Review everything carefully before submitting.",
  },
]

const location = { city: primaryBarangay.city, province: primaryBarangay.province }

const purokCounts = [6, 7, 5, 6, 4]
const puroksByBarangay: Record<string, string[]> = Object.fromEntries(
  barangayOptions.map((name, index) => [
    name,
    Array.from({ length: purokCounts[index] ?? 5 }, (_, purok) => `Purok ${purok + 1}`),
  ]),
)

const sexOptions = ["Male", "Female"] as const
const civilStatusOptions = ["Single", "Married", "Widowed", "Separated"] as const

const sectorOptions: {
  value: "regular" | "senior" | "pwd"
  title: string
  description: string
  icon: LucideIcon
}[] = [
  {
    value: "regular",
    title: "Regular Resident",
    description: "Choose this if you are not registering under Senior Citizen or PWD.",
    icon: UserRound,
  },
  {
    value: "senior",
    title: "Senior Citizen",
    description: "Choose this if you are a Senior Citizen. Supporting proof will be required.",
    icon: PersonStanding,
  },
  {
    value: "pwd",
    title: "Person with Disability",
    description: "Choose this if you are a Person with Disability. Supporting proof will be required.",
    icon: Accessibility,
  },
]

const sectorLabel = (key: string) =>
  key === "regular"
    ? "Regular Resident"
    : key === "senior"
      ? "Senior Citizen"
      : "Person with Disability"

const stepSchemas: z.ZodTypeAny[] = [
  residentRegistrationBaseSchema.pick({ barangay: true }),
  residentRegistrationBaseSchema.pick({
    firstName: true,
    middleName: true,
    lastName: true,
    suffix: true,
    birthdate: true,
    sex: true,
    civilStatus: true,
    purok: true,
    addressLine: true,
  }),
  residentRegistrationBaseSchema.pick({ sectors: true }).superRefine((values, ctx) => {
    if (values.sectors.includes("regular") && values.sectors.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sectors"],
        message: "Regular Resident cannot be combined with Senior Citizen or PWD",
      })
    }
  }),
  residentRegistrationBaseSchema
    .pick({
      sectors: true,
      validId: true,
      livePhoto: true,
      seniorProof: true,
      pwdProof: true,
    })
    .superRefine((values, ctx) => {
      if (!(values.validId instanceof File)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["validId"],
          message: "Please provide a valid ID.",
        })
      }
      if (!(values.livePhoto instanceof File)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["livePhoto"],
          message: "Please capture your live identity photo.",
        })
      }
      if (values.sectors.includes("senior") && !(values.seniorProof instanceof File)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["seniorProof"],
          message: "Senior Citizen ID or supporting proof is required.",
        })
      }
      if (values.sectors.includes("pwd") && !(values.pwdProof instanceof File)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pwdProof"],
          message: "PWD ID or supporting proof is required.",
        })
      }
    }),
  residentRegistrationBaseSchema
    .pick({ mobile: true, email: true, password: true, confirmPassword: true })
    .superRefine((values, ctx) => {
      if (values.password && values.password !== values.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Passwords do not match.",
        })
      }
    }),
  residentRegistrationBaseSchema.pick({ agree: true }),
]

const defaultValues: DefaultValues<ResidentRegistrationValues> = {
  barangay: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  birthdate: "",
  sex: undefined,
  civilStatus: undefined,
  purok: "",
  addressLine: "",
  qrToken: "",
  sectors: [],
  validId: null,
  livePhoto: null,
  seniorProof: null,
  pwdProof: null,
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
  agree: false,
}

type SelectFieldName = "barangay" | "purok" | "sex" | "civilStatus"
type TextFieldName =
  | "firstName"
  | "middleName"
  | "lastName"
  | "suffix"
  | "birthdate"
  | "addressLine"
  | "qrToken"
  | "mobile"
  | "email"
type FileFieldName = "validId" | "livePhoto" | "seniorProof" | "pwdProof"

export default function ResidentRegister() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitErrors, setSubmitErrors] = useState<string[]>([])

  /* Email one-time code — the backend blocks the account step and submit until
     `email_verified` is true (`useRegistrationEmailOtp`). */
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpNotice, setOtpNotice] = useState("")
  const [otpBusy, setOtpBusy] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  const form = useForm<ResidentRegistrationValues>({
    resolver: zodResolver(residentRegistrationSchema),
    defaultValues,
  })
  const values = form.watch()
  const { errors } = form.formState

  const isSenior = values.sectors.includes("senior")
  const isPwd = values.sectors.includes("pwd")
  const purokOptions = values.barangay ? (puroksByBarangay[values.barangay] ?? []) : []

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  /* Changing the email invalidates the code that was sent to the old address. */
  useEffect(() => {
    setOtpSent(false)
    setOtpCode("")
    setOtpVerified(false)
    setOtpError("")
    setOtpNotice("")
    setResendIn(0)
  }, [values.email])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  const requestOtp = () => {
    const email = form.getValues("email").trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.setError("email", {
        type: "manual",
        message: "Enter a valid email address before requesting a code.",
      })
      return
    }

    form.clearErrors("email")
    setOtpBusy(true)
    setOtpError("")
    // UI-only: the integration replaces this with POST /register/send-otp.
    window.setTimeout(() => {
      setOtpBusy(false)
      setOtpSent(true)
      setResendIn(30)
      setOtpNotice(`A 6-digit code was sent to ${email}. For this demo, any 6 digits work.`)
    }, 700)
  }

  const verifyOtp = () => {
    const code = otpCode.replace(/\D/g, "")
    if (code.length !== 6) {
      setOtpError("Enter the 6-digit code from your email.")
      return
    }

    setOtpBusy(true)
    setOtpError("")
    // UI-only: the integration replaces this with POST /register/verify-otp.
    window.setTimeout(() => {
      setOtpBusy(false)
      setOtpVerified(true)
      setOtpNotice("")
      form.clearErrors("email")
    }, 600)
  }

  const validateStep = () => {
    const result = stepSchemas[step].safeParse(form.getValues())
    form.clearErrors()

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === "string") {
          form.setError(field as FieldPath<ResidentRegistrationValues>, {
            type: "manual",
            message: issue.message,
          })
        }
      }

      return false
    }

    if (step === 4 && !otpVerified) {
      form.setError("email", {
        type: "manual",
        message: "Verify your email with the one-time code before continuing.",
      })
      return false
    }

    return true
  }

  const goNext = () => {
    if (!validateStep()) return
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  const goBack = () => {
    form.clearErrors()
    setStep((current) => Math.max(current - 1, 0))
  }

  const goToStep = (target: number) => {
    form.clearErrors()
    setSubmitErrors([])
    setStep(target)
  }

  const setFile = (name: FileFieldName, file: File | null) => {
    form.setValue(name, file)
    form.clearErrors(name)
  }

  const toggleSector = (key: "regular" | "senior" | "pwd") => {
    const current = form.getValues("sectors")
    let next: ("regular" | "senior" | "pwd")[]

    if (key === "regular") {
      next = current.includes("regular") ? [] : ["regular"]
    } else {
      const withoutRegular = current.filter((value) => value !== "regular")
      next = withoutRegular.includes(key)
        ? withoutRegular.filter((value) => value !== key)
        : [...withoutRegular, key]
    }

    form.setValue("sectors", next)
    form.clearErrors("sectors")
  }

  /**
   * The whole form is validated on submit, so a field that broke after an
   * `Edit` jump sends the applicant back to the step that owns it — the same
   * thing the server-side error keys do in `Resident/Register.tsx`.
   */
  const stepOwning = (field: string) => {
    if (field === "barangay") return 0
    if (field.startsWith("sectors")) return 2
    if (field === "agree") return 5
    if (["validId", "livePhoto", "seniorProof", "pwdProof"].includes(field)) return 3
    if (["mobile", "email", "password", "confirmPassword"].includes(field)) return 4
    return 1
  }

  const onInvalid = (invalid: FieldErrors<ResidentRegistrationValues>) => {
    setStep(stepOwning(Object.keys(invalid)[0] ?? ""))
  }

  const onSubmit = (submitted: ResidentRegistrationValues) => {
    if (!otpVerified) {
      form.setError("email", {
        type: "manual",
        message: "Verify your email with the one-time code before submitting.",
      })
      setStep(4)
      return
    }

    setSubmitting(true)
    setSubmitErrors([])

    const result = submitRegistration(submitted)

    window.setTimeout(() => {
      setSubmitting(false)

      if (!result.ok) {
        setSubmitErrors([result.message])
        return
      }

      navigate("/resident/register/submitted")
    }, 900)
  }

  const textField = ({
    name,
    label,
    placeholder,
    helper,
    type = "text",
    autoComplete,
    required,
    inputMode,
  }: {
    name: TextFieldName
    label: string
    placeholder?: string
    helper?: string
    type?: string
    autoComplete?: string
    required?: boolean
    inputMode?: "text" | "numeric" | "tel" | "email"
  }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ""}
              type={type}
              inputMode={inputMode}
              autoComplete={autoComplete}
              placeholder={placeholder}
              className="h-11 bg-surface"
            />
          </FormControl>
          {helper && <p className="text-[11px] text-ink-faint">{helper}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const selectField = ({
    name,
    label,
    placeholder,
    options,
    helper,
    disabled,
    optionLabel,
  }: {
    name: SelectFieldName
    label: string
    placeholder: string
    options: readonly string[]
    helper?: string
    disabled?: boolean
    optionLabel?: (value: string) => string
  }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            <span className="text-destructive"> *</span>
          </FormLabel>
          <Select
            value={field.value ?? ""}
            disabled={disabled}
            onValueChange={(value) => {
              field.onChange(value)
              if (name === "barangay") form.setValue("purok", "")
            }}
          >
            <FormControl>
              <SelectTrigger className="h-11 w-full bg-surface">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {optionLabel ? optionLabel(option) : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {helper && <p className="text-[11px] text-ink-faint">{helper}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <AuthLayout variant="resident" maxWidth="max-w-lg">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
          Resident registration
        </p>
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink-strong">
          Create Resident Account
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          Your resident record must first be added by your barangay Admin. Submit this application
          so staff can verify your identity and link your online account to that existing record.
        </p>
      </div>

      {step > 0 && values.barangay && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-brand/15 bg-brand-soft/50 px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <MapPin className="size-4 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                Registering under
              </p>
              <p className="truncate text-sm font-medium text-ink-strong">{values.barangay}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-xs text-brand hover:bg-brand-soft"
            onClick={() => goToStep(0)}
          >
            Change Barangay
          </Button>
        </div>
      )}

      {submitErrors.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-3 rounded-xl border border-destructive/25 bg-destructive-soft px-4 py-3 text-sm text-destructive"
        >
          <p className="font-semibold">Your application has not been submitted yet.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {submitErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <p className="mt-2">
            Your information and selected documents are still in this form. Correct the issue below
            and submit again.
          </p>
        </div>
      )}

      <Panel>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} noValidate>
            <div className="border-b border-line-soft px-5 pb-4 pt-5">
              <StepProgress current={step} />
              <h2 className="mt-4 text-base font-semibold tracking-tight text-ink-strong">
                {steps[step].title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {steps[step].description}
              </p>
            </div>

            <div className="px-5 py-5">
              {step === 0 && (
                <div className="space-y-5">
                  <SectionHeading
                    title="Select Your Barangay"
                    description="Choose the barangay where you currently reside. Your address and identification documents will be checked during verification."
                  />

                  {selectField({
                    name: "barangay",
                    label: "Barangay",
                    placeholder: "Select your barangay",
                    options: barangayOptions,
                    optionLabel: (option) => `${option} — ${location.city}`,
                  })}

                  {values.barangay && (
                    <div className="rounded-xl border border-brand/15 bg-brand-soft/40 p-3.5">
                      <div className="flex items-start gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-brand">
                          <MapPin className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-strong">{values.barangay}</p>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {location.city}, {location.province}
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-brand">
                            {purokOptions.length} purok
                            {purokOptions.length === 1 ? "" : "s"} available for registration.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <InfoNote icon={Info}>
                    Select the barangay where you currently live. If you choose the wrong barangay,
                    the application may be returned for correction. Selection alone does not verify
                    residency.
                  </InfoNote>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <SectionHeading
                      title="Basic Information"
                      description="Enter your information exactly as it appears on your identification documents."
                    />
                    <div className="grid gap-3.5 min-[420px]:grid-cols-2">
                      {textField({
                        name: "firstName",
                        label: "First Name",
                        placeholder: "Enter first name",
                        autoComplete: "given-name",
                        required: true,
                      })}
                      {textField({
                        name: "middleName",
                        label: "Middle Name",
                        placeholder: "Enter middle name",
                        helper: "Leave blank if not applicable.",
                        autoComplete: "additional-name",
                      })}
                      {textField({
                        name: "lastName",
                        label: "Last Name",
                        placeholder: "Enter last name",
                        autoComplete: "family-name",
                        required: true,
                      })}
                      {textField({
                        name: "suffix",
                        label: "Suffix",
                        placeholder: "e.g. Jr., Sr., III",
                        helper: "Optional",
                        autoComplete: "honorific-suffix",
                      })}
                      {textField({
                        name: "birthdate",
                        label: "Birthdate",
                        type: "date",
                        autoComplete: "bday",
                        required: true,
                      })}
                      {selectField({
                        name: "sex",
                        label: "Sex",
                        placeholder: "Select sex",
                        options: sexOptions,
                      })}
                      {selectField({
                        name: "civilStatus",
                        label: "Civil Status",
                        placeholder: "Select civil status",
                        options: civilStatusOptions,
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-line-soft pt-5">
                    <SectionHeading
                      title="Residential Address"
                      description="Choose the purok that belongs to your selected barangay, then enter your complete current address."
                    />
                    <div className="grid gap-3.5 min-[420px]:grid-cols-2">
                      {selectField({
                        name: "purok",
                        label: "Purok",
                        placeholder: values.barangay
                          ? purokOptions.length === 0
                            ? "No puroks configured"
                            : "Select your purok"
                          : "Select a barangay first",
                        options: purokOptions,
                        disabled: !values.barangay || purokOptions.length === 0,
                      })}
                      {textField({
                        name: "addressLine",
                        label: "House No. / Street / Sitio",
                        placeholder: "Enter complete local address",
                        autoComplete: "street-address",
                        required: true,
                      })}
                    </div>

                    {values.barangay && (
                      <div className="mt-4 rounded-xl border border-line-soft bg-canvas/60 px-3.5 py-3">
                        <p className="text-[11px] font-medium text-ink-muted">Selected Barangay</p>
                        <p className="mt-0.5 text-sm font-medium text-ink-strong">
                          {values.barangay}, {location.city}, {location.province}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <SectionHeading
                    title="Resident Classification"
                    description="Choose the classification that applies to you. Select Regular Resident if you are not registering as a Senior Citizen or PWD. If both Senior Citizen and PWD apply to you, you may select both."
                  />

                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {sectorOptions.map((option) => {
                      const selected = values.sectors.includes(option.value)
                      const disabled =
                        option.value === "regular"
                          ? values.sectors.some((value) => value !== "regular")
                          : values.sectors.includes("regular")
                      const Icon = option.icon

                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          disabled={disabled}
                          onClick={() => toggleSector(option.value)}
                          className={cn(
                            "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition",
                            selected
                              ? "border-brand/40 bg-brand-soft ring-1 ring-inset ring-brand/20"
                              : "border-line-soft bg-surface hover:border-line",
                            disabled && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-8 place-items-center rounded-lg",
                              selected ? "bg-brand text-white" : "bg-canvas text-ink-muted",
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="text-sm font-medium text-ink-strong">
                            {option.title}
                          </span>
                          <span className="text-[11px] leading-relaxed text-ink-muted">
                            {option.description}
                          </span>
                          <span
                            className={cn(
                              "mt-auto inline-flex items-center gap-1 pt-1 text-[11px] font-medium",
                              selected ? "text-brand" : "text-ink-faint",
                            )}
                          >
                            {selected ? (
                              <>
                                <CheckCircle2 className="size-3.5" /> Selected
                              </>
                            ) : (
                              "Select"
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {errors.sectors?.message && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {errors.sectors.message}
                    </p>
                  )}

                  {values.sectors.length > 0 ? (
                    <div className="rounded-xl border border-brand/15 bg-brand-soft/40 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                        Selected classification
                        {values.sectors.length > 1 ? "s" : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {values.sectors.map((key) => (
                          <span
                            key={key}
                            className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-brand ring-1 ring-inset ring-brand/20"
                          >
                            {sectorLabel(key)}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                        {values.sectors.includes("regular")
                          ? "Senior Citizen and PWD are disabled while Regular Resident is selected. Deselect Regular Resident first if you need to choose a sector."
                          : "Regular Resident is disabled while a Senior Citizen or PWD classification is selected. You may select both Senior Citizen and PWD if both apply to you."}
                      </p>
                    </div>
                  ) : (
                    <InfoNote icon={Info}>Please choose one classification before continuing.</InfoNote>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <InfoNote tone="warning" icon={ShieldCheck} title="Identity verification">
                    Your valid ID and live camera photo will be reviewed by authorized barangay
                    personnel for identity confirmation before approval.
                  </InfoNote>

                  <div className="space-y-3">
                    {textField({
                      name: "qrToken",
                      label: "Existing Resident QR token (optional)",
                      placeholder: "KBQR-…",
                      helper:
                        "Enter the raw token from your existing KaBarangay Resident QR. It may help staff find a matching record, but it does not prove identity or link an account. You can continue without it.",
                    })}
                  </div>

                  <div className="space-y-3 border-t border-line-soft pt-5">
                    <SectionHeading
                      title="Valid Identification"
                      description="Upload a clear image or PDF of your valid identification document."
                    />
                    <UploadField
                      id="registration-valid-id"
                      label="Valid ID"
                      description="Accepted: JPG, PNG, or PDF. Maximum 5 MB."
                      accept="image/jpeg,image/png,application/pdf"
                      file={values.validId}
                      onChange={(file) => setFile("validId", file)}
                      error={errors.validId?.message}
                    />
                  </div>

                  {(isSenior || isPwd) && (
                    <div className="space-y-3 border-t border-line-soft pt-5">
                      <SectionHeading
                        title="Sector Supporting Documents"
                        description="Provide proof for every sector you selected."
                      />
                      <div className="grid gap-3.5 min-[420px]:grid-cols-2">
                        {isSenior && (
                          <UploadField
                            id="registration-senior-proof"
                            label="Senior Citizen ID / Proof"
                            description="Upload your Senior Citizen ID or accepted supporting document."
                            accept="image/jpeg,image/png,application/pdf"
                            file={values.seniorProof}
                            onChange={(file) => setFile("seniorProof", file)}
                            error={errors.seniorProof?.message}
                          />
                        )}
                        {isPwd && (
                          <UploadField
                            id="registration-pwd-proof"
                            label="PWD ID / Proof"
                            description="Upload your PWD ID or accepted supporting document."
                            accept="image/jpeg,image/png,application/pdf"
                            file={values.pwdProof}
                            onChange={(file) => setFile("pwdProof", file)}
                            error={errors.pwdProof?.message}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 border-t border-line-soft pt-5">
                    <SectionHeading
                      title="Live Identity Photo"
                      description="Use your device camera to take a live photo. Existing gallery photos cannot be selected here."
                    />
                    <LivePhotoField
                      value={values.livePhoto}
                      onChange={(file) => setFile("livePhoto", file)}
                      error={errors.livePhoto?.message}
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <SectionHeading
                      title="Contact Information"
                      description="Mobile number – Unverified. Email must be verified with a one-time code before you can continue."
                    />

                    <div className="grid gap-3.5 min-[420px]:grid-cols-2">
                      {textField({
                        name: "mobile",
                        label: "Mobile Number",
                        placeholder: "09XXXXXXXXX",
                        type: "tel",
                        inputMode: "tel",
                        autoComplete: "tel",
                        required: true,
                      })}

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Email address<span className="text-destructive"> *</span>
                            </FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  type="email"
                                  inputMode="email"
                                  autoComplete="email"
                                  placeholder="maria.santos@example.com"
                                  className="h-11 min-w-0 bg-surface"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant={otpVerified ? "outline" : "default"}
                                className={cn(
                                  "h-11 shrink-0 px-3",
                                  otpVerified && "bg-surface text-success",
                                )}
                                onClick={requestOtp}
                                disabled={otpBusy || otpVerified || resendIn > 0}
                              >
                                {otpBusy ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : otpVerified ? (
                                  <CheckCircle2 className="size-4" />
                                ) : (
                                  <Send className="size-4" />
                                )}
                                {otpVerified
                                  ? "Verified"
                                  : otpSent && resendIn > 0
                                    ? `Resend ${resendIn}s`
                                    : otpSent
                                      ? "Resend"
                                      : "Send OTP"}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {otpSent && !otpVerified && (
                        <div className="space-y-2 rounded-xl border border-line-soft bg-canvas/60 p-3.5 min-[420px]:col-span-2">
                          <label
                            htmlFor="registration-otp"
                            className="flex items-center gap-1.5 text-xs font-medium text-ink-strong"
                          >
                            <Mail className="size-3.5 text-brand" /> 6-digit code
                          </label>
                          <div className="flex gap-2">
                            <Input
                              id="registration-otp"
                              value={otpCode}
                              onChange={(event) => {
                                setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                                setOtpError("")
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault()
                                  verifyOtp()
                                }
                              }}
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              placeholder="000000"
                              className="h-11 w-36 bg-surface text-center tracking-[0.35em] tnum"
                            />
                            <Button
                              type="button"
                              className="h-11"
                              onClick={verifyOtp}
                              disabled={otpBusy}
                            >
                              {otpBusy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <ShieldCheck className="size-4" />
                              )}
                              Verify code
                            </Button>
                          </div>
                          {otpNotice && (
                            <p className="text-xs leading-relaxed text-ink-muted">{otpNotice}</p>
                          )}
                          {otpError && <p className="text-xs text-destructive">{otpError}</p>}
                        </div>
                      )}

                      {otpVerified && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-success min-[420px]:col-span-2">
                          <CheckCircle2 className="size-3.5" /> Email verified — registration
                          updates go to this address.
                        </p>
                      )}

                      <p className="text-xs leading-relaxed text-ink-muted min-[420px]:col-span-2">
                        The approval, correction request, or any decision from the admin is sent to
                        this email. Make sure it is active and spelled correctly.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-line-soft pt-5">
                    <SectionHeading
                      title="Create Your Password"
                      description="Use a strong password that you do not use for other accounts."
                    />

                    <div className="grid gap-3.5 min-[420px]:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Password<span className="text-destructive"> *</span>
                            </FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="new-password"
                                  placeholder="At least 8 characters"
                                  className="h-11 bg-surface pr-11"
                                />
                              </FormControl>
                              <button
                                type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                              >
                                {showPassword ? (
                                  <EyeOff className="size-4" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Confirm Password<span className="text-destructive"> *</span>
                            </FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  type={showConfirm ? "text" : "password"}
                                  autoComplete="new-password"
                                  placeholder="Re-enter your password"
                                  className="h-11 bg-surface pr-11"
                                />
                              </FormControl>
                              <button
                                type="button"
                                onClick={() => setShowConfirm((value) => !value)}
                                aria-label={showConfirm ? "Hide password" : "Show password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                              >
                                {showConfirm ? (
                                  <EyeOff className="size-4" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <PasswordChecklist password={values.password} />
                  </div>

                  <InfoNote icon={Info}>
                    Your account will remain pending until the selected barangay verifies and
                    approves your registration.
                  </InfoNote>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <ReviewBlock title="Barangay" onEdit={() => goToStep(0)}>
                    <ReviewItem
                      label="Barangay"
                      value={`${values.barangay} · ${location.city}, ${location.province}`}
                    />
                  </ReviewBlock>

                  <ReviewBlock title="Personal Information" onEdit={() => goToStep(1)}>
                    <div className="grid gap-3 min-[420px]:grid-cols-2">
                      <ReviewItem
                        label="Full Name"
                        value={[values.firstName, values.middleName, values.lastName, values.suffix]
                          .filter(Boolean)
                          .join(" ")}
                      />
                      <ReviewItem label="Birthdate" value={values.birthdate || "—"} />
                      <ReviewItem label="Sex" value={values.sex} />
                      <ReviewItem label="Civil Status" value={values.civilStatus} />
                      <ReviewItem label="Purok" value={values.purok} />
                      <ReviewItem label="House No. / Street / Sitio" value={values.addressLine} />
                    </div>
                  </ReviewBlock>

                  <ReviewBlock title="Sector Information" onEdit={() => goToStep(2)}>
                    <div className="flex flex-wrap gap-1.5">
                      {(values.sectors.length > 0 ? values.sectors : ["regular"]).map((key) => (
                        <span
                          key={key}
                          className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand ring-1 ring-inset ring-brand/20"
                        >
                          {sectorLabel(key)}
                        </span>
                      ))}
                    </div>
                  </ReviewBlock>

                  <ReviewBlock title="Identity Verification" onEdit={() => goToStep(3)}>
                    <div className="grid gap-3 min-[420px]:grid-cols-2">
                      <ReviewFile label="Valid ID" file={values.validId} />
                      <ReviewFile label="Live Identity Photo" file={values.livePhoto} />
                      {isSenior && (
                        <ReviewFile label="Senior Citizen Proof" file={values.seniorProof} />
                      )}
                      {isPwd && <ReviewFile label="PWD Proof" file={values.pwdProof} />}
                    </div>
                  </ReviewBlock>

                  <ReviewBlock title="Account Information" onEdit={() => goToStep(4)}>
                    <div className="grid gap-3 min-[420px]:grid-cols-2">
                      <ReviewItem
                        label="Mobile Number"
                        value={values.mobile ? `${values.mobile} · Unverified` : "—"}
                      />
                      <ReviewItem
                        label="Email Address"
                        value={
                          values.email
                            ? `${values.email} · ${otpVerified ? "OTP verified" : "Not verified"}`
                            : "—"
                        }
                      />
                    </div>
                  </ReviewBlock>

                  {values.barangay && (
                    <InfoNote tone="warning" icon={Info}>
                      This application will be submitted to{" "}
                      <strong className="font-semibold text-ink-strong">{values.barangay}</strong>{" "}
                      for review. Make sure this is the barangay where you currently reside.
                    </InfoNote>
                  )}

                  <FormField
                    control={form.control}
                    name="agree"
                    render={({ field }) => (
                      <FormItem className="rounded-xl border border-line-soft bg-canvas/60 p-3.5">
                        <div className="flex items-start gap-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                              className="mt-0.5"
                            />
                          </FormControl>
                          <div className="space-y-1.5">
                            <FormLabel className="text-xs leading-relaxed font-normal text-ink-muted">
                              I confirm that the information and documents I provided are true and
                              belong to me. I understand that my selected barangay will review my
                              residency, identification, live camera photo, and any Senior/PWD proof
                              before approval.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-line-soft bg-canvas/60 px-5 py-4">
              {step === 0 ? (
                <Button asChild variant="outline" className="h-11 flex-1 bg-surface">
                  <Link to="/resident/login">
                    <ArrowLeft className="size-4" /> Back to login
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 bg-surface"
                  onClick={goBack}
                >
                  <ArrowLeft className="size-4" /> Back
                </Button>
              )}

              {step < steps.length - 1 ? (
                <Button type="button" className="h-11 flex-[2]" onClick={goNext}>
                  Continue <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button type="submit" className="h-11 flex-[2]" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4" /> Submit registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Panel>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Already registered?{" "}
        <Link to="/resident/login" className="font-medium text-brand hover:underline">
          Sign in to your account
        </Link>
      </p>
    </AuthLayout>
  )
}

function StepProgress({ current }: { current: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {steps.map((item, index) => {
          const done = index < current
          const active = index === current
          return (
            <div
              key={item.title}
              className={cn("flex items-center gap-1.5", index < steps.length - 1 && "flex-1")}
            >
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold tnum transition",
                  done && "bg-brand text-white",
                  active && "bg-brand-soft text-brand ring-1 ring-inset ring-brand/40",
                  !done && !active && "bg-canvas text-ink-faint ring-1 ring-inset ring-line-soft",
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              {index < steps.length - 1 && (
                <span className={cn("h-px flex-1", done ? "bg-brand" : "bg-line-soft")} />
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] font-medium text-ink-muted">
        <span className="tnum">
          Step {current + 1} of {steps.length}
        </span>{" "}
        · {steps[current].title}
      </p>
    </div>
  )
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-strong">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{description}</p>
      )}
    </div>
  )
}

function InfoNote({
  tone = "brand",
  icon: Icon,
  title,
  children,
}: {
  tone?: "brand" | "warning"
  icon: LucideIcon
  title?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3",
        tone === "warning"
          ? "border-warning/25 bg-warning-soft"
          : "border-brand/15 bg-brand-soft/50",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "warning" ? "text-warning" : "text-brand",
        )}
      />
      <div className="min-w-0 text-xs leading-relaxed text-ink-muted">
        {title && <p className="mb-0.5 text-[13px] font-medium text-ink-strong">{title}</p>}
        {children}
      </div>
    </div>
  )
}

function UploadField({
  id,
  label,
  description,
  accept,
  file,
  onChange,
  error,
}: {
  id: string
  label: string
  description: string
  accept: string
  file: File | null
  onChange: (file: File | null) => void
  error?: string
}) {
  const [localError, setLocalError] = useState<string | null>(null)
  const allowed = ["image/jpeg", "image/png", "application/pdf"]

  const pick = (picked: File) => {
    if (picked.size > 5 * 1024 * 1024) {
      setLocalError("File must not be larger than 5 MB.")
      return
    }
    if (!allowed.includes(picked.type)) {
      setLocalError("Only JPG, PNG, and PDF files are allowed.")
      return
    }
    setLocalError(null)
    onChange(picked)
  }

  return (
    <div>
      {file === null ? (
        <label
          htmlFor={id}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition",
            error || localError
              ? "border-destructive/50 bg-destructive/5"
              : "border-line bg-canvas/50 hover:border-brand/40 hover:bg-brand-soft/30",
          )}
        >
          <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
            <FileText className="size-5" />
          </span>
          <span className="text-sm font-medium text-ink-strong">{label}</span>
          <span className="max-w-xs text-xs leading-relaxed text-ink-muted">{description}</span>
          <span className="mt-1 rounded-lg border border-line bg-surface px-4 py-2 text-xs font-medium text-ink">
            Choose file
          </span>
        </label>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-soft/40 p-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-brand">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink-strong">{label} added</p>
            <p className="mt-0.5 truncate text-xs text-ink-muted">{file.name}</p>
            <p className="text-[11px] text-ink-faint">{formatFileSize(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 bg-surface text-xs"
            onClick={() => {
              setLocalError(null)
              onChange(null)
            }}
          >
            Remove
          </Button>
        </div>
      )}

      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const picked = event.target.files?.[0]
          event.target.value = ""
          if (picked) pick(picked)
        }}
      />

      {(localError ?? error) && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {localError ?? error}
        </p>
      )}
    </div>
  )
}

function PasswordChecklist({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Contains a letter", passed: /[A-Za-z]/.test(password) },
    { label: "Contains a number", passed: /\d/.test(password) },
  ]

  return (
    <div className="rounded-xl border border-line-soft bg-canvas/60 p-3.5">
      <p className="text-xs font-medium text-ink-strong">Password requirements</p>
      <ul className="mt-2 grid gap-1.5 min-[420px]:grid-cols-3">
        {checks.map((check) => (
          <li
            key={check.label}
            className={cn(
              "flex items-center gap-1.5 text-[11px]",
              check.passed ? "text-success" : "text-ink-faint",
            )}
          >
            {check.passed ? (
              <CheckCircle2 className="size-3.5 shrink-0" />
            ) : (
              <span className="size-1.5 shrink-0 rounded-full bg-current" />
            )}
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LivePhotoField({
  value,
  onChange,
  error,
}: {
  value: File | null
  onChange: (file: File | null) => void
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  useEffect(() => {
    const video = videoRef.current
    if (!cameraOpen || !video || !streamRef.current) return
    video.srcObject = streamRef.current
    void video.play().catch(() => {})
  }, [cameraOpen])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  const startCamera = async () => {
    setCameraError(null)

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setCameraError(
        "Camera access requires HTTPS. Please open KaBarangay using a secure connection.",
      )
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is not supported by this browser. Please use an updated Chrome, Edge, Safari, or Firefox browser.",
      )
      return
    }

    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
    } catch (exception) {
      const name = (exception as DOMException)?.name
      setCameraError(
        name === "NotAllowedError"
          ? "Camera permission was blocked. Allow camera access in your browser settings, then try again."
          : name === "NotFoundError"
            ? "No camera was detected on this device."
            : name === "NotReadableError"
              ? "The camera is currently being used by another app. Close the other camera app and try again."
              : "The camera could not be opened. Please check camera permission and try again.",
      )
    } finally {
      setStarting(false)
    }
  }

  const capture = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      onChange(new File([blob], "live-identity-photo.jpg", { type: "image/jpeg" }))
      stopCamera()
    }, "image/jpeg", 0.92)
  }

  return (
    <div>
      <div
        className={cn(
          "overflow-hidden rounded-xl border",
          error ? "border-destructive/50 bg-destructive/5" : "border-line-soft bg-canvas/40",
        )}
      >
        {preview ? (
          <div>
            <img
              src={preview}
              alt="Live identity photo preview"
              className="max-h-64 w-full object-cover"
            />
            <div className="flex items-center justify-between gap-3 border-t border-line-soft bg-surface px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle2 className="size-3.5" /> Live identity photo captured
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  onChange(null)
                  void startCamera()
                }}
              >
                <RotateCcw className="size-3.5" /> Retake photo
              </Button>
            </div>
          </div>
        ) : cameraOpen ? (
          <div>
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-[4/3] w-full bg-ink-strong object-cover"
            />
            <div className="flex gap-2 border-t border-line-soft bg-surface px-3.5 py-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 flex-1 bg-surface"
                onClick={stopCamera}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" className="h-9 flex-1" onClick={capture}>
                <Camera className="size-4" /> Take photo
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-surface text-ink-muted ring-1 ring-inset ring-line-soft">
              <Camera className="size-5" />
            </span>
            <p className="text-sm font-medium text-ink-strong">Position your face inside the guide</p>
            <p className="max-w-xs text-xs leading-relaxed text-ink-muted">
              This photo is captured directly from this device camera. Gallery photos cannot be
              selected here.
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-9"
                disabled={starting}
                onClick={() => void startCamera()}
              >
                {starting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
                {starting ? "Opening camera…" : "Open camera"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 bg-surface"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-4" /> Use device camera
              </Button>
            </div>
            <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-ink-faint">
              Works with laptop webcams and phone front cameras. Camera permission is required;
              deployed sites must use HTTPS.
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          onChange={(event) => {
            const picked = event.target.files?.[0] ?? null
            event.target.value = ""
            if (!picked) return
            if (picked.size > 5 * 1024 * 1024) {
              setCameraError("That photo is over 5 MB. Take a smaller one.")
              return
            }
            setCameraError(null)
            onChange(picked)
          }}
        />
      </div>

      {cameraError && <p className="mt-1.5 text-xs leading-relaxed text-warning">{cameraError}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-line-soft">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft bg-canvas/40 px-3.5 py-2">
        <p className="text-xs font-semibold text-ink-strong">{title}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px] text-brand hover:bg-brand-soft"
          onClick={onEdit}
        >
          Edit
        </Button>
      </div>
      <div className="px-3.5 py-3">{children}</div>
    </div>
  )
}

function ReviewItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-0.5 text-sm break-words text-ink">{value?.trim() || "—"}</p>
    </div>
  )
}

function ReviewFile({ label, file }: { label: string; file: File | null }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink">
        <FileText className="size-3.5 shrink-0 text-ink-faint" />
        <span className="truncate">{file?.name ?? "Not provided"}</span>
      </p>
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
