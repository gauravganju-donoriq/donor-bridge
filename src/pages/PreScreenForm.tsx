import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FormProgress from "@/components/pre-screen/FormProgress";
import StepOne from "@/components/pre-screen/StepOne";
import StepTwo from "@/components/pre-screen/StepTwo";
import StepThree from "@/components/pre-screen/StepThree";
import StepFour from "@/components/pre-screen/StepFour";
import StepFive from "@/components/pre-screen/StepFive";
import { ArrowLeft, ArrowRight } from "lucide-react";

const formSchema = z.object({
  // Step 1: Contact Info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(14, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  
  // Step 2: Contact Preferences
  preferredContact: z.enum(["phone", "email", "text"]),
  howHeard: z.string().min(1, "Please select how you heard about us"),
  
  // Step 3: Basic Health
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  sexAtBirth: z.enum(["male", "female"]),
  height: z.string().min(1, "Height is required"),
  weight: z.string().min(1, "Weight is required"),
  
  // Step 4: Health Questions
  previouslyDonated: z.enum(["yes", "no"]),
  underPhysicianCare: z.enum(["yes", "no"]),
  prescriptionMeds: z.enum(["yes", "no"]),
  otherDonorPrograms: z.enum(["yes", "no"]),
  pregnantOrBreastfeeding: z.enum(["yes", "no", "na"]),
  hospitalizedSurgery: z.enum(["yes", "no"]),
  correctionalInstitution: z.enum(["yes", "no"]),
  needleIssues: z.enum(["yes", "no"]),
  keloidScarring: z.enum(["yes", "no"]),
  bloodAnxiety: z.enum(["yes", "no"]),
  faintingHistory: z.enum(["yes", "no"]),
  bloodDisorder: z.enum(["yes", "no"]),
  arthritisBoneJoint: z.enum(["yes", "no"]),
  backHipSpine: z.enum(["yes", "no"]),
  covidSymptoms: z.enum(["yes", "no"]),
  availableToDonateSixWeeks: z.enum(["yes", "no"]),
  availabilityExplanation: z.string().min(1, "Please explain your availability"),
  
  // Consents
  locationConsent: z.boolean().refine(val => val === true, "Location consent is required"),
  bmiConsent: z.boolean().refine(val => val === true, "BMI consent is required"),
});

export type FormData = z.infer<typeof formSchema>;

const PreScreenForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "John",
      lastName: "Doe",
      phone: "(555) 123-4567",
      email: "john.doe@example.com",
      streetAddress: "123 Main Street",
      addressLine2: "Apt 4B",
      city: "Rockville",
      state: "MD",
      zipCode: "20850",
      preferredContact: "phone",
      howHeard: "Search Engine (Google, Bing, etc.)",
      dateOfBirth: "1990-05-15",
      sexAtBirth: "male",
      height: "5'10\"",
      weight: "175",
      previouslyDonated: "no",
      underPhysicianCare: "no",
      prescriptionMeds: "no",
      otherDonorPrograms: "no",
      pregnantOrBreastfeeding: "na",
      hospitalizedSurgery: "no",
      correctionalInstitution: "no",
      needleIssues: "no",
      keloidScarring: "no",
      bloodAnxiety: "no",
      faintingHistory: "no",
      bloodDisorder: "no",
      arthritisBoneJoint: "no",
      backHipSpine: "no",
      covidSymptoms: "no",
      availableToDonateSixWeeks: "yes",
      availabilityExplanation: "I am available weekdays after 5pm and all day on weekends.",
      locationConsent: false,
      bmiConsent: false,
    },
    mode: "onChange",
  });

  const stepFields: Record<number, (keyof FormData)[]> = {
    1: ["firstName", "lastName", "phone", "email", "streetAddress", "city", "state", "zipCode"],
    2: ["preferredContact", "howHeard"],
    3: ["dateOfBirth", "sexAtBirth", "height", "weight"],
    4: ["availabilityExplanation", "locationConsent", "bmiConsent"],
  };

  const validateStep = async (step: number) => {
    const fields = stepFields[step];
    const result = await methods.trigger(fields);
    return result;
  };

  const handleNext = async () => {
    if (currentStep === 5) return;
    const isValid = currentStep <= 4 ? await validateStep(currentStep) : true;
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data);
    navigate("/confirmation");
  };

  const stepTitles = ["Contact Information", "Contact Preferences", "Basic Health Info", "Health Screening", "Review & Submit"];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{stepTitles[currentStep - 1]}</CardTitle>
            <FormProgress currentStep={currentStep} totalSteps={5} />
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                {currentStep === 1 && <StepOne />}
                {currentStep === 2 && <StepTwo />}
                {currentStep === 3 && <StepThree />}
                {currentStep === 4 && <StepFour />}
                {currentStep === 5 && <StepFive />}
                
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  {currentStep < 5 ? (
                    <Button type="button" onClick={handleNext}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit">
                      Submit Application
                    </Button>
                  )}
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreScreenForm;
