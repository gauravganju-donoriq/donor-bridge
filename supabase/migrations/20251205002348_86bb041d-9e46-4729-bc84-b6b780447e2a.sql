-- Add tracking columns to donors table
ALTER TABLE public.donors
ADD COLUMN IF NOT EXISTS last_donation_date DATE,
ADD COLUMN IF NOT EXISTS next_eligible_date DATE;

-- Create function to auto-defer donor after donation completion
CREATE OR REPLACE FUNCTION public.handle_donation_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donation_date DATE;
BEGIN
  -- Only trigger on status change to 'completed' for donation appointments
  IF NEW.status = 'completed' AND NEW.appointment_type = 'donation' AND 
     (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get the appointment date
    donation_date := DATE(NEW.appointment_date);
    
    -- Update the donor's eligibility status and dates
    UPDATE public.donors
    SET 
      eligibility_status = 'temporarily_deferred',
      last_donation_date = donation_date,
      next_eligible_date = donation_date + INTERVAL '12 weeks',
      updated_at = now()
    WHERE id = NEW.donor_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on appointments table
DROP TRIGGER IF EXISTS on_donation_completed ON public.appointments;
CREATE TRIGGER on_donation_completed
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_donation_completed();

-- Also trigger on insert for cases where appointment is created as completed
DROP TRIGGER IF EXISTS on_donation_completed_insert ON public.appointments;
CREATE TRIGGER on_donation_completed_insert
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.appointment_type = 'donation')
  EXECUTE FUNCTION public.handle_donation_completed();

-- Create function to restore eligibility (called by cron)
CREATE OR REPLACE FUNCTION public.restore_donor_eligibility()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update donors who are temporarily deferred and past their next eligible date
  UPDATE public.donors
  SET 
    eligibility_status = 'eligible',
    updated_at = now()
  WHERE 
    eligibility_status = 'temporarily_deferred'
    AND next_eligible_date IS NOT NULL
    AND next_eligible_date <= CURRENT_DATE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;