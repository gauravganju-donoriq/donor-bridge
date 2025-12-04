import { useState, useEffect } from "react";
import { Plus, DollarSign, Calendar, FileText, MoreHorizontal, Trash2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import PaymentEntryDialog from "@/components/admin/appointments/PaymentEntryDialog";

interface DonorPaymentsProps {
  donorId: string;
}

interface Payment {
  id: string;
  donor_id: string;
  appointment_id: string | null;
  payment_type: "screening" | "donation";
  amount: number;
  check_number: string | null;
  check_date: string | null;
  received_date: string | null;
  date_ordered: string | null;
  date_issued: string | null;
  check_issued: boolean;
  check_mailed: boolean;
  check_voided: boolean;
  memo: string | null;
  comment: string | null;
  created_at: string;
  created_by: string | null;
}

const DonorPayments = ({ donorId }: DonorPaymentsProps) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [donorId]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("donor_id", donorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPaymentId) return;

    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", selectedPaymentId);

      if (error) throw error;

      setPayments(prev => prev.filter(p => p.id !== selectedPaymentId));
      toast({
        title: "Payment deleted",
        description: "The payment record has been removed.",
      });
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({
        title: "Error",
        description: "Failed to delete payment.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPaymentId(null);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const screeningPayments = payments.filter(p => p.payment_type === "screening");
  const donationPayments = payments.filter(p => p.payment_type === "donation");

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
              <div className="text-sm text-muted-foreground">Total Paid</div>
              <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Screening Payments</div>
              <div className="text-xl font-semibold">{screeningPayments.length} × $150</div>
              <div className="text-sm text-muted-foreground">${screeningPayments.length * 150}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Donation Payments</div>
              <div className="text-xl font-semibold">{donationPayments.length} × $450</div>
              <div className="text-sm text-muted-foreground">${donationPayments.length * 450}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Payment History ({payments.length})
            </CardTitle>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Payment
            </Button>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No payments recorded</p>
                <p className="text-sm">Click "Add Payment" to record one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Check #</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className={payment.check_voided ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {payment.date_ordered
                              ? format(parseISO(payment.date_ordered), "MMM d, yyyy")
                              : format(parseISO(payment.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={payment.payment_type === "donation" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {payment.payment_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${payment.check_voided ? "line-through text-muted-foreground" : "text-green-600"}`}>
                          ${payment.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {payment.check_number ? (
                          <div className="flex items-center gap-1 text-sm">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            {payment.check_number}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.received_date
                          ? format(parseISO(payment.received_date), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {payment.check_voided && (
                            <Badge variant="destructive" className="text-xs">Voided</Badge>
                          )}
                          {payment.check_issued && !payment.check_voided && (
                            <Badge variant="outline" className="text-xs">Issued</Badge>
                          )}
                          {payment.check_mailed && !payment.check_voided && (
                            <Badge variant="secondary" className="text-xs">Mailed</Badge>
                          )}
                          {!payment.check_issued && !payment.check_mailed && !payment.check_voided && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Pending</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedPaymentId(payment.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Payment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <PaymentEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        donorId={donorId}
        onSuccess={fetchPayments}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DonorPayments;
