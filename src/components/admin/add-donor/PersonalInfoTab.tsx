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

interface PersonalInfoTabProps {
  formData: {
    first_name: string;
    last_name: string;
    middle_initial: string;
    chosen_name: string;
    birth_date: string;
    assigned_sex: string;
    ethnicity: string;
    pronouns: string;
  };
  updateField: (field: string, value: string) => void;
  age: number | null;
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

const PRONOUNS_OPTIONS = ["He/Him", "She/Her", "They/Them", "Other"];

export const PersonalInfoTab = ({ formData, updateField, age }: PersonalInfoTabProps) => {
  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
            placeholder="Enter first name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="middle_initial">Middle Initial</Label>
          <Input
            id="middle_initial"
            value={formData.middle_initial}
            onChange={(e) => updateField("middle_initial", e.target.value)}
            maxLength={1}
            className="w-20"
            placeholder="M"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="chosen_name">Chosen Name</Label>
          <Input
            id="chosen_name"
            value={formData.chosen_name}
            onChange={(e) => updateField("chosen_name", e.target.value)}
            placeholder="Preferred name (optional)"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birth_date">
            Date of Birth <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => updateField("birth_date", e.target.value)}
              className="flex-1"
            />
            {age !== null && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Age: {age}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>
            Assigned Sex at Birth <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.assigned_sex}
            onValueChange={(value) => updateField("assigned_sex", value)}
            className="flex gap-6 pt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="font-normal cursor-pointer">
                Male
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="font-normal cursor-pointer">
                Female
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ethnicity</Label>
          <Select
            value={formData.ethnicity}
            onValueChange={(value) => updateField("ethnicity", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ethnicity" />
            </SelectTrigger>
            <SelectContent>
              {ETHNICITY_OPTIONS.map((eth) => (
                <SelectItem key={eth} value={eth}>
                  {eth}
                </SelectItem>
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
              <SelectValue placeholder="Select pronouns" />
            </SelectTrigger>
            <SelectContent>
              {PRONOUNS_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
