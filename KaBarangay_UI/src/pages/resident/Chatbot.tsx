import BarangayChatbot from "@/components/resident/BarangayChatbot"
import { chatbotStorageKey } from "@/mock/resident/assistant"

/**
 * `resources/js/pages/Resident/Chatbot.tsx` — the full-height assistant inside
 * the portal. `chatbotStorageKey()` stands in for the HMAC the backend uses, so
 * the transcript lives on this device under the same kind of per-account key.
 */
export default function Chatbot() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
          Kabarangay AI
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink-strong">
          Paano kita matutulungan?
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Gabay sa certificates, Lupon Tagapamayapa, at ibang serbisyo. Hindi nagsusumite,
          nag-aapprove, nagbabayad o nag-eedit ang chat.
        </p>
      </header>

      <BarangayChatbot storageKey={chatbotStorageKey()} />
    </div>
  )
}
