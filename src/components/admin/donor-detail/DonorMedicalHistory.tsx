import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Copy, ExternalLink, Loader2, CheckCircle2, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import QuestionnaireForm from "@/components/questionnaire/QuestionnaireForm";
import { HEALTH_QUESTIONS } from "@/data/healthQuestionnaireQuestions";

type Donor = Tables<"donors">;

interface HealthQuestionnaire {
  id: string;
  status: string;
  access_token: string;
  token_expires_at: string;
  responses: Record<string, any>;
  created_at: string;
  completed_at: string | null;
}

interface DonorMedicalHistoryProps {
  donor: Donor;
  formData: Partial<Donor>;
  setFormData: (data: Partial<Donor>) => void;
  editMode: boolean;
}

const DonorMedicalHistory = ({ donor, formData, setFormData, editMode }: DonorMedicalHistoryProps) => {
  const { user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<HealthQuestionnaire[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(true);
  const [creatingLink, setCreatingLink] = useState(false);
  const [newLinkDialogOpen, setNewLinkDialogOpen] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<HealthQuestionnaire | null>(null);

  useEffect(() => {
    fetchQuestionnaires();
  }, [donor.id]);

  const fetchQuestionnaires = async () => {
    try {
      const { data, error } = await supabase
        .from("health_questionnaires")
        .select("*")
        .eq("donor_id", donor.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestionnaires((data || []) as unknown as HealthQuestionnaire[]);
    } catch (err) {
      console.error("Error fetching questionnaires:", err);
    } finally {
      setLoadingQuestionnaires(false);
    }
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const createQuestionnaireLink = async () => {
    if (!user) return;

    setCreatingLink(true);
    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      const { error } = await supabase.from("health_questionnaires").insert({
        donor_id: donor.id,
        access_token: token,
        token_expires_at: expiresAt.toISOString(),
        created_by: user.id,
      });

      if (error) throw error;

      const link = `${window.location.origin}/questionnaire/${token}`;
      setNewLink(link);
      setNewLinkDialogOpen(true);
      fetchQuestionnaires();
    } catch (err) {
      console.error("Error creating questionnaire:", err);
      toast.error("Failed to create questionnaire link");
    } finally {
      setCreatingLink(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(newLink);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const openLink = () => {
    window.open(newLink, "_blank");
  };

  const viewQuestionnaire = (q: HealthQuestionnaire) => {
    setSelectedQuestionnaire(q);
    setViewDialogOpen(true);
  };

  const updateField = (field: keyof Donor, value: unknown) => {
    setFormData({ ...formData, [field]: value });
  };

  const getBMI = () => {
    const height = formData.height_inches || donor.height_inches;
    const weight = formData.weight_pounds || donor.weight_pounds;
    
    if (height && weight) {
      const bmi = (weight / (height * height)) * 703;
      return bmi.toFixed(1);
    }
    return donor.bmi?.toFixed(1) || "—";
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", variant: "secondary" as const };
    if (bmi < 25) return { label: "Normal", variant: "default" as const };
    if (bmi < 30) return { label: "Overweight", variant: "secondary" as const };
    return { label: "Obese", variant: "destructive" as const };
  };

  const bmiValue = parseFloat(getBMI());
  const bmiCategory = !isNaN(bmiValue) ? getBMICategory(bmiValue) : null;

  const formatHeight = (inches: number | null) => {
    if (!inches) return "—";
    return `${Math.floor(inches / 12)}'${inches % 12}"`;
  };

  const FieldDisplay = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="space-y-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );

  const getQuestionnaireStats = (responses: Record<string, any>) => {
    const answered = Object.keys(responses).length;
    const yesCount = Object.values(responses).filter((r: any) => r.answer === true).length;
    return { answered, yesCount };
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Physical Measurements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Physical Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {editMode ? (
                <>
                  <Label htmlFor="height_inches" className="text-sm">Height (inches)</Label>
                  <Input
                    id="height_inches"
                    type="number"
                    value={formData.height_inches || ""}
                    onChange={(e) => updateField("height_inches", parseInt(e.target.value) || null)}
                    placeholder="e.g., 68"
                  />
                </>
              ) : (
                <FieldDisplay label="Height" value={formatHeight(donor.height_inches)} />
              )}
            </div>
            <div className="space-y-1.5">
              {editMode ? (
                <>
                  <Label htmlFor="weight_pounds" className="text-sm">Weight (lbs)</Label>
                  <Input
                    id="weight_pounds"
                    type="number"
                    value={formData.weight_pounds || ""}
                    onChange={(e) => updateField("weight_pounds", parseInt(e.target.value) || null)}
                    placeholder="e.g., 150"
                  />
                </>
              ) : (
                <FieldDisplay label="Weight" value={donor.weight_pounds ? `${donor.weight_pounds} lbs` : null} />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">BMI</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{getBMI()}</span>
              {bmiCategory && (
                <Badge variant={bmiCategory.variant}>
                  {bmiCategory.label}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Medical Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            {editMode ? (
              <>
                <Label htmlFor="cmv_positive" className="text-sm">CMV Status</Label>
                <Select
                  value={formData.cmv_positive || "unknown"}
                  onValueChange={(value) => updateField("cmv_positive", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              <FieldDisplay label="CMV Status" value={donor.cmv_positive} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Lifestyle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Tobacco Use</p>
                <p className="text-sm text-muted-foreground">Uses tobacco products</p>
              </div>
              {editMode ? (
                <Switch
                  checked={formData.tobacco_use || false}
                  onCheckedChange={(checked) => updateField("tobacco_use", checked)}
                />
              ) : (
                <Badge variant={donor.tobacco_use ? "destructive" : "secondary"}>
                  {donor.tobacco_use ? "Yes" : "No"}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Alcohol Use</p>
                <p className="text-sm text-muted-foreground">Consumes alcohol</p>
              </div>
              {editMode ? (
                <Switch
                  checked={formData.alcohol_use || false}
                  onCheckedChange={(checked) => updateField("alcohol_use", checked)}
                />
              ) : (
                <Badge variant="secondary">
                  {donor.alcohol_use ? "Yes" : "No"}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Questionnaires */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Health Questionnaires</CardTitle>
          <Button size="sm" onClick={createQuestionnaireLink} disabled={creatingLink}>
            {creatingLink ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ClipboardList className="h-4 w-4 mr-1" />
            )}
            New Questionnaire
          </Button>
        </CardHeader>
        <CardContent>
          {loadingQuestionnaires ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : questionnaires.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No health questionnaires yet.</p>
              <p className="text-xs mt-1">Click "New Questionnaire" to create an iPad-friendly link.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {questionnaires.map((q) => {
                const stats = getQuestionnaireStats(q.responses || {});
                const isExpired = new Date(q.token_expires_at) < new Date();
                
                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {q.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(q.created_at), "MMM d, yyyy h:mm a")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {q.status === "completed" ? (
                            <>Completed • {stats.answered}/{HEALTH_QUESTIONS.length} answered • {stats.yesCount} "Yes" responses</>
                          ) : q.status === "in_progress" ? (
                            <>In Progress • {stats.answered}/{HEALTH_QUESTIONS.length} answered</>
                          ) : isExpired ? (
                            <span className="text-destructive">Link expired</span>
                          ) : (
                            <>Pending • Expires {format(new Date(q.token_expires_at), "MMM d, h:mm a")}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {q.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewQuestionnaire(q)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                      {!isExpired && q.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = `${window.location.origin}/questionnaire/${q.access_token}`;
                            navigator.clipboard.writeText(link);
                            toast.success("Link copied");
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Link Dialog */}
      <Dialog open={newLinkDialogOpen} onOpenChange={setNewLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Questionnaire Link Created</DialogTitle>
            <DialogDescription>
              Share this link on the iPad to fill out the health questionnaire. The link expires in 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {newLink}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={copyLink}>
                <Copy className="h-4 w-4 mr-1" />
                Copy Link
              </Button>
              <Button variant="outline" onClick={openLink}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Questionnaire Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Health Questionnaire Responses</DialogTitle>
            <DialogDescription>
              Completed on {selectedQuestionnaire?.completed_at && format(new Date(selectedQuestionnaire.completed_at), "MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>
          {selectedQuestionnaire && (
            <QuestionnaireForm
              initialResponses={selectedQuestionnaire.responses || {}}
              onSave={async () => {}}
              readOnly
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonorMedicalHistory;
