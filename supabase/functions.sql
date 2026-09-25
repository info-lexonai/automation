-- Atomic counter increment, avoids read-modify-write races under load.
create or replace function increment_automation_stat(p_automation_id uuid, p_column text)
returns void as $$
begin
  execute format('update automation_stats set %I = %I + 1, updated_at = now() where automation_id = $1', p_column, p_column)
  using p_automation_id;
end;
$$ language plpgsql security definer;
