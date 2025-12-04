import { useState, useEffect } from "react";
import { Phone, User, Calendar, Clock, AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import FollowUpCompleteDialog from "@/components/admin/appointments/FollowUpCompleteDialog";

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
  const [followUps, setFollowUps] = useState<FollowUpWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpWithDetails | null>(null);

  useEffect(() => {
    fetchFollowUps();
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
      setFollowUps(data || []);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
    } finally {
      setLoading(false);
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
            <div className="text-2xl font-bold mt-1">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Attempted</span>
            </div>
            <div className="text-2xl font-bold mt-1">{attemptedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Email Sent</span>
            </div>
            <div className="text-2xl font-bold mt-1">{emailSentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Overdue (&gt;3 days)</span>
            </div>
            <div className="text-2xl font-bold text-destructive mt-1">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Pending Follow-Ups
          </CardTitle>
          <CardDescription>
            Mandatory post-donation follow-up calls. Contact donors within 48 hours of donation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-sm">No pending follow-ups at this time.</p>
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
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUps.map((followUp) => {
                  const daysSince = differenceInDays(new Date(), parseISO(followUp.created_at));
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
                        <Button size="sm" onClick={() => handleOpenDialog(followUp)}>
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
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
    </div>
  );
};

export default FollowUpsDashboard;
