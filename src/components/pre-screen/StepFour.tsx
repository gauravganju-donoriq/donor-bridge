import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { FormData } from "@/pages/PreScreenForm";

type YesNoQuestion = {
  name: keyof FormData;
  label: string;
  includeNA?: boolean;
};

const HEALTH_QUESTIONS: YesNoQuestion[] = [
  { name: "previouslyDonated", label: "I Have Previously Donated with Lonza" },
  { name: "underPhysicianCare", label: "Are you under the care of a physician for any medical conditions?" },
  { name: "prescriptionMeds", label: "Do you take any prescription medications? Please include allergy medications including EpiPens." },
  { name: "otherDonorPrograms", label: "In the past 6 months, have you participated in any other donor programs such as blood or plasma donation, vaccine trials, or research studies?" },
  { name: "pregnantOrBreastfeeding", label: "If female sex at birth, are you currently pregnant or have you been pregnant in the past 12 weeks? Are you breastfeeding?", includeNA: true },
  { name: "hospitalizedSurgery", label: "In the past 12 months, have you been hospitalized, had major surgery, or been in a mental health institution?" },
  { name: "correctionalInstitution", label: "In the past 12 months, have you been an inmate of a correctional institution for more than 72 hours?" },
  { name: "needleIssues", label: "Do you have problems receiving injections with a needle or have you fainted in the past due to receiving an injection?" },
  { name: "keloidScarring", label: "Do you scar easily? (keloid production)" },
  { name: "bloodAnxiety", label: "Does the thought of giving blood cause you to feel anxious or unwell?" },
  { name: "faintingHistory", label: "Do you have a history of fainting or any negative reaction while giving blood?" },
  { name: "bloodDisorder", label: "Do you have a blood or bleeding disorder?" },
  { name: "arthritisBoneJoint", label: "Do you have any arthritis, bone, or joint conditions?" },
  { name: "backHipSpine", label: "Do you currently have or a history of any back, hip, or spine conditions or issues?" },
  { name: "covidSymptoms", label: "In the past 10 days, have you recently had symptoms of COVID-19, tested positive for COVID-19, or have you been around anyone who has tested positive?" },
  { name: "availableToDonateSixWeeks", label: "Will you be available to donate bone marrow within the next 6 weeks?" },
];

const StepFour = () => {
  const { control, watch } = useFormContext<FormData>();
  const sexAtBirth = watch("sexAtBirth");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {HEALTH_QUESTIONS.map((question) => {
          // Skip pregnancy question for males
          if (question.name === "pregnantOrBreastfeeding" && sexAtBirth === "male") {
            return null;
          }

          return (
            <FormField
              key={question.name}
              control={control}
              name={question.name}
              render={({ field }) => (
                <FormItem className="border-b border-border pb-4">
                  <FormLabel className="text-sm leading-relaxed">{question.label} *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value as string}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id={`${question.name}-yes`} />
                        <label htmlFor={`${question.name}-yes`} className="text-sm cursor-pointer">
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`${question.name}-no`} />
                        <label htmlFor={`${question.name}-no`} className="text-sm cursor-pointer">
                          No
                        </label>
                      </div>
                      {question.includeNA && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="na" id={`${question.name}-na`} />
                          <label htmlFor={`${question.name}-na`} className="text-sm cursor-pointer">
                            N/A
                          </label>
                        </div>
                      )}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
      </div>

      <FormField
        control={control}
        name="availabilityExplanation"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Please explain availability *</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe your availability for donation..."
                className={`min-h-[100px] ${fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-semibold text-lg">Consents</h3>
        
        <FormField
          control={control}
          name="locationConsent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-normal">
                  Location Consent *
                </FormLabel>
                <FormDescription>
                  I understand that in order to participate in this program, I must provide an address within a 150-mile radius of Rockville, Maryland.
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="bmiConsent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-normal">
                  BMI Consent *
                </FormLabel>
                <FormDescription>
                  I certify that I have a 36 or under Body Mass Index measurement needed to donate bone marrow. I accept that if I'm incorrect or cannot provide an accurate address, I will be turned away at the donation center, resulting in no money being distributed for my time or travel.
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default StepFour;
