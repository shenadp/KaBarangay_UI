import { UserRound } from "lucide-react"

import { cn } from "@/lib/utils"
import type { OrgChartPosition } from "@/mock/orgChart"

const honorifics = ["Hon", "Mr", "Ms", "Mrs", "Dr", "Atty"]

const sizes = {
  sm: "size-11 text-xs",
  md: "size-14 text-sm",
} as const

/** "Hon. Roberto M. Villanueva" → "RV", the same rule the resident chart uses. */
export function orgChartInitials(name: string): string {
  const words = name
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !honorifics.includes(word))

  if (words.length === 0) return "—"
  const first = words[0].charAt(0)
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : words[0].charAt(1)
  return (first + last).toUpperCase()
}

/**
 * The photo states the backend distinguishes: a file picked in this session
 * (rendered from its object URL), a file already on record (rendered as the
 * incumbent's initials, since the mock holds no image bytes), and the dashed
 * placeholder that every position starts on.
 */
export default function OrgChartAvatar({
  position,
  size = "sm",
  className,
}: {
  position: OrgChartPosition
  size?: keyof typeof sizes
  className?: string
}) {
  const { photo, assignedPerson } = position
  const frame = cn(
    "grid shrink-0 place-items-center overflow-hidden rounded-full border",
    sizes[size],
    className,
  )

  if (photo?.previewUrl) {
    return (
      <img
        src={photo.previewUrl}
        alt={`${position.title} official photo`}
        loading="lazy"
        decoding="async"
        className={cn(frame, "border-line object-cover")}
      />
    )
  }

  if (photo) {
    return (
      <span
        className={cn(frame, "border-line bg-brand-soft font-semibold text-brand tnum")}
        title="Official photo on file"
      >
        {assignedPerson ? orgChartInitials(assignedPerson) : <UserRound className="size-5" />}
      </span>
    )
  }

  return (
    <span
      className={cn(frame, "border-dashed border-line bg-canvas text-ink-faint")}
      aria-label="No photo on file"
      title="No photo on file"
    >
      <UserRound className={size === "md" ? "size-6" : "size-5"} />
    </span>
  )
}
