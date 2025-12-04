import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { FormData } from "@/pages/PreScreenForm";

const HEIGHT_OPTIONS = [
  "4'10\"", "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"",
  "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"",
  "6'2\"", "6'3\"", "6'4\"", "6'5\"", "6'6\"", "6'7\"", "6'8\""
];

const heightToInches = (heightStr: string): number | null => {
  const match = heightStr.match(/(\d+)'(\d+)"/);
  if (!match) return null;
  const feet = parseInt(match[1], 10);
  const inches = parseInt(match[2], 10);
  return feet * 12 + inches;
};

const calculateBMI = (heightStr: string, weightStr: string): number | null => {
  const inches = heightToInches(heightStr);
  const weight = parseFloat(weightStr);
  if (!inches || !weight || isNaN(weight)) return null;
  // BMI = (weight in lbs / height in inches²) × 703
  return (weight / (inches * inches)) * 703;
};

const StepThree = () => {
  const { control, watch } = useFormContext<FormData>();
  const height = watch("height");
  const weight = watch("weight");
  
  const bmi = calculateBMI(height, weight);
  const bmiDisplay = bmi ? bmi.toFixed(1) : null;
  const isOverLimit = bmi !== null && bmi > 36;

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="dateOfBirth"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Date of Birth *</FormLabel>
            <FormControl>
              <Input type="date" error={!!fieldState.error} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="sexAtBirth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What was your assigned sex at birth? *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <label htmlFor="male" className="text-sm font-medium cursor-pointer">
                    Male
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <label htmlFor="female" className="text-sm font-medium cursor-pointer">
                    Female
                  </label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="height"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Height *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className={fieldState.error ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select height" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {HEIGHT_OPTIONS.map(height => (
                  <SelectItem key={height} value={height}>{height}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="weight"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Weight (lbs.) *</FormLabel>
            <FormControl>
              <Input type="number" placeholder="150" error={!!fieldState.error} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* BMI Calculator Display */}
      {bmiDisplay && (
        <div className="mt-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Your BMI</p>
              <p className={`text-2xl font-bold ${isOverLimit ? "text-destructive" : "text-primary"}`}>
                {bmiDisplay}
              </p>
            </div>
            {isOverLimit ? (
              <AlertTriangle className="w-8 h-8 text-destructive" />
            ) : (
              <CheckCircle className="w-8 h-8 text-primary" />
            )}
          </div>
          
          {isOverLimit && (
            <Alert variant="destructive" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your BMI of {bmiDisplay} exceeds the maximum of 36 required for bone marrow donation. 
                You may not be eligible for this program.
              </AlertDescription>
            </Alert>
          )}
          
          {!isOverLimit && (
            <p className="text-sm text-muted-foreground mt-2">
              Your BMI is within the acceptable range (36 or under) for donation.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StepThree;
