import { useParams } from "react-router-dom"

import DeskPostDetail from "@/components/sectors/desk/DeskPostDetail"
import { pwdDesk } from "@/config/sectorDesks"

export default function PwdUpdateDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <DeskPostDetail desk={pwdDesk} id={id ?? ""} kind="update" />
}
