-- Enable pg_net extension for async HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to trigger evaluation on new submissions
CREATE OR REPLACE FUNCTION public.trigger_submission_evaluation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Get the Supabase URL and service key from vault or use defaults
  supabase_url := 'https://iwavtnwcwlfjhtcgfpho.supabase.co';
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- If service key not available, skip (function will be called manually)
  IF service_key IS NULL OR service_key = '' THEN
    RAISE LOG 'Skipping auto-evaluation: service key not configured';
    RETURN NEW;
  END IF;
  
  -- Make async HTTP call to evaluate-submission edge function
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/evaluate-submission',
    body := jsonb_build_object('submission_id', NEW.id, 'use_ai', false),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );
  
  RAISE LOG 'Triggered evaluation for submission %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE LOG 'Failed to trigger evaluation for submission %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on webform_submissions
DROP TRIGGER IF EXISTS auto_evaluate_submission ON public.webform_submissions;
CREATE TRIGGER auto_evaluate_submission
  AFTER INSERT ON public.webform_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_submission_evaluation();