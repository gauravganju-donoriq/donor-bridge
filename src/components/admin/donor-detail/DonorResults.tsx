import { useState, useEffect } from "react";
import { FlaskConical, Calendar, User, Clock, Pencil, Plus, ChevronDown } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import DonationResultsDialog, { type ExistingResult } from "@/components/admin/appointments/DonationResultsDialog";

interface DonorResultsProps {
  donorId: string;
  donorName?: string;
}

interface DonationResult {
  id: string;
  appointment_id: string;
  volume_ml: number | null;
  clots_vol_ml: number | null;
  final_vol_ml: number | null;
  cell_count: number | null;
  lot_number: string | null;
  lot_number_2: string | null;
  lot_number_3: string | null;
  lot_number_4: string | null;
  doctor_id: string | null;
  doctor_comments: string | null;
  lab_tech_id: string | null;
  exam_room_time: string | null;
  departure_time: string | null;
  created_at: string;
  doctor?: { full_name: string | null };
  lab_tech?: { full_name: string | null };
  appointment?: {
    appointment_date: string;
    donor_letter: string | null;
  };
}

interface AvailableAppointment {
  id: string;
  appointment_date: string;
  donor_letter: string | null;
  appointment_type: string | null;
}

const DonorResults = ({ donorId, donorName }: DonorResultsProps) => {
  const [results, setResults] = useState<DonationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<DonationResult | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [availableAppointments, setAvailableAppointments] = useState<AvailableAppointment[]>([]);
  const [addPopoverOpen, setAddPopoverOpen] = useState(false);

  useEffect(() => {
    fetchResults();
    fetchAvailableAppointments();
  }, [donorId]);

  const fetchResults = async () => {
    try {
      // First get appointments for this donor
      const { data: appointments, error: apptError } = await supabase
        .from("appointments")
        .select("id")
        .eq("donor_id", donorId);

      if (apptError) throw apptError;

      if (!appointments || appointments.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const appointmentIds = appointments.map(a => a.id);

      // Get donation results for those appointments
      const { data, error } = await supabase
        .from("donation_results")
        .select(`
          *,
          doctor:profiles!donation_results_doctor_id_fkey(full_name),
          lab_tech:profiles!donation_results_lab_tech_id_fkey(full_name),
          appointment:appointments(appointment_date, donor_letter)
        `)
        .in("appointment_id", appointmentIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error("Error fetching donation results:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAppointments = async () => {
    try {
      // Get completed appointments without results (any type)
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

      // Get existing results
      const { data: existingResults, error: resultsError } = await supabase
        .from("donation_results")
        .select("appointment_id")
        .in("appointment_id", appointments.map(a => a.id));

      if (resultsError) throw resultsError;

      const existingIds = new Set(existingResults?.map(r => r.appointment_id) || []);
      const available = appointments.filter(a => !existingIds.has(a.id));
      setAvailableAppointments(available);
    } catch (error) {
      console.error("Error fetching available appointments:", error);
    }
  };

  const handleEdit = (result: DonationResult) => {
    setSelectedResult(result);
    setEditDialogOpen(true);
  };

  const handleAddResult = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setAddPopoverOpen(false);
    setCreateDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchResults();
    fetchAvailableAppointments();
  };

  const totalVolume = results.reduce((sum, r) => sum + (r.final_vol_ml || r.volume_ml || 0), 0);
  const avgCellCount = results.length > 0
    ? results.reduce((sum, r) => sum + (r.cell_count || 0), 0) / results.filter(r => r.cell_count).length
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
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Total Donations</div>
              <div className="text-2xl font-bold">{results.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Total Volume</div>
              <div className="text-2xl font-bold">{totalVolume.toFixed(1)} ml</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Avg Cell Count</div>
              <div className="text-2xl font-bold">{avgCellCount ? avgCellCount.toFixed(2) : "—"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Donation Results ({results.length})
            </CardTitle>
            <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" disabled={availableAppointments.length === 0}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Result
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="end">
                <div className="text-sm font-medium mb-2 px-2">Select Completed Appointment</div>
                {availableAppointments.length === 0 ? (
                  <div className="text-sm text-muted-foreground px-2 py-4 text-center">
                    No completed appointments without results
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableAppointments.map((appt) => (
                      <Button
                        key={appt.id}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleAddResult(appt.id)}
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
            {results.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No donation results recorded</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Letter</TableHead>
                    <TableHead>Volume (ml)</TableHead>
                    <TableHead>Cell Count</TableHead>
                    <TableHead>Lot Numbers</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Times</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {result.appointment?.appointment_date
                              ? format(parseISO(result.appointment.appointment_date), "MMM d, yyyy")
                              : format(parseISO(result.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.appointment?.donor_letter ? (
                          <Badge variant="outline">{result.appointment.donor_letter}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{result.final_vol_ml || result.volume_ml || "—"}</div>
                          {result.clots_vol_ml && (
                            <div className="text-xs text-muted-foreground">
                              Clots: {result.clots_vol_ml}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{result.cell_count || "—"}</TableCell>
                      <TableCell>
                        <div className="text-sm space-y-0.5">
                          {result.lot_number && <div>{result.lot_number}</div>}
                          {result.lot_number_2 && <div className="text-muted-foreground">{result.lot_number_2}</div>}
                          {result.lot_number_3 && <div className="text-muted-foreground">{result.lot_number_3}</div>}
                          {result.lot_number_4 && <div className="text-muted-foreground">{result.lot_number_4}</div>}
                          {!result.lot_number && "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-0.5">
                          {result.doctor?.full_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {result.doctor.full_name}
                            </div>
                          )}
                          {result.lab_tech?.full_name && (
                            <div className="text-muted-foreground text-xs">
                              Lab: {result.lab_tech.full_name}
                            </div>
                          )}
                          {!result.doctor?.full_name && !result.lab_tech?.full_name && "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-0.5">
                          {result.exam_room_time && (
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              In: {result.exam_room_time}
                            </div>
                          )}
                          {result.departure_time && (
                            <div className="text-xs text-muted-foreground">
                              Out: {result.departure_time}
                            </div>
                          )}
                          {!result.exam_room_time && !result.departure_time && "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(result)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Comments Section */}
        {results.some(r => r.doctor_comments) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Doctor Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.filter(r => r.doctor_comments).map((result) => (
                  <div key={result.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      {result.appointment?.appointment_date
                        ? format(parseISO(result.appointment.appointment_date), "MMM d, yyyy")
                        : format(parseISO(result.created_at), "MMM d, yyyy")}
                    </div>
                    <p className="text-sm">{result.doctor_comments}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      {selectedResult && (
        <DonationResultsDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          appointmentId={selectedResult.appointment_id}
          donorId={donorId}
          donorName={donorName}
          existingResult={selectedResult as ExistingResult}
          onSuccess={handleSuccess}
        />
      )}

      {/* Create Dialog */}
      {selectedAppointmentId && (
        <DonationResultsDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          appointmentId={selectedAppointmentId}
          donorId={donorId}
          donorName={donorName}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default DonorResults;
