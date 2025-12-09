import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Link2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DonorSearchSelect from "./DonorSearchSelect";
import { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"webform_submissions">;

interface LinkToDonorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
  onSuccess: () => void;
}

interface FieldOption {
  key: string;
  label: string;
  submissionValue: string | null;
  donorField: string;
}

const LinkToDonorDialog = ({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: LinkToDonorDialogProps) => {
  const [selectedDonorId, setSelectedDonorId] = useState<string>("");
  const [selectedDonor, setSelectedDonor] = useState<Tables<"donors"> | null>(null);
  const [fieldsToUpdate, setFieldsToUpdate] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

  // Fetch donor details when selected
  const handleDonorSelect = async (donorId: string) => {
    setSelectedDonorId(donorId);
    setFieldsToUpdate([]);
    
    if (donorId) {
      const { data } = await supabase
        .from("donors")
        .select("*")
        .eq("id", donorId)
        .single();
      
      setSelectedDonor(data);
    } else {
      setSelectedDonor(null);
    }
  };

  // Get fields that can be updated from submission
  const getUpdateableFields = (): FieldOption[] => {
    if (!submission || !selectedDonor) return [];

    const fields: FieldOption[] = [];

    if (submission.phone && submission.phone !== selectedDonor.cell_phone) {
      fields.push({
        key: "phone",
        label: "Phone",
        submissionValue: submission.phone,
        donorField: "cell_phone",
      });
    }

    if (submission.email && submission.email !== selectedDonor.email) {
      fields.push({
        key: "email",
        label: "Email",
        submissionValue: submission.email,
        donorField: "email",
      });
    }

    if (submission.street_address && submission.street_address !== selectedDonor.address_line_1) {
      fields.push({
        key: "address",
        label: "Address",
        submissionValue: `${submission.street_address}${submission.address_line_2 ? `, ${submission.address_line_2}` : ""}, ${submission.city}, ${submission.state} ${submission.zip_code}`,
        donorField: "address_line_1",
      });
    }

    return fields;
  };

  const handleLink = async () => {
    if (!submission || !selectedDonorId) return;

    setIsLinking(true);

    try {
      // Update submission to linked status
      const { error: linkError } = await supabase
        .from("webform_submissions")
        .update({
          status: "linked_to_donor",
          linked_donor_id: selectedDonorId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (linkError) throw linkError;

      // Update donor fields if any selected
      if (fieldsToUpdate.length > 0 && selectedDonor) {
        const updateData: Record<string, unknown> = {};

        if (fieldsToUpdate.includes("phone")) {
          updateData.cell_phone = submission.phone;
        }
        if (fieldsToUpdate.includes("email")) {
          updateData.email = submission.email;
        }
        if (fieldsToUpdate.includes("address")) {
          updateData.address_line_1 = submission.street_address;
          updateData.address_line_2 = submission.address_line_2;
          updateData.city = submission.city;
          updateData.state = submission.state;
          updateData.postal_code = submission.zip_code;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from("donors")
            .update(updateData)
            .eq("id", selectedDonorId);

          if (updateError) throw updateError;
        }
      }

      toast({
        title: "Submission Linked",
        description: `Successfully linked to donor ${selectedDonor?.donor_id || ""}`,
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset state
      setSelectedDonorId("");
      setSelectedDonor(null);
      setFieldsToUpdate([]);
    } catch (error) {
      console.error("Link error:", error);
      toast({
        title: "Error",
        description: "Failed to link submission to donor.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const updateableFields = getUpdateableFields();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link to Existing Donor
          </DialogTitle>
          <DialogDescription>
            Link this submission to an existing donor record. You can optionally update the donor's information with data from this submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Submission Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">Submission</p>
            <p className="text-sm text-muted-foreground">
              {submission?.first_name} {submission?.last_name} ({submission?.submission_id})
            </p>
          </div>

          {/* Donor Search */}
          <div className="space-y-2">
            <Label>Select Donor to Link</Label>
            <DonorSearchSelect
              value={selectedDonorId}
              onChange={handleDonorSelect}
              placeholder="Search for a donor..."
            />
          </div>

          {/* Selected Donor Info */}
          {selectedDonor && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <p className="text-sm font-medium">Selected Donor</p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>ID:</strong> {selectedDonor.donor_id}</p>
                <p><strong>Name:</strong> {selectedDonor.first_name} {selectedDonor.last_name}</p>
                <p><strong>DOB:</strong> {selectedDonor.birth_date}</p>
                {selectedDonor.cell_phone && <p><strong>Phone:</strong> {selectedDonor.cell_phone}</p>}
                {selectedDonor.email && <p><strong>Email:</strong> {selectedDonor.email}</p>}
              </div>
            </div>
          )}

          {/* Fields to Update */}
          {updateableFields.length > 0 && (
            <div className="space-y-3">
              <Label>Update donor with new information?</Label>
              <p className="text-sm text-muted-foreground">
                The submission contains updated information. Select which fields to update:
              </p>
              <div className="space-y-2">
                {updateableFields.map((field) => (
                  <div key={field.key} className="flex items-start gap-2">
                    <Checkbox
                      id={field.key}
                      checked={fieldsToUpdate.includes(field.key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFieldsToUpdate([...fieldsToUpdate, field.key]);
                        } else {
                          setFieldsToUpdate(fieldsToUpdate.filter((f) => f !== field.key));
                        }
                      }}
                    />
                    <label htmlFor={field.key} className="text-sm cursor-pointer">
                      <span className="font-medium">{field.label}:</span>{" "}
                      <span className="text-muted-foreground">{field.submissionValue}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLinking}>
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={!selectedDonorId || isLinking}>
            {isLinking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Link to Donor
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkToDonorDialog;
