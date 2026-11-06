import { useParams } from "react-router-dom"

import DeskPostDetail from "@/components/sectors/desk/DeskPostDetail"
import { seniorDesk } from "@/config/sectorDesks"

export default function SeniorProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <DeskPostDetail desk={seniorDesk} id={id ?? ""} kind="program" />
}
