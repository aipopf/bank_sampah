-- Creates a public.profiles row after a new auth.users row is inserted.
-- Requires public.profiles.id (uuid) as a single-column primary/unique key
-- and public.profiles.role. Only id and role are written here.
-- Run as the trusted postgres database role. Do not execute from the app.

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

  if not exists (
    select 1
    from pg_index as profile_index
    join pg_attribute as profile_id
      on profile_id.attrelid = profile_index.indrelid
     and profile_id.attname = 'id'
    where profile_index.indrelid = 'public.profiles'::regclass
      and profile_index.indisunique
      and profile_index.indisvalid
      and profile_index.indnkeyatts = 1
      and profile_id.attnum = any(profile_index.indkey)
  ) then
    raise exception 'Expected a single-column primary key or unique constraint on public.profiles.id.';
  end if;
end;
$preflight$;

-- Permit only the Supabase Auth database role to insert its own newly-created
-- user as a nasabah. This narrow exception is needed because the role-helper
-- trigger also runs for the profile insert performed by the auth.users trigger.
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

  if tg_op = 'INSERT'
     and session_user = 'supabase_auth_admin'
     and requested_role = 'nasabah'
     and exists (
       select 1
       from auth.users as auth_user
       where auth_user.id = new.id
     )
  then
    return new;
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

alter function public.prevent_self_admin_role() owner to postgres;
revoke all on function public.prevent_self_admin_role()
  from public, anon, authenticated, service_role;

drop trigger if exists trg_prevent_self_admin_role on public.profiles;
create trigger trg_prevent_self_admin_role
before insert or update on public.profiles
for each row
execute function public.prevent_self_admin_role();

create or replace function public.create_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, role)
  values (new.id, 'nasabah')
  on conflict (id) do nothing;

  return new;
end;
$function$;

alter function public.create_profile_for_new_auth_user() owner to postgres;
revoke all on function public.create_profile_for_new_auth_user()
  from public, anon, authenticated, service_role;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row
execute function public.create_profile_for_new_auth_user();

commit;
