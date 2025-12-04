import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, MoreHorizontal, MapPin, Car, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import AppointmentScheduleDialog from "@/components/admin/appointments/AppointmentScheduleDialog";
import AppointmentStatusBadge from "@/components/admin/appointments/AppointmentStatusBadge";
import DonationResultsDialog from "@/components/admin/appointments/DonationResultsDialog";
import type { AppointmentStatus } from "@/components/admin/appointments/types";

interface DonorAppointmentsProps {
  donorId: string;
  donorName?: string;
}

interface AppointmentWithResults {
  id: string;
  donor_id: string;
  appointment_date: string;
  appointment_type: string | null;
  status: AppointmentStatus | null;
  notes: string | null;
  purpose: string | null;
  location: string | null;
  donor_letter: string | null;
  uber_needed: boolean | null;
  uber_ordered: boolean | null;
  prescreener?: { full_name: string | null };
  donation_results?: {
    volume_ml: number | null;
    cell_count: number | null;
    lot_number: string | null;
  } | {
    volume_ml: number | null;
    cell_count: number | null;
    lot_number: string | null;
  }[];
}

const DonorAppointments = ({ donorId, donorName }: DonorAppointmentsProps) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastDonorLetter, setLastDonorLetter] = useState<string | null>(null);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [donorId]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          prescreener:prescreened_by (
            full_name
          ),
          donation_results (
            volume_ml,
            cell_count,
            lot_number
          )
        `)
        .eq("donor_id", donorId)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);

      // Get last donation letter for auto-suggestion
      const lastDonation = data?.find(
        (apt) => apt.appointment_type === "donation" && apt.donor_letter
      );
      if (lastDonation?.donor_letter) {
        setLastDonorLetter(lastDonation.donor_letter);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = (apt: AppointmentWithResults) => {
    // For donations, open the results dialog
    if (apt.appointment_type === "donation") {
      setSelectedAppointmentId(apt.id);
      setResultsDialogOpen(true);
    } else {
      // For other types, just mark as completed
      updateStatus(apt.id, "completed");
    }
  };

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
      );

      toast({
        title: "Status updated",
        description: `Appointment marked as ${status.replace("_", " ")}.`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const getResults = (apt: AppointmentWithResults) => {
    const results = apt.donation_results;
    if (!results) return null;
    // Handle both array and single object
    if (Array.isArray(results)) {
      return results[0] || null;
    }
    return results;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Appointments ({appointments.length})
          </CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Schedule
          </Button>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No appointments scheduled</p>
              <p className="text-sm">Click "Schedule" to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => {
                  const results = getResults(apt);
                  return (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {format(parseISO(apt.appointment_date), "MMM d, yyyy")}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(apt.appointment_date), "h:mm a")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm capitalize">
                            {apt.appointment_type?.replace("_", " ") || "—"}
                          </span>
                          {apt.donor_letter && (
                            <Badge variant="outline" className="text-xs">
                              {apt.donor_letter}
                            </Badge>
                          )}
                          {apt.purpose && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {apt.purpose}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {apt.location ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="capitalize">{apt.location}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AppointmentStatusBadge status={apt.status} />
                          {(apt.uber_needed || apt.uber_ordered) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Car
                                    className={`h-4 w-4 ${
                                      apt.uber_ordered ? "text-green-600" : "text-amber-600"
                                    }`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {apt.uber_ordered ? "Uber Ordered" : "Uber Needed"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {apt.appointment_type === "donation" && results ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1 text-sm text-green-600">
                                  <FlaskConical className="h-3.5 w-3.5" />
                                  <span>{results.volume_ml} ml</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <div>Volume: {results.volume_ml} ml</div>
                                  {results.cell_count && <div>Cell Count: {results.cell_count}</div>}
                                  {results.lot_number && <div>Lot #: {results.lot_number}</div>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : apt.appointment_type === "donation" && apt.status === "completed" ? (
                          <span className="text-xs text-muted-foreground">No results</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleMarkCompleted(apt)}>
                              {apt.appointment_type === "donation" ? "Complete & Enter Results" : "Mark Completed"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(apt.id, "cancelled")}>
                              Mark Cancelled
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(apt.id, "no_show")}>
                              Mark No Show
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateStatus(apt.id, "deferred")}>
                              Mark Deferred
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(apt.id, "rescheduled")}>
                              Mark Rescheduled
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(apt.id, "sample_not_taken")}>
                              Sample Not Taken
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AppointmentScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        donorId={donorId}
        donorName={donorName}
        lastDonorLetter={lastDonorLetter}
        onSuccess={fetchAppointments}
      />

      {selectedAppointmentId && (
        <DonationResultsDialog
          open={resultsDialogOpen}
          onOpenChange={(open) => {
            setResultsDialogOpen(open);
            if (!open) setSelectedAppointmentId(null);
          }}
          appointmentId={selectedAppointmentId}
          donorId={donorId}
          donorName={donorName}
          onSuccess={fetchAppointments}
        />
      )}
    </>
  );
};

export default DonorAppointments;
