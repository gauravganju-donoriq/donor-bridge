import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, MoreHorizontal } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Appointment = Tables<"appointments">;

interface DonorAppointmentsProps {
  donorId: string;
}

const DonorAppointments = ({ donorId }: DonorAppointmentsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    appointment_date: "",
    appointment_time: "",
    appointment_type: "",
    notes: "",
  });

  useEffect(() => {
    fetchAppointments();
  }, [donorId]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("donor_id", donorId)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!formData.appointment_date || !formData.appointment_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;

      const { error } = await supabase.from("appointments").insert({
        donor_id: donorId,
        appointment_date: appointmentDateTime,
        appointment_type: formData.appointment_type || null,
        notes: formData.notes || null,
        status: "scheduled",
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Appointment created",
        description: "The appointment has been scheduled.",
      });

      setDialogOpen(false);
      setFormData({ appointment_date: "", appointment_time: "", appointment_type: "", notes: "" });
      fetchAppointments();
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to create appointment.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: Appointment["status"]) => {
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
        description: `Appointment marked as ${status}.`,
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

  const getStatusBadge = (status: Appointment["status"]) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary" className="text-xs">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 text-xs">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-xs">Cancelled</Badge>;
      case "no_show":
        return <Badge variant="destructive" className="text-xs">No Show</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {appointments.length} appointment{appointments.length !== 1 && "s"}
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base">Schedule Appointment</DialogTitle>
              <DialogDescription className="text-sm">Create a new appointment for this donor.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time" className="text-xs">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs">Type</Label>
                <Select
                  value={formData.appointment_type}
                  onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="donation">Donation</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateAppointment} disabled={saving}>
                {saving ? "Creating..." : "Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <Calendar className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No appointments scheduled</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs h-9">Date & Time</TableHead>
                <TableHead className="text-xs h-9">Type</TableHead>
                <TableHead className="text-xs h-9">Status</TableHead>
                <TableHead className="text-xs h-9">Notes</TableHead>
                <TableHead className="w-10 h-9"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(apt.appointment_date), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(apt.appointment_date), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-sm capitalize">
                    {apt.appointment_type?.replace("_", " ") || "—"}
                  </TableCell>
                  <TableCell className="py-2">{getStatusBadge(apt.status)}</TableCell>
                  <TableCell className="py-2 text-sm text-muted-foreground max-w-[150px] truncate">
                    {apt.notes || "—"}
                  </TableCell>
                  <TableCell className="py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateStatus(apt.id, "completed")}>
                          Mark Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(apt.id, "cancelled")}>
                          Mark Cancelled
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(apt.id, "no_show")}>
                          Mark No Show
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
    </div>
  );
};

export default DonorAppointments;