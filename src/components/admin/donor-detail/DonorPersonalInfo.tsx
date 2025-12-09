import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DonorSearchSelect from "../DonorSearchSelect";

type Donor = Tables<"donors">;

interface DonorPersonalInfoProps {
  donor: Donor;
  formData: Partial<Donor>;
  setFormData: (data: Partial<Donor>) => void;
  editMode: boolean;
}

// Moved outside component to prevent re-creation on each render
const FieldDisplay = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="space-y-1">
    <span className="text-sm text-muted-foreground">{label}</span>
    <p className="text-sm font-medium">{value || "—"}</p>
  </div>
);

interface FieldInputProps {
  label: string;
  field: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  editMode: boolean;
}

// Moved outside component to prevent re-creation on each render
const FieldInput = ({ label, field, type = "text", placeholder, value, onChange, editMode }: FieldInputProps) => {
  return editMode ? (
    <div className="space-y-1.5">
      <Label htmlFor={field} className="text-sm">{label}</Label>
      <Input
        id={field}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ) : (
    <FieldDisplay label={label} value={value} />
  );
};

const DonorPersonalInfo = ({ donor, formData, setFormData, editMode }: DonorPersonalInfoProps) => {
  const [referringDonor, setReferringDonor] = useState<{ donor_id: string; first_name: string; last_name: string } | null>(null);

  // Fetch referring donor details for display mode
  useEffect(() => {
    const fetchReferringDonor = async () => {
      if (donor.referred_by_donor_id) {
        const { data } = await supabase
          .from("donors")
          .select("donor_id, first_name, last_name")
          .eq("id", donor.referred_by_donor_id)
          .single();
        setReferringDonor(data);
      } else {
        setReferringDonor(null);
      }
    };
    fetchReferringDonor();
  }, [donor.referred_by_donor_id]);

  const updateField = (field: keyof Donor, value: unknown) => {
    setFormData({ ...formData, [field]: value });
  };

  const getFieldValue = (field: keyof Donor) => {
    return editMode ? (formData[field] as string) || "" : (donor[field] as string) || "";
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
            <FieldInput 
              label="First Name" 
              field="first_name" 
              placeholder="First" 
              value={getFieldValue("first_name")}
              onChange={(v) => updateField("first_name", v)}
              editMode={editMode}
            />
            <FieldInput 
              label="Last Name" 
              field="last_name" 
              placeholder="Last" 
              value={getFieldValue("last_name")}
              onChange={(v) => updateField("last_name", v)}
              editMode={editMode}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput 
              label="Middle Initial" 
              field="middle_initial" 
              placeholder="M.I." 
              value={getFieldValue("middle_initial")}
              onChange={(v) => updateField("middle_initial", v)}
              editMode={editMode}
            />
            <FieldInput 
              label="Chosen Name" 
              field="chosen_name" 
              placeholder="Preferred" 
              value={getFieldValue("chosen_name")}
              onChange={(v) => updateField("chosen_name", v)}
              editMode={editMode}
            />
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
            <FieldInput 
              label="Pronouns" 
              field="pronouns" 
              placeholder="e.g., they/them" 
              value={getFieldValue("pronouns")}
              onChange={(v) => updateField("pronouns", v)}
              editMode={editMode}
            />
            <FieldInput 
              label="Ethnicity" 
              field="ethnicity" 
              placeholder="Ethnicity" 
              value={getFieldValue("ethnicity")}
              onChange={(v) => updateField("ethnicity", v)}
              editMode={editMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldInput 
            label="Email" 
            field="email" 
            type="email" 
            placeholder="email@example.com" 
            value={getFieldValue("email")}
            onChange={(v) => updateField("email", v)}
            editMode={editMode}
          />
          <FieldInput 
            label="Cell Phone" 
            field="cell_phone" 
            type="tel" 
            placeholder="(555) 123-4567" 
            value={getFieldValue("cell_phone")}
            onChange={(v) => updateField("cell_phone", v)}
            editMode={editMode}
          />
          <FieldInput 
            label="Home Phone" 
            field="home_phone" 
            type="tel" 
            placeholder="(555) 123-4567" 
            value={getFieldValue("home_phone")}
            onChange={(v) => updateField("home_phone", v)}
            editMode={editMode}
          />
          <FieldInput 
            label="Work Phone" 
            field="work_phone" 
            type="tel" 
            placeholder="(555) 123-4567" 
            value={getFieldValue("work_phone")}
            onChange={(v) => updateField("work_phone", v)}
            editMode={editMode}
          />
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldInput 
            label="Address Line 1" 
            field="address_line_1" 
            placeholder="123 Main St" 
            value={getFieldValue("address_line_1")}
            onChange={(v) => updateField("address_line_1", v)}
            editMode={editMode}
          />
          <FieldInput 
            label="Address Line 2" 
            field="address_line_2" 
            placeholder="Apt 4B" 
            value={getFieldValue("address_line_2")}
            onChange={(v) => updateField("address_line_2", v)}
            editMode={editMode}
          />
          <div className="grid grid-cols-3 gap-3">
            <FieldInput 
              label="City" 
              field="city" 
              placeholder="City" 
              value={getFieldValue("city")}
              onChange={(v) => updateField("city", v)}
              editMode={editMode}
            />
            <FieldInput 
              label="State" 
              field="state" 
              placeholder="State" 
              value={getFieldValue("state")}
              onChange={(v) => updateField("state", v)}
              editMode={editMode}
            />
            <FieldInput 
              label="Postal Code" 
              field="postal_code" 
              placeholder="12345" 
              value={getFieldValue("postal_code")}
              onChange={(v) => updateField("postal_code", v)}
              editMode={editMode}
            />
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
          <FieldInput 
            label="Ineligibility Reason" 
            field="ineligibility_reason" 
            placeholder="Reason if ineligible" 
            value={getFieldValue("ineligibility_reason")}
            onChange={(v) => updateField("ineligibility_reason", v)}
            editMode={editMode}
          />
        </CardContent>
      </Card>

      {/* Referral & Vendor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Referral & Vendor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FieldInput 
              label="Referred By" 
              field="referred_by" 
              placeholder="e.g., Dr. Smith, Google" 
              value={getFieldValue("referred_by")}
              onChange={(v) => updateField("referred_by", v)}
              editMode={editMode}
            />
            <FieldInput 
              label="Vendor Number" 
              field="vendor_number" 
              placeholder="External reference" 
              value={getFieldValue("vendor_number")}
              onChange={(v) => updateField("vendor_number", v)}
              editMode={editMode}
            />
          </div>
          <div className="space-y-1.5">
            {editMode ? (
              <>
                <Label className="text-sm">Referring Donor</Label>
                <DonorSearchSelect
                  value={(formData.referred_by_donor_id as string) || ""}
                  onChange={(v) => updateField("referred_by_donor_id", v || null)}
                  excludeDonorId={donor.id}
                  placeholder="Search if referred by another donor..."
                />
              </>
            ) : (
              <FieldDisplay 
                label="Referring Donor" 
                value={referringDonor ? `${referringDonor.donor_id} - ${referringDonor.first_name} ${referringDonor.last_name}` : null} 
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DonorPersonalInfo;
