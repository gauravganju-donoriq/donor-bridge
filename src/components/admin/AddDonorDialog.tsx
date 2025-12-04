import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AddDonorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddDonorDialog = ({ open, onOpenChange, onSuccess }: AddDonorDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_initial: "",
    birth_date: "",
    assigned_sex: "",
    email: "",
    cell_phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    ethnicity: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      middle_initial: "",
      birth_date: "",
      assigned_sex: "",
      email: "",
      cell_phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      ethnicity: "",
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
          birth_date: formData.birth_date,
          assigned_sex: formData.assigned_sex as "male" | "female",
          email: formData.email || null,
          cell_phone: formData.cell_phone || null,
          address_line_1: formData.address_line_1 || null,
          address_line_2: formData.address_line_2 || null,
          city: formData.city || null,
          state: formData.state || null,
          postal_code: formData.postal_code || null,
          ethnicity: formData.ethnicity || null,
          eligibility_status: "pending_review" as const,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Donor</DialogTitle>
          <DialogDescription>
            Create a new donor record. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middle_initial">M.I.</Label>
                <Input
                  id="middle_initial"
                  value={formData.middle_initial}
                  onChange={(e) => updateField("middle_initial", e.target.value)}
                  placeholder="A"
                  maxLength={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date of Birth *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => updateField("birth_date", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_sex">Assigned Sex *</Label>
                <Select
                  value={formData.assigned_sex}
                  onValueChange={(value) => updateField("assigned_sex", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ethnicity">Ethnicity</Label>
              <Input
                id="ethnicity"
                value={formData.ethnicity}
                onChange={(e) => updateField("ethnicity", e.target.value)}
                placeholder="e.g., Caucasian, Hispanic"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cell_phone">Cell Phone</Label>
                <Input
                  id="cell_phone"
                  type="tel"
                  value={formData.cell_phone}
                  onChange={(e) => updateField("cell_phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Address</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address_line_1">Address Line 1</Label>
                <Input
                  id="address_line_1"
                  value={formData.address_line_1}
                  onChange={(e) => updateField("address_line_1", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_line_2">Address Line 2</Label>
                <Input
                  id="address_line_2"
                  value={formData.address_line_2}
                  onChange={(e) => updateField("address_line_2", e.target.value)}
                  placeholder="Apt 4B"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Houston"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="TX"
                  />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => updateField("postal_code", e.target.value)}
                    placeholder="77001"
                  />
                </div>
              </div>
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
