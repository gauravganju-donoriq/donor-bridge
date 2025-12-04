import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const Confirmation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
          
          <p className="text-muted-foreground mb-6">
            Your pre-screening application has been submitted successfully. Our team will review your information and contact you within 3-5 business days.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              If you have any questions, please contact us at{" "}
              <a href="mailto:info@example.com" className="text-primary hover:underline">
                info@example.com
              </a>
            </p>
          </div>
          
          <Button onClick={() => navigate("/")} className="w-full">
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Confirmation;
