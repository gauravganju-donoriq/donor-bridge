-- Create storage bucket for donor documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donor-documents',
  'donor-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create donor_documents table to track uploaded files
CREATE TABLE public.donor_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other', -- consent_hiv, consent_bone_marrow, medical_record, id_verification, other
  description TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donor_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for donor_documents
CREATE POLICY "Admins and staff can view donor documents"
ON public.donor_documents FOR SELECT
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can insert donor documents"
ON public.donor_documents FOR INSERT
WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can update donor documents"
ON public.donor_documents FOR UPDATE
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete donor documents"
ON public.donor_documents FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for donor-documents bucket
CREATE POLICY "Admins and staff can view donor document files"
ON storage.objects FOR SELECT
USING (bucket_id = 'donor-documents' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can upload donor document files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'donor-documents' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete donor document files"
ON storage.objects FOR DELETE
USING (bucket_id = 'donor-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_donor_documents_updated_at
BEFORE UPDATE ON public.donor_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();