import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, AlertCircle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInYears } from "date-fns";
import SignaturePad, { SignaturePadRef } from "@/components/admin/donor-detail/SignaturePad";

interface ConsentData {
  id: string;
  consent_type: string;
  status: string;
  token_expires_at: string;
  donor: {
    id: string;
    donor_id: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    assigned_sex: string;
  };
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
  const navigate = useNavigate();
  const signatureRef = useRef<SignaturePadRef>(null);

  const [loading, setLoading] = useState(true);
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchConsent = async () => {
      if (!token) {
        setError("Invalid consent link");
        setLoading(false);
        return;
      }

      try {
        // Fetch consent with donor info
        const { data: consent, error: consentError } = await supabase
          .from("donor_consents")
          .select("id, consent_type, status, token_expires_at, donor_id")
          .eq("access_token", token)
          .maybeSingle();

        if (consentError) throw consentError;

        if (!consent) {
          setError("Consent request not found or link has expired");
          setLoading(false);
          return;
        }

        // Check if expired
        if (new Date(consent.token_expires_at) < new Date()) {
          setError("This consent link has expired. Please contact the clinic for a new link.");
          setLoading(false);
          return;
        }

        // Check if already signed
        if (consent.status === "signed") {
          setError("This consent form has already been signed.");
          setLoading(false);
          return;
        }

        // Check if revoked
        if (consent.status === "revoked") {
          setError("This consent request has been revoked. Please contact the clinic.");
          setLoading(false);
          return;
        }

        // Fetch donor info
        const { data: donor, error: donorError } = await supabase
          .from("donors")
          .select("id, donor_id, first_name, last_name, birth_date, assigned_sex")
          .eq("id", consent.donor_id)
          .single();

        if (donorError) throw donorError;

        setConsentData({
          ...consent,
          donor,
        });
      } catch (err) {
        console.error("Error fetching consent:", err);
        setError("Failed to load consent form. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchConsent();
  }, [token]);

  const handleSubmit = async () => {
    if (!consentData || !signatureRef.current || !token) return;

    if (signatureRef.current.isEmpty()) {
      return;
    }

    setSubmitting(true);

    try {
      const signatureDataUrl = signatureRef.current.getSignatureDataURL();
      
      // Generate HTML document
      const consentContent = CONSENT_CONTENT[consentData.consent_type];
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

      // Upload HTML document to storage
      const fileName = `${consentData.donor.id}/consent_${consentData.consent_type}_${Date.now()}.html`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      const { error: uploadError } = await supabase.storage
        .from("donor-documents")
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Update consent record
      const { error: updateError } = await supabase
        .from("donor_consents")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signature_data: signatureDataUrl,
          signed_document_path: fileName,
        })
        .eq("access_token", token);

      if (updateError) throw updateError;

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting consent:", err);
      setError("Failed to submit consent. Please try again.");
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
            <h2 className="text-lg font-semibold mb-2">Unable to Load Consent Form</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-lg font-semibold mb-2">Consent Submitted</h2>
            <p className="text-muted-foreground">
              Thank you for signing the consent form. Your submission has been recorded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!consentData) return null;

  const consentContent = CONSENT_CONTENT[consentData.consent_type];
  const donorAge = differenceInYears(new Date(), new Date(consentData.donor.birth_date));

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Lonza Donor Program</h1>
          <Badge variant="secondary" className="mt-2">Consent Form</Badge>
        </div>

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
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              />
              <label htmlFor="acknowledge" className="text-sm cursor-pointer">
                I have read and understood the above information. By signing below, I voluntarily consent to the terms described.
              </label>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={!acknowledged || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Consent"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsentForm;
