-- Materials/equipment/subcontractor expense tracking, tied to a site

create table expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  site_id uuid references sites(id) on delete cascade not null,
  category text check (category in ('materials', 'equipment', 'subcontractor', 'other')) not null,
  description text not null,
  amount numeric not null,
  date date not null,
  vendor text,
  notes text,
  receipt_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table expenses enable row level security;
create policy "Users can CRUD their own expenses" on expenses for all using (auth.uid() = user_id);

-- Private storage bucket for expense receipts (mirrors payment-receipts)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('expense-receipts', 'expense-receipts', false, 5242880, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "expense_receipts_owner_all" ON storage.objects
  FOR ALL
  USING (bucket_id = 'expense-receipts' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'expense-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
