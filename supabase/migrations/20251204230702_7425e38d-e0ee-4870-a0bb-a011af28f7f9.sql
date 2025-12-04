-- Create donor_notes table for tracking interactions and observations
CREATE TABLE public.donor_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donor_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins and staff can view donor notes"
ON public.donor_notes
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can insert donor notes"
ON public.donor_notes
FOR INSERT
WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Users can update their own notes"
ON public.donor_notes
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete any notes"
ON public.donor_notes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_donor_notes_updated_at
BEFORE UPDATE ON public.donor_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_donor_notes_donor_id ON public.donor_notes(donor_id);
CREATE INDEX idx_donor_notes_created_at ON public.donor_notes(created_at DESC);