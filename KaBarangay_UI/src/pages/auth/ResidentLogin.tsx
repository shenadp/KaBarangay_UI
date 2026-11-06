import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { CheckCircle2, Eye, EyeOff, Info, Loader2, LogIn } from "lucide-react"

import AuthLayout from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Panel } from "@/components/Panel"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { barangay } from "@/mock/data"
import { currentAccountPassword, sessionResident } from "@/mock/resident/session"
import { attemptLogin, loginBarangays, type LoginBarangay } from "@/mock/resident/auth"
import { residentLoginSchema, type ResidentLoginValues } from "@/schemas/forms"

/**
 * Resident sign-in, one screen the way `Resident/Login.tsx` is: the barangay
 * picker, the identifier, the password and the approval notice share a card.
 * UI-only — `attemptLogin()` reads the same registry the Admin desk writes.
 */
export default function ResidentLogin() {
  const navigate = useNavigate()
  const location = useLocation()

  // `PasswordResetController::reset()` flashes here once the new password is saved.
  const flash = (location.state as { flash?: string } | null)?.flash

  const [barangays, setBarangays] = useState<LoginBarangay[]>([])
  const [loadingBarangays, setLoadingBarangays] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const form = useForm<ResidentLoginValues>({
    resolver: zodResolver(residentLoginSchema),
    defaultValues: { barangayId: "", identifier: "", password: "", remember: false },
  })

  useEffect(() => {
    setBarangays(loginBarangays())
    setLoadingBarangays(false)
  }, [])

  const onSubmit = (values: ResidentLoginValues) => {
    setSubmitting(true)
    setLoginError(null)

    const result = attemptLogin(values)

    window.setTimeout(() => {
      setSubmitting(false)

      if (!result.ok) {
        setLoginError(result.message)
        return
      }

      navigate("/resident")
    }, 600)
  }

  return (
    <AuthLayout variant="resident">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
          Resident portal
        </p>
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink-strong">
          Resident Login
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in to access your barangay services, requests, announcements, QR code, and
          resident account.
        </p>
      </div>

      <Panel className="p-5 sm:p-6">
        {flash && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-success-soft px-4 py-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            {flash}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="barangayId">Barangay</Label>
            <Select
              value={form.watch("barangayId")}
              onValueChange={(value) => {
                form.setValue("barangayId", value, { shouldValidate: true })
                setLoginError(null)
              }}
              disabled={loadingBarangays}
            >
              <SelectTrigger id="barangayId" className="h-11 w-full bg-surface">
                <SelectValue
                  placeholder={loadingBarangays ? "Loading barangays…" : "Select your barangay"}
                />
              </SelectTrigger>
              <SelectContent>
                {barangays.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.name} ({option.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.barangayId ? (
              <p className="text-sm text-destructive">{form.formState.errors.barangayId.message}</p>
            ) : (
              !loadingBarangays &&
              barangays.length === 0 && (
                <p className="text-sm text-warning">No active barangays are available.</p>
              )
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="identifier">Resident ID, Email, or Mobile Number</Label>
            <Input
              id="identifier"
              autoComplete="username"
              placeholder="e.g. BSI-RES-000001"
              className="h-11 bg-surface"
              {...form.register("identifier")}
              onChange={(event) => {
                form.setValue("identifier", event.target.value, { shouldValidate: false })
                setLoginError(null)
              }}
            />
            {form.formState.errors.identifier && (
              <p className="text-sm text-destructive">
                {form.formState.errors.identifier.message}
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
                placeholder="Enter your password"
                className="h-11 bg-surface pr-11"
                {...form.register("password")}
                onChange={(event) => {
                  form.setValue("password", event.target.value, { shouldValidate: false })
                  setLoginError(null)
                }}
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
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="remember"
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted"
            >
              <Checkbox
                id="remember"
                checked={form.watch("remember") === true}
                onCheckedChange={(checked) =>
                  form.setValue("remember", checked === true, { shouldValidate: true })
                }
              />
              Remember me
            </label>
            <Link
              to="/resident/forgot-password"
              className="text-sm font-medium text-brand hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {loginError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive"
            >
              <Info className="mt-0.5 size-4 shrink-0" />
              {loginError}
            </div>
          )}

          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Signing In…
              </>
            ) : (
              <>
                <LogIn className="size-4" /> Sign In
              </>
            )}
          </Button>
        </form>
      </Panel>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          New resident account
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <p className="text-center text-sm text-ink-muted">
        Don’t have a KaBarangay resident account?
      </p>
      <Button asChild variant="outline" className="mt-3 h-11 w-full">
        <Link to="/resident/register">Create Resident Account</Link>
      </Button>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-line bg-surface/60 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" />
        <div>
          <p className="text-sm font-semibold text-ink-strong">New account approval</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            New resident accounts must be reviewed and approved by the barangay before they can
            sign in. Already applied?{" "}
            <Link to="/resident/application/access" className="font-medium text-brand hover:underline">
              Access your application
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-line-soft bg-surface p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          Demo · sign in as
        </p>
        <dl className="mt-2.5 grid gap-1.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">Resident ID</dt>
            <dd className="font-mono tnum text-ink-strong">{sessionResident().residentNumber}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">Password</dt>
            <dd className="font-mono text-ink-strong">{currentAccountPassword()}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-5 text-center text-xs text-ink-faint">
        Need assistance? Please contact the {barangay.name} office.
      </p>
    </AuthLayout>
  )
}
