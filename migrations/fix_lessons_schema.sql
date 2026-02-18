-- Migration to add missing columns to lessons table
BEGIN;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='telegram_sent') THEN
        ALTER TABLE public.lessons ADD COLUMN telegram_sent boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='timezone') THEN
        ALTER TABLE public.lessons ADD COLUMN timezone text DEFAULT 'UTC';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='audit_info') THEN
        ALTER TABLE public.lessons ADD COLUMN audit_info jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='cancellation_reason') THEN
        ALTER TABLE public.lessons ADD COLUMN cancellation_reason text;
    END IF;
END $$;

COMMIT;
