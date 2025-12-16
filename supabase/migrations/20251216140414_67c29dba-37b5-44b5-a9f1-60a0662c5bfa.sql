-- Fix existing follow-up records that were incorrectly marked as completed
-- when the donor actually requested a callback
UPDATE follow_ups 
SET 
  status = 'callback_requested',
  ai_call_status = 'callback_requested',
  completed_at = NULL,
  completed_by = NULL,
  updated_at = now()
WHERE 
  status = 'completed' 
  AND ai_parsed_responses->>'call_successful' = 'false';