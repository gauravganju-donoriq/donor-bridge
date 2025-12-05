import { useFormContext } from "react-hook-form";
import type { FormData } from "@/pages/PreScreenForm";

const ReviewSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="font-semibold text-lg mb-3 text-primary">{title}</h3>
    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
      {children}
    </div>
  </div>
);

const ReviewItem = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="flex justify-between py-1 border-b border-border last:border-0">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className="text-sm font-medium">{value || "—"}</span>
  </div>
);

const formatYesNo = (value: string | undefined) => {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value === "na") return "N/A";
  return value || "—";
};

const StepFive = () => {
  const { getValues } = useFormContext<FormData>();
  const data = getValues();

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground mb-6">
        Please review your information before submitting. Click "Back" to make any changes.
      </p>

      <ReviewSection title="Contact Information">
        <ReviewItem label="Name" value={`${data.firstName} ${data.lastName}`} />
        <ReviewItem label="Phone" value={data.phone} />
        <ReviewItem label="Email" value={data.email} />
        <ReviewItem label="Address" value={`${data.streetAddress}${data.addressLine2 ? `, ${data.addressLine2}` : ""}`} />
        <ReviewItem label="City, State, ZIP" value={`${data.city}, ${data.state} ${data.zipCode}`} />
      </ReviewSection>

      <ReviewSection title="Contact Preferences">
        <ReviewItem label="Preferred Contact" value={data.preferredContact?.charAt(0).toUpperCase() + data.preferredContact?.slice(1)} />
        <ReviewItem label="How Heard About Us" value={data.howHeard} />
      </ReviewSection>

      <ReviewSection title="Basic Health Info">
        <ReviewItem label="Date of Birth" value={data.dateOfBirth} />
        <ReviewItem label="Sex at Birth" value={data.sexAtBirth?.charAt(0).toUpperCase() + data.sexAtBirth?.slice(1)} />
        <ReviewItem label="Height" value={data.height} />
        <ReviewItem label="Weight" value={`${data.weight} lbs`} />
      </ReviewSection>

      <ReviewSection title="Health Screening">
        <ReviewItem label="Previously Donated with Donor Bridge" value={formatYesNo(data.previouslyDonated)} />
        <ReviewItem label="Under Physician Care" value={formatYesNo(data.underPhysicianCare)} />
        <ReviewItem label="Prescription Medications" value={formatYesNo(data.prescriptionMeds)} />
        <ReviewItem label="Other Donor Programs (6 mo)" value={formatYesNo(data.otherDonorPrograms)} />
        {data.sexAtBirth === "female" && (
          <ReviewItem label="Pregnant/Breastfeeding" value={formatYesNo(data.pregnantOrBreastfeeding)} />
        )}
        <ReviewItem label="Hospitalized/Surgery (12 mo)" value={formatYesNo(data.hospitalizedSurgery)} />
        <ReviewItem label="Correctional Institution (12 mo)" value={formatYesNo(data.correctionalInstitution)} />
        <ReviewItem label="Needle/Injection Issues" value={formatYesNo(data.needleIssues)} />
        <ReviewItem label="Keloid Scarring" value={formatYesNo(data.keloidScarring)} />
        <ReviewItem label="Blood Anxiety" value={formatYesNo(data.bloodAnxiety)} />
        <ReviewItem label="Fainting History" value={formatYesNo(data.faintingHistory)} />
        <ReviewItem label="Blood Disorder" value={formatYesNo(data.bloodDisorder)} />
        <ReviewItem label="Arthritis/Bone/Joint" value={formatYesNo(data.arthritisBoneJoint)} />
        <ReviewItem label="Back/Hip/Spine Issues" value={formatYesNo(data.backHipSpine)} />
        <ReviewItem label="COVID Symptoms (10 days)" value={formatYesNo(data.covidSymptoms)} />
        <ReviewItem label="Available in 6 Weeks" value={formatYesNo(data.availableToDonateSixWeeks)} />
        <ReviewItem label="Availability Details" value={data.availabilityExplanation} />
      </ReviewSection>

      <ReviewSection title="Consents">
        <ReviewItem label="Location Consent" value={data.locationConsent ? "Agreed" : "Not Agreed"} />
        <ReviewItem label="BMI Consent" value={data.bmiConsent ? "Agreed" : "Not Agreed"} />
      </ReviewSection>
    </div>
  );
};

export default StepFive;
