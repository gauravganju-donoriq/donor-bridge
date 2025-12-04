import { useState, useMemo, useEffect } from "react";
import { Loader2, User, Phone, Activity, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import type { Tables } from "@/integrations/supabase/types";

type Donor = Tables<"donors">;

interface EditDonorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  donor: Donor | null;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

const formatSSN = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 9)}`;
};

const Section = ({ 
  icon: Icon, 
  title, 
  children, 
  alternate = false 
}: { 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
  alternate?: boolean;
}) => (
  <div className={`px-6 py-5 ${alternate ? 'bg-muted/40' : ''}`}>
    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border/50">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

const EditDonorDrawer = ({ open, onOpenChange, onSuccess, donor }: EditDonorDrawerProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

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

  // Populate form when donor changes
  useEffect(() => {
    if (donor) {
      setFormData({
        first_name: donor.first_name || "",
        last_name: donor.last_name || "",
        middle_initial: donor.middle_initial || "",
        chosen_name: donor.chosen_name || "",
        birth_date: donor.birth_date || "",
        eligibility_status: donor.eligibility_status || "eligible",
        ineligibility_reason: donor.ineligibility_reason || "N/A",
        assigned_sex: donor.assigned_sex || "",
        ethnicity: donor.ethnicity || "No Answer",
        pronouns: donor.pronouns || "",
        height_inches: donor.height_inches?.toString() || "",
        weight_pounds: donor.weight_pounds?.toString() || "",
        cell_phone: donor.cell_phone || "",
        home_phone: donor.home_phone || "",
        work_phone: donor.work_phone || "",
        email: donor.email || "",
        address_line_1: donor.address_line_1 || "",
        address_line_2: donor.address_line_2 || "",
        city: donor.city || "",
        state: donor.state || "",
        postal_code: donor.postal_code || "",
        alcohol_use: donor.alcohol_use === true ? "yes" : donor.alcohol_use === false ? "no" : "",
        tobacco_use: donor.tobacco_use === true ? "yes" : donor.tobacco_use === false ? "no" : "",
        cmv_positive: donor.cmv_positive || "",
        social_security: donor.social_security_encrypted || "",
      });
      setIsDirty(false);
    }
  }, [donor]);

  const bmi = useMemo(() => {
    const height = parseFloat(formData.height_inches);
    const weight = parseFloat(formData.weight_pounds);
    if (height > 0 && weight > 0) {
      return ((weight * 703) / (height * height)).toFixed(1);
    }
    return "—";
  }, [formData.height_inches, formData.weight_pounds]);

  const age = useMemo(() => {
    if (!formData.birth_date) return null;
    const today = new Date();
    const birth = new Date(formData.birth_date);
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  }, [formData.birth_date]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleClose = (forceClose = false) => {
    if (isDirty && !forceClose) {
      setShowConfirmClose(true);
    } else {
      setIsDirty(false);
      onOpenChange(false);
    }
  };

  const canSubmit = formData.first_name && formData.last_name && formData.birth_date && formData.assigned_sex;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!donor || !canSubmit) {
      toast({
        title: "Missing required fields",
        description: "Please fill in First Name, Last Name, Date of Birth, and Assigned Sex.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("donors")
        .update({
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
          bmi: bmi !== "—" ? parseFloat(bmi) : null,
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
        })
        .eq("id", donor.id);

      if (error) throw error;

      toast({
        title: "Donor updated",
        description: `${formData.first_name} ${formData.last_name} has been updated.`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating donor:", error);
      toast({
        title: "Error",
        description: "Failed to update donor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getBmiStatus = () => {
    const bmiNum = parseFloat(bmi);
    if (isNaN(bmiNum)) return null;
    if (bmiNum < 18.5) return { label: "Underweight", color: "text-yellow-600" };
    if (bmiNum < 25) return { label: "Normal", color: "text-green-600" };
    if (bmiNum < 30) return { label: "Overweight", color: "text-yellow-600" };
    return { label: "Obese", color: "text-red-600" };
  };

  const bmiStatus = getBmiStatus();

  if (!donor) return null;

  return (
    <>
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen ? handleClose() : onOpenChange(true)}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-xl">Edit Donor</SheetTitle>
          <SheetDescription>
            {donor.donor_id} • {donor.first_name} {donor.last_name}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            
            {/* PERSONAL INFO */}
            <Section icon={User} title="Personal Information">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    value={formData.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    placeholder="John"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_last_name">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    value={formData.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_middle_initial">M.I.</Label>
                  <Input
                    id="edit_middle_initial"
                    value={formData.middle_initial}
                    onChange={(e) => updateField("middle_initial", e.target.value.slice(0, 1).toUpperCase())}
                    maxLength={1}
                    placeholder="A"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="edit_chosen_name">Chosen Name</Label>
                  <Input
                    id="edit_chosen_name"
                    value={formData.chosen_name}
                    onChange={(e) => updateField("chosen_name", e.target.value)}
                    placeholder="Preferred name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_birth_date">Date of Birth *</Label>
                  <div className="relative">
                    <Input
                      id="edit_birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => updateField("birth_date", e.target.value)}
                    />
                    {age !== null && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {age} yrs
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Assigned Sex *</Label>
                  <Select value={formData.assigned_sex} onValueChange={(v) => updateField("assigned_sex", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Ethnicity</Label>
                  <Select value={formData.ethnicity} onValueChange={(v) => updateField("ethnicity", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No Answer">No Answer</SelectItem>
                      <SelectItem value="Hispanic or Latino">Hispanic or Latino</SelectItem>
                      <SelectItem value="Not Hispanic or Latino">Not Hispanic or Latino</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_pronouns">Pronouns</Label>
                  <Input
                    id="edit_pronouns"
                    value={formData.pronouns}
                    onChange={(e) => updateField("pronouns", e.target.value)}
                    placeholder="e.g. he/him"
                  />
                </div>
              </div>
            </Section>

            {/* CONTACT INFO */}
            <Section icon={Phone} title="Contact Information" alternate>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_cell_phone">Cell Phone</Label>
                  <Input
                    id="edit_cell_phone"
                    value={formData.cell_phone}
                    onChange={(e) => updateField("cell_phone", formatPhoneNumber(e.target.value))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_home_phone">Home Phone</Label>
                  <Input
                    id="edit_home_phone"
                    value={formData.home_phone}
                    onChange={(e) => updateField("home_phone", formatPhoneNumber(e.target.value))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_work_phone">Work Phone</Label>
                  <Input
                    id="edit_work_phone"
                    value={formData.work_phone}
                    onChange={(e) => updateField("work_phone", formatPhoneNumber(e.target.value))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_address_line_1">Address</Label>
                <Input
                  id="edit_address_line_1"
                  value={formData.address_line_1}
                  onChange={(e) => updateField("address_line_1", e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <Input
                id="edit_address_line_2"
                value={formData.address_line_2}
                onChange={(e) => updateField("address_line_2", e.target.value)}
                placeholder="Apt, suite, unit, etc."
              />

              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="edit_city">City</Label>
                  <Input
                    id="edit_city"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Select value={formData.state} onValueChange={(v) => updateField("state", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="edit_postal_code">ZIP</Label>
                  <Input
                    id="edit_postal_code"
                    value={formData.postal_code}
                    onChange={(e) => updateField("postal_code", e.target.value.slice(0, 10))}
                    placeholder="12345"
                  />
                </div>
              </div>
            </Section>

            {/* PHYSICAL & MEDICAL */}
            <Section icon={Activity} title="Physical & Medical">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_height_inches">Height (in)</Label>
                  <Input
                    id="edit_height_inches"
                    type="number"
                    value={formData.height_inches}
                    onChange={(e) => updateField("height_inches", e.target.value)}
                    placeholder="66"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_weight_pounds">Weight (lbs)</Label>
                  <Input
                    id="edit_weight_pounds"
                    type="number"
                    value={formData.weight_pounds}
                    onChange={(e) => updateField("weight_pounds", e.target.value)}
                    placeholder="150"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>BMI</Label>
                  <div className="h-9 px-3 py-2 rounded-md border bg-muted/50 text-sm flex items-center gap-2">
                    <span>{bmi}</span>
                    {bmiStatus && (
                      <span className={`text-xs ${bmiStatus.color}`}>({bmiStatus.label})</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>CMV Status</Label>
                  <Select value={formData.cmv_positive} onValueChange={(v) => updateField("cmv_positive", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unknown" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Alcohol Use</Label>
                  <RadioGroup
                    value={formData.alcohol_use}
                    onValueChange={(v) => updateField("alcohol_use", v)}
                    className="flex gap-4 h-9 items-center"
                  >
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="yes" id="edit_alcohol_yes" />
                      <Label htmlFor="edit_alcohol_yes" className="font-normal text-sm">Yes</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="no" id="edit_alcohol_no" />
                      <Label htmlFor="edit_alcohol_no" className="font-normal text-sm">No</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-1.5">
                  <Label>Tobacco Use</Label>
                  <RadioGroup
                    value={formData.tobacco_use}
                    onValueChange={(v) => updateField("tobacco_use", v)}
                    className="flex gap-4 h-9 items-center"
                  >
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="yes" id="edit_tobacco_yes" />
                      <Label htmlFor="edit_tobacco_yes" className="font-normal text-sm">Yes</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="no" id="edit_tobacco_no" />
                      <Label htmlFor="edit_tobacco_no" className="font-normal text-sm">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </Section>

            {/* ELIGIBILITY */}
            <Section icon={Shield} title="Eligibility & Compliance" alternate>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Eligibility Status</Label>
                  <Select value={formData.eligibility_status} onValueChange={(v) => updateField("eligibility_status", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eligible">Eligible</SelectItem>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                      <SelectItem value="ineligible">Ineligible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Ineligibility Reason</Label>
                  <Select value={formData.ineligibility_reason} onValueChange={(v) => updateField("ineligibility_reason", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">N/A</SelectItem>
                      <SelectItem value="Medical Condition">Medical Condition</SelectItem>
                      <SelectItem value="Age Requirement">Age Requirement</SelectItem>
                      <SelectItem value="BMI Out of Range">BMI Out of Range</SelectItem>
                      <SelectItem value="Failed Screening">Failed Screening</SelectItem>
                      <SelectItem value="Withdrew">Withdrew</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_social_security">Social Security Number</Label>
                <Input
                  id="edit_social_security"
                  value={formData.social_security}
                  onChange={(e) => updateField("social_security", formatSSN(e.target.value))}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                />
              </div>
            </Section>

          </div>

          <SheetFooter className="px-6 py-4 border-t bg-muted/30 flex-row gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose()} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !canSubmit} className="flex-1 sm:flex-none">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to close without saving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Editing</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleClose(true)}>
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default EditDonorDrawer;
