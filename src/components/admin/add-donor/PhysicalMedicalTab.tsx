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

interface PhysicalMedicalTabProps {
  formData: {
    height_inches: string;
    weight_pounds: string;
    alcohol_use: string;
    tobacco_use: string;
    cmv_positive: string;
  };
  updateField: (field: string, value: string) => void;
  bmi: string;
}

export const PhysicalMedicalTab = ({ formData, updateField, bmi }: PhysicalMedicalTabProps) => {
  const getBmiStatus = (bmiValue: string) => {
    const num = parseFloat(bmiValue);
    if (isNaN(num)) return null;
    if (num < 18.5) return { label: "Underweight", color: "text-yellow-600" };
    if (num < 25) return { label: "Normal", color: "text-green-600" };
    if (num < 30) return { label: "Overweight", color: "text-yellow-600" };
    return { label: "Obese", color: "text-red-600" };
  };

  const bmiStatus = getBmiStatus(bmi);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height_inches">Height (inches)</Label>
          <Input
            id="height_inches"
            type="number"
            value={formData.height_inches}
            onChange={(e) => updateField("height_inches", e.target.value)}
            placeholder="e.g., 68"
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight_pounds">Weight (lbs)</Label>
          <Input
            id="weight_pounds"
            type="number"
            value={formData.weight_pounds}
            onChange={(e) => updateField("weight_pounds", e.target.value)}
            placeholder="e.g., 150"
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label>BMI</Label>
          <div className="h-10 flex items-center gap-2">
            <span className="text-xl font-semibold">{bmi}</span>
            {bmiStatus && (
              <span className={`text-sm ${bmiStatus.color}`}>
                ({bmiStatus.label})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Medical Information</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>CMV Status</Label>
            <Select
              value={formData.cmv_positive}
              onValueChange={(value) => updateField("cmv_positive", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Lifestyle</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Alcohol Use</Label>
            <RadioGroup
              value={formData.alcohol_use}
              onValueChange={(value) => updateField("alcohol_use", value)}
              className="flex gap-6 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="alcohol_yes" />
                <Label htmlFor="alcohol_yes" className="font-normal cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="alcohol_no" />
                <Label htmlFor="alcohol_no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Tobacco Use</Label>
            <RadioGroup
              value={formData.tobacco_use}
              onValueChange={(value) => updateField("tobacco_use", value)}
              className="flex gap-6 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="tobacco_yes" />
                <Label htmlFor="tobacco_yes" className="font-normal cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="tobacco_no" />
                <Label htmlFor="tobacco_no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
};
