import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { format, differenceInYears } from "date-fns";
import { Loader2, ClipboardList, CheckCircle2, AlertTriangle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QuestionnaireForm from "@/components/questionnaire/QuestionnaireForm";

interface DonorInfo {
  first_name: string;
  last_name: string;
  donor_id: string;
  birth_date: string;
  assigned_sex: string;
}

interface QuestionnaireData {
  id: string;
  donor_id: string;
  status: string;
  responses: Record<string, any>;
  donors: DonorInfo;
}

const Questionnaire = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (token) {
      fetchQuestionnaire();
    }
  }, [token]);

  const fetchQuestionnaire = async () => {
    try {
      const { data, error } = await supabase
        .from("health_questionnaires")
        .select(`
          id,
          donor_id,
          status,
          responses,
          token_expires_at,
          donors (
            first_name,
            last_name,
            donor_id,
            birth_date,
            assigned_sex
          )
        `)
        .eq("access_token", token)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError("Invalid or expired questionnaire link");
        return;
      }

      // Check if token is expired
      if (new Date(data.token_expires_at) < new Date()) {
        setError("This questionnaire link has expired. Please request a new link.");
        return;
      }

      if (data.status === "completed") {
        setCompleted(true);
      }

      setQuestionnaire(data as unknown as QuestionnaireData);
    } catch (err) {
      console.error("Error fetching questionnaire:", err);
      setError("Failed to load questionnaire");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (responses: Record<string, any>, isComplete: boolean) => {
    if (!questionnaire) return;

    try {
      const updates: any = {
        responses,
        status: isComplete ? "completed" : "in_progress",
        updated_at: new Date().toISOString(),
      };

      if (isComplete) {
        updates.completed_at = new Date().toISOString();
      } else if (questionnaire.status === "pending") {
        updates.started_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("health_questionnaires")
        .update(updates)
        .eq("access_token", token);

      if (error) throw error;

      if (isComplete) {
        setCompleted(true);
        toast.success("Questionnaire completed successfully!");
      } else {
        toast.success("Progress saved");
      }
    } catch (err) {
      console.error("Error saving questionnaire:", err);
      toast.error("Failed to save questionnaire");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold">Unable to Load Questionnaire</h2>
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
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <h2 className="text-xl font-semibold">Questionnaire Completed</h2>
            <p className="text-muted-foreground">
              Thank you! The health questionnaire has been submitted successfully.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const donor = questionnaire?.donors;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header with Donor Info */}
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">
                {donor?.first_name} {donor?.last_name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{donor?.donor_id}</span>
                <span>•</span>
                <span>
                  {donor?.birth_date && differenceInYears(new Date(), new Date(donor.birth_date))} years old
                </span>
                <span>•</span>
                <span className="capitalize">{donor?.assigned_sex}</span>
              </div>
            </div>
            <Badge variant="outline" className="hidden sm:flex">
              <ClipboardList className="h-3 w-3 mr-1" />
              Health Questionnaire
            </Badge>
          </div>
        </div>
      </div>

      {/* Questionnaire Form */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <QuestionnaireForm
          initialResponses={questionnaire?.responses || {}}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default Questionnaire;
