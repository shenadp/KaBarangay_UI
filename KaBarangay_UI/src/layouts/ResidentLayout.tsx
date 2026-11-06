import { useEffect, useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { Bell, ChevronRight, MoreHorizontal } from "lucide-react"

import BarangayChatbot from "@/components/resident/BarangayChatbot"
import { LogoMark } from "@/components/Logo"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { chatbotStorageKey } from "@/mock/resident/assistant"
import {
  applyResidentSettings,
  readResidentSettings,
  RESIDENT_SETTINGS_EVENT,
  type ResidentSettings,
} from "@/lib/residentSettings"
import { residentMoreNav, residentNav, type NavItem } from "@/config/navigation"

type Props = {
  barangayName?: string
  residentName?: string
  residentInitials?: string
}

export default function ResidentLayout({
  barangayName = "Barangay San Isidro",
  residentName = "Maria Santos",
  residentInitials = "MS",
}: Props) {
  const location = useLocation()

  const [moreOpen, setMoreOpen] = useState(false)

  /** The reference closes the sheet as soon as the route changes. */
  useEffect(() => setMoreOpen(false), [location.pathname])

  /** The reference mounts the floating assistant everywhere except its own page. */
  const isAssistantPage = location.pathname === "/resident/chatbot"

  /** The device preferences are repainted here so no resident page carries theme markup. */
  useEffect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)")

    const paint = (settings?: ResidentSettings) => {
      applyResidentSettings(settings ?? readResidentSettings(), colorScheme.matches)
    }

    /** Another tab, or the settings page itself, announced a new blob. */
    const handleSettings = (event: Event) => {
      const detail =
        event instanceof CustomEvent ? (event.detail as ResidentSettings | undefined) : undefined

      paint(detail)
    }

    paint()

    window.addEventListener(RESIDENT_SETTINGS_EVENT, handleSettings)
    window.addEventListener("storage", handleSettings)
    colorScheme.addEventListener("change", handleSettings)

    return () => {
      window.removeEventListener(RESIDENT_SETTINGS_EVENT, handleSettings)
      window.removeEventListener("storage", handleSettings)
      colorScheme.removeEventListener("change", handleSettings)
    }
  }, [])

  return (
    <div className="min-h-screen bg-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-canvas shadow-raised">
        {/* App bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line-soft bg-surface px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <LogoMark size="sm" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold text-ink-strong">{barangayName}</p>
              <p className="truncate text-[11px] text-ink-muted">Resident Portal</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="More"
                  className="grid size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-canvas"
                >
                  <MoreHorizontal className="size-5" />
                </button>
              </DialogTrigger>
              <DialogContent
                aria-describedby={undefined}
                showCloseButton={false}
                className={cn(
                  "top-auto bottom-0 left-1/2 max-w-[calc(100%-0rem)] translate-y-0 gap-0 rounded-t-2xl rounded-b-none border-line-soft bg-surface p-4 shadow-raised sm:max-w-lg",
                  "mx-auto flex max-h-[75vh] flex-col",
                )}
              >
                <div className="flex items-center justify-between pb-1">
                  <DialogTitle className="text-base">More</DialogTitle>
                  <DialogClose className="grid size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-canvas">
                    <ChevronRight className="size-5 -rotate-90" />
                    <span className="sr-only">Close navigation menu</span>
                  </DialogClose>
                </div>

                <div className="-mx-1 overflow-y-auto px-1 pb-1">
                  {residentMoreNav.map((group) => (
                    <section key={group.label} className="mt-3 first:mt-1">
                      <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                        {group.label}
                      </p>
                      <ul className="space-y-0.5">
                        {group.items.map((item) => (
                          <MoreLinkRow key={item.to} item={item} />
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <button
              type="button"
              aria-label="Notifications"
              className="relative grid size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-canvas"
            >
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand" />
            </button>
            <span className="ml-1 grid size-8 place-items-center rounded-full bg-brand text-[11px] font-semibold text-white">
              {residentInitials}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 pb-28 pt-4">
          <Outlet />
        </main>

        {/* Bottom navigation */}
        <nav className="safe-bottom fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-line-soft bg-surface/95 backdrop-blur">
          <ul className="grid grid-cols-5">
            {residentNav.map((item) => (
              <NavItemRow key={item.to} item={item} />
            ))}
          </ul>
        </nav>

        {!isAssistantPage && <BarangayChatbot floating storageKey={chatbotStorageKey()} />}
      </div>
    </div>
  )
}

function NavItemRow({ item }: { item: NavItem }) {
  const Icon = item.icon

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cn(
            "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
            isActive ? "text-brand" : "text-ink-muted",
          )
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={cn(
                "absolute -top-px h-0.5 w-8 rounded-full transition-colors",
                isActive ? "bg-brand" : "bg-transparent",
              )}
            />
            <Icon className="size-5" strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="truncate px-0.5">{item.label}</span>
          </>
        )}
      </NavLink>
    </li>
  )
}

/** One row of the "More" sheet; the sheet stays open until the route changes. */
function MoreLinkRow({ item }: { item: NavItem }) {
  const Icon = item.icon

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cn(
            "flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors",
            isActive ? "bg-brand-soft text-brand-deep" : "text-ink hover:bg-canvas",
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <ChevronRight className="size-4 shrink-0 text-ink-faint" />
          </>
        )}
      </NavLink>
    </li>
  )
}
