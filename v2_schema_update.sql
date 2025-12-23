-- Add columns for hourly attendance tracking
ALTER TABLE attendance 
ADD COLUMN start_time TEXT, 
ADD COLUMN end_time TEXT, 
ADD COLUMN working_hours NUMERIC DEFAULT 0;

-- Optional: Update existing records to have default hours based on status
-- 'present' = 10 hours
-- 'half-day' = 5 hours
UPDATE attendance SET working_hours = 10 WHERE status = 'present';
UPDATE attendance SET working_hours = 5 WHERE status = 'half-day';
