-- Create voice_ai_settings table for configurable AI call settings
CREATE TABLE public.voice_ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_ai_settings ENABLE ROW LEVEL SECURITY;

-- Policies for voice_ai_settings
CREATE POLICY "Admins and staff can view voice ai settings"
ON public.voice_ai_settings
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can update voice ai settings"
ON public.voice_ai_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert voice ai settings"
ON public.voice_ai_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_voice_ai_settings_updated_at
BEFORE UPDATE ON public.voice_ai_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.voice_ai_settings (setting_key, setting_value, description) VALUES
('enabled', 'true', 'Enable or disable AI voice follow-ups'),
('agent_name', 'Sarah', 'Name the AI agent uses to introduce itself'),
('greeting_template', 'Hi {{donor_name}}, this is {{agent_name}} calling from Donor Bridge. I''m following up on your donation on {{donation_date}}. Do you have a few minutes to answer some quick questions about how you''re feeling?', 'Greeting message template'),
('closing_message', 'Thank you so much for your time and for being a donor. Your contribution makes a real difference. Take care and we hope to see you again!', 'Closing message after questionnaire'),
('question_pain_level', 'On a scale of 1 to 10, with 1 being no pain and 10 being severe pain, how would you rate any discomfort you experienced during the procedure?', 'Question about procedure pain level'),
('question_current_pain', 'And how about right now - on the same 1 to 10 scale, what is your current pain level at the aspiration sites?', 'Question about current pain level'),
('question_pain_medication', 'Have you needed to take any pain medication since your donation?', 'Question about pain medication'),
('question_aspiration_sites', 'Have you checked your aspiration sites today? How do they look?', 'Question about aspiration site check'),
('question_infection_signs', 'Have you noticed any signs of infection, such as increased redness, swelling, warmth, or discharge at the aspiration sites?', 'Question about infection signs'),
('question_unusual_symptoms', 'Have you experienced any unusual symptoms since your donation, such as fever, dizziness, or excessive fatigue?', 'Question about unusual symptoms'),
('question_doctor_rating', 'On a scale of 1 to 5, how would you rate your experience with the doctor during the procedure?', 'Question about doctor rating'),
('question_nurse_rating', 'And on the same 1 to 5 scale, how would you rate your experience with the nursing staff?', 'Question about nurse rating'),
('question_staff_rating', 'How about the overall front desk and administrative staff - on a scale of 1 to 5?', 'Question about staff rating'),
('question_donate_again', 'Based on your experience, would you be willing to donate again in the future?', 'Question about willingness to donate again'),
('question_feedback', 'Is there anything else you''d like to share about your experience, or any feedback that could help us improve?', 'Question for additional feedback'),
('escalation_message', 'I''m sorry to hear that. I''m going to make a note of this and have one of our nurses follow up with you directly. Is the best number to reach you the one I called?', 'Message when donor reports concerning symptoms'),
('max_call_duration_seconds', '300', 'Maximum call duration in seconds');

-- Add AI call tracking columns to follow_ups table
ALTER TABLE public.follow_ups
ADD COLUMN IF NOT EXISTS ai_call_id TEXT,
ADD COLUMN IF NOT EXISTS ai_call_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_transcript TEXT,
ADD COLUMN IF NOT EXISTS ai_recording_url TEXT,
ADD COLUMN IF NOT EXISTS ai_call_summary JSONB,
ADD COLUMN IF NOT EXISTS ai_call_duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS ai_called_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_parsed_responses JSONB;