-- Add referral and tracking fields to donors table
ALTER TABLE public.donors
ADD COLUMN referred_by text,
ADD COLUMN referred_by_donor_id uuid REFERENCES public.donors(id),
ADD COLUMN vendor_number text;

-- Add comments for clarity
COMMENT ON COLUMN public.donors.referred_by IS 'Source of referral (e.g., Dr. Smith, Google Search, Friend)';
COMMENT ON COLUMN public.donors.referred_by_donor_id IS 'If referred by another donor, their UUID';
COMMENT ON COLUMN public.donors.vendor_number IS 'External vendor/reference number';