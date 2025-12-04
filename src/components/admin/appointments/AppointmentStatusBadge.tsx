import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "./types";

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus | null;
}

const AppointmentStatusBadge = ({ status }: AppointmentStatusBadgeProps) => {
  switch (status) {
    case "scheduled":
      return <Badge variant="secondary">Scheduled</Badge>;
    case "completed":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
    case "cancelled":
      return <Badge variant="outline">Cancelled</Badge>;
    case "no_show":
      return <Badge variant="destructive">No Show</Badge>;
    case "rescheduled":
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Rescheduled</Badge>;
    case "deferred":
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Deferred</Badge>;
    case "sample_not_taken":
      return <Badge variant="outline">Sample Not Taken</Badge>;
    default:
      return <Badge variant="outline">{status || "—"}</Badge>;
  }
};

export default AppointmentStatusBadge;
