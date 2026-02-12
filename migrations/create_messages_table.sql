-- Create messages table for chat between students and teachers
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade not null,
  teacher_id text, -- Optional, to track which teacher sent it (or if it was sent to a specific teacher in future)
  sender text not null check (sender in ('student', 'teacher')),
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for performance
create index if not exists messages_student_id_idx on messages(student_id);
create index if not exists messages_created_at_idx on messages(created_at);

-- Enable RLS
alter table messages enable row level security;

-- Policies
-- Teachers can view all messages
create policy "Teachers can view all messages"
  on messages for select
  using (true); -- Ideally restrict to authenticated teachers

-- Teachers can insert messages
create policy "Teachers can insert messages"
  on messages for insert
  with check (sender = 'teacher');

-- Students can view their own messages
create policy "Students can view own messages"
  on messages for select
  using (student_id::text = auth.uid()::text);

-- Students can insert messages
create policy "Students can insert messages"
  on messages for insert
  with check (sender = 'student');
