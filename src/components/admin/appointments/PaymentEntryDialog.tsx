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
  const [formData, setFormData] = useState({
    payment_type: defaultType || "",
    amount: defaultType ? PAYMENT_AMOUNTS[defaultType].toString() : "",
    check_number: "",
    check_date: "",
    received_date: "",
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
      check_number: "",
      check_date: "",
      received_date: "",
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
        check_number: formData.check_number || null,
        check_date: formData.check_date || null,
        received_date: formData.received_date || null,
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Enter the payment details for this donor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Type */}
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

          {/* Amount */}
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

          {/* Check Number */}
          <div className="space-y-2">
            <Label htmlFor="check_number">Check Number</Label>
            <Input
              id="check_number"
              placeholder="Enter check number"
              value={formData.check_number}
              onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check_date">Check Date</Label>
              <Input
                id="check_date"
                type="date"
                value={formData.check_date}
                onChange={(e) => setFormData({ ...formData, check_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="received_date">Received Date</Label>
              <Input
                id="received_date"
                type="date"
                value={formData.received_date}
                onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentEntryDialog;
