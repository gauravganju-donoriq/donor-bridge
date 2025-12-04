import { useState } from "react";
import { Phone } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface FollowUpCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUpId: string;
  donorName?: string;
  onSuccess?: () => void;
}

const FollowUpCompleteDialog = ({
  open,
  onOpenChange,
  followUpId,
  donorName,
  onSuccess,
}: FollowUpCompleteDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    pain_level: 1,
    procedure_feedback: "",
    would_donate_again: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      pain_level: 1,
      procedure_feedback: "",
      would_donate_again: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("follow_ups")
        .update({
          status: "completed",
          pain_level: formData.pain_level,
          procedure_feedback: formData.procedure_feedback || null,
          would_donate_again: formData.would_donate_again === "yes" ? true : formData.would_donate_again === "no" ? false : null,
          notes: formData.notes || null,
          completed_by: user?.id,
          completed_at: new Date().toISOString(),
        })
        .eq("id", followUpId);

      if (error) throw error;

      toast({
        title: "Follow-up completed",
        description: "The follow-up has been recorded.",
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error completing follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to complete follow-up.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAttempt = async (attemptNumber: 1 | 2) => {
    try {
      const newStatus = attemptNumber === 1 ? "attempted_1" : "attempted_2";
      const { error } = await supabase
        .from("follow_ups")
        .update({ status: newStatus })
        .eq("id", followUpId);

      if (error) throw error;

      toast({
        title: "Attempt recorded",
        description: `Call attempt ${attemptNumber} has been logged.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error recording attempt:", error);
      toast({
        title: "Error",
        description: "Failed to record attempt.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    try {
      const { error } = await supabase
        .from("follow_ups")
        .update({ status: "email_sent" })
        .eq("id", followUpId);

      if (error) throw error;

      toast({
        title: "Email status updated",
        description: "Follow-up marked as email sent.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Complete Follow-Up
          </DialogTitle>
          <DialogDescription>
            {donorName
              ? `Record the follow-up call results for ${donorName}.`
              : "Record the results of the post-donation follow-up call."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick Actions */}
          <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
            <Button variant="outline" size="sm" onClick={() => handleAttempt(1)}>
              Log Attempt #1
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAttempt(2)}>
              Log Attempt #2
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail}>
              Sent Email
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              If you reached the donor, complete the follow-up below:
            </p>

            {/* Pain Level */}
            <div className="space-y-3">
              <Label>Pain Level (1-10): {formData.pain_level}</Label>
              <Slider
                value={[formData.pain_level]}
                onValueChange={([value]) => setFormData({ ...formData, pain_level: value })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No pain</span>
                <span>Severe pain</span>
              </div>
            </div>

            {/* Procedure Feedback */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="feedback">How was the procedure?</Label>
              <Textarea
                id="feedback"
                placeholder="Donor's feedback about the procedure..."
                value={formData.procedure_feedback}
                onChange={(e) => setFormData({ ...formData, procedure_feedback: e.target.value })}
                rows={2}
              />
            </div>

            {/* Would Donate Again */}
            <div className="space-y-2 mt-4">
              <Label>Would they donate again?</Label>
              <RadioGroup
                value={formData.would_donate_again}
                onValueChange={(value) => setFormData({ ...formData, would_donate_again: value })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="font-normal">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="maybe" id="maybe" />
                  <Label htmlFor="maybe" className="font-normal">Maybe</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any other notes from the call..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Complete Follow-Up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpCompleteDialog;
