import { useState, useEffect } from "react";
import { format, parseISO, isToday, isThisWeek, isThisMonth, isBefore, isAfter, addDays, startOfDay } from "date-fns";
import { Calendar, Clock, MapPin, MoreHorizontal, User, Car, Pencil, RefreshCw, X } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AppointmentStatusBadge from "./AppointmentStatusBadge";
import AppointmentEditDialog from "./AppointmentEditDialog";
import CancellationDialog from "./CancellationDialog";
import RescheduleDialog from "./RescheduleDialog";
import { AppointmentWithDonor, AppointmentStatus, STATUS_OPTIONS, DATE_RANGE_OPTIONS, DateRangeOption } from "./types";

interface AppointmentListProps {
  onRefresh?: () => void;
}

const AppointmentList = ({ onRefresh }: AppointmentListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentWithDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeOption>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [noShowDialogOpen, setNoShowDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDonor | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
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

      onRefresh?.();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const handleNoShowConfirm = async () => {
    if (!selectedAppointment) return;
    await updateStatus(selectedAppointment.id, "no_show");
    setNoShowDialogOpen(false);
    setSelectedAppointment(null);
  };

  const openEditDialog = (apt: AppointmentWithDonor) => {
    setSelectedAppointment(apt);
    setEditDialogOpen(true);
  };

  const openCancelDialog = (apt: AppointmentWithDonor) => {
    setSelectedAppointment(apt);
    setCancelDialogOpen(true);
  };

  const openRescheduleDialog = (apt: AppointmentWithDonor) => {
    setSelectedAppointment(apt);
    setRescheduleDialogOpen(true);
  };

  const openNoShowDialog = (apt: AppointmentWithDonor) => {
    setSelectedAppointment(apt);
    setNoShowDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchAppointments();
    onRefresh?.();
  };

  const filterByDateRange = (apt: AppointmentWithDonor): boolean => {
    const aptDate = parseISO(apt.appointment_date);
    const today = startOfDay(new Date());

    switch (dateRangeFilter) {
      case "today":
        return isToday(aptDate);
      case "week":
        return isThisWeek(aptDate);
      case "next7":
        return isAfter(aptDate, today) && isBefore(aptDate, addDays(today, 8));
      case "month":
        return isThisMonth(aptDate);
      case "upcoming":
        return isAfter(aptDate, today) || isToday(aptDate);
      case "past":
        return isBefore(aptDate, today) && !isToday(aptDate);
      default:
        return true;
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter !== "all" && apt.status !== statusFilter) return false;
    if (typeFilter !== "all" && apt.appointment_type !== typeFilter) return false;
    if (!filterByDateRange(apt)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const donorName = `${apt.donors?.first_name} ${apt.donors?.last_name}`.toLowerCase();
      const donorId = apt.donors?.donor_id?.toLowerCase() || "";
      if (!donorName.includes(query) && !donorId.includes(query)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDonorName = (apt: AppointmentWithDonor) => 
    apt.donors ? `${apt.donors.first_name} ${apt.donors.last_name}` : "Unknown";

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Appointments ({filteredAppointments.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search donor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[180px]"
              />
              <Select value={dateRangeFilter} onValueChange={(v) => setDateRangeFilter(v as DateRangeOption)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No appointments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow key={apt.id} className="cursor-pointer hover:bg-muted/50">
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
                        <div
                          className="flex items-center gap-2 cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/admin/donors/${apt.donor_id}`)}
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {apt.donors?.first_name} {apt.donors?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {apt.donors?.donor_id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm capitalize">{apt.appointment_type || "—"}</span>
                          {apt.donor_letter && (
                            <Badge variant="outline" className="text-xs">
                              {apt.donor_letter}
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
                            <Car className={`h-4 w-4 ${apt.uber_ordered ? "text-green-600" : "text-amber-600"}`} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {apt.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/donors/${apt.donor_id}`)}>
                              View Donor
                            </DropdownMenuItem>
                            {apt.status === "scheduled" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(apt)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openRescheduleDialog(apt)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reschedule
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openCancelDialog(apt)}>
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateStatus(apt.id, "completed")}>
                              Mark Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openNoShowDialog(apt)}>
                              Mark No Show
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(apt.id, "deferred")}>
                              Mark Deferred
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(apt.id, "sample_not_taken")}>
                              Sample Not Taken
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedAppointment && (
        <AppointmentEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          appointment={selectedAppointment}
          onSuccess={handleDialogSuccess}
        />
      )}

      {/* Cancel Dialog */}
      {selectedAppointment && (
        <CancellationDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          appointmentId={selectedAppointment.id}
          donorName={getDonorName(selectedAppointment)}
          onSuccess={handleDialogSuccess}
        />
      )}

      {/* Reschedule Dialog */}
      {selectedAppointment && (
        <RescheduleDialog
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          appointment={selectedAppointment}
          onSuccess={handleDialogSuccess}
        />
      )}

      {/* No Show Confirmation */}
      <AlertDialog open={noShowDialogOpen} onOpenChange={setNoShowDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as No Show?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAppointment && (
                <>Are you sure you want to mark this appointment for {getDonorName(selectedAppointment)} as a no-show?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNoShowConfirm}>
              Mark No Show
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AppointmentList;
