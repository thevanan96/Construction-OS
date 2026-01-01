-- Add additional_roles column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS additional_roles JSONB DEFAULT '[]'::jsonb;

-- Add role column to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS role TEXT;

-- Update existing attendance records (optional: backfill with employee's current role if needed, but safe to leave null/default)
-- For now, we leave it nullable as older records imply the primary role.
