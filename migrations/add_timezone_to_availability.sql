-- Migration: Add timezone column to availability_settings
-- This resolves issues where teacher availability updates fail due to missing column.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'availability_settings' AND column_name = 'timezone') THEN 
        ALTER TABLE availability_settings ADD COLUMN timezone TEXT DEFAULT 'UTC'; 
    END IF; 
END $$;
