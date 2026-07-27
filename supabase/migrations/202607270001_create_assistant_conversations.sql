create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Nuova chat',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_conversations_title_length_check check (char_length(title) between 1 and 120),
  constraint assistant_conversations_messages_array_check check (jsonb_typeof(messages) = 'array')
);

create index if not exists assistant_conversations_profile_updated_idx
on public.assistant_conversations (profile_id, updated_at desc);

alter table public.assistant_conversations enable row level security;

drop trigger if exists set_assistant_conversations_updated_at on public.assistant_conversations;
create trigger set_assistant_conversations_updated_at
before update on public.assistant_conversations
for each row
execute function public.set_internal_kpi_updated_at();
