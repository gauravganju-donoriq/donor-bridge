import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Link2, 
  Loader2,
  AlertCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SubmissionStatus {
  submission_id: string;
  status: string;
  first_name: string;
  created_at: string;
  reviewed_at: string | null;
}

const StatusLookup = () => {
  const [submissionId, setSubmissionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedId = submissionId.trim().toUpperCase();
    if (!trimmedId) {
      setError("Please enter a submission ID");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);

    try {
      const { data, error: fetchError } = await supabase
        .from("webform_submissions")
        .select("submission_id, status, first_name, created_at, reviewed_at")
        .eq("submission_id", trimmedId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setResult(data);
      } else {
        setError("No application found with this reference number. Please check the ID and try again.");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError("Unable to look up your application status. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return {
          badge: <Badge variant="secondary" className="text-base py-1 px-3"><Clock className="h-4 w-4 mr-2" />Under Review</Badge>,
          message: "Your application is currently being reviewed by our team. We typically complete reviews within 2-3 business days.",
          color: "text-muted-foreground"
        };
      case "approved":
        return {
          badge: <Badge className="bg-green-500/10 text-green-600 text-base py-1 px-3"><CheckCircle2 className="h-4 w-4 mr-2" />Approved</Badge>,
          message: "Congratulations! Your application has been approved. Our team will contact you soon to schedule your screening appointment.",
          color: "text-green-600"
        };
      case "rejected":
        return {
          badge: <Badge variant="destructive" className="text-base py-1 px-3"><XCircle className="h-4 w-4 mr-2" />Not Eligible</Badge>,
          message: "Unfortunately, based on the information provided, you do not meet our eligibility requirements at this time. If you have questions, please contact us.",
          color: "text-destructive"
        };
      case "linked_to_donor":
        return {
          badge: <Badge className="bg-blue-500/10 text-blue-600 text-base py-1 px-3"><Link2 className="h-4 w-4 mr-2" />Processed</Badge>,
          message: "Your application has been processed and linked to your donor profile. Our team will be in touch with next steps.",
          color: "text-blue-600"
        };
      default:
        return {
          badge: <Badge variant="outline" className="text-base py-1 px-3">Unknown</Badge>,
          message: "Please contact us for more information about your application status.",
          color: "text-muted-foreground"
        };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Button 
          variant="ghost" 
          asChild
          className="mb-4"
        >
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Application Status</CardTitle>
            <CardDescription>
              Enter your reference number to check your application status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="submissionId">Reference Number</Label>
                <Input
                  id="submissionId"
                  placeholder="WF-000000"
                  value={submissionId}
                  onChange={(e) => setSubmissionId(e.target.value)}
                  className="text-center text-lg font-mono"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Your reference number was provided when you submitted your application
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
            </form>

            {/* Results */}
            {searched && !loading && (
              <div className="border-t pt-6">
                {error ? (
                  <div className="text-center space-y-3">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">{error}</p>
                  </div>
                ) : result ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      {getStatusDisplay(result.status).badge}
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-mono font-medium">{result.submission_id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Applicant</span>
                        <span className="font-medium">{result.first_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Submitted</span>
                        <span>{formatDate(result.created_at)}</span>
                      </div>
                      {result.reviewed_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Reviewed</span>
                          <span>{formatDate(result.reviewed_at)}</span>
                        </div>
                      )}
                    </div>

                    <p className={`text-sm text-center ${getStatusDisplay(result.status).color}`}>
                      {getStatusDisplay(result.status).message}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Contact Info */}
            <div className="border-t pt-4 text-center text-sm text-muted-foreground">
              <p>Need help? Contact us at</p>
              <a href="mailto:donors@donorbridge.com" className="text-primary hover:underline">
                donors@donorbridge.com
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatusLookup;
