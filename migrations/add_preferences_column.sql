-- Add preferences column to students table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'preferences') THEN 
        ALTER TABLE students ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb; 
    END IF; 
END $$;

-- Add preferences column to availability_settings table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'availability_settings' AND column_name = 'preferences') THEN 
        ALTER TABLE availability_settings ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb; 
    END IF; 
END $$;
