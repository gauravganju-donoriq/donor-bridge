import { useState, useEffect } from "react";
import { Phone, User, Calendar, Clock, AlertCircle, CheckCircle2, Mail, Bot, Loader2, Eye, PhoneMissed, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, parseISO, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import FollowUpCompleteDialog from "@/components/admin/appointments/FollowUpCompleteDialog";
import AICallDetailsDialog from "@/components/admin/voice-ai/AICallDetailsDialog";

interface FollowUpWithDetails {
  id: string;
  appointment_id: string;
  donor_id: string;
  status: "pending" | "attempted_1" | "attempted_2" | "completed" | "email_sent";
  pain_level: number | null;
  procedure_feedback: string | null;
  would_donate_again: boolean | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  ai_call_id: string | null;
  ai_call_status: string | null;
  ai_transcript: string | null;
  ai_recording_url: string | null;
  ai_parsed_responses: Record<string, unknown> | null;
  ai_call_duration_ms: number | null;
  ai_called_at: string | null;
  donors?: {
    id: string;
    donor_id: string;
    first_name: string;
    last_name: string;
    cell_phone: string | null;
  };
  appointments?: {
    appointment_date: string;
  };
}

const FollowUpsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState<FollowUpWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpWithDetails | null>(null);
  const [aiDetailsOpen, setAiDetailsOpen] = useState(false);
  const [selectedAiFollowUp, setSelectedAiFollowUp] = useState<FollowUpWithDetails | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [voiceAiEnabled, setVoiceAiEnabled] = useState(true);

  useEffect(() => {
    fetchFollowUps();
    checkVoiceAiEnabled();

    // Subscribe to realtime updates on follow_ups table
    const channel = supabase
      .channel('follow_ups_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follow_ups',
        },
        () => {
          // Refetch on any change
          fetchFollowUps();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFollowUps = async () => {
    try {
      const { data, error } = await supabase
        .from("follow_ups")
        .select(`
          *,
          donors:donor_id (
            id,
            donor_id,
            first_name,
            last_name,
            cell_phone
          ),
          appointments:appointment_id (
            appointment_date
          )
        `)
        .neq("status", "completed")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFollowUps((data || []) as FollowUpWithDetails[]);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkVoiceAiEnabled = async () => {
    try {
      const { data } = await supabase
        .from("voice_ai_settings")
        .select("setting_value")
        .eq("setting_key", "enabled")
        .single();

      setVoiceAiEnabled(data?.setting_value === "true");
    } catch (error) {
      console.error("Error checking voice AI status:", error);
    }
  };

  const handleAiCall = async (followUp: FollowUpWithDetails) => {
    if (!followUp.donors?.cell_phone) {
      toast({
        title: "No phone number",
        description: "This donor has no phone number on file.",
        variant: "destructive",
      });
      return;
    }

    setCallingId(followUp.id);
    try {
      const { data, error } = await supabase.functions.invoke("retell-initiate-call", {
        body: { follow_up_id: followUp.id },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "AI call initiated",
        description: `Calling ${followUp.donors.first_name} ${followUp.donors.last_name}...`,
      });

      // Refresh to show updated status
      setTimeout(fetchFollowUps, 2000);
    } catch (error) {
      console.error("Error initiating AI call:", error);
      toast({
        title: "Call failed",
        description: error instanceof Error ? error.message : "Failed to initiate AI call",
        variant: "destructive",
      });
    } finally {
      setCallingId(null);
    }
  };

  const handleViewAiDetails = (followUp: FollowUpWithDetails) => {
    setSelectedAiFollowUp(followUp);
    setAiDetailsOpen(true);
  };

  const handleApplyAiData = async () => {
    if (!selectedAiFollowUp?.ai_parsed_responses) return;

    const parsed = selectedAiFollowUp.ai_parsed_responses;
    
    try {
      const updateData: Record<string, unknown> = {};
      
      if (parsed.pain_level !== undefined) updateData.pain_level = parsed.pain_level;
      if (parsed.current_pain_level !== undefined) updateData.current_pain_level = parsed.current_pain_level;
      if (parsed.doctor_rating !== undefined) updateData.doctor_rating = parsed.doctor_rating;
      if (parsed.nurse_rating !== undefined) updateData.nurse_rating = parsed.nurse_rating;
      if (parsed.staff_rating !== undefined) updateData.staff_rating = parsed.staff_rating;
      if (parsed.took_pain_medication !== undefined) updateData.took_pain_medication = parsed.took_pain_medication;
      if (parsed.pain_medication_details !== undefined) updateData.pain_medication_details = parsed.pain_medication_details;
      if (parsed.checked_aspiration_sites !== undefined) updateData.checked_aspiration_sites = parsed.checked_aspiration_sites;
      if (parsed.aspiration_sites_notes !== undefined) updateData.aspiration_sites_notes = parsed.aspiration_sites_notes;
      if (parsed.signs_of_infection !== undefined) updateData.signs_of_infection = parsed.signs_of_infection;
      if (parsed.infection_details !== undefined) updateData.infection_details = parsed.infection_details;
      if (parsed.unusual_symptoms !== undefined) updateData.unusual_symptoms = parsed.unusual_symptoms;
      if (parsed.symptoms_details !== undefined) updateData.symptoms_details = parsed.symptoms_details;
      if (parsed.would_donate_again !== undefined) updateData.would_donate_again = parsed.would_donate_again;
      if (parsed.procedure_feedback !== undefined) updateData.procedure_feedback = parsed.procedure_feedback;

      // Mark as completed
      updateData.status = "completed";
      updateData.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from("follow_ups")
        .update(updateData)
        .eq("id", selectedAiFollowUp.id);

      if (error) throw error;

      toast({
        title: "Data applied",
        description: "AI-collected data has been applied and follow-up marked complete.",
      });

      setAiDetailsOpen(false);
      setSelectedAiFollowUp(null);
      fetchFollowUps();
    } catch (error) {
      console.error("Error applying AI data:", error);
      toast({
        title: "Error",
        description: "Failed to apply AI data.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: FollowUpWithDetails["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "attempted_1":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Attempt 1</Badge>;
      case "attempted_2":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Attempt 2</Badge>;
      case "email_sent":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Email Sent</Badge>;
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAiCallBadge = (followUp: FollowUpWithDetails) => {
    const status = followUp.ai_call_status;
    
    // Check if callback was requested (call completed but donor asked to call back)
    if (status === "completed" && followUp.ai_parsed_responses) {
      const parsed = followUp.ai_parsed_responses as Record<string, unknown>;
      if (parsed.call_successful === false) {
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            <PhoneMissed className="h-3 w-3 mr-1" />
            Callback Requested
          </Badge>
        );
      }
    }
    
    switch (status) {
      case "initiated":
      case "in_progress":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Calling...
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            AI Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            AI Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getUrgencyIndicator = (createdAt: string) => {
    const daysSinceCreated = differenceInDays(new Date(), parseISO(createdAt));
    if (daysSinceCreated > 3) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (daysSinceCreated > 1) {
      return <Clock className="h-4 w-4 text-amber-500" />;
    }
    return null;
  };

  const handleOpenDialog = (followUp: FollowUpWithDetails) => {
    setSelectedFollowUp(followUp);
    setDialogOpen(true);
  };

  // Summary stats
  const pendingCount = followUps.filter(f => f.status === "pending").length;
  const attemptedCount = followUps.filter(f => f.status === "attempted_1" || f.status === "attempted_2").length;
  const emailSentCount = followUps.filter(f => f.status === "email_sent").length;
  const overdueCount = followUps.filter(f => differenceInDays(new Date(), parseISO(f.created_at)) > 3).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Pending Calls</span>
            </div>
            <div className="text-xl font-semibold mt-1">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Attempted</span>
            </div>
            <div className="text-xl font-semibold mt-1">{attemptedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Email Sent</span>
            </div>
            <div className="text-xl font-semibold mt-1">{emailSentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Overdue (&gt;3 days)</span>
            </div>
            <div className="text-xl font-semibold text-destructive mt-1">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Phone className="h-4 w-4" />
            Pending Follow-Ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No pending follow-ups</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Donation Date</TableHead>
                  <TableHead>Days Since</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUps.map((followUp) => {
                  const daysSince = differenceInDays(new Date(), parseISO(followUp.created_at));
                  const isAiCalling = callingId === followUp.id || 
                    followUp.ai_call_status === "initiated" || 
                    followUp.ai_call_status === "in_progress";
                  
                  return (
                    <TableRow key={followUp.id}>
                      <TableCell>
                        {getUrgencyIndicator(followUp.created_at)}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center gap-2 cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/admin/donors/${followUp.donor_id}`)}
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {followUp.donors?.first_name} {followUp.donors?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {followUp.donors?.donor_id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {followUp.donors?.cell_phone || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {followUp.appointments?.appointment_date
                              ? format(parseISO(followUp.appointments.appointment_date), "MMM d, yyyy")
                              : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={daysSince > 3 ? "text-destructive font-medium" : ""}>
                          {daysSince} day{daysSince !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(followUp.status)}
                      </TableCell>
                      <TableCell>
                        {getAiCallBadge(followUp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* Show Retry button for failed calls or callback requested */}
                          {voiceAiEnabled && followUp.donors?.cell_phone && (
                            followUp.ai_call_status === "failed" || 
                            (followUp.ai_call_status === "completed" && 
                              followUp.ai_parsed_responses && 
                              (followUp.ai_parsed_responses as Record<string, unknown>).call_successful === false)
                          ) ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAiCall(followUp)}
                              disabled={isAiCalling}
                              className="text-amber-600 border-amber-500 hover:bg-amber-50"
                            >
                              {isAiCalling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4 mr-1" />
                              )}
                              {!isAiCalling && "Retry"}
                            </Button>
                          ) : voiceAiEnabled && followUp.donors?.cell_phone && !followUp.ai_call_id ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAiCall(followUp)}
                              disabled={isAiCalling}
                            >
                              {isAiCalling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Bot className="h-4 w-4" />
                              )}
                            </Button>
                          ) : null}
                          {followUp.ai_call_status === "completed" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewAiDetails(followUp)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" onClick={() => handleOpenDialog(followUp)}>
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedFollowUp && (
        <FollowUpCompleteDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedFollowUp(null);
          }}
          followUpId={selectedFollowUp.id}
          donorName={`${selectedFollowUp.donors?.first_name} ${selectedFollowUp.donors?.last_name}`}
          onSuccess={fetchFollowUps}
        />
      )}

      {selectedAiFollowUp && (
        <AICallDetailsDialog
          open={aiDetailsOpen}
          onOpenChange={(open) => {
            setAiDetailsOpen(open);
            if (!open) setSelectedAiFollowUp(null);
          }}
          transcript={selectedAiFollowUp.ai_transcript}
          recordingUrl={selectedAiFollowUp.ai_recording_url}
          parsedResponses={selectedAiFollowUp.ai_parsed_responses as Record<string, unknown> | null}
          callDurationMs={selectedAiFollowUp.ai_call_duration_ms}
          callStatus={selectedAiFollowUp.ai_call_status}
          calledAt={selectedAiFollowUp.ai_called_at}
          onApplyData={handleApplyAiData}
        />
      )}
    </div>
  );
};

export default FollowUpsDashboard;
