import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Car, User, FileText, History, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import AppointmentStatusBadge from "./AppointmentStatusBadge";
import { AppointmentWithDonor } from "./types";

interface RescheduleHistoryItem {
  id: string;
  appointment_date: string;
  status: string | null;
  notes: string | null;
  created_at: string | null;
}

interface AppointmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
}

const AppointmentDetailsDialog = ({
  open,
  onOpenChange,
  appointmentId,
}: AppointmentDetailsDialogProps) => {
  const [appointment, setAppointment] = useState<AppointmentWithDonor | null>(null);
  const [rescheduleHistory, setRescheduleHistory] = useState<RescheduleHistoryItem[]>([]);
  const [rescheduledTo, setRescheduledTo] = useState<RescheduleHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && appointmentId) {
      fetchAppointmentDetails();
    }
  }, [open, appointmentId]);

  const fetchAppointmentDetails = async () => {
    setLoading(true);
    try {
      // Fetch main appointment
      const { data: apt, error } = await supabase
        .from("appointments")
        .select(`
          *,
          donors:donor_id (
            id,
            donor_id,
            first_name,
            last_name
          ),
          prescreener:prescreened_by (
            full_name
          )
        `)
        .eq("id", appointmentId)
        .maybeSingle();

      if (error) throw error;
      setAppointment(apt);

      // Fetch reschedule history (appointments this one was rescheduled from)
      if (apt?.rescheduled_from) {
        const history: RescheduleHistoryItem[] = [];
        let currentId = apt.rescheduled_from;
        
        // Traverse the reschedule chain backwards
        while (currentId) {
          const { data: prevApt } = await supabase
            .from("appointments")
            .select("id, appointment_date, status, notes, created_at, rescheduled_from")
            .eq("id", currentId)
            .maybeSingle();
          
          if (prevApt) {
            history.push(prevApt);
            currentId = prevApt.rescheduled_from;
          } else {
            break;
          }
        }
        
        setRescheduleHistory(history.reverse()); // Show oldest first
      } else {
        setRescheduleHistory([]);
      }

      // Check if this appointment was rescheduled to a newer one
      const { data: nextApt } = await supabase
        .from("appointments")
        .select("id, appointment_date, status, notes, created_at")
        .eq("rescheduled_from", appointmentId)
        .maybeSingle();
      
      setRescheduledTo(nextApt || null);

    } catch (error) {
      console.error("Error fetching appointment details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!appointment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-center py-8">Appointment not found.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const donorName = appointment.donors 
    ? `${appointment.donors.first_name} ${appointment.donors.last_name}` 
    : "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Donor Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{donorName}</p>
              <p className="text-sm text-muted-foreground">{appointment.donors?.donor_id}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(parseISO(appointment.appointment_date), "MMMM d, yyyy")}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Time</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(parseISO(appointment.appointment_date), "h:mm a")}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Appointment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Type</p>
              <div className="flex items-center gap-2">
                <span className="capitalize">{appointment.appointment_type || "—"}</span>
                {appointment.donor_letter && (
                  <Badge variant="outline">{appointment.donor_letter}</Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Purpose</p>
              <span className="capitalize">{appointment.purpose || "—"}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
              <div className="flex items-center gap-1">
                {appointment.location ? (
                  <>
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="capitalize">{appointment.location}</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
          </div>

          <Separator />

          {/* Pre-screen Info */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Pre-screen Information</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Prescreened By</p>
                <span>{appointment.prescreener?.full_name || "—"}</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Date Prescreened</p>
                <span>
                  {appointment.prescreened_date 
                    ? format(parseISO(appointment.prescreened_date), "MMM d, yyyy") 
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Uber Info */}
          {(appointment.uber_needed || appointment.uber_ordered) && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <Car className={`h-4 w-4 ${appointment.uber_ordered ? "text-green-600" : "text-amber-600"}`} />
                <span className="text-sm">
                  {appointment.uber_ordered ? "Uber Ordered" : "Uber Needed"}
                </span>
              </div>
            </>
          )}

          {/* Notes */}
          {appointment.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Notes</p>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  {appointment.notes}
                </p>
              </div>
            </>
          )}

          {/* Reschedule History */}
          {(rescheduleHistory.length > 0 || rescheduledTo) && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Reschedule History</p>
                </div>
                <div className="space-y-2">
                  {rescheduleHistory.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <div className="flex-1 p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {format(parseISO(item.appointment_date), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.status?.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                  
                  {/* Current appointment */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {format(parseISO(appointment.appointment_date), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                        <Badge variant="secondary" className="text-xs">Current</Badge>
                      </div>
                    </div>
                    {rescheduledTo && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>

                  {/* Rescheduled to */}
                  {rescheduledTo && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex-1 p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {format(parseISO(rescheduledTo.appointment_date), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {rescheduledTo.status?.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Created At */}
          <div className="text-xs text-muted-foreground text-center pt-2">
            Created {appointment.created_at 
              ? format(parseISO(appointment.created_at), "MMM d, yyyy 'at' h:mm a") 
              : "—"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsDialog;
