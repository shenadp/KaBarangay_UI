import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * The registry stores a birthdate as YYYY-MM-DD; the admin desk edits it as
 * three selects so the day list follows the month actually chosen.
 */

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/** Radix reserves the empty string, so "unset" stands in for "not chosen". */
const UNSET = "unset"

const pad = (value: number) => String(value).padStart(2, "0")

// A blank year still has to answer for February, the way the backend does.
const daysIn = (year: string, month: string) =>
  month ? new Date(Number(year) || 2000, Number(month), 0).getDate() : 31

export default function BirthdateInput({ value, onChange, className }: Props) {
  const [year = "", month = "", day = ""] = value.split("-")
  const thisYear = new Date().getFullYear()

  const update = (part: "year" | "month" | "day", next: string) => {
    const parts = { year, month, day, [part]: next }
    if (Number(parts.day) > daysIn(parts.year, parts.month)) parts.day = ""
    onChange([parts.year, parts.month, parts.day].join("-"))
  }

  const trigger = "w-full bg-surface"

  return (
    <div className={`grid grid-cols-[1.4fr_1fr_1fr] gap-2 ${className ?? ""}`}>
      <Select
        value={month || UNSET}
        onValueChange={(next) => update("month", next === UNSET ? "" : next)}
      >
        <SelectTrigger className={trigger} aria-label="Birth month">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNSET}>Month</SelectItem>
          {months.map((name, index) => (
            <SelectItem key={name} value={pad(index + 1)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={day || UNSET} onValueChange={(next) => update("day", next === UNSET ? "" : next)}>
        <SelectTrigger className={trigger} aria-label="Birth day">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value={UNSET}>Day</SelectItem>
          {Array.from({ length: daysIn(year, month) }, (_, index) => index + 1).map((number) => (
            <SelectItem key={number} value={pad(number)}>
              {number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={year || UNSET} onValueChange={(next) => update("year", next === UNSET ? "" : next)}>
        <SelectTrigger className={trigger} aria-label="Birth year">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value={UNSET}>Year</SelectItem>
          {Array.from({ length: 151 }, (_, index) => thisYear - index).map((number) => (
            <SelectItem key={number} value={String(number)}>
              {number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
