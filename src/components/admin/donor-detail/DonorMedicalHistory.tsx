import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type Donor = Tables<"donors">;

interface DonorMedicalHistoryProps {
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
    if (bmi < 18.5) return { label: "Underweight", variant: "secondary" as const };
    if (bmi < 25) return { label: "Normal", variant: "default" as const };
    if (bmi < 30) return { label: "Overweight", variant: "secondary" as const };
    return { label: "Obese", variant: "destructive" as const };
  };

  const bmiValue = parseFloat(getBMI());
  const bmiCategory = !isNaN(bmiValue) ? getBMICategory(bmiValue) : null;

  const formatHeight = (inches: number | null) => {
    if (!inches) return "—";
    return `${Math.floor(inches / 12)}'${inches % 12}"`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Physical Measurements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Physical Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {editMode ? (
                <>
                  <Label htmlFor="height_inches" className="text-sm">Height (inches)</Label>
                  <Input
                    id="height_inches"
                    type="number"
                    value={formData.height_inches || ""}
                    onChange={(e) => updateField("height_inches", parseInt(e.target.value) || null)}
                    placeholder="e.g., 68"
                  />
                </>
              ) : (
                <FieldDisplay label="Height" value={formatHeight(donor.height_inches)} />
              )}
            </div>
            <div className="space-y-1.5">
              {editMode ? (
                <>
                  <Label htmlFor="weight_pounds" className="text-sm">Weight (lbs)</Label>
                  <Input
                    id="weight_pounds"
                    type="number"
                    value={formData.weight_pounds || ""}
                    onChange={(e) => updateField("weight_pounds", parseInt(e.target.value) || null)}
                    placeholder="e.g., 150"
                  />
                </>
              ) : (
                <FieldDisplay label="Weight" value={donor.weight_pounds ? `${donor.weight_pounds} lbs` : null} />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">BMI</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{getBMI()}</span>
              {bmiCategory && (
                <Badge variant={bmiCategory.variant}>
                  {bmiCategory.label}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Medical Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            {editMode ? (
              <>
                <Label htmlFor="cmv_positive" className="text-sm">CMV Status</Label>
                <Select
                  value={formData.cmv_positive || "unknown"}
                  onValueChange={(value) => updateField("cmv_positive", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              <FieldDisplay label="CMV Status" value={donor.cmv_positive} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Lifestyle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Tobacco Use</p>
                <p className="text-sm text-muted-foreground">Uses tobacco products</p>
              </div>
              {editMode ? (
                <Switch
                  checked={formData.tobacco_use || false}
                  onCheckedChange={(checked) => updateField("tobacco_use", checked)}
                />
              ) : (
                <Badge variant={donor.tobacco_use ? "destructive" : "secondary"}>
                  {donor.tobacco_use ? "Yes" : "No"}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Alcohol Use</p>
                <p className="text-sm text-muted-foreground">Consumes alcohol</p>
              </div>
              {editMode ? (
                <Switch
                  checked={formData.alcohol_use || false}
                  onCheckedChange={(checked) => updateField("alcohol_use", checked)}
                />
              ) : (
                <Badge variant="secondary">
                  {donor.alcohol_use ? "Yes" : "No"}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DonorMedicalHistory;
