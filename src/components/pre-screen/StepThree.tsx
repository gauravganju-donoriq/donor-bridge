import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormData } from "@/pages/PreScreenForm";

const HEIGHT_OPTIONS = [
  "4'10\"", "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"",
  "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"",
  "6'2\"", "6'3\"", "6'4\"", "6'5\"", "6'6\"", "6'7\"", "6'8\""
];

const StepThree = () => {
  const { control } = useFormContext<FormData>();

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
    </div>
  );
};

export default StepThree;
