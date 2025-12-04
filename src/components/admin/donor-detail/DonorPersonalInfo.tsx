import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const renderField = (label: string, field: keyof Donor, type: string = "text", placeholder?: string) => {
    const value = editMode ? (formData[field] as string) || "" : (donor[field] as string) || "";

    return (
      <div className="space-y-2">
        <Label htmlFor={field}>{label}</Label>
        {editMode ? (
          <Input
            id={field}
            type={type}
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <p className="text-sm py-2 px-3 bg-muted rounded-md min-h-[40px] flex items-center">
            {value || <span className="text-muted-foreground">Not provided</span>}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Personal identification details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {renderField("First Name", "first_name", "text", "First name")}
            {renderField("Last Name", "last_name", "text", "Last name")}
          </div>
          {renderField("Middle Initial", "middle_initial", "text", "M.I.")}
          {renderField("Chosen Name", "chosen_name", "text", "Preferred name")}
          {renderField("Pronouns", "pronouns", "text", "e.g., they/them")}

          <div className="space-y-2">
            <Label htmlFor="birth_date">Date of Birth</Label>
            {editMode ? (
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date || ""}
                onChange={(e) => updateField("birth_date", e.target.value)}
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md">
                {format(new Date(donor.birth_date), "MMMM d, yyyy")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_sex">Assigned Sex</Label>
            {editMode ? (
              <Select
                value={formData.assigned_sex || ""}
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
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md capitalize">
                {donor.assigned_sex}
              </p>
            )}
          </div>

          {renderField("Ethnicity", "ethnicity", "text", "Ethnicity")}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Phone numbers and email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderField("Email", "email", "email", "email@example.com")}
          {renderField("Cell Phone", "cell_phone", "tel", "(555) 123-4567")}
          {renderField("Home Phone", "home_phone", "tel", "(555) 123-4567")}
          {renderField("Work Phone", "work_phone", "tel", "(555) 123-4567")}
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>Residential address information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {renderField("Address Line 1", "address_line_1", "text", "123 Main St")}
            {renderField("Address Line 2", "address_line_2", "text", "Apt 4B")}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {renderField("City", "city", "text", "City")}
            {renderField("State", "state", "text", "State")}
            {renderField("Postal Code", "postal_code", "text", "12345")}
          </div>
        </CardContent>
      </Card>

      {/* Eligibility Status */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Eligibility Status</CardTitle>
          <CardDescription>Current eligibility and review status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eligibility_status">Status</Label>
              {editMode ? (
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
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md capitalize">
                  {donor.eligibility_status?.replace("_", " ") || "Not set"}
                </p>
              )}
            </div>
            {renderField("Ineligibility Reason", "ineligibility_reason", "text", "Reason if ineligible")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DonorPersonalInfo;
