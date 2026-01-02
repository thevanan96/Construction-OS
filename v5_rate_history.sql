-- Add rate_history column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS rate_history JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN employees.rate_history IS 'Array of {rate: number, effectiveDate: string} to track salary history';
