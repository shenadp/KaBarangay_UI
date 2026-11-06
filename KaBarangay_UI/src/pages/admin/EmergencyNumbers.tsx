import { useMemo, useState } from "react"
import { PhoneCall, Plus, SearchX, ShieldCheck, Siren } from "lucide-react"

import ContactRow from "@/components/admin/emergency/ContactRow"
import DeleteHotlineDialog from "@/components/admin/emergency/DeleteHotlineDialog"
import HotlineDialog from "@/components/admin/emergency/HotlineDialog"
import EmptyState from "@/components/EmptyState"
import PageHeader from "@/components/PageHeader"
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { emergencyDirectory, type ContactItem } from "@/mock/admin/emergency"

/**
 * Emergency Numbers — `Admin/EmergencyNumbers/Index`.
 *
 * Two directories side by side: the barangay's own hotlines, which this portal
 * creates, edits and deletes, and the city's verified emergency services, which
 * arrive read-only because the shared records are managed centrally.
 */
export default function AdminEmergencyNumbers() {
  /** Bumping the revision re-reads both queries, the way a reload would. */
  const [revision, setRevision] = useState(0)
  const sync = () => setRevision((current) => current + 1)

  const [success, setSuccess] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ContactItem | null>(null)
  const [contactToDelete, setContactToDelete] = useState<ContactItem | null>(null)

  const hotlines = useMemo(() => emergencyDirectory.hotlines(), [revision])
  const services = useMemo(() => emergencyDirectory.sharedContacts(), [revision])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (contact: ContactItem) => {
    setEditing(contact)
    setFormOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Emergency Numbers"
        description="Manage your barangay hotlines and Tanod contacts. Verified emergency service contacts are maintained centrally and are read-only here."
      />

      {success && (
        <p role="status" className="rounded-xl border border-line-soft bg-success-soft px-4 py-3 text-sm text-success">
          {success}
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader>
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <PanelTitle>Barangay Hotlines</PanelTitle>
                <PanelDescription>Official Tanod and barangay contacts ({hotlines.length})</PanelDescription>
              </div>
            </div>

            <Button size="sm" onClick={openAdd}>
              <Plus />
              Add Hotline
            </Button>
          </PanelHeader>

          <div className="space-y-3 p-4 sm:p-5">
            {hotlines.length === 0 ? (
              <EmptyState
                icon={PhoneCall}
                className="py-10"
                title="No barangay hotlines added yet."
                description="Add the official hotline or Tanod personnel numbers."
                action={
                  <Button size="sm" variant="outline" onClick={openAdd}>
                    <Plus />
                    Add First Contact
                  </Button>
                }
              />
            ) : (
              hotlines.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  theme="hotline"
                  onEdit={() => openEdit(contact)}
                  onDelete={() => setContactToDelete(contact)}
                />
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader>
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <Siren className="size-5" />
              </span>
              <div>
                <PanelTitle>Emergency Services</PanelTitle>
                <PanelDescription>Verified shared directory ({services.length})</PanelDescription>
              </div>
            </div>

            <span className="rounded-full bg-canvas px-2.5 py-1 text-[10px] font-semibold tracking-wider text-ink-faint uppercase">
              Read-only
            </span>
          </PanelHeader>

          <div className="space-y-3 p-4 sm:p-5">
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-xs leading-relaxed text-destructive">
              These contacts are managed centrally to ensure consistent, reviewed emergency
              information. Contact your city or municipal administrator to request a correction.
            </p>

            {services.length === 0 ? (
              <EmptyState
                icon={SearchX}
                className="py-10"
                title="No verified emergency contacts available."
                description="Shared emergency services have not been added yet."
              />
            ) : (
              services.map((contact) => (
                <ContactRow key={contact.id} contact={contact} theme="service" />
              ))
            )}
          </div>
        </Panel>
      </div>

      <HotlineDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        contact={editing}
        onSaved={(message) => {
          setSuccess(message)
          sync()
        }}
      />

      <DeleteHotlineDialog
        contact={contactToDelete}
        onOpenChange={(open) => {
          if (!open) setContactToDelete(null)
        }}
        onDeleted={(message) => {
          setSuccess(message)
          setContactToDelete(null)
          sync()
        }}
      />
    </div>
  )
}
