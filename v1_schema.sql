
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Linked to Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  company_name text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table profiles enable row level security;
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);


-- EMPLOYEES
create table employees (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null, -- The manager/owner
  name text not null,
  role text not null,
  status text check (status in ('active', 'inactive')) default 'active',
  daily_rate numeric not null default 0,
  joined_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Employees
alter table employees enable row level security;
create policy "Users can CRUD their own employees" on employees for all using (auth.uid() = user_id);


-- SITES
create table sites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  location text not null,
  status text check (status in ('active', 'completed', 'on-hold')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Sites
alter table sites enable row level security;
create policy "Users can CRUD their own sites" on sites for all using (auth.uid() = user_id);


-- ATTENDANCE
create table attendance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  employee_id uuid references employees(id) on delete cascade not null,
  site_id uuid references sites(id) on delete set null,
  date date not null,
  status text check (status in ('present', 'absent', 'half-day')) not null,
  check_in text,
  check_out text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(employee_id, date) -- One record per employee per day
);

-- Enable RLS for Attendance
alter table attendance enable row level security;
create policy "Users can CRUD their own attendance" on attendance for all using (auth.uid() = user_id);


-- PAYMENTS
create table payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  employee_id uuid references employees(id) on delete cascade not null,
  amount numeric not null,
  type text check (type in ('salary', 'advance', 'bonus')) not null,
  date date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Payments
alter table payments enable row level security;
create policy "Users can CRUD their own payments" on payments for all using (auth.uid() = user_id);


-- TRIGGER: Handle New User Signup
-- Automatically creates a profile entry when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, company_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'company_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
