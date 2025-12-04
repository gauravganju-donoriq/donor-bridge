import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EligibilityTabProps {
  formData: {
    eligibility_status: string;
    ineligibility_reason: string;
    social_security: string;
  };
  updateField: (field: string, value: string) => void;
}

const INELIGIBILITY_REASONS = [
  "N/A",
  "Age",
  "BMI",
  "Medical History",
  "Travel History",
  "Other",
];

export const EligibilityTab = ({ formData, updateField }: EligibilityTabProps) => {
  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  const handleSSNChange = (value: string) => {
    const formatted = formatSSN(value);
    updateField("social_security", formatted);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Eligibility Status</Label>
          <Select
            value={formData.eligibility_status}
            onValueChange={(value) => updateField("eligibility_status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eligible">Eligible</SelectItem>
              <SelectItem value="ineligible">Ineligible</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Ineligibility Reason</Label>
          <Select
            value={formData.ineligibility_reason}
            onValueChange={(value) => updateField("ineligibility_reason", value)}
            disabled={formData.eligibility_status !== "ineligible"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INELIGIBILITY_REASONS.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Sensitive Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="social_security">Social Security Number</Label>
            <Input
              id="social_security"
              type="text"
              value={formData.social_security}
              onChange={(e) => handleSSNChange(e.target.value)}
              placeholder="XXX-XX-XXXX"
              maxLength={11}
            />
            <p className="text-xs text-muted-foreground">
              This information is encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
