import DeskApplicationCreate from "@/components/sectors/desk/DeskApplicationCreate"
import { pwdDesk } from "@/config/sectorDesks"

export default function PwdApplicationCreate() {
  return <DeskApplicationCreate desk={pwdDesk} />
}
