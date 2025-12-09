import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AppointmentWithDonor, TIME_SLOTS } from "./types";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithDonor;
  onSuccess?: () => void;
}

const RescheduleDialog = ({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: RescheduleDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && appointment) {
      // Pre-fill with the original date/time as starting point
      const aptDate = parseISO(appointment.appointment_date);
      setSelectedDate(aptDate);
      setSelectedTime(format(aptDate, "HH:mm"));
      setNotes("");
    }
  }, [open, appointment]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select a new date and time.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const newDateTime = `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00`;

      // Create new appointment with reference to old one
      const { error: insertError } = await supabase.from("appointments").insert({
        donor_id: appointment.donor_id,
        appointment_date: newDateTime,
        appointment_type: appointment.appointment_type,
        status: "scheduled",
        created_by: user?.id,
        notes: notes || null,
        uber_needed: appointment.uber_needed,
        uber_ordered: false, // Reset uber ordered for new appointment
        purpose: appointment.purpose,
        location: appointment.location,
        donor_letter: appointment.donor_letter,
        prescreened_by: appointment.prescreened_by,
        prescreened_date: appointment.prescreened_date,
        rescheduled_from: appointment.id,
      });

      if (insertError) throw insertError;

      // Mark old appointment as rescheduled
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ 
          status: "rescheduled",
          notes: `[Rescheduled to ${format(new Date(newDateTime), "MMM d, yyyy 'at' h:mm a")}]${appointment.notes ? ` | Original: ${appointment.notes}` : ""}`,
        })
        .eq("id", appointment.id);

      if (updateError) throw updateError;

      toast({
        title: "Appointment rescheduled",
        description: `New appointment created for ${format(new Date(newDateTime), "MMM d, yyyy 'at' h:mm a")}.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to reschedule appointment.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const donorName = appointment?.donors 
    ? `${appointment.donors.first_name} ${appointment.donors.last_name}` 
    : "this donor";

  const originalDate = appointment ? format(parseISO(appointment.appointment_date), "MMM d, yyyy 'at' h:mm a") : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Reschedule appointment for {donorName}. Original: {originalDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>New Time *</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {format(new Date(`2000-01-01T${time}`), "h:mm a")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes for New Appointment (Optional)</Label>
            <Textarea
              placeholder="Any notes for the rescheduled appointment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReschedule} disabled={saving}>
            {saving ? "Rescheduling..." : "Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
