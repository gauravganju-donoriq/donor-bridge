import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import { CANCELLATION_REASONS } from "./types";

interface CancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  donorName?: string;
  onSuccess?: () => void;
}

const CancellationDialog = ({
  open,
  onOpenChange,
  appointmentId,
  donorName,
  onSuccess,
}: CancellationDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleCancel = async () => {
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a cancellation reason.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const cancellationNote = `[Cancelled: ${CANCELLATION_REASONS.find(r => r.value === reason)?.label}]${notes ? ` - ${notes}` : ""}`;
      
      const { error } = await supabase
        .from("appointments")
        .update({ 
          status: "cancelled",
          notes: cancellationNote,
        })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled.",
      });

      setReason("");
      setNotes("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            {donorName 
              ? `Are you sure you want to cancel this appointment for ${donorName}?`
              : "Are you sure you want to cancel this appointment?"}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cancellation Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Appointment
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={saving}>
            {saving ? "Cancelling..." : "Cancel Appointment"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancellationDialog;
