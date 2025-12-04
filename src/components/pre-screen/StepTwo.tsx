import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormData } from "@/pages/PreScreenForm";

const HOW_HEARD_OPTIONS = [
  "Search Engine (Google, Bing, etc.)",
  "Social Media",
  "Friend or Family",
  "Healthcare Provider",
  "News Article",
  "Community Event",
  "Other",
];

const StepTwo = () => {
  const { control } = useFormContext<FormData>();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="preferredContact"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred Contact Method *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="phone" />
                  <label htmlFor="phone" className="text-sm font-medium cursor-pointer">
                    Phone
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <label htmlFor="email" className="text-sm font-medium cursor-pointer">
                    Email
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="text" />
                  <label htmlFor="text" className="text-sm font-medium cursor-pointer">
                    Text Message
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
        name="howHeard"
        render={({ field }) => (
          <FormItem>
            <FormLabel>How Did You Hear About Us? *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {HOW_HEARD_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default StepTwo;
