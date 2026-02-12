-- Allow Teachers to update messages (e.g. mark as read)
create policy "Teachers can update messages"
  on messages for update
  using (true);

-- Allow Students to update messages (mark teacher messages as read)
create policy "Students can update own messages"
  on messages for update
  using (student_id::text = auth.uid()::text);
