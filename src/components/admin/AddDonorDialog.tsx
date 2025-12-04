import { useState, useMemo } from "react";
import { Loader2, User, Phone, Activity, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PersonalInfoTab } from "./add-donor/PersonalInfoTab";
import { ContactInfoTab } from "./add-donor/ContactInfoTab";
import { PhysicalMedicalTab } from "./add-donor/PhysicalMedicalTab";
import { EligibilityTab } from "./add-donor/EligibilityTab";

interface AddDonorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddDonorDialog = ({ open, onOpenChange, onSuccess }: AddDonorDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

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
    setActiveTab("personal");
  };

  // Check if required fields in each tab are filled
  const isPersonalComplete = formData.first_name && formData.last_name && formData.birth_date && formData.assigned_sex;
  const isContactComplete = true; // No required fields
  const isPhysicalComplete = true; // No required fields
  const isEligibilityComplete = true; // Has defaults

  const canSubmit = isPersonalComplete;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.birth_date || !formData.assigned_sex) {
      toast({
        title: "Missing required fields",
        description: "Please fill in First Name, Last Name, Date of Birth, and Assigned Sex.",
        variant: "destructive",
      });
      setActiveTab("personal");
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

  const TabIndicator = ({ isComplete }: { isComplete: boolean }) => (
    isComplete ? (
      <Check className="h-3 w-3 text-green-500" />
    ) : null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Donor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Personal</span>
                <TabIndicator isComplete={!!isPersonalComplete} />
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Contact</span>
                <TabIndicator isComplete={isContactComplete} />
              </TabsTrigger>
              <TabsTrigger value="physical" className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Physical</span>
                <TabIndicator isComplete={isPhysicalComplete} />
              </TabsTrigger>
              <TabsTrigger value="eligibility" className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Eligibility</span>
                <TabIndicator isComplete={isEligibilityComplete} />
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-1">
              <TabsContent value="personal" className="mt-0">
                <PersonalInfoTab
                  formData={formData}
                  updateField={updateField}
                  age={age}
                />
              </TabsContent>

              <TabsContent value="contact" className="mt-0">
                <ContactInfoTab
                  formData={formData}
                  updateField={updateField}
                />
              </TabsContent>

              <TabsContent value="physical" className="mt-0">
                <PhysicalMedicalTab
                  formData={formData}
                  updateField={updateField}
                  bmi={bmi}
                />
              </TabsContent>

              <TabsContent value="eligibility" className="mt-0">
                <EligibilityTab
                  formData={formData}
                  updateField={updateField}
                />
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !canSubmit}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Donor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDonorDialog;
