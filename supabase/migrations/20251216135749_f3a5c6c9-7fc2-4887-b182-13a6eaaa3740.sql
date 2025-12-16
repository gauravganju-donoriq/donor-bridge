-- Add 'callback_requested' to follow_up_status enum
ALTER TYPE public.follow_up_status ADD VALUE IF NOT EXISTS 'callback_requested';