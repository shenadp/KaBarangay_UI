import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react"

import AuthLayout from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { barangayOptions } from "@/mock/data"
import { staffLoginSchema, type StaffLoginValues } from "@/schemas/forms"

const demoPortals = [
  { label: "Admin", to: "/admin" },
  { label: "Clerk", to: "/clerk/dashboard" },
  { label: "Senior", to: "/senior/dashboard" },
  { label: "PWD", to: "/pwd/dashboard" },
  { label: "Lupon", to: "/lupon/dashboard" },
]

/**
 * Portals a staff member can sign in under: the department picked on the form
 * is what routes them to that portal. `to` is the landing route; `positions`
 * is provisional until the access matrix is finalised.
 */
const portals: {
  name: string
  to: string
  positions: string[]
}[] = [
  {
    name: "Admin",
    to: "/admin",
    positions: [
      "Punong Barangay",
      "Barangay Kagawad",
      "SK Chairperson",
      "Barangay Secretary",
      "Barangay Treasurer",
      "Barangay Health Worker",
      "Sanitation Officer",
      "Barangay Tanod",
      "Traffic and Safety Officer",
    ],
  },
  {
    name: "Clerk",
    to: "/clerk/dashboard",
    positions: ["Barangay Clerk", "Records Officer", "Collection Officer"],
  },
  {
    name: "Senior Citizen Sector",
    to: "/senior/dashboard",
    positions: ["Senior Citizen Desk", "Senior Citizen Staff"],
  },
  {
    name: "PWD Sector",
    to: "/pwd/dashboard",
    positions: ["PWD Desk", "PWD Staff"],
  },
  {
    name: "Lupong Tagapamayapa",
    to: "/lupon/dashboard",
    positions: ["Lupon Chairperson", "Pangkat Member", "Mediator"],
  },
]

/**
 * Admin / staff desktop app: barangay selection and credentials share one form
 * on one page (no separate select screen — that step belongs to the resident
 * site instead).
 */
export default function StaffLogin() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<StaffLoginValues>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: {
      barangay: "",
      department: "",
      position: "",
      fullName: "",
      password: "",
      remember: false,
    },
  })

  const department = form.watch("department")
  const positions = portals.find((item) => item.name === department)?.positions ?? []

  const onSubmit = (values: StaffLoginValues) => {
    setSubmitting(true)
    // UI-only auth: the backend integration replaces this handler. The picked
    // department decides which portal the staff member lands on.
    const portal = portals.find((item) => item.name === values.department)
    window.setTimeout(() => navigate(portal?.to ?? "/admin"), 500)
  }

  return (
    <AuthLayout variant="staff">
      <div className="rounded-xl border border-line-soft bg-surface p-6 shadow-card">
        <h1 className="text-lg font-semibold tracking-tight text-ink-strong">Staff Login</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in to access your barangay management system.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="barangay">Select Barangay</Label>
            <Select
              value={form.watch("barangay")}
              onValueChange={(value) =>
                form.setValue("barangay", value, { shouldValidate: true })
              }
            >
              <SelectTrigger id="barangay" className="h-11 w-full bg-canvas">
                <SelectValue placeholder="Select your barangay" />
              </SelectTrigger>
              <SelectContent>
                {barangayOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.barangay && (
              <p className="text-sm text-destructive">
                {form.formState.errors.barangay.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={department}
              onValueChange={(value) => {
                form.setValue("department", value, { shouldValidate: true })
                // The positions belong to the picked department — start clean.
                // Not validated here: the message belongs to the submit, not the pick.
                form.setValue("position", "")
              }}
            >
              <SelectTrigger id="department" className="h-11 w-full bg-canvas">
                <SelectValue placeholder="Select portal" />
              </SelectTrigger>
              <SelectContent>
                {portals.map((item) => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.department && (
              <p className="text-sm text-destructive">
                {form.formState.errors.department.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="position">Position</Label>
            <Select
              value={form.watch("position")}
              onValueChange={(value) =>
                form.setValue("position", value, { shouldValidate: true })
              }
              disabled={!department}
            >
              <SelectTrigger id="position" className="h-11 w-full bg-canvas">
                <SelectValue
                  placeholder={department ? "Select position" : "Pick a portal first"}
                />
              </SelectTrigger>
              <SelectContent>
                {positions.map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.position && (
              <p className="text-sm text-destructive">
                {form.formState.errors.position.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Elena R. Villamor"
              className="h-11 bg-canvas"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 bg-canvas pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <label
            htmlFor="remember"
            className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted"
          >
            <Checkbox
              id="remember"
              checked={form.watch("remember")}
              onCheckedChange={(checked) =>
                form.setValue("remember", checked === true, { shouldValidate: true })
              }
            />
            Remember me
          </label>

          <Button type="submit" className="mt-1 h-11 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Signing in…
              </>
            ) : (
              <>
                <LogIn className="size-4" /> Login
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Resident?{" "}
        <Link to="/resident/login" className="font-medium text-brand hover:underline">
          Sign in to the resident portal
        </Link>
      </p>

      <div className="mt-5 rounded-xl border border-dashed border-line bg-surface/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          Demo · jump straight to a portal
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {demoPortals.map((portal) => (
            <Link
              key={portal.to}
              to={portal.to}
              className="inline-flex h-7 items-center rounded-md border border-line-soft bg-surface px-2.5 text-xs font-medium text-ink-muted transition-colors hover:border-brand hover:text-brand"
            >
              {portal.label}
            </Link>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
