-- Phase 1: Add new columns to donation_results table
ALTER TABLE public.donation_results
ADD COLUMN IF NOT EXISTS clots_vol_ml numeric,
ADD COLUMN IF NOT EXISTS final_vol_ml numeric,
ADD COLUMN IF NOT EXISTS lot_number_2 text,
ADD COLUMN IF NOT EXISTS lot_number_3 text,
ADD COLUMN IF NOT EXISTS lot_number_4 text,
ADD COLUMN IF NOT EXISTS exam_room_time time,
ADD COLUMN IF NOT EXISTS departure_time time;

-- Phase 2: Add new columns to payments table for 3-stage workflow
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS date_ordered date,
ADD COLUMN IF NOT EXISTS memo text,
ADD COLUMN IF NOT EXISTS date_issued date,
ADD COLUMN IF NOT EXISTS check_issued boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS check_mailed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS check_voided boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS comment text;

-- Phase 3: Add new columns to follow_ups table for comprehensive questionnaire
ALTER TABLE public.follow_ups
ADD COLUMN IF NOT EXISTS current_pain_level integer,
ADD COLUMN IF NOT EXISTS staff_rating integer,
ADD COLUMN IF NOT EXISTS nurse_rating integer,
ADD COLUMN IF NOT EXISTS doctor_rating integer,
ADD COLUMN IF NOT EXISTS took_pain_medication boolean,
ADD COLUMN IF NOT EXISTS pain_medication_details text,
ADD COLUMN IF NOT EXISTS checked_aspiration_sites boolean,
ADD COLUMN IF NOT EXISTS aspiration_sites_notes text,
ADD COLUMN IF NOT EXISTS signs_of_infection boolean,
ADD COLUMN IF NOT EXISTS infection_details text,
ADD COLUMN IF NOT EXISTS unusual_symptoms boolean,
ADD COLUMN IF NOT EXISTS symptoms_details text;