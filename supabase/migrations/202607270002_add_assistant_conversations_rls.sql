drop policy if exists assistant_conversations_select_own on public.assistant_conversations;
create policy assistant_conversations_select_own
on public.assistant_conversations
for select
using (auth.uid() = profile_id);

drop policy if exists assistant_conversations_insert_own on public.assistant_conversations;
create policy assistant_conversations_insert_own
on public.assistant_conversations
for insert
with check (auth.uid() = profile_id);

drop policy if exists assistant_conversations_update_own on public.assistant_conversations;
create policy assistant_conversations_update_own
on public.assistant_conversations
for update
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists assistant_conversations_delete_own on public.assistant_conversations;
create policy assistant_conversations_delete_own
on public.assistant_conversations
for delete
using (auth.uid() = profile_id);

drop policy if exists assistant_conversations_manage_admin on public.assistant_conversations;
create policy assistant_conversations_manage_admin
on public.assistant_conversations
for all
using (public.is_admin_user())
with check (public.is_admin_user());
