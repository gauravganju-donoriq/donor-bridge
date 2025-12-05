import { useState, useEffect } from "react";
import { Phone, Mail, CheckCircle, AlertCircle, Clock, Pencil, Plus, ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import FollowUpCompleteDialog, { type ExistingFollowUp } from "@/components/admin/appointments/FollowUpCompleteDialog";

interface DonorFollowUpsProps {
  donorId: string;
  donorName?: string;
}

interface FollowUp {
  id: string;
  appointment_id: string;
  status: string;
  pain_level: number | null;
  current_pain_level: number | null;
  staff_rating: number | null;
  nurse_rating: number | null;
  doctor_rating: number | null;
  took_pain_medication: boolean | null;
  pain_medication_details: string | null;
  checked_aspiration_sites: boolean | null;
  aspiration_sites_notes: string | null;
  signs_of_infection: boolean | null;
  infection_details: string | null;
  unusual_symptoms: boolean | null;
  symptoms_details: string | null;
  would_donate_again: boolean | null;
  procedure_feedback: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  appointment?: {
    appointment_date: string;
    donor_letter: string | null;
  };
  completed_by_profile?: {
    full_name: string | null;
  };
}

interface AvailableAppointment {
  id: string;
  appointment_date: string;
  donor_letter: string | null;
  appointment_type: string | null;
}

const DonorFollowUps = ({ donorId, donorName }: DonorFollowUpsProps) => {
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableAppointments, setAvailableAppointments] = useState<AvailableAppointment[]>([]);
  const [addPopoverOpen, setAddPopoverOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFollowUps();
    fetchAvailableAppointments();
  }, [donorId]);

  const fetchFollowUps = async () => {
    try {
      const { data, error } = await supabase
        .from("follow_ups")
        .select(`
          *,
          appointment:appointments(appointment_date, donor_letter),
          completed_by_profile:profiles!follow_ups_completed_by_fkey(full_name)
        `)
        .eq("donor_id", donorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFollowUps(data || []);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAppointments = async () => {
    try {
      // Get completed appointments (any type)
      const { data: appointments, error: apptError } = await supabase
        .from("appointments")
        .select("id, appointment_date, donor_letter, appointment_type")
        .eq("donor_id", donorId)
        .eq("status", "completed")
        .order("appointment_date", { ascending: false });

      if (apptError) throw apptError;

      if (!appointments || appointments.length === 0) {
        setAvailableAppointments([]);
        return;
      }

      // Get existing follow-ups
      const { data: existingFollowUps, error: followUpsError } = await supabase
        .from("follow_ups")
        .select("appointment_id")
        .in("appointment_id", appointments.map(a => a.id));

      if (followUpsError) throw followUpsError;

      const existingIds = new Set(existingFollowUps?.map(f => f.appointment_id) || []);
      const available = appointments.filter(a => !existingIds.has(a.id));
      setAvailableAppointments(available);
    } catch (error) {
      console.error("Error fetching available appointments:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "attempted_1":
        return <Badge variant="outline"><Phone className="h-3 w-3 mr-1" />Attempt 1</Badge>;
      case "attempted_2":
        return <Badge variant="outline" className="border-orange-500 text-orange-600"><Phone className="h-3 w-3 mr-1" />Attempt 2</Badge>;
      case "email_sent":
        return <Badge variant="outline"><Mail className="h-3 w-3 mr-1" />Email Sent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOpenDialog = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setDialogOpen(true);
  };

  const handleAddFollowUp = async (appointmentId: string) => {
    try {
      // Create new follow-up record
      const { data, error } = await supabase
        .from("follow_ups")
        .insert({
          appointment_id: appointmentId,
          donor_id: donorId,
          status: "pending",
        })
        .select(`
          *,
          appointment:appointments(appointment_date, donor_letter),
          completed_by_profile:profiles!follow_ups_completed_by_fkey(full_name)
        `)
        .single();

      if (error) throw error;

      setAddPopoverOpen(false);
      setSelectedFollowUp(data as FollowUp);
      setDialogOpen(true);
      
      // Refresh lists
      fetchFollowUps();
      fetchAvailableAppointments();
    } catch (error) {
      console.error("Error creating follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to create follow-up.",
        variant: "destructive",
      });
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSuccess = () => {
    fetchFollowUps();
    fetchAvailableAppointments();
  };

  const YesNoDisplay = ({ value, details, label }: { value: boolean | null; details?: string | null; label: string }) => {
    if (value === null) return null;
    return (
      <div className="flex items-start gap-2 py-1">
        <div className="flex items-center gap-1.5 min-w-[140px]">
          {value ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">{label}</span>
        </div>
        <span className="text-sm font-medium">{value ? "Yes" : "No"}</span>
        {details && <span className="text-sm text-muted-foreground">— {details}</span>}
      </div>
    );
  };

  const completedCount = followUps.filter(f => f.status === "completed").length;
  const pendingCount = followUps.filter(f => f.status !== "completed").length;
  const avgPainLevel = followUps.filter(f => f.pain_level).length > 0
    ? followUps.reduce((sum, f) => sum + (f.pain_level || 0), 0) / followUps.filter(f => f.pain_level).length
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Total Follow-Ups</div>
              <div className="text-2xl font-bold">{followUps.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Avg Pain Level</div>
              <div className="text-2xl font-bold">{avgPainLevel ? avgPainLevel.toFixed(1) : "—"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Follow-Ups List with Expandable Details */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Follow-Up History ({followUps.length})
            </CardTitle>
            <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" disabled={availableAppointments.length === 0}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Follow-Up
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="end">
                <div className="text-sm font-medium mb-2 px-2">Select Completed Appointment</div>
                {availableAppointments.length === 0 ? (
                  <div className="text-sm text-muted-foreground px-2 py-4 text-center">
                    No completed appointments without follow-ups
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableAppointments.map((appt) => (
                      <Button
                        key={appt.id}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleAddFollowUp(appt.id)}
                      >
                        <div>
                          <div className="font-medium">
                            {format(parseISO(appt.appointment_date), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {appt.appointment_type === "donation" ? "Donation" : "Screening"}
                            {appt.donor_letter && ` • Letter: ${appt.donor_letter}`}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No follow-ups recorded</p>
                <p className="text-sm">Follow-ups will appear here after donations are completed.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {followUps.map((followUp) => {
                  const isExpanded = expandedIds.has(followUp.id);
                  const hasDetails = followUp.status === "completed" && (
                    followUp.took_pain_medication !== null ||
                    followUp.checked_aspiration_sites !== null ||
                    followUp.signs_of_infection !== null ||
                    followUp.unusual_symptoms !== null ||
                    followUp.procedure_feedback ||
                    followUp.notes
                  );

                  return (
                    <Collapsible
                      key={followUp.id}
                      open={isExpanded}
                      onOpenChange={() => hasDetails && toggleExpanded(followUp.id)}
                    >
                      <div className="border rounded-lg">
                        {/* Summary Row */}
                        <div className="p-3 flex items-center gap-4">
                          {hasDetails && (
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          )}
                          {!hasDetails && <div className="w-6" />}
                          
                          <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                            <div>
                              <span className="text-sm font-medium">
                                {followUp.appointment?.appointment_date
                                  ? format(parseISO(followUp.appointment.appointment_date), "MMM d, yyyy")
                                  : format(parseISO(followUp.created_at), "MMM d, yyyy")}
                              </span>
                              {followUp.appointment?.donor_letter && (
                                <Badge variant="outline" className="ml-2">{followUp.appointment.donor_letter}</Badge>
                              )}
                            </div>
                            <div>{getStatusBadge(followUp.status)}</div>
                            <div className="text-sm">
                              {followUp.pain_level ? (
                                <span>Pain: {followUp.pain_level}→{followUp.current_pain_level || "?"}</span>
                              ) : "—"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(followUp.staff_rating || followUp.nurse_rating || followUp.doctor_rating) ? (
                                <span>
                                  {followUp.staff_rating && `S:${followUp.staff_rating}`}
                                  {followUp.nurse_rating && ` N:${followUp.nurse_rating}`}
                                  {followUp.doctor_rating && ` D:${followUp.doctor_rating}`}
                                </span>
                              ) : "—"}
                            </div>
                            <div>
                              {followUp.would_donate_again === true && (
                                <Badge className="bg-green-500/10 text-green-600">Would Donate</Badge>
                              )}
                              {followUp.would_donate_again === false && (
                                <Badge variant="destructive">Won't Donate</Badge>
                              )}
                            </div>
                            <div className="text-right">
                              {followUp.status === "completed" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenDialog(followUp)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenDialog(followUp)}
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Details */}
                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-0 ml-10 border-t">
                            <div className="pt-3 space-y-1">
                              <div className="text-xs font-medium text-muted-foreground mb-2">QUESTIONNAIRE DETAILS</div>
                              
                              <YesNoDisplay 
                                value={followUp.took_pain_medication} 
                                details={followUp.pain_medication_details}
                                label="Pain medication?"
                              />
                              <YesNoDisplay 
                                value={followUp.checked_aspiration_sites} 
                                details={followUp.aspiration_sites_notes}
                                label="Checked sites?"
                              />
                              <YesNoDisplay 
                                value={followUp.signs_of_infection} 
                                details={followUp.infection_details}
                                label="Signs of infection?"
                              />
                              <YesNoDisplay 
                                value={followUp.unusual_symptoms} 
                                details={followUp.symptoms_details}
                                label="Unusual symptoms?"
                              />
                              <YesNoDisplay 
                                value={followUp.would_donate_again} 
                                label="Would donate again?"
                              />

                              {followUp.procedure_feedback && (
                                <div className="pt-2">
                                  <div className="text-sm text-muted-foreground">Procedure Feedback:</div>
                                  <div className="text-sm">{followUp.procedure_feedback}</div>
                                </div>
                              )}

                              {followUp.notes && (
                                <div className="pt-2">
                                  <div className="text-sm text-muted-foreground">Notes:</div>
                                  <div className="text-sm">{followUp.notes}</div>
                                </div>
                              )}

                              {followUp.completed_by_profile?.full_name && (
                                <div className="pt-2 text-xs text-muted-foreground">
                                  Completed by: {followUp.completed_by_profile.full_name}
                                  {followUp.completed_at && ` on ${format(parseISO(followUp.completed_at), "MMM d, yyyy")}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedFollowUp && (
        <FollowUpCompleteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          followUpId={selectedFollowUp.id}
          donorName={donorName}
          existingFollowUp={selectedFollowUp as ExistingFollowUp}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default DonorFollowUps;
