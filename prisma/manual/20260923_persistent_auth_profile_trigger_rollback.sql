-- Rollback for 20260923100000_persistent_auth_profile_trigger.
-- This removes only the trigger/function. It intentionally preserves every profile row.
drop trigger if exists gene_auth_user_profile on auth.users;
drop function if exists private.ensure_gene_profile();
