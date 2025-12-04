import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorId: string;
  appointmentId?: string;
  defaultType?: "screening" | "donation";
  onSuccess?: () => void;
}

const PAYMENT_AMOUNTS = {
  screening: 150,
  donation: 450,
} as const;

interface FormData {
  payment_type: "screening" | "donation" | "";
  amount: string;
  // Ordering
  date_ordered: string;
  memo: string;
  // Received
  received_date: string;
  check_number: string;
  check_date: string;
  // Reconciling
  date_issued: string;
  check_issued: boolean;
  check_mailed: boolean;
  check_voided: boolean;
  comment: string;
}

const PaymentEntryDialog = ({
  open,
  onOpenChange,
  donorId,
  appointmentId,
  defaultType,
  onSuccess,
}: PaymentEntryDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    payment_type: defaultType || "",
    amount: defaultType ? PAYMENT_AMOUNTS[defaultType].toString() : "",
    date_ordered: format(new Date(), "yyyy-MM-dd"),
    memo: "",
    received_date: "",
    check_number: "",
    check_date: "",
    date_issued: "",
    check_issued: false,
    check_mailed: false,
    check_voided: false,
    comment: "",
  });

  useEffect(() => {
    if (open && defaultType) {
      setFormData(prev => ({
        ...prev,
        payment_type: defaultType,
        amount: PAYMENT_AMOUNTS[defaultType].toString(),
      }));
    }
  }, [open, defaultType]);

  const handleTypeChange = (type: string) => {
    const paymentType = type as "screening" | "donation";
    setFormData({
      ...formData,
      payment_type: paymentType,
      amount: PAYMENT_AMOUNTS[paymentType].toString(),
    });
  };

  const resetForm = () => {
    setFormData({
      payment_type: defaultType || "",
      amount: defaultType ? PAYMENT_AMOUNTS[defaultType].toString() : "",
      date_ordered: format(new Date(), "yyyy-MM-dd"),
      memo: "",
      received_date: "",
      check_number: "",
      check_date: "",
      date_issued: "",
      check_issued: false,
      check_mailed: false,
      check_voided: false,
      comment: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.payment_type || !formData.amount) {
      toast({
        title: "Error",
        description: "Please select a payment type and amount.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("payments").insert({
        donor_id: donorId,
        appointment_id: appointmentId || null,
        payment_type: formData.payment_type as "screening" | "donation",
        amount: parseFloat(formData.amount),
        date_ordered: formData.date_ordered || null,
        memo: formData.memo || null,
        received_date: formData.received_date || null,
        check_number: formData.check_number || null,
        check_date: formData.check_date || null,
        date_issued: formData.date_issued || null,
        check_issued: formData.check_issued,
        check_mailed: formData.check_mailed,
        check_voided: formData.check_voided,
        comment: formData.comment || null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Payment recorded",
        description: `$${formData.amount} ${formData.payment_type} payment saved.`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        title: "Error",
        description: "Failed to save payment.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = () => {
    setFormData({ ...formData, check_voided: true });
  };

  const handleClear = () => {
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Entry
          </DialogTitle>
          <DialogDescription>
            Enter the payment details for this donor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ORDERING Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">ORDERING</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_ordered">Date Ordered</Label>
                <Input
                  id="date_ordered"
                  type="date"
                  value={formData.date_ordered}
                  onChange={(e) => setFormData({ ...formData, date_ordered: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Type *</Label>
                <Select
                  value={formData.payment_type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="screening">Screening ($150)</SelectItem>
                    <SelectItem value="donation">Donation ($450)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memo">Memo</Label>
                <Input
                  id="memo"
                  placeholder="Optional memo"
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Received Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Received</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="received_date">Date Received</Label>
                <Input
                  id="received_date"
                  type="date"
                  value={formData.received_date}
                  onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check_number">Check Number</Label>
                <Input
                  id="check_number"
                  placeholder="Check #"
                  value={formData.check_number}
                  onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check_date">Check Date</Label>
                <Input
                  id="check_date"
                  type="date"
                  value={formData.check_date}
                  onChange={(e) => setFormData({ ...formData, check_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Reconciling Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Reconciling</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_issued">Date Issued</Label>
                <Input
                  id="date_issued"
                  type="date"
                  value={formData.date_issued}
                  onChange={(e) => setFormData({ ...formData, date_issued: e.target.value })}
                />
              </div>
              <div className="space-y-4 pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="check_issued"
                    checked={formData.check_issued}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, check_issued: checked === true })
                    }
                  />
                  <Label htmlFor="check_issued" className="font-normal">Check Issued</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="check_mailed"
                    checked={formData.check_mailed}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, check_mailed: checked === true })
                    }
                  />
                  <Label htmlFor="check_mailed" className="font-normal">Check Mailed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="check_voided"
                    checked={formData.check_voided}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, check_voided: checked === true })
                    }
                  />
                  <Label htmlFor="check_voided" className="font-normal text-destructive">Check Voided</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                placeholder="Additional comments..."
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="destructive" onClick={handleVoid}>
              Void
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : "Submit"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentEntryDialog;
