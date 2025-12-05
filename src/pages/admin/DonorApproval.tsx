import { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Ruler,
  Scale,
  Brain,
  Play,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, differenceInYears } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import { EvaluationBadge } from "@/components/admin/screening/EvaluationBadge";
import { EvaluationDetails } from "@/components/admin/screening/EvaluationDetails";

interface EvaluationFlag {
  rule_key: string;
  rule_name: string;
  severity: string;
  message: string;
  rule_type: string;
  actual_value?: string | number | boolean;
}

// Use the base type from supabase and cast the JSON fields as needed
type Submission = Tables<"webform_submissions">;
type SubmissionStatus = "pending" | "approved" | "rejected" | "linked_to_donor";

const PAGE_SIZE = 10;

const DonorApproval = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [aiFilter, setAiFilter] = useState<"all" | "suitable" | "unsuitable" | "review_required" | "not_evaluated">("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Sheet & dialogs
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Fetch submissions
  useEffect(() => {
    fetchSubmissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, searchQuery, aiFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("webform_submissions")
        .select("*", { count: "exact" });

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as SubmissionStatus);
      }

      // Apply search
      if (searchQuery.trim()) {
        const search = searchQuery.trim().toLowerCase();
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,submission_id.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      // Apply AI filter
      if (aiFilter !== "all") {
        if (aiFilter === "not_evaluated") {
          query = query.is("ai_recommendation", null);
        } else {
          query = query.eq("ai_recommendation", aiFilter);
        }
      }

      // Pagination
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.order("created_at", { ascending: false }).range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setSubmissions(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load submissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, aiFilter]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getStatusBadge = (status: SubmissionStatus | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "linked_to_donor":
        return <Badge className="bg-blue-500/10 text-blue-600"><User className="h-3 w-3 mr-1" />Linked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const openSubmissionDetail = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReviewerNotes(submission.reviewer_notes || "");
    setSheetOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedSubmission || !user) return;

    setProcessing(true);
    try {
      // Create donor record from submission
      // Note: donor_id is auto-generated by database trigger
      const { data: donor, error: donorError } = await supabase
        .from("donors")
        .insert([{
          donor_id: "TEMP", // Will be overwritten by trigger
          first_name: selectedSubmission.first_name,
          last_name: selectedSubmission.last_name,
          birth_date: selectedSubmission.birth_date!,
          assigned_sex: selectedSubmission.assigned_sex as "male" | "female",
          email: selectedSubmission.email,
          cell_phone: selectedSubmission.phone,
          address_line_1: selectedSubmission.street_address,
          address_line_2: selectedSubmission.address_line_2,
          city: selectedSubmission.city,
          state: selectedSubmission.state,
          postal_code: selectedSubmission.zip_code,
          height_inches: selectedSubmission.height_feet && selectedSubmission.height_inches
            ? (selectedSubmission.height_feet * 12) + (selectedSubmission.height_inches || 0)
            : null,
          weight_pounds: selectedSubmission.weight,
          ethnicity: selectedSubmission.ethnicity?.join(", "),
          eligibility_status: "pending_review" as const,
          created_by: user.id,
        }])
        .select()
        .single();

      if (donorError) throw donorError;

      // Update submission status
      const { error: updateError } = await supabase
        .from("webform_submissions")
        .update({
          status: "approved",
          linked_donor_id: donor.id,
          reviewer_id: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewerNotes || null,
        })
        .eq("id", selectedSubmission.id);

      if (updateError) throw updateError;

      toast({
        title: "Submission Approved",
        description: `Donor record created: ${donor.donor_id}`,
      });

      setApproveDialogOpen(false);
      setSheetOpen(false);
      fetchSubmissions();
    } catch (error) {
      console.error("Error approving submission:", error);
      toast({
        title: "Error",
        description: "Failed to approve submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !user) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("webform_submissions")
        .update({
          status: "rejected",
          reviewer_id: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewerNotes || null,
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      toast({
        title: "Submission Rejected",
        description: "The submission has been rejected.",
      });

      setRejectDialogOpen(false);
      setSheetOpen(false);
      fetchSubmissions();
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast({
        title: "Error",
        description: "Failed to reject submission.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "Not provided"}</p>
      </div>
    </div>
  );

  const BooleanItem = ({ label, value, details }: { label: string; value: boolean | null; details: string | null }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm">{label}</span>
      <div className="text-right">
        <Badge variant={value ? "destructive" : "secondary"} className="text-xs">
          {value ? "Yes" : "No"}
        </Badge>
        {value && details && (
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{details}</p>
        )}
      </div>
    </div>
  );

  // Batch evaluate all not-evaluated submissions
  const [batchEvaluating, setBatchEvaluating] = useState(false);
  
  const handleBatchEvaluate = async () => {
    setBatchEvaluating(true);
    try {
      // Get all submissions that haven't been evaluated
      const { data: pendingSubmissions, error: fetchError } = await supabase
        .from("webform_submissions")
        .select("id")
        .is("ai_recommendation", null)
        .limit(50);

      if (fetchError) throw fetchError;

      if (!pendingSubmissions || pendingSubmissions.length === 0) {
        toast({
          title: "No Submissions to Evaluate",
          description: "All submissions have already been evaluated.",
        });
        return;
      }

      toast({
        title: "Batch Evaluation Started",
        description: `Evaluating ${pendingSubmissions.length} submission(s)...`,
      });

      // Process in batches of 3
      const batchSize = 3;
      let processed = 0;

      for (let i = 0; i < pendingSubmissions.length; i += batchSize) {
        const batch = pendingSubmissions.slice(i, i + batchSize);
        
        // Process batch in parallel
        await Promise.all(
          batch.map(async (sub) => {
            try {
              await supabase.functions.invoke("evaluate-submission", {
                body: { submission_id: sub.id, use_ai: false },
              });
              processed++;
            } catch (err) {
              console.error(`Failed to evaluate ${sub.id}:`, err);
            }
          })
        );
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < pendingSubmissions.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast({
        title: "Batch Evaluation Complete",
        description: `Successfully evaluated ${processed} of ${pendingSubmissions.length} submissions.`,
      });

      fetchSubmissions();
    } catch (error) {
      console.error("Batch evaluation error:", error);
      toast({
        title: "Error",
        description: "Failed to run batch evaluation.",
        variant: "destructive",
      });
    } finally {
      setBatchEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donor Approval</h1>
          <p className="text-muted-foreground">
            Review and approve webform submissions ({totalCount} total)
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleBatchEvaluate}
          disabled={batchEvaluating}
        >
          <Brain className={`h-4 w-4 mr-2 ${batchEvaluating ? "animate-pulse" : ""}`} />
          {batchEvaluating ? "Evaluating..." : "Evaluate All"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="linked_to_donor">Linked</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={aiFilter}
              onValueChange={(v) => setAiFilter(v as typeof aiFilter)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="AI Recommendation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All AI Results</SelectItem>
                <SelectItem value="suitable">✓ Suitable</SelectItem>
                <SelectItem value="unsuitable">✗ Unsuitable</SelectItem>
                <SelectItem value="review_required">⚠ Review Required</SelectItem>
                <SelectItem value="not_evaluated">Not Evaluated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Submissions
          </CardTitle>
          <CardDescription>Click on a row to view details and take action</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead className="hidden md:table-cell">Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">AI</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="text-muted-foreground">
                        {statusFilter === "pending"
                          ? "No pending submissions"
                          : "No submissions found"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => (
                    <TableRow
                      key={submission.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openSubmissionDetail(submission)}
                    >
                      <TableCell className="font-mono text-sm">
                        {submission.submission_id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {submission.first_name} {submission.last_name}
                        </div>
                        {submission.birth_date && (
                          <div className="text-xs text-muted-foreground">
                            {differenceInYears(new Date(), new Date(submission.birth_date))} years old
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          {submission.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{submission.email}</span>
                            </div>
                          )}
                          {submission.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {submission.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {submission.city && submission.state
                          ? `${submission.city}, ${submission.state}`
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {submission.created_at
                          ? format(new Date(submission.created_at), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <EvaluationBadge
                          recommendation={submission.ai_recommendation || null}
                          score={submission.ai_score}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          openSubmissionDetail(submission);
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <span className="text-sm text-muted-foreground">
              {totalCount === 0
                ? "No results"
                : `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, totalCount)} of ${totalCount}`}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="mx-2 text-sm">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedSubmission && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedSubmission.first_name} {selectedSubmission.last_name}
                  {getStatusBadge(selectedSubmission.status)}
                </SheetTitle>
                <SheetDescription>
                  Submission {selectedSubmission.submission_id} •{" "}
                  {selectedSubmission.created_at
                    ? format(new Date(selectedSubmission.created_at), "MMMM d, yyyy 'at' h:mm a")
                    : "Unknown date"}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* AI Pre-Screening Evaluation */}
                <EvaluationDetails
                  submissionId={selectedSubmission.id}
                  evaluation={selectedSubmission.ai_evaluation as unknown as Parameters<typeof EvaluationDetails>[0]["evaluation"]}
                  score={selectedSubmission.ai_score ?? null}
                  recommendation={selectedSubmission.ai_recommendation ?? null}
                  flags={(selectedSubmission.evaluation_flags as unknown as EvaluationFlag[]) ?? null}
                  evaluatedAt={selectedSubmission.evaluated_at ?? null}
                  onEvaluationComplete={fetchSubmissions}
                />

                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
                    <InfoItem icon={User} label="Name" value={`${selectedSubmission.first_name} ${selectedSubmission.last_name}`} />
                    <InfoItem icon={Calendar} label="Date of Birth" value={selectedSubmission.birth_date ? format(new Date(selectedSubmission.birth_date), "MMM d, yyyy") : null} />
                    <InfoItem icon={User} label="Assigned Sex" value={selectedSubmission.assigned_sex} />
                    <InfoItem icon={User} label="Ethnicity" value={selectedSubmission.ethnicity?.join(", ")} />
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
                    <InfoItem icon={Mail} label="Email" value={selectedSubmission.email} />
                    <InfoItem icon={Phone} label="Phone" value={selectedSubmission.phone} />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm">
                      {selectedSubmission.street_address || "Not provided"}
                      {selectedSubmission.address_line_2 && <><br />{selectedSubmission.address_line_2}</>}
                      <br />
                      {[selectedSubmission.city, selectedSubmission.state, selectedSubmission.zip_code].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                </div>

                {/* Physical Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Physical Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
                    <InfoItem
                      icon={Ruler}
                      label="Height"
                      value={selectedSubmission.height_feet ? `${selectedSubmission.height_feet}'${selectedSubmission.height_inches || 0}"` : null}
                    />
                    <InfoItem icon={Scale} label="Weight" value={selectedSubmission.weight ? `${selectedSubmission.weight} lbs` : null} />
                  </div>
                </div>

                {/* Medical History */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Medical History</h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <BooleanItem label="Chronic illness" value={selectedSubmission.has_chronic_illness} details={selectedSubmission.chronic_illness_details} />
                    <BooleanItem label="Takes medications" value={selectedSubmission.takes_medications} details={selectedSubmission.medication_details} />
                    <BooleanItem label="Had surgery" value={selectedSubmission.had_surgery} details={selectedSubmission.surgery_details} />
                    <BooleanItem label="Tattoos/Piercings" value={selectedSubmission.has_tattoos_piercings} details={selectedSubmission.tattoo_piercing_details} />
                    <BooleanItem label="Been pregnant" value={selectedSubmission.has_been_pregnant} details={selectedSubmission.pregnancy_details} />
                    <BooleanItem label="Blood disorder" value={selectedSubmission.has_blood_disorder} details={selectedSubmission.blood_disorder_details} />
                    <BooleanItem label="Received transfusion" value={selectedSubmission.has_received_transfusion} details={selectedSubmission.transfusion_details} />
                    <BooleanItem label="Been incarcerated" value={selectedSubmission.has_been_incarcerated} details={selectedSubmission.incarceration_details} />
                    <BooleanItem label="Traveled internationally" value={selectedSubmission.has_traveled_internationally} details={selectedSubmission.travel_details} />
                  </div>
                </div>

                {/* Acknowledgments */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Acknowledgments</h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedSubmission.acknowledge_info_accurate ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Information is accurate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedSubmission.acknowledge_health_screening ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Agrees to health screening</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedSubmission.acknowledge_time_commitment ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Understands time commitment</span>
                    </div>
                  </div>
                </div>

                {/* Reviewer Notes */}
                {selectedSubmission.status === "pending" && (
                  <div>
                    <Label htmlFor="notes">Reviewer Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about this submission..."
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* Previous Review Info */}
                {selectedSubmission.status !== "pending" && selectedSubmission.reviewer_notes && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Review Notes</h3>
                    <p className="text-sm bg-muted/30 rounded-lg p-4">{selectedSubmission.reviewer_notes}</p>
                    {selectedSubmission.reviewed_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Reviewed on {format(new Date(selectedSubmission.reviewed_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {selectedSubmission.status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button className="flex-1" onClick={() => setApproveDialogOpen(true)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Create Donor
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Submission</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new donor record from this submission. The donor will be assigned a unique ID and set to "Pending Review" status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={processing}>
              {processing ? "Creating..." : "Approve & Create Donor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this submission? This action can be reversed by an admin if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={processing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processing ? "Rejecting..." : "Reject Submission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DonorApproval;
