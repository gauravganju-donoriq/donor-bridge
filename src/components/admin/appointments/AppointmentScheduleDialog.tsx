import { useState, useEffect } from "react";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  AppointmentFormData,
  APPOINTMENT_TYPES,
  APPOINTMENT_PURPOSES,
  APPOINTMENT_LOCATIONS,
  DONOR_LETTERS,
  TIME_SLOTS,
} from "./types";

interface AppointmentScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorId: string;
  donorName?: string;
  onSuccess?: () => void;
  lastDonorLetter?: string | null;
}

const getNextDonorLetter = (lastLetter: string | null): string => {
  if (!lastLetter) return "A";
  const index = DONOR_LETTERS.indexOf(lastLetter as typeof DONOR_LETTERS[number]);
  if (index === -1 || index >= DONOR_LETTERS.length - 1) return "A";
  return DONOR_LETTERS[index + 1];
};

const AppointmentScheduleDialog = ({
  open,
  onOpenChange,
  donorId,
  donorName,
  onSuccess,
  lastDonorLetter,
}: AppointmentScheduleDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [staffMembers, setStaffMembers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const [formData, setFormData] = useState<AppointmentFormData>({
    appointment_date: "",
    appointment_time: "",
    appointment_type: "",
    purpose: "",
    location: "",
    donor_letter: "",
    prescreened_by: "",
    prescreened_date: "",
    uber_needed: false,
    uber_ordered: false,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchStaffMembers();
      // Auto-suggest next donor letter for donation type
      if (lastDonorLetter) {
        setFormData(prev => ({
          ...prev,
          donor_letter: getNextDonorLetter(lastDonorLetter),
        }));
      }
    }
  }, [open, lastDonorLetter]);

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
      }));
    }
  }, [selectedDate]);

  const fetchStaffMembers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true);
    if (data) setStaffMembers(data);
  };

  const resetForm = () => {
    setFormData({
      appointment_date: "",
      appointment_time: "",
      appointment_type: "",
      purpose: "",
      location: "",
      donor_letter: "",
      prescreened_by: "",
      prescreened_date: "",
      uber_needed: false,
      uber_ordered: false,
      notes: "",
    });
    setSelectedDate(undefined);
  };

  const handleSubmit = async () => {
    if (!formData.appointment_date || !formData.appointment_time) {
      toast({
        title: "Error",
        description: "Please select a date and time.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.appointment_type) {
      toast({
        title: "Error",
        description: "Please select an appointment type.",
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
        appointment_type: formData.appointment_type,
        status: "scheduled" as const,
        created_by: user?.id,
        notes: formData.notes || null,
        uber_needed: formData.uber_needed,
        uber_ordered: formData.uber_ordered,
        purpose: formData.purpose || null,
        location: formData.location || null,
        donor_letter: formData.donor_letter || null,
        prescreened_by: formData.prescreened_by || null,
        prescreened_date: formData.prescreened_date || null,
      });

      if (error) throw error;

      toast({
        title: "Appointment scheduled",
        description: `${formData.appointment_type === "screening" ? "Screening" : "Donation"} appointment created for ${format(new Date(appointmentDateTime), "MMM d, yyyy 'at' h:mm a")}.`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            {donorName ? `Create a new appointment for ${donorName}.` : "Create a new appointment for this donor."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date & Time Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Date & Time</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
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
                <Label>Time *</Label>
                <Select
                  value={formData.appointment_time}
                  onValueChange={(value) => setFormData({ ...formData, appointment_time: value })}
                >
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
            </div>
          </div>

          {/* Appointment Details Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Appointment Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.appointment_type}
                  onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(value) => setFormData({ ...formData, purpose: value as AppointmentFormData["purpose"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_PURPOSES.map((purpose) => (
                      <SelectItem key={purpose.value} value={purpose.value}>
                        {purpose.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value as AppointmentFormData["location"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_LOCATIONS.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.appointment_type === "donation" && (
                <div className="space-y-2">
                  <Label>Donor Letter (A-L)</Label>
                  <Select
                    value={formData.donor_letter}
                    onValueChange={(value) => setFormData({ ...formData, donor_letter: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select letter" />
                    </SelectTrigger>
                    <SelectContent>
                      {DONOR_LETTERS.map((letter) => (
                        <SelectItem key={letter} value={letter}>
                          {letter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Pre-screen Info Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Pre-screen Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prescreened By</Label>
                <Select
                  value={formData.prescreened_by}
                  onValueChange={(value) => setFormData({ ...formData, prescreened_by: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Prescreened</Label>
                <Input
                  type="date"
                  value={formData.prescreened_date}
                  onChange={(e) => setFormData({ ...formData, prescreened_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Status Checkboxes Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Additional Options</h4>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="uber_needed"
                  checked={formData.uber_needed}
                  onCheckedChange={(checked) => setFormData({ ...formData, uber_needed: checked as boolean })}
                />
                <Label htmlFor="uber_needed" className="text-sm font-normal">Uber Needed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="uber_ordered"
                  checked={formData.uber_ordered}
                  onCheckedChange={(checked) => setFormData({ ...formData, uber_ordered: checked as boolean })}
                />
                <Label htmlFor="uber_ordered" className="text-sm font-normal">Uber Ordered</Label>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes about this appointment..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Scheduling..." : "Schedule Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentScheduleDialog;
