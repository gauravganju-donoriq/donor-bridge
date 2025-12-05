-- Create donor_consents table for tracking consent forms
CREATE TABLE public.donor_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data TEXT,
  signed_document_path TEXT,
  ip_address TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_consent_type CHECK (consent_type IN ('hiv_testing', 'bone_marrow_donation', 'genetic_testing', 'research_use', 'hipaa_authorization')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'signed', 'expired', 'revoked'))
);

-- Create index for faster lookups
CREATE INDEX idx_donor_consents_donor_id ON public.donor_consents(donor_id);
CREATE INDEX idx_donor_consents_access_token ON public.donor_consents(access_token);
CREATE INDEX idx_donor_consents_status ON public.donor_consents(status);

-- Enable RLS
ALTER TABLE public.donor_consents ENABLE ROW LEVEL SECURITY;

-- Staff can view all consents
CREATE POLICY "Admins and staff can view donor consents"
ON public.donor_consents
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

-- Staff can create consents
CREATE POLICY "Admins and staff can insert donor consents"
ON public.donor_consents
FOR INSERT
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Staff can update consents
CREATE POLICY "Admins and staff can update donor consents"
ON public.donor_consents
FOR UPDATE
USING (is_admin_or_staff(auth.uid()));

-- Admins can delete consents
CREATE POLICY "Admins can delete donor consents"
ON public.donor_consents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can view consent via valid token
CREATE POLICY "Public can view consent via valid token"
ON public.donor_consents
FOR SELECT
USING (access_token IS NOT NULL AND token_expires_at > now() AND status = 'pending');

-- Public can update consent via valid token (for signing)
CREATE POLICY "Public can sign consent via valid token"
ON public.donor_consents
FOR UPDATE
USING (access_token IS NOT NULL AND token_expires_at > now() AND status = 'pending');

-- Add trigger for updated_at
CREATE TRIGGER update_donor_consents_updated_at
BEFORE UPDATE ON public.donor_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();