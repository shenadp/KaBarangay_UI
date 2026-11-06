import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import SegmentedTabs from "@/components/SegmentedTabs"
import CertificateGenerateDialog from "@/components/sectors/clerk/CertificateGenerateDialog"
import CertificateIssuedDialog from "@/components/sectors/clerk/CertificateIssuedDialog"
import CertificateRequestDialog from "@/components/sectors/clerk/CertificateRequestDialog"
import CertificateTable from "@/components/sectors/clerk/CertificateTable"
import { CertificateFlashBanner } from "@/components/sectors/clerk/CertificateStatus"
import {
  emptyCertificateFilters,
  type CertificateFilterState,
} from "@/components/sectors/clerk/CertificateFilters"
import { useCertificateStore } from "@/components/sectors/clerk/useCertificateStore"
import { Button } from "@/components/ui/button"
import {
  certificateTabs,
  type CertificateTab,
} from "@/mock/clerk/certificates"

/**
 * The clerk's certificate issuance desk: three record tabs over one in-memory
 * store, so an action taken here — or on a deep-linked detail page — is still
 * visible after navigating.
 */
export default function CertificatesDesk() {
  const { store, revision, requests, issuances, records, flash, setFlash, refresh } =
    useCertificateStore()

  const [tab, setTab] = useState<CertificateTab>("requests")
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<CertificateFilterState>(emptyCertificateFilters)
  const [requestId, setRequestId] = useState<number | null>(null)
  const [issuanceId, setIssuanceId] = useState<number | null>(null)
  // `walk-in` marks an issuance filed straight at the desk, with no request.
  const [generateTarget, setGenerateTarget] = useState<number | "walk-in" | null>(null)

  const openRequest = useMemo(
    () => (requestId === null ? null : store.requestById(requestId)),
    [requestId, revision, store],
  )
  const openIssuance = useMemo(
    () => (issuanceId === null ? null : store.issuanceById(issuanceId)),
    [issuanceId, revision, store],
  )
  const generateRequest = useMemo(
    () => (generateTarget === null || generateTarget === "walk-in" ? null : store.requestById(generateTarget)),
    [generateTarget, revision, store],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Office of the Barangay Clerk"
        title="Certificate Issuance"
        description="Review resident requests, generate the certificate, collect the fee and release the signed copy."
        actions={
          <Button size="sm" className="h-9" onClick={() => setGenerateTarget("walk-in")}>
            <Plus className="size-4" /> Issue New Certificate
          </Button>
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={(value) => setTab(value as CertificateTab)}
        segments={certificateTabs.map((entry) => ({
          label: entry.label,
          value: entry.value,
          count:
            entry.value === "requests"
              ? requests.length
              : entry.value === "issued"
                ? issuances.length
                : records.length,
        }))}
      />

      {flash && (
        <CertificateFlashBanner flash={flash} onDismiss={() => setFlash(null)} />
      )}

      <CertificateTable
        tab={tab}
        requests={requests}
        issuances={issuances}
        records={records}
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        onTabChange={setTab}
        onOpenRequest={(request) => {
          setRequestId(request.id)
          setFlash(null)
        }}
        onOpenIssuance={(issuance) => {
          setIssuanceId(issuance.id)
          setFlash(null)
        }}
        onIssue={(request) => {
          setRequestId(null)
          setGenerateTarget(request ? request.id : "walk-in")
        }}
      />

      <CertificateRequestDialog
        request={openRequest ?? null}
        issuance={openRequest ? store.issuanceForRequest(openRequest.id) : null}
        open={requestId !== null && openRequest !== null}
        onOpenChange={(next) => {
          if (!next) setRequestId(null)
        }}
        onGenerate={(request) => {
          setRequestId(null)
          setGenerateTarget(request.id)
        }}
        onChanged={refresh}
        onFeedback={setFlash}
      />

      <CertificateIssuedDialog
        issuance={openIssuance ?? null}
        linkedRequest={openIssuance?.requestId ? store.requestById(openIssuance.requestId) ?? null : null}
        open={issuanceId !== null && openIssuance !== null}
        onOpenChange={(next) => {
          if (!next) setIssuanceId(null)
        }}
        onFeedback={setFlash}
      />

      <CertificateGenerateDialog
        open={generateTarget !== null}
        onOpenChange={(next) => {
          if (!next) setGenerateTarget(null)
        }}
        request={generateRequest ?? null}
        onFeedback={setFlash}
        onCommitted={refresh}
      />
    </div>
  )
}
