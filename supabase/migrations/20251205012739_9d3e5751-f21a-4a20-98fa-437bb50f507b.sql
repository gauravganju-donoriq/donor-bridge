-- Create function to log eligibility status changes
CREATE OR REPLACE FUNCTION public.log_eligibility_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log if eligibility_status actually changed
  IF OLD.eligibility_status IS DISTINCT FROM NEW.eligibility_status THEN
    INSERT INTO public.activity_logs (
      entity_type,
      entity_id,
      action,
      details,
      user_id
    ) VALUES (
      'donor',
      NEW.id,
      'eligibility_changed',
      jsonb_build_object(
        'from_status', OLD.eligibility_status,
        'to_status', NEW.eligibility_status,
        'last_donation_date', NEW.last_donation_date,
        'next_eligible_date', NEW.next_eligible_date,
        'ineligibility_reason', NEW.ineligibility_reason
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for eligibility changes
CREATE TRIGGER on_eligibility_change
  AFTER UPDATE ON public.donors
  FOR EACH ROW
  EXECUTE FUNCTION public.log_eligibility_change();