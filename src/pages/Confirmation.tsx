import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, Mail, Phone } from "lucide-react";

const Confirmation = () => {
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get("id");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>Thank you for your interest in becoming a bone marrow donor.</p>
            <p className="mt-2">Your application has been received and is being reviewed.</p>
          </div>

          {submissionId && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Reference Number</p>
              <p className="text-xl font-semibold font-mono">{submissionId}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Please save this number for your records
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">What happens next?</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">1.</span>
                Our team will review your application within 2-3 business days.
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">2.</span>
                If approved, we'll contact you to schedule a screening appointment.
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">3.</span>
                During screening, we'll conduct additional health assessments.
              </li>
            </ol>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Questions?</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:donors@donorbridge.com" className="text-primary hover:underline">
                  donors@donorbridge.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+1-800-555-0123" className="text-primary hover:underline">
                  1-800-555-0123
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button asChild className="w-full">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Confirmation;
