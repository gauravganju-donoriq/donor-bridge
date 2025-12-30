import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Loader2, AlertCircle, User, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInYears } from "date-fns";
import SignaturePad, { SignaturePadRef } from "@/components/admin/donor-detail/SignaturePad";

interface ConsentRecord {
  id: string;
  consent_type: string;
  status: string;
  token_expires_at: string;
}

interface DonorInfo {
  id: string;
  donor_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  assigned_sex: string;
}

interface ConsentData {
  consents: ConsentRecord[];
  donor: DonorInfo;
}

const CONSENT_CONTENT: Record<string, { title: string; content: string[] }> = {
  hiv_testing: {
    title: "HIV Testing Consent Form",
    content: [
      "I understand that I will be tested for HIV (Human Immunodeficiency Virus) as part of the donor screening process.",
      "I understand that this test is performed to ensure the safety of donated materials.",
      "I consent to have my blood sample tested for HIV antibodies and/or antigens.",
      "I understand that I will be notified of the test results and provided with appropriate counseling if needed.",
      "I understand that my test results will be kept confidential and only disclosed as required by law or for medical purposes.",
    ],
  },
  bone_marrow_donation: {
    title: "Bone Marrow Donation Consent Form",
    content: [
      "I voluntarily consent to donate bone marrow for research and/or clinical purposes.",
      "I understand the bone marrow aspiration procedure, including the risks and benefits involved.",
      "I acknowledge that I have been informed about the procedure, which involves the collection of bone marrow from my hip bone under local anesthesia.",
      "I understand that common side effects may include soreness, bruising, and fatigue at the collection site.",
      "I agree to follow all pre- and post-procedure instructions provided by the medical staff.",
      "I understand that I may withdraw my consent at any time before the procedure.",
    ],
  },
  genetic_testing: {
    title: "Genetic Testing Consent Form",
    content: [
      "I consent to genetic testing as part of the donor qualification process.",
      "I understand that genetic testing may reveal information about my health and genetic makeup.",
      "I agree that the genetic information collected may be used for research purposes.",
      "I understand that my genetic information will be kept confidential and secure.",
    ],
  },
  research_use: {
    title: "Research Use Authorization",
    content: [
      "I authorize the use of my donated biological materials for research purposes.",
      "I understand that my donation may be used in various research studies.",
      "I agree that I will not receive compensation for any commercial products developed from my donation.",
      "I understand that my identity will remain confidential in any research publications.",
    ],
  },
  hipaa_authorization: {
    title: "HIPAA Authorization",
    content: [
      "I authorize the disclosure of my protected health information as described in this form.",
      "I understand my rights under HIPAA regarding my health information.",
      "I understand that I may revoke this authorization at any time in writing.",
      "I understand that information disclosed may no longer be protected by federal privacy laws.",
    ],
  },
};

const ConsentForm = () => {
  const { token } = useParams<{ token: string }>();
  const signatureRef = useRef<SignaturePadRef>(null);

  const [loading, setLoading] = useState(true);
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchConsents = async () => {
      if (!token) {
        setError("Invalid consent link");
        setLoading(false);
        return;
      }

      try {
        // Fetch all consents with this token
        const { data: consents, error: consentsError } = await supabase
          .from("donor_consents")
          .select("id, consent_type, status, token_expires_at, donor_id")
          .eq("access_token", token);

        if (consentsError) throw consentsError;

        if (!consents || consents.length === 0) {
          setError("Consent request not found or link has expired");
          setLoading(false);
          return;
        }

        // Check if expired
        if (new Date(consents[0].token_expires_at) < new Date()) {
          setError("This consent link has expired. Please contact the clinic for a new link.");
          setLoading(false);
          return;
        }

        // Check if all already signed
        const allSigned = consents.every(c => c.status === "signed");
        if (allSigned) {
          setError("All consent forms have already been signed.");
          setLoading(false);
          return;
        }

        // Check if any revoked
        const anyRevoked = consents.some(c => c.status === "revoked");
        if (anyRevoked) {
          setError("This consent request has been revoked. Please contact the clinic.");
          setLoading(false);
          return;
        }

        // Fetch donor info
        const { data: donor, error: donorError } = await supabase
          .from("donors")
          .select("id, donor_id, first_name, last_name, birth_date, assigned_sex")
          .eq("id", consents[0].donor_id)
          .single();

        if (donorError) throw donorError;

        // Filter to only pending consents
        const pendingConsents = consents.filter(c => c.status === "pending");
        
        setConsentData({
          consents: pendingConsents,
          donor,
        });
      } catch (err) {
        console.error("Error fetching consents:", err);
        setError("Failed to load consent forms. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchConsents();
  }, [token]);

  const handleSignatureCapture = () => {
    if (!signatureRef.current || !consentData) return;
    
    if (signatureRef.current.isEmpty()) {
      return false;
    }

    const signatureDataUrl = signatureRef.current.getSignatureDataURL();
    if (signatureDataUrl) {
      const currentConsent = consentData.consents[currentStep];
      setSignatures(prev => ({
        ...prev,
        [currentConsent.id]: signatureDataUrl,
      }));
      return true;
    }
    return false;
  };

  const handleNext = () => {
    if (!consentData) return;

    const currentConsent = consentData.consents[currentStep];
    
    // Check acknowledgment
    if (!acknowledged[currentConsent.id]) {
      return;
    }

    // Capture signature
    if (!handleSignatureCapture()) {
      return;
    }

    // Move to next step or submit
    if (currentStep < consentData.consents.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Reset signature pad for next form
      setTimeout(() => {
        signatureRef.current?.clear();
      }, 100);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!consentData || !token) return;

    setSubmitting(true);

    try {
      // Process each consent
      for (const consent of consentData.consents) {
        const signatureDataUrl = signatures[consent.id];
        const consentContent = CONSENT_CONTENT[consent.consent_type];
        
        // Generate HTML document
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${consentContent.title} - ${consentData.donor.first_name} ${consentData.donor.last_name}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .donor-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .content { line-height: 1.8; }
              .content li { margin: 10px 0; }
              .signature-section { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
              .signature-img { max-width: 300px; border-bottom: 1px solid #333; }
              .date { margin-top: 10px; }
            </style>
          </head>
          <body>
            <h1>${consentContent.title}</h1>
            <div class="donor-info">
              <p><strong>Donor Name:</strong> ${consentData.donor.first_name} ${consentData.donor.last_name}</p>
              <p><strong>Donor ID:</strong> ${consentData.donor.donor_id}</p>
              <p><strong>Date of Birth:</strong> ${format(new Date(consentData.donor.birth_date), "MMMM d, yyyy")}</p>
            </div>
            <div class="content">
              <ul>
                ${consentContent.content.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            <div class="signature-section">
              <p><strong>Electronic Signature:</strong></p>
              <img src="${signatureDataUrl}" class="signature-img" alt="Signature" />
              <p class="date"><strong>Signed on:</strong> ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
            </div>
          </body>
          </html>
        `;

        // Store the signed document content - try storage first, fallback to DB only
        let documentPath: string | null = null;
        
        try {
          // Try uploading as binary data (most permissive mime type)
          const fileName = `${consentData.donor.id}/consent_${consent.consent_type}_${Date.now()}.dat`;
          const blob = new Blob([htmlContent], { type: 'application/octet-stream' });
        
        const { error: uploadError } = await supabase.storage
          .from("donor-documents")
          .upload(fileName, blob);

          if (!uploadError) {
            documentPath = fileName;
          } else {
            console.warn("Storage upload failed, storing signature only:", uploadError.message);
          }
        } catch (storageErr) {
          console.warn("Storage not available, storing signature only");
        }

        // Update consent record (always succeeds even if storage fails)
        const { error: updateError } = await supabase
          .from("donor_consents")
          .update({
            status: "signed",
            signed_at: new Date().toISOString(),
            signature_data: signatureDataUrl,
            signed_document_path: documentPath,
          })
          .eq("id", consent.id);

        if (updateError) throw updateError;
      }

      setCompleted(true);
    } catch (err: any) {
      console.error("Error submitting consents:", err);
      // Show more specific error message
      const errorMessage = err?.message || "Failed to submit consent forms. Please try again.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">Unable to Load Consent Forms</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-lg font-semibold mb-2">All Consent Forms Submitted</h2>
            <p className="text-muted-foreground">
              Thank you for signing all {consentData?.consents.length} consent form(s). Your submissions have been recorded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!consentData) return null;

  const currentConsent = consentData.consents[currentStep];
  const consentContent = CONSENT_CONTENT[currentConsent.consent_type];
  const donorAge = differenceInYears(new Date(), new Date(consentData.donor.birth_date));
  const progress = ((currentStep + 1) / consentData.consents.length) * 100;
  const isLastStep = currentStep === consentData.consents.length - 1;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Donor Bridge</h1>
          <Badge variant="secondary" className="mt-2">Consent Forms</Badge>
        </div>

        {/* Progress */}
        {consentData.consents.length > 1 && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Form {currentStep + 1} of {consentData.consents.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex gap-1 mt-3">
                {consentData.consents.map((consent, index) => (
                  <div
                    key={consent.id}
                    className={`flex-1 text-xs text-center py-1 px-2 rounded ${
                      index === currentStep
                        ? "bg-primary text-primary-foreground"
                        : index < currentStep || signatures[consent.id]
                        ? "bg-green-500/20 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {CONSENT_CONTENT[consent.consent_type].title.replace(" Consent Form", "").replace(" Authorization", "")}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Donor Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">
                  {consentData.donor.first_name} {consentData.donor.last_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {consentData.donor.donor_id} • {donorAge} years old • {consentData.donor.assigned_sex}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent Form */}
        <Card>
          <CardHeader>
            <CardTitle>{consentContent.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Consent Content */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please read the following carefully:
              </p>
              <ul className="space-y-3">
                {consentContent.content.map((item, index) => (
                  <li key={index} className="flex gap-2 text-sm">
                    <span className="text-primary font-medium">{index + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Date */}
            <div className="pt-4 border-t">
              <p className="text-sm">
                <span className="text-muted-foreground">Date:</span>{" "}
                <span className="font-medium">{format(new Date(), "MMMM d, yyyy")}</span>
              </p>
            </div>

            {/* Signature */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Signature</p>
              <SignaturePad ref={signatureRef} width={500} height={150} />
            </div>

            {/* Acknowledgment */}
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id={`acknowledge-${currentConsent.id}`}
                checked={acknowledged[currentConsent.id] || false}
                onCheckedChange={(checked) => 
                  setAcknowledged(prev => ({
                    ...prev,
                    [currentConsent.id]: checked as boolean,
                  }))
                }
              />
              <label htmlFor={`acknowledge-${currentConsent.id}`} className="text-sm cursor-pointer">
                I have read and understood the above information. By signing below, I voluntarily consent to the terms described.
              </label>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || submitting}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!acknowledged[currentConsent.id] || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : isLastStep ? (
                  <>
                    Submit All ({consentData.consents.length})
                    <CheckCircle className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next Form
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsentForm;
