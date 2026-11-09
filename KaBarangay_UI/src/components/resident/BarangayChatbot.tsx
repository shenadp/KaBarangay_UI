import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import AssistantLauncher, { type LauncherPosition } from "./AssistantLauncher"
import { plainAssistantText } from "@/lib/assistantText"
import { cn } from "@/lib/utils"
import {
  assistantAnswer,
  CHATBOT_MAX_MESSAGE_LENGTH,
  type TrackingRecord,
} from "@/mock/resident/assistant"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  records?: TrackingRecord[]
  checkedAt?: string
}

const greeting = (): Message => ({
  id: "welcome",
  role: "assistant",
  content:
    "Magandang araw! Ako si Kabarangay AI. Paano kita matutulungan tungkol sa certificates, Lupon Tagapamayapa, o iba pang serbisyo ng barangay?",
})

const suggestions = [
  "I-track ang status ng requests ko",
  "Paano kumuha ng Indigent Certificate?",
  "Ano ang proseso ng Lupon Tagapamayapa?",
]

/**
 * `components/resident/BarangayChatbot.tsx`.
 *
 * The reference posts the message to the chat endpoint; this build answers it
 * with `assistantAnswer()`, the local port of the same two branches, after a
 * short pause so the thinking state reads the way the network turn did.
 */
export default function BarangayChatbot({
  floating = false,
  storageKey = null,
}: {
  floating?: boolean
  storageKey?: string | null
}) {
  const [open, setOpen] = useState(!floating)
  const [launcherPosition, setLauncherPosition] = useState<LauncherPosition | null>(null)
  const [messages, setMessages] = useState<Message[]>([greeting()])
  const [input, setInput] = useState("")
  const [hydratedKey, setHydratedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const pending = useRef<number | null>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const reset = () => {
    if (pending.current !== null) window.clearTimeout(pending.current)
    pending.current = null
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        /* nothing to clear when storage is blocked */
      }
    }
    setLoading(false)
    setError("")
    setInput("")
    setMessages([greeting()])
  }

  /* Restoring a saved transcript — the same validation the reference applies. */
  useEffect(() => {
    if (pending.current !== null) window.clearTimeout(pending.current)
    pending.current = null
    setLoading(false)
    setError("")
    setInput("")

    let restored: Message[] | null = null
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null")
        if (saved?.version === 1 && Array.isArray(saved.messages)) {
          restored = saved.messages
            .filter(
              (item: Message) =>
                item &&
                typeof item.id === "string" &&
                ["user", "assistant"].includes(item.role) &&
                typeof item.content === "string",
            )
            .slice(-60)
            .map((item: Message) => ({
              id: item.id,
              role: item.role,
              content: item.content.slice(0, 20000),
              checkedAt: typeof item.checkedAt === "string" ? item.checkedAt : undefined,
              records: Array.isArray(item.records)
                ? item.records
                    .filter(
                      (record: TrackingRecord) =>
                        record &&
                        typeof record.label === "string" &&
                        typeof record.status === "string" &&
                        typeof record.detail === "string" &&
                        typeof record.reference === "string" &&
                        typeof record.url === "string" &&
                        record.url.startsWith("/resident/"),
                    )
                    .slice(0, 20)
                : undefined,
            }))
        }
      } catch {
        /* An unavailable or invalid saved chat must not prevent chatting. */
      }
    }

    setMessages(restored?.length ? restored : [greeting()])
    setHydratedKey(storageKey)
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || hydratedKey !== storageKey) return
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ version: 1, messages: messages.slice(-60) }),
      )
    } catch {
      /* Chat remains usable when browser storage is full or blocked. */
    }
  }, [storageKey, hydratedKey, messages])

  /* The settings page announces a wipe here, so both desks clear the same way. */
  useEffect(() => {
    window.addEventListener("kabarangay-assistant-cleared", reset)
    return () => {
      window.removeEventListener("kabarangay-assistant-cleared", reset)
      if (pending.current !== null) window.clearTimeout(pending.current)
      pending.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages, loading, open, error])

  const send = (text = input) => {
    const message = text.trim()
    if (!message || loading) return

    if (message.length > CHATBOT_MAX_MESSAGE_LENGTH) {
      setError("Hanggang 1,000 characters lamang ang mensahe.")
      return
    }

    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: "user", content: message },
    ])
    setInput("")
    setError("")
    setLoading(true)

    pending.current = window.setTimeout(() => {
      const answer = assistantAnswer(message)
      pending.current = null
      setLoading(false)

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: plainAssistantText(answer.reply),
          records: answer.records?.filter((record) => record.url.startsWith("/resident/")),
          checkedAt: answer.checkedAt,
        },
      ])
      inputRef.current?.focus()
    }, 600)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send()
  }

  /* The panel keeps the launcher visible, so it opens above or below it. */
  const floatingStyle = (() => {
    if (!floating || !launcherPosition) return undefined
    const { top, viewportHeight } = launcherPosition
    const above = Math.max(0, top - 28)
    const below = Math.max(0, viewportHeight - top - 84)

    if (Math.max(above, below) < 300)
      return { top: 16, bottom: "auto", height: Math.max(180, viewportHeight - 32) }

    const height = Math.min(520, Math.max(above, below))
    return { top: above >= below ? top - height - 12 : top + 68, bottom: "auto", height }
  })()

  const panel = (
    <section
      id="kabarangay-ai-chat"
      role={floating ? "dialog" : undefined}
      aria-label="Kabarangay AI assistant"
      style={floatingStyle}
      className={cn(
        "flex flex-col overflow-hidden border rounded-xl",
        floating
          ? "pointer-events-auto absolute inset-x-3 z-50 border-line bg-surface shadow-raised md:inset-x-auto md:right-4 md:w-[380px]"
          : "min-h-96 border-line-soft bg-surface shadow-card",
        !floating && "h-[min(76dvh,740px)]",
      )}
    >
      <header
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 bg-brand text-white",
          floating ? "p-3" : "p-4",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <RobotAvatar className={cn("shrink-0", floating ? "size-9" : "size-12")} thinking={loading} />
          <div className="min-w-0">
            <h2 className={cn("font-semibold tracking-tight", floating ? "text-sm" : "text-base")}>
              Kabarangay AI
            </h2>
            {!floating && <p className="text-xs text-white/80">Personal barangay assistant</p>}
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-brand-muted">
              <span className="size-1.5 rounded-full bg-white" />
              Live request tracking
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="min-h-8 rounded-lg border border-white/40 px-2 text-xs font-medium transition-colors hover:bg-white/10"
          >
            Bagong usapan
          </button>
          {floating && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Isara si Kabarangay AI"
              className="grid size-8 place-items-center rounded-lg text-lg leading-none transition-colors hover:bg-white/10"
            >
              ×
            </button>
          )}
        </div>
      </header>

      <div
        className={cn(
          "scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas",
          floating ? "p-3" : "p-4",
        )}
      >
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Mga mensahe"
          className="space-y-3"
        >
          {messages.map((item) => (
            <div
              key={item.id}
              className={cn("flex", item.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[90%] break-words whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  item.role === "user"
                    ? "bg-brand text-white"
                    : "border border-line-soft bg-surface text-ink shadow-card",
                )}
              >
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider opacity-70">
                  {item.role === "user" ? (
                    "Ikaw"
                  ) : (
                    <span className="flex items-center gap-1">
                      <RobotAvatar className="size-5" />
                      Kabarangay AI
                    </span>
                  )}
                </span>

                {item.role === "assistant"
                  ? plainAssistantText(
                      item.records?.length ? item.content.split("\n\n")[0] : item.content,
                    )
                  : item.content}

                {item.records?.map((record, index) => (
                  <div
                    key={record.reference + index}
                    className="mt-3 space-y-1.5 rounded-xl border border-line-soft bg-brand-soft p-3 text-ink"
                  >
                    <p className="text-xs font-semibold">{record.label}</p>
                    <p className="font-mono text-[11px] text-ink-muted tnum">{record.reference}</p>
                    <p className="inline-block rounded-full border border-line-soft bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink-strong">
                      {record.status}
                    </p>
                    <p className="text-xs leading-5">{record.detail}</p>
                    <Link
                      to={record.url}
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-8 items-center text-xs font-semibold text-brand hover:underline"
                    >
                      Buksan ang record →
                    </Link>
                  </div>
                ))}

                {item.checkedAt && (
                  <p className="mt-2 text-[10px] text-ink-faint">
                    Mula sa system · Sinuri{" "}
                    {new Date(item.checkedAt).toLocaleString("en-PH", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "Asia/Manila",
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <p role="status" className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <span aria-hidden="true" className="size-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            Naghahanda ng sagot si Kabarangay AI…
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-danger-soft bg-danger-soft p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div ref={bottom} />
      </div>

      <footer className={cn("shrink-0 border-t border-line-soft bg-surface", floating ? "space-y-2 p-2.5" : "space-y-3 p-3")}>
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, floating ? 1 : suggestions.length).map((text) => (
              <button
                key={text}
                type="button"
                disabled={loading}
                onClick={() => send(text)}
                className="min-h-9 rounded-lg border border-line-soft bg-canvas px-2.5 text-left text-xs font-medium text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        <nav aria-label="Mga serbisyo" className="flex gap-3 text-xs font-semibold text-brand">
          <Link to="/resident/certificates" className="min-h-8 inline-flex items-center">
            Certificates
          </Link>
          <Link to="/resident/lupon" className="min-h-8 inline-flex items-center">
            Lupon
          </Link>
          <Link to="/resident/citizen-charter" className="min-h-8 inline-flex items-center">
            Citizen’s Charter
          </Link>
        </nav>

        <form onSubmit={submit} aria-busy={loading} className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="kabarangay-ai-message" className="sr-only">
              Mensahe kay Kabarangay AI
            </label>
            <textarea
              id="kabarangay-ai-message"
              ref={inputRef}
              rows={floating ? 1 : 2}
              maxLength={CHATBOT_MAX_MESSAGE_LENGTH}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  send()
                }
              }}
              placeholder="I-type ang iyong tanong…"
              className="w-full resize-none rounded-xl border border-line bg-canvas p-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
            />
            <p className="text-right text-[10px] text-ink-faint tnum">
              {input.length}/{CHATBOT_MAX_MESSAGE_LENGTH}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="mb-4 min-h-9 rounded-xl bg-brand px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-40"
          >
            {loading ? "Sandali…" : "Ipadala"}
          </button>
        </form>
      </footer>
    </section>
  )

  if (!floating) return panel

  /* The assistant belongs to the phone frame, not the whole browser window. */
  return (
    <div className="pointer-events-none fixed inset-0 z-40 mx-auto w-full max-w-lg md:max-w-none">
      <AssistantLauncher
        open={open}
        onToggle={() => setOpen((value) => !value)}
        onPositionChange={setLauncherPosition}
      >
        <RobotAvatar className="size-10 shrink-0" />
      </AssistantLauncher>
      {open && panel}
    </div>
  )
}

function RobotAvatar({ className, thinking = false }: { className: string; thinking?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn(className, thinking && "motion-safe:animate-pulse")}
      fill="none"
    >
      <circle cx="32" cy="32" r="31" fill="var(--brand-soft)" />
      <path d="M32 15V9" stroke="var(--brand-deep)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="8" r="3" fill="var(--brand)" />
      <rect x="11" y="22" width="5" height="19" rx="2.5" fill="var(--brand)" />
      <rect x="48" y="22" width="5" height="19" rx="2.5" fill="var(--brand)" />
      <rect
        x="16"
        y="17"
        width="32"
        height="31"
        rx="11"
        fill="var(--brand-muted)"
        stroke="var(--brand-deep)"
        strokeWidth="2"
      />
      <rect x="21" y="24" width="22" height="13" rx="6.5" fill="var(--brand-deep)" />
      <circle cx="27" cy="30" r="2.5" fill="var(--brand-soft)" />
      <circle cx="37" cy="30" r="2.5" fill="var(--brand-soft)" />
      <path d="M27 41Q32 45 37 41" stroke="var(--brand-deep)" strokeWidth="2" strokeLinecap="round" />
      <path d="M23 53Q32 49 41 53" stroke="var(--brand-deep)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
