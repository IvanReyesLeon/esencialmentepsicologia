-- Migration: Add sent_email_html column to reminder_queue table
-- Run this SQL in your PostgreSQL database

ALTER TABLE reminder_queue ADD COLUMN IF NOT EXISTS sent_email_html TEXT;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reminder_queue' 
ORDER BY ordinal_position;
