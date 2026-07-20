-- Employee ID photo + payment receipt attachment support

ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_path TEXT;
COMMENT ON COLUMN employees.photo_path IS 'Path within the employee-photos storage bucket, e.g. {user_id}/{uuid}.jpg';

ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_path TEXT;
COMMENT ON COLUMN payments.receipt_path IS 'Path within the payment-receipts storage bucket, e.g. {user_id}/{uuid}.jpg';

-- Private storage buckets (accessed via signed URLs, not public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('employee-photos', 'employee-photos', false, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('payment-receipts', 'payment-receipts', false, 5242880, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS: a user may only manage objects under a folder named after their own user id
CREATE POLICY "employee_photos_owner_all" ON storage.objects
  FOR ALL
  USING (bucket_id = 'employee-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'employee-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "payment_receipts_owner_all" ON storage.objects
  FOR ALL
  USING (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
