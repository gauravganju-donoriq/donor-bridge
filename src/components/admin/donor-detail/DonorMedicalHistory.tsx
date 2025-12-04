import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type Donor = Tables<"donors">;

interface DonorMedicalHistoryProps {
  donor: Donor;
  formData: Partial<Donor>;
  setFormData: (data: Partial<Donor>) => void;
  editMode: boolean;
}

const DonorMedicalHistory = ({ donor, formData, setFormData, editMode }: DonorMedicalHistoryProps) => {
  const updateField = (field: keyof Donor, value: unknown) => {
    setFormData({ ...formData, [field]: value });
  };

  const getBMI = () => {
    const height = formData.height_inches || donor.height_inches;
    const weight = formData.weight_pounds || donor.weight_pounds;
    
    if (height && weight) {
      const bmi = (weight / (height * height)) * 703;
      return bmi.toFixed(1);
    }
    return donor.bmi?.toFixed(1) || "—";
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-yellow-600" };
    if (bmi < 25) return { label: "Normal", color: "text-green-600" };
    if (bmi < 30) return { label: "Overweight", color: "text-yellow-600" };
    return { label: "Obese", color: "text-red-600" };
  };

  const bmiValue = parseFloat(getBMI());
  const bmiCategory = !isNaN(bmiValue) ? getBMICategory(bmiValue) : null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Physical Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Physical Measurements</CardTitle>
          <CardDescription>Height, weight, and BMI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height_inches">Height (inches)</Label>
              {editMode ? (
                <Input
                  id="height_inches"
                  type="number"
                  value={formData.height_inches || ""}
                  onChange={(e) => updateField("height_inches", parseInt(e.target.value) || null)}
                  placeholder="e.g., 68"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {donor.height_inches ? `${Math.floor(donor.height_inches / 12)}'${donor.height_inches % 12}"` : "—"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_pounds">Weight (lbs)</Label>
              {editMode ? (
                <Input
                  id="weight_pounds"
                  type="number"
                  value={formData.weight_pounds || ""}
                  onChange={(e) => updateField("weight_pounds", parseInt(e.target.value) || null)}
                  placeholder="e.g., 150"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {donor.weight_pounds ? `${donor.weight_pounds} lbs` : "—"}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>BMI</Label>
            <div className="flex items-center gap-3 py-2 px-3 bg-muted rounded-md">
              <span className="text-sm font-medium">{getBMI()}</span>
              {bmiCategory && (
                <span className={`text-xs ${bmiCategory.color}`}>
                  ({bmiCategory.label})
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Status */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Status</CardTitle>
          <CardDescription>CMV status and other medical info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cmv_positive">CMV Status</Label>
            {editMode ? (
              <Select
                value={formData.cmv_positive || "unknown"}
                onValueChange={(value) => updateField("cmv_positive", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select CMV status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md capitalize">
                {donor.cmv_positive || "Unknown"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle Factors */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Lifestyle Factors</CardTitle>
          <CardDescription>Tobacco, alcohol, and other lifestyle information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base">Tobacco Use</Label>
                <p className="text-sm text-muted-foreground">Does the donor use tobacco products?</p>
              </div>
              {editMode ? (
                <Switch
                  checked={formData.tobacco_use || false}
                  onCheckedChange={(checked) => updateField("tobacco_use", checked)}
                />
              ) : (
                <span className={`font-medium ${donor.tobacco_use ? "text-red-600" : "text-green-600"}`}>
                  {donor.tobacco_use ? "Yes" : "No"}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base">Alcohol Use</Label>
                <p className="text-sm text-muted-foreground">Does the donor consume alcohol?</p>
              </div>
              {editMode ? (
                <Switch
                  checked={formData.alcohol_use || false}
                  onCheckedChange={(checked) => updateField("alcohol_use", checked)}
                />
              ) : (
                <span className={`font-medium ${donor.alcohol_use ? "text-yellow-600" : "text-green-600"}`}>
                  {donor.alcohol_use ? "Yes" : "No"}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Notes */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Additional Medical Information</CardTitle>
          <CardDescription>Any additional notes about the donor's medical history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
            Medical history notes and detailed records will be available in a future update.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DonorMedicalHistory;
