-- STAGING ONLY: additive Control Centre foundation.
-- Does not touch Ready Plans, affiliate base URLs, images, legacy plans, users,
-- payments, passes, credits, destinations, events, offers, or published slugs.
begin;

create table if not exists public.customer_travel_preferences (
  user_id uuid primary key references auth.users(id) on delete restrict,
  preferred_pace text,
  walking_tolerance text,
  interests text[] not null default '{}',
  avoided_activities text[] not null default '{}',
  budget_preference text,
  accommodation_preference text,
  transport_preference text,
  wake_time time,
  sleep_time time,
  meal_preferences text[] not null default '{}',
  weather_preference text,
  accessibility_requirements text,
  mobility_requirements text,
  family_composition jsonb,
  preferred_travel_months integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  opaque_click_id text not null unique,
  user_id uuid references auth.users(id) on delete restrict,
  plan_id uuid references public.customer_plans(id) on delete restrict,
  day_id uuid references public.customer_plan_days(id) on delete restrict,
  item_id uuid references public.customer_plan_items(id) on delete restrict,
  provider text not null,
  source_page text,
  price_snapshot_id uuid,
  status text not null default 'RECORDED',
  failure_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.customer_plans(id) on delete restrict,
  item_id uuid references public.customer_plan_items(id) on delete restrict,
  amount numeric(14,2),
  currency text,
  price_type text not null check (price_type in ('LIVE','RECENTLY_CHECKED','ESTIMATED','UNAVAILABLE')),
  checked_at timestamptz,
  provider text,
  provider_reference text,
  created_at timestamptz not null default now(),
  check ((amount is null and currency is null) or (amount is not null and currency is not null))
);

alter table public.trip_affiliate_clicks
  add constraint trip_affiliate_clicks_price_snapshot_fk
  foreign key (price_snapshot_id) references public.trip_price_snapshots(id) on delete set null not valid;

create table if not exists public.trip_booking_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.customer_plans(id) on delete restrict,
  item_id uuid references public.customer_plan_items(id) on delete restrict,
  click_id uuid references public.trip_affiliate_clicks(id) on delete set null,
  status text not null default 'NOT_SELECTED' check (status in (
    'NOT_SELECTED','SELECTED','CLICKED','BOOKING_PENDING','CUSTOMER_CONFIRMED',
    'PROVIDER_CONFIRMED','CANCELLED','REFUNDED'
  )),
  final_price numeric(14,2),
  currency text,
  booked_at timestamptz,
  booking_reference_ciphertext text,
  cancellation_deadline timestamptz,
  notes text,
  provider_evidence jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, plan_id, item_id),
  check ((final_price is null and currency is null) or (final_price is not null and currency is not null))
);

create table if not exists public.trip_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.customer_plans(id) on delete restrict,
  title text not null,
  category text not null,
  due_at timestamptz,
  status text not null default 'OPEN',
  critical boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_packing_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.customer_plans(id) on delete restrict,
  rule_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, plan_id)
);

create table if not exists public.trip_packing_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.trip_packing_lists(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  category text not null,
  label text not null,
  system_generated boolean not null default false,
  essential boolean not null default false,
  hidden boolean not null default false,
  packed boolean not null default false,
  traveller_label text,
  luggage_type text,
  reminder_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.customer_plans(id) on delete restrict,
  planned_total numeric(14,2) not null default 0,
  currency text not null,
  per_person numeric(14,2),
  category_allocations jsonb,
  uncertainty_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, plan_id)
);

create table if not exists public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.customer_plans(id) on delete restrict,
  category text not null,
  label text not null,
  amount numeric(14,2) not null,
  currency text not null,
  expense_type text not null default 'ACTUAL',
  occurred_at timestamptz,
  shared boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_analysis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.customer_plans(id) on delete restrict,
  input_version integer not null,
  analysis_type text not null,
  score numeric(6,2),
  level text,
  factors jsonb not null default '[]',
  corrections jsonb not null default '[]',
  explanation text,
  engine_version text not null,
  created_at timestamptz not null default now(),
  unique(plan_id, input_version, analysis_type)
);

create table if not exists public.trip_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.customer_plans(id) on delete restrict,
  input_version integer not null,
  score integer not null check (score between 0 and 100),
  categories jsonb not null,
  missing_actions jsonb not null default '[]',
  critical_actions jsonb not null default '[]',
  next_action text,
  created_at timestamptz not null default now(),
  unique(plan_id, input_version)
);

create table if not exists public.trip_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete restrict,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  promotional_enabled boolean not null default false,
  reminder_frequency text not null default 'NORMAL',
  updated_at timestamptz not null default now()
);

create table if not exists public.gene_feature_flags (
  key text primary key,
  enabled boolean not null default false,
  admin_test_only boolean not null default true,
  config jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.gene_jobs (
  id uuid primary key default gen_random_uuid(),
  job_key text not null unique,
  job_type text not null,
  status text not null default 'PENDING',
  payload jsonb not null default '{}',
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  last_error_code text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (attempts >= 0 and max_attempts between 1 and 10)
);

create index if not exists trip_clicks_owner_created_idx on public.trip_affiliate_clicks(user_id, created_at desc);
create index if not exists trip_clicks_plan_item_idx on public.trip_affiliate_clicks(plan_id, item_id);
create index if not exists trip_clicks_day_idx on public.trip_affiliate_clicks(day_id);
create index if not exists trip_clicks_item_idx on public.trip_affiliate_clicks(item_id);
create index if not exists trip_clicks_price_snapshot_idx on public.trip_affiliate_clicks(price_snapshot_id);
create index if not exists trip_price_plan_item_idx on public.trip_price_snapshots(plan_id, item_id, created_at desc);
create index if not exists trip_prices_item_idx on public.trip_price_snapshots(item_id);
create index if not exists trip_prices_user_idx on public.trip_price_snapshots(user_id);
create index if not exists trip_bookings_owner_status_idx on public.trip_booking_records(user_id, status, updated_at desc);
create index if not exists trip_bookings_click_idx on public.trip_booking_records(click_id);
create index if not exists trip_bookings_item_idx on public.trip_booking_records(item_id);
create index if not exists trip_bookings_plan_idx on public.trip_booking_records(plan_id);
create index if not exists trip_tasks_plan_status_due_idx on public.trip_tasks(plan_id, status, due_at);
create index if not exists trip_tasks_user_idx on public.trip_tasks(user_id);
create index if not exists trip_packing_items_list_idx on public.trip_packing_items(list_id);
create index if not exists trip_packing_items_user_idx on public.trip_packing_items(user_id);
create index if not exists trip_packing_lists_plan_idx on public.trip_packing_lists(plan_id);
create index if not exists trip_budgets_plan_idx on public.trip_budgets(plan_id);
create index if not exists trip_expenses_plan_created_idx on public.trip_expenses(plan_id, created_at desc);
create index if not exists trip_expenses_user_idx on public.trip_expenses(user_id);
create index if not exists trip_analysis_plan_version_idx on public.trip_analysis_results(plan_id, input_version);
create index if not exists trip_analysis_user_idx on public.trip_analysis_results(user_id);
create index if not exists trip_readiness_plan_created_idx on public.trip_readiness_snapshots(plan_id, created_at desc);
create index if not exists trip_readiness_user_idx on public.trip_readiness_snapshots(user_id);
create index if not exists gene_jobs_status_run_after_idx on public.gene_jobs(status, run_after);

-- All customer records are server-written. Customers receive owner-only reads.
alter table public.customer_travel_preferences enable row level security;
alter table public.trip_affiliate_clicks enable row level security;
alter table public.trip_price_snapshots enable row level security;
alter table public.trip_booking_records enable row level security;
alter table public.trip_tasks enable row level security;
alter table public.trip_packing_lists enable row level security;
alter table public.trip_packing_items enable row level security;
alter table public.trip_budgets enable row level security;
alter table public.trip_expenses enable row level security;
alter table public.trip_analysis_results enable row level security;
alter table public.trip_readiness_snapshots enable row level security;
alter table public.trip_notification_preferences enable row level security;
alter table public.gene_feature_flags enable row level security;
alter table public.gene_jobs enable row level security;

revoke all on public.customer_travel_preferences, public.trip_affiliate_clicks,
  public.trip_price_snapshots, public.trip_booking_records, public.trip_tasks,
  public.trip_packing_lists, public.trip_packing_items, public.trip_budgets,
  public.trip_expenses, public.trip_analysis_results,
  public.trip_readiness_snapshots, public.trip_notification_preferences,
  public.gene_feature_flags, public.gene_jobs from anon, authenticated;

grant select on public.customer_travel_preferences, public.trip_affiliate_clicks,
  public.trip_price_snapshots, public.trip_booking_records, public.trip_tasks,
  public.trip_packing_lists, public.trip_packing_items, public.trip_budgets,
  public.trip_expenses, public.trip_analysis_results,
  public.trip_readiness_snapshots, public.trip_notification_preferences to authenticated;

create policy customer_preferences_owner_select on public.customer_travel_preferences for select to authenticated using (user_id=(select auth.uid()));
create policy trip_clicks_owner_select on public.trip_affiliate_clicks for select to authenticated using (user_id=(select auth.uid()));
create policy trip_prices_owner_select on public.trip_price_snapshots for select to authenticated using (user_id=(select auth.uid()));
create policy trip_bookings_owner_select on public.trip_booking_records for select to authenticated using (user_id=(select auth.uid()));
create policy trip_tasks_owner_select on public.trip_tasks for select to authenticated using (user_id=(select auth.uid()));
create policy trip_packing_lists_owner_select on public.trip_packing_lists for select to authenticated using (user_id=(select auth.uid()));
create policy trip_packing_items_owner_select on public.trip_packing_items for select to authenticated using (user_id=(select auth.uid()));
create policy trip_budgets_owner_select on public.trip_budgets for select to authenticated using (user_id=(select auth.uid()));
create policy trip_expenses_owner_select on public.trip_expenses for select to authenticated using (user_id=(select auth.uid()));
create policy trip_analysis_owner_select on public.trip_analysis_results for select to authenticated using (user_id=(select auth.uid()));
create policy trip_readiness_owner_select on public.trip_readiness_snapshots for select to authenticated using (user_id=(select auth.uid()));
create policy trip_notification_preferences_owner_select on public.trip_notification_preferences for select to authenticated using (user_id=(select auth.uid()));

commit;
