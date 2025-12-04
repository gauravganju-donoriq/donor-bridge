import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AddDonorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ETHNICITY_OPTIONS = [
  "No Answer",
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "Two or More Races",
  "Other",
];

const PRONOUNS_OPTIONS = [
  "He/Him",
  "She/Her",
  "They/Them",
  "Other",
];

const INELIGIBILITY_REASONS = [
  "N/A",
  "Age",
  "BMI",
  "Medical History",
  "Travel History",
  "Other",
];

const AddDonorDialog = ({ open, onOpenChange, onSuccess }: AddDonorDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_initial: "",
    chosen_name: "",
    birth_date: "",
    eligibility_status: "eligible",
    ineligibility_reason: "N/A",
    assigned_sex: "",
    ethnicity: "No Answer",
    pronouns: "",
    height_inches: "",
    weight_pounds: "",
    cell_phone: "",
    home_phone: "",
    work_phone: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    alcohol_use: "",
    tobacco_use: "",
    cmv_positive: "",
    social_security: "",
  });

  const bmi = useMemo(() => {
    const height = parseFloat(formData.height_inches);
    const weight = parseFloat(formData.weight_pounds);
    if (height > 0 && weight > 0) {
      // BMI = (weight in pounds * 703) / (height in inches)^2
      return ((weight * 703) / (height * height)).toFixed(1);
    }
    return "NaN";
  }, [formData.height_inches, formData.weight_pounds]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      middle_initial: "",
      chosen_name: "",
      birth_date: "",
      eligibility_status: "eligible",
      ineligibility_reason: "N/A",
      assigned_sex: "",
      ethnicity: "No Answer",
      pronouns: "",
      height_inches: "",
      weight_pounds: "",
      cell_phone: "",
      home_phone: "",
      work_phone: "",
      email: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      alcohol_use: "",
      tobacco_use: "",
      cmv_positive: "",
      social_security: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.birth_date || !formData.assigned_sex) {
      toast({
        title: "Missing required fields",
        description: "Please fill in First Name, Last Name, Date of Birth, and Assigned Sex.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("donors")
        .insert([{
          donor_id: "TEMP", // Will be overwritten by trigger
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_initial: formData.middle_initial || null,
          chosen_name: formData.chosen_name || null,
          birth_date: formData.birth_date,
          assigned_sex: formData.assigned_sex as "male" | "female",
          eligibility_status: formData.eligibility_status as "eligible" | "ineligible" | "pending_review",
          ineligibility_reason: formData.ineligibility_reason !== "N/A" ? formData.ineligibility_reason : null,
          ethnicity: formData.ethnicity !== "No Answer" ? formData.ethnicity : null,
          pronouns: formData.pronouns || null,
          height_inches: formData.height_inches ? parseInt(formData.height_inches) : null,
          weight_pounds: formData.weight_pounds ? parseInt(formData.weight_pounds) : null,
          bmi: bmi !== "NaN" ? parseFloat(bmi) : null,
          cell_phone: formData.cell_phone || null,
          home_phone: formData.home_phone || null,
          work_phone: formData.work_phone || null,
          email: formData.email || null,
          address_line_1: formData.address_line_1 || null,
          address_line_2: formData.address_line_2 || null,
          city: formData.city || null,
          state: formData.state || null,
          postal_code: formData.postal_code || null,
          alcohol_use: formData.alcohol_use === "yes" ? true : formData.alcohol_use === "no" ? false : null,
          tobacco_use: formData.tobacco_use === "yes" ? true : formData.tobacco_use === "no" ? false : null,
          cmv_positive: formData.cmv_positive || "unknown",
          social_security_encrypted: formData.social_security || null,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Donor created",
        description: `${data.first_name} ${data.last_name} has been added with ID ${data.donor_id}.`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating donor:", error);
      toast({
        title: "Error",
        description: "Failed to create donor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Donor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: First Name, Last Name, Middle Initial, Chosen Name */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Donor's first name is required</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Donor's last name is required</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="middle_initial">Middle Initial</Label>
              <Input
                id="middle_initial"
                value={formData.middle_initial}
                onChange={(e) => updateField("middle_initial", e.target.value)}
                maxLength={1}
                className="w-16"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chosen_name">Chosen Name</Label>
              <Input
                id="chosen_name"
                value={formData.chosen_name}
                onChange={(e) => updateField("chosen_name", e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Birth Date, Eligibility, Ineligibility Reason */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => updateField("birth_date", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Donor must be no younger than 18 and no older than 45</p>
            </div>
            <div className="space-y-2">
              <Label>Eligibility</Label>
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
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INELIGIBILITY_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Donor ID (readonly), Assigned Sex, Ethnicity, Pronouns */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Donor ID</Label>
              <Input
                value=""
                disabled
                placeholder="Auto-generated"
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Sex at Birth</Label>
              <RadioGroup
                value={formData.assigned_sex}
                onValueChange={(value) => updateField("assigned_sex", value)}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="font-normal">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="font-normal">Female</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Ethnicity</Label>
              <Select
                value={formData.ethnicity}
                onValueChange={(value) => updateField("ethnicity", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ETHNICITY_OPTIONS.map((eth) => (
                    <SelectItem key={eth} value={eth}>{eth}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pronouns</Label>
              <Select
                value={formData.pronouns}
                onValueChange={(value) => updateField("pronouns", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PRONOUNS_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Height, Weight, BMI */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height_inches">Height</Label>
              <Input
                id="height_inches"
                type="number"
                value={formData.height_inches}
                onChange={(e) => updateField("height_inches", e.target.value)}
                placeholder=""
              />
              <p className="text-xs text-muted-foreground">In inches</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_pounds">Weight</Label>
              <Input
                id="weight_pounds"
                type="number"
                value={formData.weight_pounds}
                onChange={(e) => updateField("weight_pounds", e.target.value)}
                placeholder=""
              />
              <p className="text-xs text-muted-foreground">In pounds</p>
            </div>
            <div className="space-y-2">
              <Label>BMI</Label>
              <div className="text-2xl font-semibold pt-2">{bmi}</div>
            </div>
          </div>

          {/* Row 5: Phone numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cell_phone">Cell Phone</Label>
              <Input
                id="cell_phone"
                type="tel"
                value={formData.cell_phone}
                onChange={(e) => updateField("cell_phone", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Hint: Your active phone number.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_phone">Home Phone</Label>
              <Input
                id="home_phone"
                type="tel"
                value={formData.home_phone}
                onChange={(e) => updateField("home_phone", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Hint: Your home phone number.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="work_phone">Work Phone</Label>
              <Input
                id="work_phone"
                type="tel"
                value={formData.work_phone}
                onChange={(e) => updateField("work_phone", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Hint: Your work phone number.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
          </div>

          {/* Row 6: Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address_line_1">Address Line 1</Label>
              <Input
                id="address_line_1"
                value={formData.address_line_1}
                onChange={(e) => updateField("address_line_1", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line_2">Address Line 2</Label>
              <Input
                id="address_line_2"
                value={formData.address_line_2}
                onChange={(e) => updateField("address_line_2", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => updateField("postal_code", e.target.value)}
              />
            </div>
          </div>

          {/* Row 7: Alcohol Use, Tobacco Use, CMV, Social Security */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Alcohol Use</Label>
              <RadioGroup
                value={formData.alcohol_use}
                onValueChange={(value) => updateField("alcohol_use", value)}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="alcohol_yes" />
                  <Label htmlFor="alcohol_yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="alcohol_no" />
                  <Label htmlFor="alcohol_no" className="font-normal">No</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Tobacco Use</Label>
              <RadioGroup
                value={formData.tobacco_use}
                onValueChange={(value) => updateField("tobacco_use", value)}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="tobacco_yes" />
                  <Label htmlFor="tobacco_yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="tobacco_no" />
                  <Label htmlFor="tobacco_no" className="font-normal">No</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Is CMV Positive</Label>
              <Select
                value={formData.cmv_positive}
                onValueChange={(value) => updateField("cmv_positive", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_security">Social Security</Label>
              <Input
                id="social_security"
                value={formData.social_security}
                onChange={(e) => updateField("social_security", e.target.value)}
                placeholder="XXX-XX-XXXX"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Donor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDonorDialog;
