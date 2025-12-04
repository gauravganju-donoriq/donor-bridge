import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Donor = Tables<"donors">;

interface DonorPersonalInfoProps {
  donor: Donor;
  formData: Partial<Donor>;
  setFormData: (data: Partial<Donor>) => void;
  editMode: boolean;
}

const DonorPersonalInfo = ({ donor, formData, setFormData, editMode }: DonorPersonalInfoProps) => {
  const updateField = (field: keyof Donor, value: unknown) => {
    setFormData({ ...formData, [field]: value });
  };

  const FieldDisplay = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="space-y-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );

  const FieldInput = ({ label, field, type = "text", placeholder }: { label: string; field: keyof Donor; type?: string; placeholder?: string }) => {
    const value = editMode ? (formData[field] as string) || "" : (donor[field] as string) || "";
    
    return editMode ? (
      <div className="space-y-1.5">
        <Label htmlFor={field} className="text-sm">{label}</Label>
        <Input
          id={field}
          type={type}
          value={value}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
        />
      </div>
    ) : (
      <FieldDisplay label={label} value={value} />
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="First Name" field="first_name" placeholder="First" />
            <FieldInput label="Last Name" field="last_name" placeholder="Last" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Middle Initial" field="middle_initial" placeholder="M.I." />
            <FieldInput label="Chosen Name" field="chosen_name" placeholder="Preferred" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {editMode ? (
                <>
                  <Label htmlFor="birth_date" className="text-sm">Date of Birth</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date || ""}
                    onChange={(e) => updateField("birth_date", e.target.value)}
                  />
                </>
              ) : (
                <FieldDisplay 
                  label="Date of Birth" 
                  value={format(new Date(donor.birth_date), "MMMM d, yyyy")} 
                />
              )}
            </div>
            <div className="space-y-1.5">
              {editMode ? (
                <>
                  <Label htmlFor="assigned_sex" className="text-sm">Assigned Sex</Label>
                  <Select
                    value={formData.assigned_sex || ""}
                    onValueChange={(value) => updateField("assigned_sex", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <FieldDisplay label="Assigned Sex" value={donor.assigned_sex} />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Pronouns" field="pronouns" placeholder="e.g., they/them" />
            <FieldInput label="Ethnicity" field="ethnicity" placeholder="Ethnicity" />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldInput label="Email" field="email" type="email" placeholder="email@example.com" />
          <FieldInput label="Cell Phone" field="cell_phone" type="tel" placeholder="(555) 123-4567" />
          <FieldInput label="Home Phone" field="home_phone" type="tel" placeholder="(555) 123-4567" />
          <FieldInput label="Work Phone" field="work_phone" type="tel" placeholder="(555) 123-4567" />
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldInput label="Address Line 1" field="address_line_1" placeholder="123 Main St" />
          <FieldInput label="Address Line 2" field="address_line_2" placeholder="Apt 4B" />
          <div className="grid grid-cols-3 gap-3">
            <FieldInput label="City" field="city" placeholder="City" />
            <FieldInput label="State" field="state" placeholder="State" />
            <FieldInput label="Postal Code" field="postal_code" placeholder="12345" />
          </div>
        </CardContent>
      </Card>

      {/* Eligibility */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Eligibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            {editMode ? (
              <>
                <Label htmlFor="eligibility_status" className="text-sm">Status</Label>
                <Select
                  value={formData.eligibility_status || ""}
                  onValueChange={(value) => updateField("eligibility_status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eligible">Eligible</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="ineligible">Ineligible</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              <FieldDisplay 
                label="Status" 
                value={donor.eligibility_status?.replace("_", " ")} 
              />
            )}
          </div>
          <FieldInput label="Ineligibility Reason" field="ineligibility_reason" placeholder="Reason if ineligible" />
        </CardContent>
      </Card>
    </div>
  );
};

export default DonorPersonalInfo;