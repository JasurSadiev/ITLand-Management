-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Students Table
create table if not exists public.students (
    id uuid default uuid_generate_v4() primary key,
    full_name text not null,
    age integer,
    parent_name text,
    contact_phone text,
    contact_whatsapp text,
    contact_email text,
    password_text text, -- Storing as text for teacher visibility as requested
    timezone text default 'America/New_York',
    lesson_type text check (lesson_type in ('1-on-1', 'group')),
    subjects text[], -- Array of strings
    lesson_price numeric default 0,
    payment_model text check (payment_model in ('per-lesson', 'package', 'monthly')),
    status text check (status in ('active', 'paused', 'finished')),
    notes text,
    tags text[],
    lesson_balance integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lessons Table
create table if not exists public.lessons (
    id uuid default uuid_generate_v4() primary key,
    student_ids uuid[] not null, -- Array of student UUIDs (simplifies many-to-many for this scale)
    date date not null,
    time text not null,
    duration integer not null,
    status text not null check (status in ('upcoming', 'completed', 'cancelled-student', 'cancelled-teacher', 'rescheduled', 'no-show', 'reschedule-requested')),
    payment_status text not null check (payment_status in ('paid', 'unpaid', 'package')),
    subject text,
    notes text,
    -- Recurrence fields
    recurrence_type text check (recurrence_type in ('one-time', 'weekly', 'specific-days', 'makeup')),
    recurrence_end_date date,
    recurrence_days integer[],
    recurrence_parent_id text,
    is_makeup boolean default false,
    meeting_link text,
    audit_info jsonb, -- Stores {rescheduled_from: string, penalty_charged: boolean, reason: string}
    cancellation_reason text,
    whatsapp_sent boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reschedule Requests table
create table public.reschedule_requests (
    id uuid default gen_random_uuid() primary key,
    lesson_id uuid references public.lessons(id) on delete cascade not null,
    student_id uuid references public.students(id) on delete cascade not null,
    proposed_slots jsonb not null, -- Array of {date: string, time: string}
    reason text,
    status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments Table
create table if not exists public.payments (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    amount numeric not null,
    method text check (method in ('cash', 'transfer', 'card', 'other')),
    date date not null,
    lesson_ids uuid[],
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Packages Table
create table if not exists public.packages (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    total_lessons integer not null,
    remaining_lessons integer not null,
    amount numeric not null,
    purchase_date date not null,
    expiry_date date,
    status text check (status in ('active', 'expired', 'completed'))
);

-- Homework Table
create table if not exists public.homework (
    id uuid default uuid_generate_v4() primary key,
    lesson_id uuid references public.lessons(id) on delete set null,
    student_id uuid references public.students(id) on delete cascade not null,
    title text not null,
    description text,
    due_date date,
    status text check (status in ('assigned', 'submitted', 'checked')),
    feedback text,
    attachments text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Materials Table
create table if not exists public.materials (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    type text check (type in ('file', 'link')),
    url text not null,
    tags text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) - Optional for now, but good practice
alter table public.students enable row level security;
alter table public.lessons enable row level security;
alter table public.payments enable row level security;
alter table public.packages enable row level security;
alter table public.homework enable row level security;
alter table public.materials enable row level security;

-- Create policies (Allow all for anon for now since we are using anon key directly)
create policy "Allow all access" on public.students for all using (true);
create policy "Allow all access" on public.lessons for all using (true);
create policy "Allow all access" on public.payments for all using (true);
create policy "Allow all access" on public.packages for all using (true);
create policy "Allow all access" on public.homework for all using (true);
create policy "Allow all access" on public.materials for all using (true);
