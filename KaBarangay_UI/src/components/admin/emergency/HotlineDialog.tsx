import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { emergencyDirectory, type ContactItem, type HotlineInput } from "@/mock/admin/emergency"

const fieldClass = "space-y-1.5"

/** The two defaults the modal has to carry: `can_sms` is off, `is_active` is on. */
function initialValues(contact: ContactItem | null): HotlineInput {
  return contact ? emergencyDirectory.inputFor(contact) : emergencyDirectory.blankInput()
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `null` opens the create form; a hotline opens the edit form. */
  contact: ContactItem | null
  onSaved: (message: string) => void
}

export default function HotlineDialog({ open, onOpenChange, contact, onSaved }: Props) {
  const [values, setValues] = useState<HotlineInput>(() => initialValues(contact))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  /** Every open is a fresh form — the backend never carries a rejected draft over. */
  useEffect(() => {
    if (!open) return

    setValues(initialValues(contact))
    setErrors({})
  }, [open, contact])

  const set = <Key extends keyof HotlineInput>(key: Key, value: HotlineInput[Key]) =>
    setValues((current) => ({ ...current, [key]: value }))

  const handleSubmit = () => {
    // UI-only: the backend integration replaces this delay.
    setBusy(true)
    window.setTimeout(() => {
      const result = contact
        ? emergencyDirectory.update(contact.id, values)
        : emergencyDirectory.create(values)

      setBusy(false)

      if (!result.ok) {
        setErrors(result.errors)
        return
      }

      onSaved(result.message)
      onOpenChange(false)
    }, 500)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Barangay Hotline" : "Add Barangay Hotline"}</DialogTitle>
          <DialogDescription>
            Barangay hotlines are the numbers your own residents can dial. The verified emergency
            services beside them are managed centrally.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <div className={fieldClass}>
            <Label htmlFor="hotline-sub-category">Subcategory / Group</Label>
            <Input
              id="hotline-sub-category"
              name="sub_category"
              autoComplete="off"
              placeholder="e.g. Official, Tanod, Desk"
              value={values.subCategory}
              onChange={(event) => set("subCategory", event.target.value)}
            />
            {errors.subCategory && <p className="text-xs text-destructive">{errors.subCategory}</p>}
          </div>

          <div className={fieldClass}>
            <Label htmlFor="hotline-name">Contact / Personnel Name *</Label>
            <Input
              id="hotline-name"
              name="name"
              autoComplete="off"
              placeholder="e.g. Barangay Tanod or Cenon Mabutin Bocacao"
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className={fieldClass}>
            <Label htmlFor="hotline-label">Label / Position (Optional)</Label>
            <Input
              id="hotline-label"
              name="label"
              autoComplete="off"
              placeholder="e.g. Chief Tanod, Official Hotline"
              value={values.label}
              onChange={(event) => set("label", event.target.value)}
            />
            {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
          </div>

          <div className={fieldClass}>
            <Label htmlFor="hotline-phone">Phone Number *</Label>
            <Input
              id="hotline-phone"
              name="phone_number"
              type="tel"
              autoComplete="off"
              className="font-mono"
              placeholder="e.g. 09394596081"
              value={values.phoneNumber}
              onChange={(event) => set("phoneNumber", event.target.value)}
            />
            {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber}</p>}
          </div>

          <div className="space-y-3 rounded-xl border border-line-soft bg-canvas/60 p-3.5">
            <label className="flex items-center justify-between gap-3 text-xs text-ink">
              <span>Allow Call (confirm this number accepts calls)</span>
              <Switch
                name="can_call"
                checked={values.canCall}
                onCheckedChange={(checked) => set("canCall", checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-xs text-ink">
              <span>Allow Text/SMS (enable only after confirming SMS support)</span>
              <Switch
                name="can_sms"
                checked={values.canSms}
                onCheckedChange={(checked) => set("canSms", checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-xs text-ink">
              <span>Visible to Residents</span>
              <Switch
                name="is_active"
                checked={values.isActive}
                onCheckedChange={(checked) => set("isActive", checked)}
              />
            </label>

            <div className="flex items-center gap-2 border-t border-line-soft pt-3 text-xs text-ink">
              <Label htmlFor="hotline-display-order" className="text-xs font-normal">
                Sort Order
              </Label>
              <Input
                id="hotline-display-order"
                name="display_order"
                type="number"
                min={0}
                className="h-8 w-20 text-center tnum"
                value={values.displayOrder}
                onChange={(event) => set("displayOrder", Number.parseInt(event.target.value, 10) || 0)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {contact ? "Update Hotline" : "Save Hotline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
