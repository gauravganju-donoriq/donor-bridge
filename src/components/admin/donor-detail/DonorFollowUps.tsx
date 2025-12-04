import { useState, useEffect } from "react";
import { Phone, Mail, CheckCircle, AlertCircle, Clock, Pencil } from "lucide-react";
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
import { format, parseISO } from "date-fns";
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

const DonorFollowUps = ({ donorId, donorName }: DonorFollowUpsProps) => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchFollowUps();
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

        {/* Follow-Ups Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Follow-Up History ({followUps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No follow-ups recorded</p>
                <p className="text-sm">Follow-ups will appear here after donations are completed.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Letter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pain Level</TableHead>
                    <TableHead>Ratings</TableHead>
                    <TableHead>Donate Again?</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followUps.map((followUp) => (
                    <TableRow key={followUp.id}>
                      <TableCell>
                        <span className="text-sm">
                          {followUp.appointment?.appointment_date
                            ? format(parseISO(followUp.appointment.appointment_date), "MMM d, yyyy")
                            : format(parseISO(followUp.created_at), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {followUp.appointment?.donor_letter ? (
                          <Badge variant="outline">{followUp.appointment.donor_letter}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(followUp.status)}</TableCell>
                      <TableCell>
                        {followUp.pain_level ? (
                          <div className="space-y-0.5">
                            <div className="text-sm">Procedure: {followUp.pain_level}/10</div>
                            {followUp.current_pain_level && (
                              <div className="text-xs text-muted-foreground">
                                Current: {followUp.current_pain_level}/10
                              </div>
                            )}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {(followUp.staff_rating || followUp.nurse_rating || followUp.doctor_rating) ? (
                          <div className="text-xs space-y-0.5">
                            {followUp.staff_rating && <div>Staff: {followUp.staff_rating}/10</div>}
                            {followUp.nurse_rating && <div>Nurse: {followUp.nurse_rating}/10</div>}
                            {followUp.doctor_rating && <div>Doctor: {followUp.doctor_rating}/10</div>}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {followUp.would_donate_again === true && (
                          <Badge className="bg-green-500/10 text-green-600">Yes</Badge>
                        )}
                        {followUp.would_donate_again === false && (
                          <Badge variant="destructive">No</Badge>
                        )}
                        {followUp.would_donate_again === null && "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Feedback Section */}
        {followUps.some(f => f.procedure_feedback || f.notes) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Feedback & Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {followUps.filter(f => f.procedure_feedback || f.notes).map((followUp) => (
                  <div key={followUp.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span>
                        {followUp.appointment?.appointment_date
                          ? format(parseISO(followUp.appointment.appointment_date), "MMM d, yyyy")
                          : format(parseISO(followUp.created_at), "MMM d, yyyy")}
                      </span>
                      {followUp.completed_by_profile?.full_name && (
                        <>
                          <span>•</span>
                          <span>Completed by: {followUp.completed_by_profile.full_name}</span>
                        </>
                      )}
                    </div>
                    {followUp.procedure_feedback && (
                      <p className="text-sm mb-1"><strong>Feedback:</strong> {followUp.procedure_feedback}</p>
                    )}
                    {followUp.notes && (
                      <p className="text-sm text-muted-foreground"><strong>Notes:</strong> {followUp.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedFollowUp && (
        <FollowUpCompleteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          followUpId={selectedFollowUp.id}
          donorName={donorName}
          existingFollowUp={selectedFollowUp as ExistingFollowUp}
          onSuccess={fetchFollowUps}
        />
      )}
    </>
  );
};

export default DonorFollowUps;
