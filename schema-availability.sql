-- Availability Settings (Teacher side)
create table if not exists public.availability_settings (
    user_id uuid references auth.users(id) on delete cascade primary key,
    working_hours jsonb default '[
        {"dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "active": true},
        {"dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00", "active": true},
        {"dayOfWeek": 3, "startTime": "09:00", "endTime": "17:00", "active": true},
        {"dayOfWeek": 4, "startTime": "09:00", "endTime": "17:00", "active": true},
        {"dayOfWeek": 5, "startTime": "09:00", "endTime": "17:00", "active": true},
        {"dayOfWeek": 6, "startTime": "09:00", "endTime": "13:00", "active": false},
        {"dayOfWeek": 0, "startTime": "09:00", "endTime": "13:00", "active": false}
    ]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Blackout Slots
create table if not exists public.blackout_slots (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    date date not null,
    start_time text not null,
    end_time text not null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
