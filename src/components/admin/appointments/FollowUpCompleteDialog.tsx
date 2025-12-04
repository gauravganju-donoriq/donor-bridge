import { useState } from "react";
import { Phone, Mail, Printer } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
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

interface FormData {
  // Pain Assessment
  pain_level: number;
  current_pain_level: number;
  // Staff Ratings
  staff_rating: number;
  nurse_rating: number;
  doctor_rating: number;
  // Recovery Questions
  took_pain_medication: boolean | null;
  pain_medication_details: string;
  checked_aspiration_sites: boolean | null;
  aspiration_sites_notes: string;
  signs_of_infection: boolean | null;
  infection_details: string;
  unusual_symptoms: boolean | null;
  symptoms_details: string;
  // Donation Intent
  would_donate_again: string;
  // General
  procedure_feedback: string;
  notes: string;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
  const [formData, setFormData] = useState<FormData>({
    pain_level: 0,
    current_pain_level: 0,
    staff_rating: 0,
    nurse_rating: 0,
    doctor_rating: 0,
    took_pain_medication: null,
    pain_medication_details: "",
    checked_aspiration_sites: null,
    aspiration_sites_notes: "",
    signs_of_infection: null,
    infection_details: "",
    unusual_symptoms: null,
    symptoms_details: "",
    would_donate_again: "",
    procedure_feedback: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      pain_level: 0,
      current_pain_level: 0,
      staff_rating: 0,
      nurse_rating: 0,
      doctor_rating: 0,
      took_pain_medication: null,
      pain_medication_details: "",
      checked_aspiration_sites: null,
      aspiration_sites_notes: "",
      signs_of_infection: null,
      infection_details: "",
      unusual_symptoms: null,
      symptoms_details: "",
      would_donate_again: "",
      procedure_feedback: "",
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
          pain_level: formData.pain_level || null,
          current_pain_level: formData.current_pain_level || null,
          staff_rating: formData.staff_rating || null,
          nurse_rating: formData.nurse_rating || null,
          doctor_rating: formData.doctor_rating || null,
          took_pain_medication: formData.took_pain_medication,
          pain_medication_details: formData.pain_medication_details || null,
          checked_aspiration_sites: formData.checked_aspiration_sites,
          aspiration_sites_notes: formData.aspiration_sites_notes || null,
          signs_of_infection: formData.signs_of_infection,
          infection_details: formData.infection_details || null,
          unusual_symptoms: formData.unusual_symptoms,
          symptoms_details: formData.symptoms_details || null,
          would_donate_again: formData.would_donate_again === "yes" ? true : formData.would_donate_again === "no" ? false : null,
          procedure_feedback: formData.procedure_feedback || null,
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

  const handlePrint = () => {
    window.print();
  };

  const RatingScale = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (val: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {RATING_OPTIONS.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
              value === num
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  const YesNoQuestion = ({
    label,
    value,
    onChange,
    detailsLabel,
    detailsValue,
    onDetailsChange,
  }: {
    label: string;
    value: boolean | null;
    onChange: (val: boolean) => void;
    detailsLabel?: string;
    detailsValue?: string;
    onDetailsChange?: (val: string) => void;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <RadioGroup
        value={value === null ? "" : value ? "yes" : "no"}
        onValueChange={(val) => onChange(val === "yes")}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id={`${label}-yes`} />
          <Label htmlFor={`${label}-yes`} className="font-normal">Yes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id={`${label}-no`} />
          <Label htmlFor={`${label}-no`} className="font-normal">No</Label>
        </div>
      </RadioGroup>
      {value === true && detailsLabel && onDetailsChange && (
        <Input
          placeholder={detailsLabel}
          value={detailsValue || ""}
          onChange={(e) => onDetailsChange(e.target.value)}
          className="mt-2"
        />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Donor Follow-Up Questionnaire
          </DialogTitle>
          <DialogDescription>
            {donorName
              ? `Record the follow-up call results for ${donorName}.`
              : "Record the results of the post-donation follow-up call."}
          </DialogDescription>
        </DialogHeader>

        {/* Quick Actions */}
        <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
          <Button variant="outline" size="sm" onClick={() => handleAttempt(1)}>
            <Phone className="h-4 w-4 mr-1" />
            Log Attempt 1
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAttempt(2)}>
            <Phone className="h-4 w-4 mr-1" />
            Log Attempt 2
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendEmail}>
            <Mail className="h-4 w-4 mr-1" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="ml-auto">
            <Printer className="h-4 w-4 mr-1" />
            Print PDF
          </Button>
        </div>

        <Separator />

        <div className="space-y-6 py-4">
          {/* Pain Assessment Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">Pain Assessment</h4>
            <RatingScale
              label="On a scale of 1-10, what was your pain level during the procedure?"
              value={formData.pain_level}
              onChange={(val) => setFormData({ ...formData, pain_level: val })}
            />
            <RatingScale
              label="On a scale of 1-10, what is your current pain level?"
              value={formData.current_pain_level}
              onChange={(val) => setFormData({ ...formData, current_pain_level: val })}
            />
          </div>

          <Separator />

          {/* Staff Ratings Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">Staff Ratings</h4>
            <RatingScale
              label="On a scale of 1-10, how would you rate the front desk staff's courtesy and professionalism?"
              value={formData.staff_rating}
              onChange={(val) => setFormData({ ...formData, staff_rating: val })}
            />
            <RatingScale
              label="On a scale of 1-10, how would you rate the nurse/medical assistant?"
              value={formData.nurse_rating}
              onChange={(val) => setFormData({ ...formData, nurse_rating: val })}
            />
            <RatingScale
              label="On a scale of 1-10, how would you rate the doctor?"
              value={formData.doctor_rating}
              onChange={(val) => setFormData({ ...formData, doctor_rating: val })}
            />
          </div>

          <Separator />

          {/* Recovery Questions Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">Recovery Questions</h4>
            
            <YesNoQuestion
              label="Have you taken any pain medication since the procedure?"
              value={formData.took_pain_medication}
              onChange={(val) => setFormData({ ...formData, took_pain_medication: val })}
              detailsLabel="What medication did you take?"
              detailsValue={formData.pain_medication_details}
              onDetailsChange={(val) => setFormData({ ...formData, pain_medication_details: val })}
            />

            <YesNoQuestion
              label="Have you looked at your aspiration sites?"
              value={formData.checked_aspiration_sites}
              onChange={(val) => setFormData({ ...formData, checked_aspiration_sites: val })}
              detailsLabel="Please describe what you observed"
              detailsValue={formData.aspiration_sites_notes}
              onDetailsChange={(val) => setFormData({ ...formData, aspiration_sites_notes: val })}
            />

            <YesNoQuestion
              label="Do you see any signs of infection (redness, swelling, discharge)?"
              value={formData.signs_of_infection}
              onChange={(val) => setFormData({ ...formData, signs_of_infection: val })}
              detailsLabel="Please describe the signs"
              detailsValue={formData.infection_details}
              onDetailsChange={(val) => setFormData({ ...formData, infection_details: val })}
            />

            <YesNoQuestion
              label="Are you experiencing any unusual symptoms?"
              value={formData.unusual_symptoms}
              onChange={(val) => setFormData({ ...formData, unusual_symptoms: val })}
              detailsLabel="Please describe the symptoms"
              detailsValue={formData.symptoms_details}
              onDetailsChange={(val) => setFormData({ ...formData, symptoms_details: val })}
            />
          </div>

          <Separator />

          {/* Donation Intent Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">Future Donation</h4>
            <div className="space-y-2">
              <Label className="text-sm">Would you be willing to donate again?</Label>
              <RadioGroup
                value={formData.would_donate_again}
                onValueChange={(value) => setFormData({ ...formData, would_donate_again: value })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="donate-yes" />
                  <Label htmlFor="donate-yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="donate-no" />
                  <Label htmlFor="donate-no" className="font-normal">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="maybe" id="donate-maybe" />
                  <Label htmlFor="donate-maybe" className="font-normal">Maybe</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Separator />

          {/* Additional Feedback */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">Additional Feedback</h4>
            <div className="space-y-2">
              <Label htmlFor="procedure_feedback">Procedure Feedback</Label>
              <Textarea
                id="procedure_feedback"
                value={formData.procedure_feedback}
                onChange={(e) => setFormData({ ...formData, procedure_feedback: e.target.value })}
                placeholder="Any feedback about the procedure..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes from the call..."
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
