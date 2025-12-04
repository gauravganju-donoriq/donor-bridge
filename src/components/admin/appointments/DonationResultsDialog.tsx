import { useState, useEffect } from "react";
import { FlaskConical } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DonationResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  donorId: string;
  donorName?: string;
  onSuccess?: () => void;
}

interface StaffMember {
  id: string;
  full_name: string | null;
}

interface FormData {
  volume_ml: string;
  cell_count: string;
  lot_number: string;
  doctor_id: string;
  doctor_comments: string;
  lab_tech_id: string;
}

const DonationResultsDialog = ({
  open,
  onOpenChange,
  appointmentId,
  donorId,
  donorName,
  onSuccess,
}: DonationResultsDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [formData, setFormData] = useState<FormData>({
    volume_ml: "",
    cell_count: "",
    lot_number: "",
    doctor_id: "",
    doctor_comments: "",
    lab_tech_id: "",
  });

  useEffect(() => {
    if (open) {
      fetchStaffMembers();
      resetForm();
    }
  }, [open]);

  const fetchStaffMembers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true);
    if (data) setStaffMembers(data);
  };

  const resetForm = () => {
    setFormData({
      volume_ml: "",
      cell_count: "",
      lot_number: "",
      doctor_id: "",
      doctor_comments: "",
      lab_tech_id: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.volume_ml) {
      toast({
        title: "Error",
        description: "Please enter the volume collected.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Insert donation results
      const { error: resultsError } = await supabase.from("donation_results").insert({
        appointment_id: appointmentId,
        volume_ml: parseFloat(formData.volume_ml) || null,
        cell_count: formData.cell_count ? parseFloat(formData.cell_count) : null,
        lot_number: formData.lot_number || null,
        doctor_id: formData.doctor_id || null,
        doctor_comments: formData.doctor_comments || null,
        lab_tech_id: formData.lab_tech_id || null,
      });

      if (resultsError) throw resultsError;

      // Update appointment status to completed
      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);

      if (appointmentError) throw appointmentError;

      // Auto-create follow-up task for mandatory post-donation call
      const { error: followUpError } = await supabase.from("follow_ups").insert({
        appointment_id: appointmentId,
        donor_id: donorId,
        status: "pending",
      });

      if (followUpError) {
        console.error("Error creating follow-up:", followUpError);
        // Don't fail the whole operation if follow-up creation fails
      }

      toast({
        title: "Results recorded",
        description: "Donation results saved. A follow-up task has been created.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving donation results:", error);
      toast({
        title: "Error",
        description: "Failed to save donation results.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Record Donation Results
          </DialogTitle>
          <DialogDescription>
            {donorName
              ? `Enter the donation results for ${donorName}.`
              : "Enter the results from this donation procedure."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Volume & Cell Count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume (ml) *</Label>
              <Input
                id="volume"
                type="number"
                step="0.1"
                placeholder="e.g., 250"
                value={formData.volume_ml}
                onChange={(e) => setFormData({ ...formData, volume_ml: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cell_count">Cell Count</Label>
              <Input
                id="cell_count"
                type="number"
                step="0.01"
                placeholder="e.g., 2.5"
                value={formData.cell_count}
                onChange={(e) => setFormData({ ...formData, cell_count: e.target.value })}
              />
            </div>
          </div>

          {/* Lot Number */}
          <div className="space-y-2">
            <Label htmlFor="lot_number">Lot Number (SAP Durham)</Label>
            <Input
              id="lot_number"
              placeholder="Enter lot number"
              value={formData.lot_number}
              onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
            />
          </div>

          {/* Doctor & Lab Tech */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select
                value={formData.doctor_id}
                onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
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
              <Label>Lab Tech</Label>
              <Select
                value={formData.lab_tech_id}
                onValueChange={(value) => setFormData({ ...formData, lab_tech_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lab tech" />
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
          </div>

          {/* Doctor's Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Doctor's Comments</Label>
            <Textarea
              id="comments"
              placeholder="Any notes or observations from the procedure..."
              value={formData.doctor_comments}
              onChange={(e) => setFormData({ ...formData, doctor_comments: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Results & Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DonationResultsDialog;
