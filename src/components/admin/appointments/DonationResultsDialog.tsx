import { useState, useEffect } from "react";
import { FlaskConical, X } from "lucide-react";
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

export interface ExistingResult {
  id: string;
  volume_ml: number | null;
  clots_vol_ml: number | null;
  final_vol_ml: number | null;
  cell_count: number | null;
  lot_number: string | null;
  lot_number_2: string | null;
  lot_number_3: string | null;
  lot_number_4: string | null;
  doctor_id: string | null;
  doctor_comments: string | null;
  lab_tech_id: string | null;
  exam_room_time: string | null;
  departure_time: string | null;
}

interface DonationResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  donorId: string;
  donorName?: string;
  existingResult?: ExistingResult;
  onSuccess?: () => void;
}

interface StaffMember {
  id: string;
  full_name: string | null;
}

interface FormData {
  volume_ml: string;
  clots_vol_ml: string;
  final_vol_ml: string;
  cell_count: string;
  lot_number: string;
  lot_number_2: string;
  lot_number_3: string;
  lot_number_4: string;
  doctor_id: string;
  doctor_comments: string;
  lab_tech_id: string;
  exam_room_time: string;
  departure_time: string;
}

const initialFormData: FormData = {
  volume_ml: "",
  clots_vol_ml: "",
  final_vol_ml: "",
  cell_count: "",
  lot_number: "",
  lot_number_2: "",
  lot_number_3: "",
  lot_number_4: "",
  doctor_id: "",
  doctor_comments: "",
  lab_tech_id: "",
  exam_room_time: "",
  departure_time: "",
};

const DonationResultsDialog = ({
  open,
  onOpenChange,
  appointmentId,
  donorId,
  donorName,
  existingResult,
  onSuccess,
}: DonationResultsDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const isEditMode = !!existingResult;

  useEffect(() => {
    if (open) {
      fetchStaffMembers();
      if (existingResult) {
        setFormData({
          volume_ml: existingResult.volume_ml?.toString() || "",
          clots_vol_ml: existingResult.clots_vol_ml?.toString() || "",
          final_vol_ml: existingResult.final_vol_ml?.toString() || "",
          cell_count: existingResult.cell_count?.toString() || "",
          lot_number: existingResult.lot_number || "",
          lot_number_2: existingResult.lot_number_2 || "",
          lot_number_3: existingResult.lot_number_3 || "",
          lot_number_4: existingResult.lot_number_4 || "",
          doctor_id: existingResult.doctor_id || "",
          doctor_comments: existingResult.doctor_comments || "",
          lab_tech_id: existingResult.lab_tech_id || "",
          exam_room_time: existingResult.exam_room_time || "",
          departure_time: existingResult.departure_time || "",
        });
      } else {
        resetForm();
      }
    }
  }, [open, existingResult]);

  // Auto-calculate final volume
  useEffect(() => {
    const total = parseFloat(formData.volume_ml) || 0;
    const clots = parseFloat(formData.clots_vol_ml) || 0;
    const final = total - clots;
    setFormData(prev => ({ ...prev, final_vol_ml: final > 0 ? final.toFixed(1) : "" }));
  }, [formData.volume_ml, formData.clots_vol_ml]);

  const fetchStaffMembers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true);
    if (data) setStaffMembers(data);
  };

  const resetForm = () => {
    setFormData(initialFormData);
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
      const resultData = {
        volume_ml: parseFloat(formData.volume_ml) || null,
        clots_vol_ml: formData.clots_vol_ml ? parseFloat(formData.clots_vol_ml) : null,
        final_vol_ml: formData.final_vol_ml ? parseFloat(formData.final_vol_ml) : null,
        cell_count: formData.cell_count ? parseFloat(formData.cell_count) : null,
        lot_number: formData.lot_number || null,
        lot_number_2: formData.lot_number_2 || null,
        lot_number_3: formData.lot_number_3 || null,
        lot_number_4: formData.lot_number_4 || null,
        doctor_id: formData.doctor_id || null,
        doctor_comments: formData.doctor_comments || null,
        lab_tech_id: formData.lab_tech_id || null,
        exam_room_time: formData.exam_room_time || null,
        departure_time: formData.departure_time || null,
      };

      if (isEditMode && existingResult) {
        // Update existing result
        const { error } = await supabase
          .from("donation_results")
          .update(resultData)
          .eq("id", existingResult.id);

        if (error) throw error;

        toast({
          title: "Results updated",
          description: "Donation results have been updated.",
        });
      } else {
        // Insert new result
        const { error: resultsError } = await supabase.from("donation_results").insert({
          appointment_id: appointmentId,
          ...resultData,
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
        }

        toast({
          title: "Results recorded",
          description: "Donation results saved. A follow-up task has been created.",
        });
      }

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            {isEditMode ? "Edit Donation Results" : "Record Donation Results"}
          </DialogTitle>
          <DialogDescription>
            {donorName
              ? `${isEditMode ? "Update" : "Enter"} the donation results for ${donorName}.`
              : `${isEditMode ? "Update" : "Enter"} the results from this donation procedure.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Volume Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Volume Information</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="volume">Total Vol (ml) *</Label>
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
                <Label htmlFor="clots_vol">Clots Vol (ml)</Label>
                <Input
                  id="clots_vol"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5"
                  value={formData.clots_vol_ml}
                  onChange={(e) => setFormData({ ...formData, clots_vol_ml: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="final_vol">Final Vol (ml)</Label>
                <Input
                  id="final_vol"
                  type="number"
                  value={formData.final_vol_ml}
                  readOnly
                  className="bg-muted"
                  placeholder="Auto-calculated"
                />
              </div>
            </div>
          </div>

          {/* Comment & Cell Count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comments">Comment</Label>
              <Textarea
                id="comments"
                placeholder="Any notes or observations..."
                value={formData.doctor_comments}
                onChange={(e) => setFormData({ ...formData, doctor_comments: e.target.value })}
                rows={3}
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

          {/* Lot Numbers Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Lot Numbers (SAP Durham)</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lot_1">Lot 1</Label>
                <Input
                  id="lot_1"
                  placeholder="Lot #1"
                  value={formData.lot_number}
                  onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lot_2">Lot 2</Label>
                <Input
                  id="lot_2"
                  placeholder="Lot #2"
                  value={formData.lot_number_2}
                  onChange={(e) => setFormData({ ...formData, lot_number_2: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lot_3">Lot 3</Label>
                <Input
                  id="lot_3"
                  placeholder="Lot #3"
                  value={formData.lot_number_3}
                  onChange={(e) => setFormData({ ...formData, lot_number_3: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lot_4">Lot 4</Label>
                <Input
                  id="lot_4"
                  placeholder="Lot #4"
                  value={formData.lot_number_4}
                  onChange={(e) => setFormData({ ...formData, lot_number_4: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Staff Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Staff</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calculated By (Lab Tech)</Label>
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
              <div className="space-y-2">
                <Label>Physician</Label>
                <Select
                  value={formData.doctor_id}
                  onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select physician" />
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
          </div>

          {/* Times Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Times</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam_room_time">Exam Room Time</Label>
                <div className="flex gap-2">
                  <Input
                    id="exam_room_time"
                    type="time"
                    value={formData.exam_room_time}
                    onChange={(e) => setFormData({ ...formData, exam_room_time: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData({ ...formData, exam_room_time: "" })}
                    title="Reset Time"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departure_time">Departure Time</Label>
                <div className="flex gap-2">
                  <Input
                    id="departure_time"
                    type="time"
                    value={formData.departure_time}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData({ ...formData, departure_time: "" })}
                    title="Reset Time"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={resetForm} type="button">
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : isEditMode ? "Update Results" : "Save Results & Complete"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DonationResultsDialog;
