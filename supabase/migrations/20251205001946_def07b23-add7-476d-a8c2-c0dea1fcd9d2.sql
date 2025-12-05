-- Create health_questionnaires table
CREATE TABLE public.health_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  -- Access token for iPad link
  access_token TEXT NOT NULL UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  
  -- All responses stored as JSONB for flexibility
  responses JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking
  created_by UUID NOT NULL,
  completed_by UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_questionnaires ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and staff can view health questionnaires"
ON public.health_questionnaires FOR SELECT
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can insert health questionnaires"
ON public.health_questionnaires FOR INSERT
WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can update health questionnaires"
ON public.health_questionnaires FOR UPDATE
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete health questionnaires"
ON public.health_questionnaires FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public access via token (for iPad without login)
CREATE POLICY "Public can view questionnaire via valid token"
ON public.health_questionnaires FOR SELECT
USING (
  access_token IS NOT NULL 
  AND token_expires_at > now()
);

CREATE POLICY "Public can update questionnaire via valid token"
ON public.health_questionnaires FOR UPDATE
USING (
  access_token IS NOT NULL 
  AND token_expires_at > now()
  AND status != 'completed'
);

-- Add trigger for updated_at
CREATE TRIGGER update_health_questionnaires_updated_at
BEFORE UPDATE ON public.health_questionnaires
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for token lookups
CREATE INDEX idx_health_questionnaires_token ON public.health_questionnaires(access_token);
CREATE INDEX idx_health_questionnaires_donor ON public.health_questionnaires(donor_id);