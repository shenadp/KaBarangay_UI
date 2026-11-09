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

  /** The desktop header names the section the resident is currently reading. */
  const pageLabel = [...residentMoreNav.flatMap((group) => group.items)]
    .filter(
      (item) =>
        location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
    )
    .sort((a, b) => b.to.length - a.to.length)[0]?.label

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
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-canvas shadow-raised md:max-w-none md:flex-row md:shadow-none">
        {/* Desktop sidebar — the same groups as the mobile "More" sheet. */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col self-start border-r border-line-soft bg-surface md:flex">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line-soft px-5">
            <LogoMark size="sm" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold text-ink-strong">{barangayName}</p>
              <p className="truncate text-[11px] text-ink-muted">Resident Portal</p>
            </div>
          </div>

          <nav className="scrollbar-slim flex-1 space-y-4 overflow-y-auto px-3 py-5">
            {residentMoreNav.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-wider text-ink-faint uppercase">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarLinkRow key={`${group.label}-${item.to}`} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="shrink-0 border-t border-line-soft p-3">
            <Link
              to="/resident/profile"
              className="flex items-center gap-3 rounded-xl bg-canvas px-3 py-2.5 transition-colors hover:bg-brand-soft"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white">
                {residentInitials}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13px] font-medium text-ink-strong">{residentName}</p>
                <p className="truncate text-[11px] text-ink-muted">Resident</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-ink-faint" />
            </Link>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* Mobile app bar */}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line-soft bg-surface px-4 md:hidden">
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

          {/* Desktop top bar */}
          <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center gap-4 border-b border-line-soft bg-surface px-6 md:flex xl:px-8">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wider text-ink-faint uppercase">
                Resident Portal
              </p>
              <p className="truncate text-sm font-semibold text-ink-strong">
                {pageLabel ?? "Home"}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="relative grid size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-brand"
              >
                <Bell className="size-[18px]" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand" />
              </button>
              <span className="hidden h-6 w-px bg-line-soft sm:block" />
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-[13px] font-medium text-ink-strong">{residentName}</p>
                <p className="text-[11px] text-ink-muted">Resident</p>
              </div>
              <span className="grid size-9 place-items-center rounded-full bg-brand text-xs font-semibold text-white">
                {residentInitials}
              </span>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 px-4 pb-28 pt-4 md:px-6 md:pb-10 md:pt-6 xl:px-8">
            <div className="md:mx-auto md:max-w-6xl">
              <Outlet />
            </div>
          </main>

          {/* Bottom navigation — phones and tablets only */}
          <nav className="safe-bottom fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-line-soft bg-surface/95 backdrop-blur md:hidden">
            <ul className="grid grid-cols-5">
              {residentNav.map((item) => (
                <NavItemRow key={item.to} item={item} />
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {!isAssistantPage && <BarangayChatbot floating storageKey={chatbotStorageKey()} />}
    </div>
  )
}

function SidebarLinkRow({ item }: { item: NavItem }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
          isActive
            ? "bg-brand-soft text-brand-deep"
            : "text-ink-muted hover:bg-canvas hover:text-ink-strong",
        )
      }
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.9} />
      <span className="truncate">{item.label}</span>
    </NavLink>
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
