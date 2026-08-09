-- Bug reports for in-app feedback (MVP: open access, no auth)

create table if not exists bug_reports (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  kind text not null default 'bug' check (kind in ('bug', 'idea')),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bug_reports_created_at on bug_reports(created_at desc);

alter table bug_reports enable row level security;

create policy "Allow all access to bug_reports" on bug_reports for all using (true) with check (true);
