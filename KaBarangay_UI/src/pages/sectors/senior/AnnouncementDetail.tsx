import { useParams } from "react-router-dom"

import DeskPostDetail from "@/components/sectors/desk/DeskPostDetail"
import { seniorDesk } from "@/config/sectorDesks"

export default function SeniorAnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <DeskPostDetail desk={seniorDesk} id={id ?? ""} kind="auto" />
}
