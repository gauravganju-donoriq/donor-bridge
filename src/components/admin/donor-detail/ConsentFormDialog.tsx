import { useState, useRef } from "react";
import { format } from "date-fns";
import { Loader2, FileSignature } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import SignaturePad, { SignaturePadRef } from "./SignaturePad";

interface ConsentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorId: string;
  donorName: string;
  onSuccess: () => void;
}

const CONSENT_FORMS = {
  consent_hiv: {
    title: "HIV Testing Consent Form",
    content: `I, the undersigned, hereby consent to the collection of my blood sample for HIV testing as part of the donor screening process.

I understand that:
• The HIV test will be performed on my blood sample
• The results will be kept confidential and only shared with authorized medical personnel
• A positive test result may disqualify me from donating
• I will be notified of my test results
• I have the right to ask questions about the testing process

I acknowledge that I have been informed about the nature and purpose of HIV testing, and I voluntarily consent to this procedure.`,
  },
  consent_bone_marrow: {
    title: "Bone Marrow Donation Consent Form",
    content: `I, the undersigned, hereby consent to bone marrow aspiration for research and/or clinical purposes.

I understand that:
• The procedure involves inserting a needle into the hip bone to collect bone marrow
• Local anesthesia will be administered to minimize discomfort
• Common side effects include soreness at the aspiration site for several days
• Rare risks include infection, bleeding, and nerve damage
• I may withdraw my consent at any time before the procedure
• My donated bone marrow will be used for approved research or clinical purposes

I acknowledge that I have been fully informed about the bone marrow donation procedure, including its risks and benefits. I have had the opportunity to ask questions and have received satisfactory answers.

I voluntarily consent to this procedure and understand that I will receive compensation as outlined in my donor agreement.`,
  },
};

const ConsentFormDialog = ({
  open,
  onOpenChange,
  donorId,
  donorName,
  onSuccess,
}: ConsentFormDialogProps) => {
  const { user } = useAuth();
  const signatureRef = useRef<SignaturePadRef>(null);
  
  const [formType, setFormType] = useState<keyof typeof CONSENT_FORMS>("consent_hiv");
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedForm = CONSENT_FORMS[formType];
  const currentDate = format(new Date(), "MMMM d, yyyy");

  const handleSubmit = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Please provide your signature");
      return;
    }

    if (!acknowledged) {
      toast.error("Please acknowledge that you have read and understood the form");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setSaving(true);

    try {
      const signatureDataURL = signatureRef.current.getSignatureDataURL();
      if (!signatureDataURL) {
        throw new Error("Failed to capture signature");
      }

      // Create the consent form document as HTML
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${selectedForm.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { text-align: center; color: #333; }
    .content { white-space: pre-wrap; line-height: 1.6; margin: 30px 0; }
    .signature-section { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 30px; }
    .signature-line { display: flex; justify-content: space-between; margin-top: 30px; }
    .signature-block { text-align: center; }
    .signature-block img { max-width: 300px; height: 100px; object-fit: contain; }
    .signature-block p { margin: 5px 0; border-top: 1px solid #333; padding-top: 5px; }
    .date { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>${selectedForm.title}</h1>
  <div class="content">${selectedForm.content}</div>
  <div class="signature-section">
    <p><strong>Donor Name:</strong> ${donorName}</p>
    <p class="date"><strong>Date:</strong> ${currentDate}</p>
    <div class="signature-line">
      <div class="signature-block">
        <img src="${signatureDataURL}" alt="Donor Signature" />
        <p>Donor Signature</p>
      </div>
    </div>
  </div>
</body>
</html>`;

      // Convert HTML to Blob
      const blob = new Blob([htmlContent], { type: "text/html" });
      const fileName = `${donorId}/${Date.now()}_${formType}_signed.html`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("donor-documents")
        .upload(fileName, blob, {
          contentType: "text/html",
        });

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase.from("donor_documents").insert({
        donor_id: donorId,
        file_name: `${selectedForm.title} - Signed ${currentDate}.html`,
        file_path: fileName,
        file_size: blob.size,
        file_type: "text/html",
        document_type: formType,
        description: `Electronically signed on ${currentDate}`,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast.success("Consent form signed and saved successfully");
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Error saving consent form:", error);
      toast.error(error.message || "Failed to save consent form");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setAcknowledged(false);
    signatureRef.current?.clear();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Electronic Consent Form
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Consent Form Type</Label>
            <Select
              value={formType}
              onValueChange={(v) => setFormType(v as keyof typeof CONSENT_FORMS)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consent_hiv">HIV Testing Consent</SelectItem>
                <SelectItem value="consent_bone_marrow">Bone Marrow Donation Consent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{selectedForm.title}</h3>
              <span className="text-sm text-muted-foreground">{currentDate}</span>
            </div>
            <ScrollArea className="h-[200px] border rounded-lg p-4 bg-muted/30">
              <p className="whitespace-pre-wrap text-sm">{selectedForm.content}</p>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <p className="text-sm">
              <strong>Donor Name:</strong> {donorName}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Signature</Label>
            <SignaturePad ref={signatureRef} width={540} height={120} />
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
            />
            <label
              htmlFor="acknowledge"
              className="text-sm leading-tight cursor-pointer"
            >
              I have read and understood the above consent form. I confirm that the
              information provided is accurate and I voluntarily provide my electronic
              signature.
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !acknowledged}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileSignature className="h-4 w-4 mr-1" />
            )}
            Sign & Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsentFormDialog;
