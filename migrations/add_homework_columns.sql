-- Add missing columns to homework table for student submissions and timezone support

-- Add timezone column (defaults to UTC)
ALTER TABLE public.homework 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- Add submission_text column for student homework submissions
ALTER TABLE public.homework 
ADD COLUMN IF NOT EXISTS submission_text text;

-- Add submitted_at timestamp for tracking when homework was submitted
ALTER TABLE public.homework 
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone;

-- Update due_date to be timestamp with time zone instead of just date for better timezone support
-- Note: This requires data migration if you have existing data
-- ALTER TABLE public.homework ALTER COLUMN due_date TYPE timestamp with time zone USING due_date::timestamp with time zone;
