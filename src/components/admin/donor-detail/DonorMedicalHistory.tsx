import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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

  const FieldDisplay = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Physical Measurements */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Physical</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            {editMode ? (
              <>
                <Label htmlFor="height_inches" className="text-xs">Height (inches)</Label>
                <Input
                  id="height_inches"
                  type="number"
                  value={formData.height_inches || ""}
                  onChange={(e) => updateField("height_inches", parseInt(e.target.value) || null)}
                  placeholder="e.g., 68"
                  className="mt-1 h-9 text-sm"
                />
              </>
            ) : (
              <FieldDisplay label="Height" value={formatHeight(donor.height_inches)} />
            )}
          </div>
          <div>
            {editMode ? (
              <>
                <Label htmlFor="weight_pounds" className="text-xs">Weight (lbs)</Label>
                <Input
                  id="weight_pounds"
                  type="number"
                  value={formData.weight_pounds || ""}
                  onChange={(e) => updateField("weight_pounds", parseInt(e.target.value) || null)}
                  placeholder="e.g., 150"
                  className="mt-1 h-9 text-sm"
                />
              </>
            ) : (
              <FieldDisplay label="Weight" value={donor.weight_pounds ? `${donor.weight_pounds} lbs` : null} />
            )}
          </div>
          <div>
            <span className="text-xs text-muted-foreground">BMI</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-medium">{getBMI()}</span>
              {bmiCategory && (
                <Badge variant={bmiCategory.variant} className="text-xs h-5">
                  {bmiCategory.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Medical Status */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Medical Status</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            {editMode ? (
              <>
                <Label htmlFor="cmv_positive" className="text-xs">CMV Status</Label>
                <Select
                  value={formData.cmv_positive || "unknown"}
                  onValueChange={(value) => updateField("cmv_positive", value)}
                >
                  <SelectTrigger className="mt-1 h-9 text-sm">
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
        </div>
      </div>

      <Separator />

      {/* Lifestyle */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Lifestyle</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Tobacco Use</p>
              <p className="text-xs text-muted-foreground">Uses tobacco products</p>
            </div>
            {editMode ? (
              <Switch
                checked={formData.tobacco_use || false}
                onCheckedChange={(checked) => updateField("tobacco_use", checked)}
              />
            ) : (
              <Badge variant={donor.tobacco_use ? "destructive" : "secondary"} className="text-xs">
                {donor.tobacco_use ? "Yes" : "No"}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Alcohol Use</p>
              <p className="text-xs text-muted-foreground">Consumes alcohol</p>
            </div>
            {editMode ? (
              <Switch
                checked={formData.alcohol_use || false}
                onCheckedChange={(checked) => updateField("alcohol_use", checked)}
              />
            ) : (
              <Badge variant={donor.alcohol_use ? "secondary" : "secondary"} className="text-xs">
                {donor.alcohol_use ? "Yes" : "No"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Notes Placeholder */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Medical Notes</h4>
        <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
          Medical history notes will be available in a future update.
        </div>
      </div>
    </div>
  );
};

export default DonorMedicalHistory;