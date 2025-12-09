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
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

// Parse height string like "5'10\"" into feet and inches
const parseHeight = (heightStr: string): { feet: number; inches: number } => {
  const match = heightStr.match(/(\d+)'(\d+)"/);
  if (match) {
    return { feet: parseInt(match[1], 10), inches: parseInt(match[2], 10) };
  }
  return { feet: 0, inches: 0 };
};

const PreScreenForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      streetAddress: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      preferredContact: "phone",
      howHeard: "",
      dateOfBirth: "",
      sexAtBirth: "male",
      height: "",
      weight: "",
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
      availabilityExplanation: "",
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Parse height into feet and inches
      const { feet, inches } = parseHeight(data.height);
      
      // Generate a temporary submission_id (will be replaced by trigger if configured)
      const tempSubmissionId = `WF-${Date.now().toString().slice(-6)}`;
      
      // Map form data to database columns
      const submissionData = {
        submission_id: tempSubmissionId,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        email: data.email,
        street_address: data.streetAddress,
        address_line_2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        birth_date: data.dateOfBirth,
        assigned_sex: data.sexAtBirth,
        height_feet: feet,
        height_inches: inches,
        weight: parseInt(data.weight, 10) || null,
        // Map health questions to database booleans
        has_blood_disorder: data.bloodDisorder === "yes",
        takes_medications: data.prescriptionMeds === "yes",
        had_surgery: data.hospitalizedSurgery === "yes",
        has_been_incarcerated: data.correctionalInstitution === "yes",
        has_been_pregnant: data.pregnantOrBreastfeeding === "yes",
        // Acknowledgements
        acknowledge_info_accurate: data.locationConsent,
        acknowledge_time_commitment: data.bmiConsent,
        acknowledge_health_screening: true, // They completed the form
      };

      const { data: result, error } = await supabase
        .from("webform_submissions")
        .insert([submissionData])
        .select("submission_id")
        .single();

      if (error) {
        console.error("Submission error:", error);
        toast({
          title: "Submission Failed",
          description: "There was an error submitting your application. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Trigger AI evaluation (non-blocking)
      supabase.functions.invoke("evaluate-submission", {
        body: { submission_id: result.submission_id, use_ai: false },
      }).catch(err => console.error("Evaluation error:", err));

      // Navigate to confirmation with submission ID
      navigate(`/confirmation?id=${result.submission_id}`);
      
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                    disabled={currentStep === 1 || isSubmitting}
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
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
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
