-- Per-site materials inventory with a full received/used/adjustment transaction history.
-- Current quantity on hand is derived client-side as the sum of a material's transactions
-- (matching how the rest of the app computes totals from fetched records), not stored directly.

create table materials (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  site_id uuid references sites(id) on delete cascade not null,
  name text not null,
  unit text not null,
  reorder_point numeric not null default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table materials enable row level security;
create policy "Users can CRUD their own materials" on materials for all using (auth.uid() = user_id);

create table material_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  material_id uuid references materials(id) on delete cascade not null,
  type text check (type in ('received', 'used', 'adjustment')) not null,
  quantity numeric not null, -- signed: positive increases stock, negative decreases it
  date date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table material_transactions enable row level security;
create policy "Users can CRUD their own material transactions" on material_transactions for all using (auth.uid() = user_id);
