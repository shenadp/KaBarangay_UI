import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Search,
  type LucideIcon,
} from "lucide-react"

import { Logo, LogoMark } from "@/components/Logo"
import DesktopOnly from "@/components/DesktopOnly"
import { cn } from "@/lib/utils"
import type { NavGroup } from "@/config/navigation"

export type LayoutUser = {
  name: string
  role: string
  initials: string
}

type Props = {
  nav: NavGroup[]
  user: LayoutUser
  searchPlaceholder?: string
  /** Brand line under the logo, e.g. "Admin Portal". */
  portalLabel?: string
}

function NavRow({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavGroup["items"][number]
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon: LucideIcon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-white text-brand"
            : "text-white/75 hover:bg-white/10 hover:text-white",
        )
      }
    >
      <Icon className="size-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}

export default function DashboardLayout({ nav, user, searchPlaceholder, portalLabel }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const sidebar = (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col bg-brand transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "relative flex h-16 shrink-0 items-center border-b border-white/15",
          collapsed ? "justify-center px-3" : "justify-between px-4",
        )}
      >
        <Logo tone="onBrand" collapsed={collapsed} subtitle="Management System" />
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            className="grid size-8 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronsLeft className="size-4" />
          </button>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="absolute -right-3 top-5 grid size-6 place-items-center rounded-full border border-line-soft bg-surface text-ink-muted shadow-card transition-colors hover:text-brand"
          >
            <ChevronsRight className="size-3.5" />
          </button>
        )}
      </div>

      <nav className="scrollbar-slim flex-1 overflow-y-auto px-3 py-4">
        {portalLabel && !collapsed && (
          <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
            {portalLabel}
          </p>
        )}
        <div className="flex flex-col gap-1">
          {nav.map((group, index) => (
            <div key={group.label ?? index} className="mb-4 last:mb-0">
              {group.label && !collapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <NavRow key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className={cn("shrink-0 border-t border-white/15 p-3", collapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-brand">
            {user.initials}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium text-white">{user.name}</p>
              <p className="truncate text-[11px] text-white/65">{user.role}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate("/login")}
          title={collapsed ? "Log out" : undefined}
          className={cn(
            "mt-2 flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop shell */}
      <div className="hidden min-h-screen bg-canvas lg:flex">
        {sidebar}
        <div
          className={cn(
            "flex min-h-screen flex-1 flex-col transition-[padding] duration-200",
            collapsed ? "pl-[76px]" : "pl-64",
          )}
        >
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-line-soft bg-surface px-6">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                placeholder={searchPlaceholder ?? "Search"}
                className="h-9 w-full rounded-lg border border-line-soft bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
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
              <div className="hidden text-right leading-tight xl:block">
                <p className="text-[13px] font-medium text-ink-strong">{user.name}</p>
                <p className="text-[11px] text-ink-muted">{user.role}</p>
              </div>
              <span className="grid size-9 place-items-center rounded-full bg-brand text-xs font-semibold text-white">
                {user.initials}
              </span>
            </div>
          </header>

          <main className="flex-1 px-6 py-6 xl:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Below `lg` the desk portals are intentionally desktop-only. */}
      <div className="lg:hidden">
        <DesktopOnly />
      </div>
    </>
  )
}
