-- Per-session notes for an exercise (keeps our exercise_sessions model).
-- Existing exercise_notes rows are copied onto each exercise's latest session.

alter table exercise_sessions
  add column if not exists note text;

update exercise_sessions es
set note = en.note
from exercise_notes en
where en.exercise_id = es.exercise_id
  and es.note is null
  and es.session_date = (
    select max(s2.session_date)
    from exercise_sessions s2
    where s2.exercise_id = es.exercise_id
  );
