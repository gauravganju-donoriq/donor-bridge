import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
    </div>
  );

  const FieldInput = ({ label, field, type = "text", placeholder }: { label: string; field: keyof Donor; type?: string; placeholder?: string }) => {
    const value = editMode ? (formData[field] as string) || "" : (donor[field] as string) || "";
    
    return editMode ? (
      <div>
        <Label htmlFor={field} className="text-xs">{label}</Label>
        <Input
          id={field}
          type={type}
          value={value}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
          className="mt-1 h-9 text-sm"
        />
      </div>
    ) : (
      <FieldDisplay label={label} value={value} />
    );
  };

  return (
    <div className="space-y-6">
      {/* Identity Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FieldInput label="First Name" field="first_name" placeholder="First" />
        <FieldInput label="Middle Initial" field="middle_initial" placeholder="M.I." />
        <FieldInput label="Last Name" field="last_name" placeholder="Last" />
        <FieldInput label="Chosen Name" field="chosen_name" placeholder="Preferred" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          {editMode ? (
            <>
              <Label htmlFor="birth_date" className="text-xs">Date of Birth</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date || ""}
                onChange={(e) => updateField("birth_date", e.target.value)}
                className="mt-1 h-9 text-sm"
              />
            </>
          ) : (
            <FieldDisplay 
              label="Date of Birth" 
              value={format(new Date(donor.birth_date), "MMM d, yyyy")} 
            />
          )}
        </div>
        <div>
          {editMode ? (
            <>
              <Label htmlFor="assigned_sex" className="text-xs">Assigned Sex</Label>
              <Select
                value={formData.assigned_sex || ""}
                onValueChange={(value) => updateField("assigned_sex", value)}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
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
        <FieldInput label="Pronouns" field="pronouns" placeholder="e.g., they/them" />
        <FieldInput label="Ethnicity" field="ethnicity" placeholder="Ethnicity" />
      </div>

      <Separator />

      {/* Contact Section */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contact</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FieldInput label="Email" field="email" type="email" placeholder="email@example.com" />
          <FieldInput label="Cell Phone" field="cell_phone" type="tel" placeholder="(555) 123-4567" />
          <FieldInput label="Home Phone" field="home_phone" type="tel" placeholder="(555) 123-4567" />
          <FieldInput label="Work Phone" field="work_phone" type="tel" placeholder="(555) 123-4567" />
        </div>
      </div>

      <Separator />

      {/* Address Section */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FieldInput label="Address Line 1" field="address_line_1" placeholder="123 Main St" />
          <FieldInput label="Address Line 2" field="address_line_2" placeholder="Apt 4B" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldInput label="City" field="city" placeholder="City" />
          <FieldInput label="State" field="state" placeholder="State" />
          <FieldInput label="Postal Code" field="postal_code" placeholder="12345" />
        </div>
      </div>

      <Separator />

      {/* Eligibility Section */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Eligibility</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            {editMode ? (
              <>
                <Label htmlFor="eligibility_status" className="text-xs">Status</Label>
                <Select
                  value={formData.eligibility_status || ""}
                  onValueChange={(value) => updateField("eligibility_status", value)}
                >
                  <SelectTrigger className="mt-1 h-9 text-sm">
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
        </div>
      </div>
    </div>
  );
};

export default DonorPersonalInfo;