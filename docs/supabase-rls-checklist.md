# Supabase RLS Testing Checklist

Use this after applying the `20260527100000_add_supabase_rls_policies` migration.

## Anonymous visitor

- Can view only published `ready_plans`
- Can view only published `destinations`
- Can view only published `offers`
- Can view only published `events`
- Cannot insert, update, or delete any content
- Can load public images from `ready-plans`, `destinations`, `offers`, and `events` buckets

## Authenticated customer

- Can read only their own `profiles` row
- Can read, create, update, and delete only their own `plans`
- Can read, create, update, and delete only their own `plan_days`
- Can read, create, update, and delete only their own `plan_items`
- Cannot read another user's plans, plan days, or plan items
- Can read only their own `passes`
- Can read only their own `payments`
- Can read only their own `ai_usage_logs`
- Cannot update pass credits, pass status, payment status, or AI usage rows directly
- Cannot insert or delete pass, payment, or AI usage rows directly

## Admin

- `profiles.role = 'ADMIN'` user can read all protected rows
- Admin can create, update, publish, draft, archive, and remove `ready_plans`
- Admin can create, update, publish, draft, and remove `destinations`
- Admin can create, update, publish, draft, and remove `offers`
- Admin can create, update, publish, draft, and remove `events`
- Admin can manage `affiliate_links`
- Admin can upload, replace, and delete images in the four public content buckets

## Content visibility

- Draft `ready_plans` do not appear publicly
- Draft `destinations` do not appear publicly
- Draft `offers` do not appear publicly
- Draft `events` do not appear publicly
- Removed content does not appear publicly

## Backend expectations

- Affiliate links are only surfaced through internal redirect routes
- Webhook/server logic remains the only code path that should mutate payment and pass balances
- AI usage rows continue to be written server-side after successful actions only
