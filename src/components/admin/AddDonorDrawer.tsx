import { useState, useMemo } from "react";
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
import { useAuth } from "@/hooks/useAuth";

interface AddDonorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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

const AddDonorDrawer = ({ open, onOpenChange, onSuccess }: AddDonorDrawerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const validateField = (field: string, value: string) => {
    let error = "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    const zipRegex = /^\d{5}(-\d{4})?$/;
    const phoneFields = ["cell_phone", "home_phone", "work_phone"];
    
    if (field === "first_name" && !value.trim()) {
      error = "First name is required";
    } else if (field === "last_name" && !value.trim()) {
      error = "Last name is required";
    } else if (field === "birth_date") {
      if (!value) {
        error = "Date of birth is required";
      } else {
        const today = new Date();
        const birth = new Date(value);
        let calculatedAge = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge < 18) {
          error = "Donor must be at least 18 years old";
        }
      }
    } else if (field === "assigned_sex" && !value) {
      error = "Assigned sex is required";
    } else if (field === "email" && value && !emailRegex.test(value)) {
      error = "Please enter a valid email address";
    } else if (phoneFields.includes(field) && value && !phoneRegex.test(value)) {
      error = "Format: (555) 123-4567";
    } else if (field === "postal_code" && value && !zipRegex.test(value)) {
      error = "Format: 12345 or 12345-6789";
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!formData.birth_date) {
      newErrors.birth_date = "Date of birth is required";
    } else {
      const today = new Date();
      const birth = new Date(formData.birth_date);
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge < 18) {
        newErrors.birth_date = "Donor must be at least 18 years old";
      }
    }
    if (!formData.assigned_sex) newErrors.assigned_sex = "Assigned sex is required";
    setErrors(newErrors);
    setTouched({ first_name: true, last_name: true, birth_date: true, assigned_sex: true });
    return Object.keys(newErrors).length === 0;
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
    setIsDirty(false);
    setErrors({});
    setTouched({});
  };

  const handleClose = (forceClose = false) => {
    if (isDirty && !forceClose) {
      setShowConfirmClose(true);
    } else {
      resetForm();
      onOpenChange(false);
    }
  };

  const canSubmit = formData.first_name && formData.last_name && formData.birth_date && formData.assigned_sex;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("donors")
        .insert([{
          donor_id: "TEMP",
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

  const getBmiStatus = () => {
    const bmiNum = parseFloat(bmi);
    if (isNaN(bmiNum)) return null;
    if (bmiNum < 18.5) return { label: "Underweight", color: "text-yellow-600" };
    if (bmiNum < 25) return { label: "Normal", color: "text-green-600" };
    if (bmiNum < 30) return { label: "Overweight", color: "text-yellow-600" };
    return { label: "Obese", color: "text-red-600" };
  };

  const bmiStatus = getBmiStatus();

  return (
    <>
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen ? handleClose() : onOpenChange(true)}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-xl">Add New Donor</SheetTitle>
          <SheetDescription>
            Required fields are marked with *
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            
            {/* PERSONAL INFO */}
            <Section icon={User} title="Personal Information">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    onBlur={() => handleBlur("first_name")}
                    placeholder="John"
                    autoFocus
                    className={touched.first_name && errors.first_name ? "border-destructive" : ""}
                  />
                  {touched.first_name && errors.first_name && (
                    <p className="text-xs text-destructive">{errors.first_name}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    onBlur={() => handleBlur("last_name")}
                    placeholder="Doe"
                    className={touched.last_name && errors.last_name ? "border-destructive" : ""}
                  />
                  {touched.last_name && errors.last_name && (
                    <p className="text-xs text-destructive">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="middle_initial">M.I.</Label>
                  <Input
                    id="middle_initial"
                    value={formData.middle_initial}
                    onChange={(e) => updateField("middle_initial", e.target.value.slice(0, 1).toUpperCase())}
                    maxLength={1}
                    placeholder="A"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="chosen_name">Chosen Name</Label>
                  <Input
                    id="chosen_name"
                    value={formData.chosen_name}
                    onChange={(e) => updateField("chosen_name", e.target.value)}
                    placeholder="Preferred name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="birth_date">Date of Birth *</Label>
                  <div className="relative">
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => updateField("birth_date", e.target.value)}
                      onBlur={() => handleBlur("birth_date")}
                      className={touched.birth_date && errors.birth_date ? "border-destructive" : ""}
                    />
                    {age !== null && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {age} yrs
                      </span>
                    )}
                  </div>
                  {touched.birth_date && errors.birth_date && (
                    <p className="text-xs text-destructive">{errors.birth_date}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Assigned Sex *</Label>
                  <Select value={formData.assigned_sex} onValueChange={(v) => { updateField("assigned_sex", v); setTouched((prev) => ({ ...prev, assigned_sex: true })); }}>
                    <SelectTrigger className={touched.assigned_sex && errors.assigned_sex ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {touched.assigned_sex && errors.assigned_sex && (
                    <p className="text-xs text-destructive">{errors.assigned_sex}</p>
                  )}
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
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Input
                    id="pronouns"
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
                  <Label htmlFor="cell_phone">Cell Phone</Label>
                  <Input
                    id="cell_phone"
                    value={formData.cell_phone}
                    onChange={(e) => updateField("cell_phone", formatPhoneNumber(e.target.value))}
                    onBlur={() => handleBlur("cell_phone")}
                    placeholder="(555) 123-4567"
                    className={touched.cell_phone && errors.cell_phone ? "border-destructive" : ""}
                  />
                  {touched.cell_phone && errors.cell_phone && (
                    <p className="text-xs text-destructive">{errors.cell_phone}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    placeholder="john@example.com"
                    className={touched.email && errors.email ? "border-destructive" : ""}
                  />
                  {touched.email && errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="home_phone">Home Phone</Label>
                  <Input
                    id="home_phone"
                    value={formData.home_phone}
                    onChange={(e) => updateField("home_phone", formatPhoneNumber(e.target.value))}
                    onBlur={() => handleBlur("home_phone")}
                    placeholder="(555) 123-4567"
                    className={touched.home_phone && errors.home_phone ? "border-destructive" : ""}
                  />
                  {touched.home_phone && errors.home_phone && (
                    <p className="text-xs text-destructive">{errors.home_phone}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="work_phone">Work Phone</Label>
                  <Input
                    id="work_phone"
                    value={formData.work_phone}
                    onChange={(e) => updateField("work_phone", formatPhoneNumber(e.target.value))}
                    onBlur={() => handleBlur("work_phone")}
                    placeholder="(555) 123-4567"
                    className={touched.work_phone && errors.work_phone ? "border-destructive" : ""}
                  />
                  {touched.work_phone && errors.work_phone && (
                    <p className="text-xs text-destructive">{errors.work_phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address_line_1">Address</Label>
                <Input
                  id="address_line_1"
                  value={formData.address_line_1}
                  onChange={(e) => updateField("address_line_1", e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <Input
                id="address_line_2"
                value={formData.address_line_2}
                onChange={(e) => updateField("address_line_2", e.target.value)}
                placeholder="Apt, suite, unit, etc."
              />

              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
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
                  <Label htmlFor="postal_code">ZIP</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => updateField("postal_code", e.target.value.slice(0, 10))}
                    onBlur={() => handleBlur("postal_code")}
                    placeholder="12345"
                    className={touched.postal_code && errors.postal_code ? "border-destructive" : ""}
                  />
                  {touched.postal_code && errors.postal_code && (
                    <p className="text-xs text-destructive">{errors.postal_code}</p>
                  )}
                </div>
              </div>
            </Section>

            {/* PHYSICAL & MEDICAL */}
            <Section icon={Activity} title="Physical & Medical">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="height_inches">Height (in)</Label>
                  <Input
                    id="height_inches"
                    type="number"
                    value={formData.height_inches}
                    onChange={(e) => updateField("height_inches", e.target.value)}
                    placeholder="66"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight_pounds">Weight (lbs)</Label>
                  <Input
                    id="weight_pounds"
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
                      <RadioGroupItem value="yes" id="alcohol_yes" />
                      <Label htmlFor="alcohol_yes" className="font-normal text-sm">Yes</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="no" id="alcohol_no" />
                      <Label htmlFor="alcohol_no" className="font-normal text-sm">No</Label>
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
                      <RadioGroupItem value="yes" id="tobacco_yes" />
                      <Label htmlFor="tobacco_yes" className="font-normal text-sm">Yes</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="no" id="tobacco_no" />
                      <Label htmlFor="tobacco_no" className="font-normal text-sm">No</Label>
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
                <Label htmlFor="social_security">Social Security Number</Label>
                <Input
                  id="social_security"
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
            <Button type="button" variant="ghost" onClick={resetForm} disabled={!isDirty} className="flex-1 sm:flex-none">
              Reset Form
            </Button>
            <Button type="submit" disabled={saving || !canSubmit} className="flex-1 sm:flex-none">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Donor
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

export default AddDonorDrawer;
