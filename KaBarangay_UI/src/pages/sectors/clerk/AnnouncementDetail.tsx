import { useParams } from "react-router-dom"

import DeskPostDetail from "@/components/sectors/desk/DeskPostDetail"
import { clerkDesk } from "@/config/sectorDesks"

export default function ClerkAnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <DeskPostDetail desk={clerkDesk} id={id ?? ""} kind="auto" />
}
