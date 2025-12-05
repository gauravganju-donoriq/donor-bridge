-- Create screening_rules table for configurable evaluation rules
CREATE TABLE public.screening_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('hard_disqualify', 'soft_flag', 'threshold')),
  rule_name TEXT NOT NULL,
  rule_key TEXT NOT NULL UNIQUE,
  rule_value JSONB NOT NULL,
  field_path TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.screening_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for screening_rules
CREATE POLICY "Admins and staff can view screening rules"
ON public.screening_rules FOR SELECT
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can insert screening rules"
ON public.screening_rules FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update screening rules"
ON public.screening_rules FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete screening rules"
ON public.screening_rules FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_screening_rules_updated_at
BEFORE UPDATE ON public.screening_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add evaluation columns to webform_submissions
ALTER TABLE public.webform_submissions 
ADD COLUMN ai_evaluation JSONB,
ADD COLUMN ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
ADD COLUMN ai_recommendation TEXT CHECK (ai_recommendation IN ('suitable', 'unsuitable', 'review_required', 'pending')),
ADD COLUMN evaluation_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN evaluated_at TIMESTAMPTZ;

-- Seed default screening rules
-- Hard Disqualifiers
INSERT INTO public.screening_rules (rule_type, rule_name, rule_key, rule_value, field_path, description, severity, display_order) VALUES
('hard_disqualify', 'Maximum BMI', 'bmi_max', '{"value": 36, "operator": "gt"}', 'calculated_bmi', 'BMI greater than 36 is a medical safety concern', 'critical', 1),
('hard_disqualify', 'Minimum Age', 'age_min', '{"value": 18, "operator": "lt"}', 'calculated_age', 'Must be at least 18 years old (legal requirement)', 'critical', 2),
('hard_disqualify', 'Blood Disorder', 'blood_disorder', '{"value": true, "operator": "eq"}', 'has_blood_disorder', 'Blood disorders are a medical disqualification', 'critical', 3);

-- Soft Flags (need human review)
INSERT INTO public.screening_rules (rule_type, rule_name, rule_key, rule_value, field_path, description, severity, display_order) VALUES
('soft_flag', 'Maximum Age', 'age_max', '{"value": 65, "operator": "gt"}', 'calculated_age', 'Donors over 65 may need additional screening', 'medium', 10),
('soft_flag', 'Chronic Illness', 'chronic_illness', '{"value": true, "operator": "eq"}', 'has_chronic_illness', 'Depends on the specific condition - review details', 'medium', 11),
('soft_flag', 'Recent Surgery', 'recent_surgery', '{"value": true, "operator": "eq"}', 'had_surgery', 'May need recovery time - check surgery details', 'medium', 12),
('soft_flag', 'Recent Tattoo/Piercing', 'recent_tattoo', '{"value": true, "operator": "eq"}', 'has_tattoos_piercings', '12-month wait period may apply', 'low', 13),
('soft_flag', 'Recent Incarceration', 'recent_incarceration', '{"value": true, "operator": "eq"}', 'has_been_incarcerated', 'Additional screening needed', 'high', 14),
('soft_flag', 'Recent International Travel', 'recent_travel', '{"value": true, "operator": "eq"}', 'has_traveled_internationally', 'Depends on travel location', 'medium', 15),
('soft_flag', 'Recent Blood Transfusion', 'recent_transfusion', '{"value": true, "operator": "eq"}', 'has_received_transfusion', 'Wait period required', 'medium', 16),
('soft_flag', 'Recent Pregnancy', 'recent_pregnancy', '{"value": true, "operator": "eq"}', 'has_been_pregnant', 'For female donors - check timing', 'medium', 17),
('soft_flag', 'Takes Medications', 'takes_medications', '{"value": true, "operator": "eq"}', 'takes_medications', 'Depends on specific medications', 'low', 18);