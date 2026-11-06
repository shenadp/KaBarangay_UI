import { useCallback, useMemo, useState } from "react"

import {
  clerkCertificateStore,
  type CertificateAction,
  type CertificateAllRecordRow,
  type CertificateIssuanceRecord,
  type CertificateRequestRecord,
} from "@/mock/clerk/certificates"
import type { CertificateFlash } from "@/components/sectors/clerk/CertificateStatus"

/**
 * The list, the dialogs and the deep-linked detail page all read the one
 * in-memory store, so a decision made on any surface is still there after
 * navigation. `revision` re-renders a surface when another one wrote to it.
 */
export function useCertificateStore() {
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<CertificateFlash | null>(null)

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  const requests = useMemo<CertificateRequestRecord[]>(
    () => clerkCertificateStore.queue(),
    // A write to the store only shows up here once the revision moves.
    [revision],
  )
  const issuances = useMemo<CertificateIssuanceRecord[]>(
    () => clerkCertificateStore.issuanceQueue(),
    [revision],
  )
  const records = useMemo<CertificateAllRecordRow[]>(
    () => clerkCertificateStore.allRecords(),
    [revision],
  )

  /** Runs a store action behind a short delay and reports its message. */
  const act = useCallback((run: () => CertificateAction) => {
    setBusy(true)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      const action = run()
      setBusy(false)
      setFlash({ text: action.message, tone: action.ok ? "success" : "error" })
      if (action.ok) setRevision((value) => value + 1)
    }, 500)
  }, [])

  return {
    store: clerkCertificateStore,
    revision,
    refresh,
    busy,
    flash,
    setFlash,
    act,
    requests,
    issuances,
    records,
  }
}

export type CertificateStoreView = ReturnType<typeof useCertificateStore>
