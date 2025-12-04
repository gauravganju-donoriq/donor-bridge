-- Phase 1: Comprehensive Scheduling System Schema

-- 1.1 Create new enums
CREATE TYPE public.appointment_purpose AS ENUM ('research', 'clinical');
CREATE TYPE public.appointment_location AS ENUM ('bethesda', 'germantown');
CREATE TYPE public.payment_type AS ENUM ('screening', 'donation');
CREATE TYPE public.follow_up_status AS ENUM ('pending', 'attempted_1', 'attempted_2', 'completed', 'email_sent');

-- 1.2 Add new status values to appointment_status enum
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'rescheduled';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'deferred';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'sample_not_taken';

-- 1.3 Expand appointments table with new columns
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS purpose appointment_purpose,
  ADD COLUMN IF NOT EXISTS location appointment_location,
  ADD COLUMN IF NOT EXISTS donor_letter CHAR(1),
  ADD COLUMN IF NOT EXISTS prescreened_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS prescreened_date DATE,
  ADD COLUMN IF NOT EXISTS uber_needed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS uber_ordered BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rescheduled_from UUID REFERENCES public.appointments(id);

-- Add constraint for donor_letter (A-L only)
ALTER TABLE public.appointments 
  ADD CONSTRAINT valid_donor_letter CHECK (donor_letter IS NULL OR donor_letter ~ '^[A-L]$');

-- 1.4 Create donation_results table
CREATE TABLE public.donation_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  volume_ml NUMERIC,
  cell_count NUMERIC,
  lot_number TEXT,
  doctor_id UUID REFERENCES public.profiles(id),
  doctor_comments TEXT,
  lab_tech_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

-- 1.5 Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  payment_type payment_type NOT NULL,
  amount NUMERIC NOT NULL,
  check_number TEXT,
  check_date DATE,
  received_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 1.6 Create follow_ups table
CREATE TABLE public.follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  status follow_up_status NOT NULL DEFAULT 'pending',
  pain_level INTEGER CHECK (pain_level IS NULL OR (pain_level >= 1 AND pain_level <= 10)),
  procedure_feedback TEXT,
  would_donate_again BOOLEAN,
  completed_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

-- 1.7 Enable RLS on new tables
ALTER TABLE public.donation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- 1.8 RLS Policies for donation_results
CREATE POLICY "Admins and staff can view donation results"
  ON public.donation_results FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can insert donation results"
  ON public.donation_results FOR INSERT
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can update donation results"
  ON public.donation_results FOR UPDATE
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete donation results"
  ON public.donation_results FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 1.9 RLS Policies for payments
CREATE POLICY "Admins and staff can view payments"
  ON public.payments FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can update payments"
  ON public.payments FOR UPDATE
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete payments"
  ON public.payments FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 1.10 RLS Policies for follow_ups
CREATE POLICY "Admins and staff can view follow ups"
  ON public.follow_ups FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can insert follow ups"
  ON public.follow_ups FOR INSERT
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can update follow ups"
  ON public.follow_ups FOR UPDATE
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete follow ups"
  ON public.follow_ups FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 1.11 Create triggers for updated_at
CREATE TRIGGER update_donation_results_updated_at
  BEFORE UPDATE ON public.donation_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.12 Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_donor_id ON public.appointments(donor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_location ON public.appointments(location);
CREATE INDEX IF NOT EXISTS idx_donation_results_appointment_id ON public.donation_results(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_donor_id ON public.payments(donor_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_donor_id ON public.follow_ups(donor_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(status);