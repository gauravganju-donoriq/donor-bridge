import { useState, useEffect } from "react";
import { Copy, ExternalLink, Loader2, CheckCircle2, Clock, Eye, ClipboardList, Trash2, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import QuestionnaireForm from "@/components/questionnaire/QuestionnaireForm";
import { HEALTH_QUESTIONS } from "@/data/healthQuestionnaireQuestions";

interface DonorHealthQuestionnaireProps {
  donorId: string;
  donorName?: string;
}

interface HealthQuestionnaire {
  id: string;
  status: string;
  access_token: string;
  token_expires_at: string;
  responses: Record<string, any>;
  created_at: string;
  completed_at: string | null;
}

const DonorHealthQuestionnaire = ({ donorId, donorName = "Donor" }: DonorHealthQuestionnaireProps) => {
  const { user, isAdmin } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<HealthQuestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingLink, setCreatingLink] = useState(false);
  const [newLinkDialogOpen, setNewLinkDialogOpen] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<HealthQuestionnaire | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionnaireToDelete, setQuestionnaireToDelete] = useState<HealthQuestionnaire | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchQuestionnaires();
  }, [donorId]);

  const fetchQuestionnaires = async () => {
    try {
      const { data, error } = await supabase
        .from("health_questionnaires")
        .select("*")
        .eq("donor_id", donorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestionnaires((data || []) as unknown as HealthQuestionnaire[]);
    } catch (err) {
      console.error("Error fetching questionnaires:", err);
      toast.error("Failed to load questionnaires");
    } finally {
      setLoading(false);
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
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase.from("health_questionnaires").insert({
        donor_id: donorId,
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

  const copyLink = async (link?: string) => {
    try {
      await navigator.clipboard.writeText(link || newLink);
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

  const handleDeleteClick = (q: HealthQuestionnaire) => {
    setQuestionnaireToDelete(q);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!questionnaireToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("health_questionnaires")
        .delete()
        .eq("id", questionnaireToDelete.id);

      if (error) throw error;

      toast.success("Questionnaire deleted");
      fetchQuestionnaires();
    } catch (error) {
      console.error("Error deleting questionnaire:", error);
      toast.error("Failed to delete questionnaire");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setQuestionnaireToDelete(null);
    }
  };

  const getQuestionnaireStats = (responses: Record<string, any>) => {
    const answered = Object.keys(responses).length;
    const yesCount = Object.values(responses).filter((r: any) => r.answer === true).length;
    return { answered, yesCount };
  };

  // Check if there's an active (pending/in-progress) questionnaire
  const hasActiveQuestionnaire = questionnaires.some(q => {
    const isExpired = new Date(q.token_expires_at) < new Date();
    return (q.status === "pending" || q.status === "in_progress") && !isExpired;
  });

  const getStatusBadge = (q: HealthQuestionnaire) => {
    const isExpired = new Date(q.token_expires_at) < new Date();
    
    if (q.status === "completed") {
      return (
        <Badge className="bg-green-500/10 text-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    if (q.status === "in_progress") {
      return (
        <Badge className="bg-blue-500/10 text-blue-600">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/10 text-yellow-600">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">
          Health Questionnaire
        </CardTitle>
        <Button 
          size="sm" 
          onClick={createQuestionnaireLink} 
          disabled={creatingLink || hasActiveQuestionnaire}
          title={hasActiveQuestionnaire ? "Complete or delete the active questionnaire first" : undefined}
        >
          {creatingLink ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4 mr-1" />
          )}
          Generate Link
        </Button>
      </CardHeader>
      <CardContent>
        {questionnaires.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm font-medium mb-1">No Health Questionnaires</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Generate a link to send to {donorName} to fill out the health questionnaire on an iPad or phone.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {questionnaires.map((q) => {
              const stats = getQuestionnaireStats(q.responses || {});
              const isExpired = new Date(q.token_expires_at) < new Date();
              const isActive = (q.status === "pending" || q.status === "in_progress") && !isExpired;
              const canDelete = q.status !== "completed";

              return (
                <div
                  key={q.id}
                  className="p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(q)}
                      <span className="text-xs text-muted-foreground">
                        {q.status === "completed" && q.completed_at
                          ? `Completed ${format(new Date(q.completed_at), "MMM d, yyyy")}`
                          : isActive
                          ? `Expires ${format(new Date(q.token_expires_at), "MMM d, yyyy")}`
                          : `Created ${format(new Date(q.created_at), "MMM d, yyyy")}`}
                      </span>
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
                      {isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(`${window.location.origin}/questionnaire/${q.access_token}`)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                      )}
                      {canDelete && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(q)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats for completed questionnaires */}
                  {q.status === "completed" && (
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2 pt-2 border-t">
                      <span>{stats.answered} of {HEALTH_QUESTIONS.length} questions answered</span>
                      <span>{stats.yesCount} "Yes" responses</span>
                    </div>
                  )}
                  
                  {/* Progress for in-progress */}
                  {q.status === "in_progress" && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      {stats.answered} of {HEALTH_QUESTIONS.length} questions answered
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* New Link Dialog */}
      <Dialog open={newLinkDialogOpen} onOpenChange={setNewLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Questionnaire Link Created</DialogTitle>
            <DialogDescription>
              Share this link with {donorName} to fill out the health questionnaire. The link expires in 7 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {newLink}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => copyLink()}>
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
              {selectedQuestionnaire?.completed_at && 
                `Completed on ${format(new Date(selectedQuestionnaire.completed_at), "MMMM d, yyyy 'at' h:mm a")}`
              }
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Questionnaire</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this questionnaire request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default DonorHealthQuestionnaire;
