-- Requires public.profiles(id uuid, role text or enum).
-- Run this migration as the trusted postgres database role.
-- The first admin must be assigned manually by a trusted operator in the
-- Supabase SQL Editor, never through public registration.
-- This trigger only guards role changes. It does not replace table grants or
-- RLS policies, which must separately authorize access to profile rows.

begin;

do $preflight$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
      and data_type = 'uuid'
  ) then
    raise exception 'Expected public.profiles.id with UUID type.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    raise exception 'Expected public.profiles.role.';
  end if;
end;
$preflight$;

create or replace function public.get_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select profile.role::text
  from public.profiles as profile
  where profile.id = (select auth.uid())
  limit 1;
$function$;

create or replace function public.user_has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    lower(btrim(p_role)) in ('admin', 'petugas', 'nasabah')
    and lower(btrim(public.get_user_role())) = lower(btrim(p_role)),
    false
  );
$function$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.user_has_role('admin');
$function$;

create or replace function public.is_petugas()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.user_has_role('petugas');
$function$;

create or replace function public.is_nasabah()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.user_has_role('nasabah');
$function$;

create or replace function public.prevent_self_admin_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  request_role text := auth.role();
  request_user_id uuid := auth.uid();
  requested_role text := lower(btrim(new.role::text));
begin
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception using
      errcode = '42501',
      message = 'ID profil tidak dapat diubah.';
  end if;

  if request_role is null
     and session_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if requested_role is null
     or requested_role not in ('admin', 'petugas', 'nasabah')
  then
    raise exception using
      errcode = '42501',
      message = 'Role tidak valid.';
  end if;

  if tg_op = 'INSERT' then
    if request_role <> 'authenticated'
       or request_user_id is null
       or new.id is distinct from request_user_id
       or requested_role <> 'nasabah' then
      raise exception using
        errcode = '42501',
        message = 'Registrasi hanya dapat membuat profil nasabah untuk pengguna yang sedang terautentikasi.';
    end if;

    return new;
  end if;

  if new.role is distinct from old.role then
    if request_role <> 'authenticated'
       or request_user_id is null
       or new.id is not distinct from request_user_id
       or not public.is_admin() then
      raise exception using
        errcode = '42501',
        message = 'Perubahan role hanya dapat dilakukan oleh administrator pada profil pengguna lain.';
    end if;
  end if;

  return new;
end;
$function$;

alter function public.get_user_role() owner to postgres;
alter function public.user_has_role(text) owner to postgres;
alter function public.is_admin() owner to postgres;
alter function public.is_petugas() owner to postgres;
alter function public.is_nasabah() owner to postgres;
alter function public.prevent_self_admin_role() owner to postgres;

revoke all on function public.get_user_role() from public, anon, authenticated, service_role;
revoke all on function public.user_has_role(text) from public, anon, authenticated, service_role;
revoke all on function public.is_admin() from public, anon, authenticated, service_role;
revoke all on function public.is_petugas() from public, anon, authenticated, service_role;
revoke all on function public.is_nasabah() from public, anon, authenticated, service_role;
grant execute on function public.get_user_role() to authenticated;
grant execute on function public.user_has_role(text) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_petugas() to authenticated;
grant execute on function public.is_nasabah() to authenticated;

revoke all on function public.prevent_self_admin_role() from public, anon, authenticated, service_role;

drop trigger if exists trg_prevent_self_admin_role on public.profiles;
create trigger trg_prevent_self_admin_role
before insert or update on public.profiles
for each row
execute function public.prevent_self_admin_role();

commit;
