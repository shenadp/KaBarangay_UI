import { z } from "zod"

const required = "This field is required"

/**
 * Staff sign-in. Barangay is picked in the same card (step 1) and the
 * account is identified by department + position + full name — no email login.
 */
export const staffLoginSchema = z.object({
  barangay: z.string().min(1, "Select your barangay"),
  department: z.string().min(1, "Select your department"),
  position: z.string().min(1, "Select your position"),
  fullName: z.string().min(2, "Full name is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
})
export type StaffLoginValues = z.infer<typeof staffLoginSchema>

/**
 * Resident sign-in. The barangay picker and the credentials share one form,
 * exactly as `Resident/Login.tsx` does, and the messages are its own.
 */
export const residentLoginSchema = z.object({
  barangayId: z.string().min(1, "Please select your barangay."),
  identifier: z.string().min(1, "Enter your Resident ID, email, or mobile number."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean().optional(),
})
export type ResidentLoginValues = z.infer<typeof residentLoginSchema>

/**
 * The file inputs of the registration wizard. Nothing is uploaded — the mock
 * keeps the picked `File` so the review step can name it — so the value only
 * has to be a `File` or empty; the rules live in the object-level refinements.
 */
const registrationFile = z.custom<File | null>(() => true)

/**
 * Resident registration follows the backend's six-step wizard:
 * barangay → personal information → sector → identity → account → review.
 * The page validates one step at a time against a slice of this object, so the
 * base object stays refinable (`pick` is not available on a `ZodEffects`).
 * Every message is the one `Resident/Register.tsx` shows.
 */
export const residentRegistrationBaseSchema = z.object({
  barangay: z.string().min(1, "Please select your barangay."),
  firstName: z.string().trim().min(1, "First name is required."),
  middleName: z.string().optional(),
  lastName: z.string().trim().min(1, "Last name is required."),
  suffix: z.string().optional(),
  birthdate: z.string().min(1, "Birthdate is required."),
  sex: z.enum(["Male", "Female"], { errorMap: () => ({ message: "Please select your sex." }) }),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Separated"], {
    errorMap: () => ({ message: "Civil status is required." }),
  }),
  purok: z.string().min(1, "Please select your purok."),
  addressLine: z.string().trim().min(1, "House number, street, or sitio is required."),
  qrToken: z.string().max(69, "That token is too long").optional(),
  sectors: z
    .array(z.enum(["regular", "senior", "pwd"]))
    .min(1, "Please select your resident classification."),
  validId: registrationFile,
  livePhoto: registrationFile,
  seniorProof: registrationFile,
  pwdProof: registrationFile,
  mobile: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mobile number is required." })
        return
      }
      if (!/^09\d{9}$/.test(value.replace(/\D/g, "")))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid Philippine mobile number, for example 09171234567.",
        })
    }),
  // Optional in the backend: only a filled-in address has to look like one.
  email: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid email address." })
    }),
  password: z
    .string()
    .superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Password is required." })
        return
      }
      if (value.length < 8)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must contain at least 8 characters.",
        })
      if (!/[A-Za-z]/.test(value))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must contain at least one letter.",
        })
      if (!/\d/.test(value))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must contain at least one number.",
        })
    }),
  confirmPassword: z.string().min(1, "Please confirm your password."),
  agree: z.boolean().refine((value) => value, {
    message: "Please confirm that the information you provided is true and correct.",
  }),
})

export const residentRegistrationSchema = residentRegistrationBaseSchema.superRefine((data, ctx) => {
  if (data.sectors.includes("regular") && data.sectors.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sectors"],
      message: "Regular Resident cannot be combined with Senior Citizen or PWD",
    })
  }

  if (!(data.validId instanceof File)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["validId"],
      message: "Please provide a valid ID.",
    })
  }

  if (!(data.livePhoto instanceof File)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["livePhoto"],
      message: "Please capture your live identity photo.",
    })
  }

  if (data.sectors.includes("senior") && !(data.seniorProof instanceof File)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["seniorProof"],
      message: "Senior Citizen ID or supporting proof is required.",
    })
  }

  if (data.sectors.includes("pwd") && !(data.pwdProof instanceof File)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pwdProof"],
      message: "PWD ID or supporting proof is required.",
    })
  }

  if (data.password && data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    })
  }
})

export type ResidentRegistrationValues = z.infer<typeof residentRegistrationBaseSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, required).email("Enter a valid email address"),
})
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const certificateRequestSchema = z.object({
  type: z.string().min(1, "Select a certificate"),
  purpose: z.string().min(3, "State the purpose of your request"),
  pickup: z.enum(["Pick up at barangay hall", "Deliver to my address"], {
    errorMap: () => ({ message: "Select an option" }),
  }),
  remarks: z.string().max(200, "Keep it under 200 characters").optional(),
  agree: z.literal(true, { errorMap: () => ({ message: "Confirm that your details are correct" }) }),
})
export type CertificateRequestValues = z.infer<typeof certificateRequestSchema>

export const announcementSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  summary: z.string().min(10, "Add a short summary"),
  audience: z.enum(["All residents", "Senior Citizens", "PWD", "Youth", "Barangay officials"], {
    errorMap: () => ({ message: "Select an audience" }),
  }),
  date: z.string().min(1, "Date is required"),
  venue: z.string().min(3, "Venue is required"),
  requiresAttendance: z.boolean().optional(),
  body: z.string().min(20, "Write at least 20 characters"),
})
export type AnnouncementValues = z.infer<typeof announcementSchema>
