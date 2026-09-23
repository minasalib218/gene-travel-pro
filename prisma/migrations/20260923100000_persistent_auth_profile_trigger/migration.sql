-- Additive authentication hardening. No customer content or commerce rows are rewritten.
create schema if not exists private;

create or replace function private.ensure_gene_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    "fullName",
    "avatarUrl",
    role,
    "createdAt",
    "updatedAt"
  )
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Traveler'
    ),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    'USER',
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    "fullName" = coalesce(public.profiles."fullName", excluded."fullName"),
    "avatarUrl" = coalesce(excluded."avatarUrl", public.profiles."avatarUrl"),
    "updatedAt" = now();

  return new;
end;
$$;

revoke all on function private.ensure_gene_profile() from public, anon, authenticated;

drop trigger if exists gene_auth_user_profile on auth.users;
create trigger gene_auth_user_profile
after insert on auth.users
for each row execute function private.ensure_gene_profile();
