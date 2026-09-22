-- STAGING ONLY. Forward-only, additive Gene customer-planning schema.
-- This script intentionally does not alter legacy plans/plan_days/plan_items,
-- ready_plans, ready_plan_items, images, slugs, or affiliate destinations.

begin;

do $$ begin
  create type public.customer_plan_status as enum ('DRAFT','RECOMMENDED','ANALYZED','CONFIRMED','ARCHIVED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.customer_planning_stage as enum (
    'DRAFT_INPUT','RECOMMENDATIONS_GENERATING','RECOMMENDATIONS_READY',
    'SELECTIONS_CONFIRMED','TIMELINE_GENERATING','TIMELINE_READY',
    'GENERATION_FAILED','SUMMARY_READY','ARCHIVED'
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.generation_status as enum ('PENDING','RUNNING','COMPLETED','FAILED');
exception when duplicate_object then null; end $$;

create table if not exists public.customer_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  pass_id uuid references public.passes(id) on delete set null,
  creation_key text,
  status public.customer_plan_status not null default 'DRAFT',
  planning_stage public.customer_planning_stage not null default 'DRAFT_INPUT',
  version integer not null default 1 check (version > 0),
  title text not null,
  destination text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  inputs_json jsonb,
  recommendation_json jsonb,
  analysis_json jsonb,
  summary_json jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_plans_valid_dates check (end_date >= start_date)
);
create unique index if not exists customer_plans_creation_key_uidx on public.customer_plans(creation_key) where creation_key is not null;
create index if not exists customer_plans_owner_updated_idx on public.customer_plans(user_id, updated_at desc);
create index if not exists customer_plans_owner_status_idx on public.customer_plans(user_id, status);
create index if not exists customer_plans_pass_idx on public.customer_plans(pass_id);

create table if not exists public.customer_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.customer_plans(id) on delete restrict,
  day_index integer not null check (day_index >= 0),
  day_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_id, day_index)
);
create index if not exists customer_plan_days_plan_idx on public.customer_plan_days(plan_id);

create table if not exists public.customer_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.customer_plan_days(id) on delete restrict,
  slot text not null,
  kind text not null,
  title text,
  description text,
  start_time text,
  end_time text,
  provider text,
  provider_id text,
  image_url text,
  deeplink text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_plan_items_day_idx on public.customer_plan_items(plan_day_id);

create table if not exists public.plan_inputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  customer_plan_id uuid references public.customer_plans(id) on delete restrict,
  request_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plan_inputs_owner_created_idx on public.plan_inputs(user_id, created_at desc);
create index if not exists plan_inputs_customer_plan_idx on public.plan_inputs(customer_plan_id);

create table if not exists public.plan_recommendations (
  id uuid primary key default gen_random_uuid(),
  plan_input_id uuid not null references public.plan_inputs(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'READY',
  provider text,
  provider_result_ids jsonb,
  provenance jsonb,
  freshness_at timestamptz,
  selections jsonb,
  result_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plan_recommendations_owner_created_idx on public.plan_recommendations(user_id, created_at desc);
create index if not exists plan_recommendations_input_idx on public.plan_recommendations(plan_input_id);

create table if not exists public.plan_generations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.customer_plans(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null unique,
  status public.generation_status not null default 'PENDING',
  request_json jsonb,
  result_json jsonb,
  provider text,
  provider_request_id text,
  credit_transaction_id uuid,
  error_code text,
  error_message text,
  retry_count integer not null default 0 check (retry_count >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plan_generations_owner_created_idx on public.plan_generations(user_id, created_at desc);
create index if not exists plan_generations_plan_status_idx on public.plan_generations(plan_id, status);
create index if not exists plan_generations_credit_transaction_idx on public.plan_generations(credit_transaction_id);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  pass_id uuid references public.passes(id) on delete restrict,
  amount integer not null check (amount <> 0),
  reason text not null,
  plan_id uuid references public.customer_plans(id) on delete restrict,
  generation_id uuid references public.plan_generations(id) on delete restrict,
  payment_id text references public.payments(id) on delete restrict,
  idempotency_key text not null unique,
  actor text not null,
  reversal_of uuid references public.credit_ledger(id) on delete restrict,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_owner_created_idx on public.credit_ledger(user_id, created_at desc);
create index if not exists credit_ledger_plan_idx on public.credit_ledger(plan_id);
create index if not exists credit_ledger_pass_idx on public.credit_ledger(pass_id);
create index if not exists credit_ledger_generation_idx on public.credit_ledger(generation_id);
create index if not exists credit_ledger_payment_idx on public.credit_ledger(payment_id);
create index if not exists credit_ledger_reversal_idx on public.credit_ledger(reversal_of);

alter table public.plan_generations
  add constraint plan_generations_credit_transaction_fk
  foreign key (credit_transaction_id) references public.credit_ledger(id) on delete restrict
  not valid;

create table if not exists public.tier_action_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  pass_id uuid references public.passes(id) on delete restrict,
  action_type text not null,
  plan_id uuid references public.customer_plans(id) on delete restrict,
  generation_id uuid references public.plan_generations(id) on delete restrict,
  payment_id text references public.payments(id) on delete restrict,
  actor text not null,
  idempotency_key text not null unique,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists tier_action_logs_owner_created_idx on public.tier_action_logs(user_id, created_at desc);
create index if not exists tier_action_logs_pass_idx on public.tier_action_logs(pass_id);
create index if not exists tier_action_logs_plan_idx on public.tier_action_logs(plan_id);
create index if not exists tier_action_logs_generation_idx on public.tier_action_logs(generation_id);
create index if not exists tier_action_logs_payment_idx on public.tier_action_logs(payment_id);

-- Owner-private tables. Server mutations continue through trusted server code.
alter table public.customer_plans enable row level security;
alter table public.customer_plan_days enable row level security;
alter table public.customer_plan_items enable row level security;
alter table public.plan_inputs enable row level security;
alter table public.plan_recommendations enable row level security;
alter table public.plan_generations enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.tier_action_logs enable row level security;

revoke all on public.customer_plans, public.customer_plan_days, public.customer_plan_items,
  public.plan_inputs, public.plan_recommendations, public.plan_generations,
  public.credit_ledger, public.tier_action_logs from anon, authenticated;
grant select on public.customer_plans, public.customer_plan_days, public.customer_plan_items,
  public.plan_inputs, public.plan_recommendations, public.plan_generations to authenticated;

create policy customer_plans_owner_select on public.customer_plans for select to authenticated
  using (user_id = (select auth.uid()));
create policy customer_plan_days_owner_select on public.customer_plan_days for select to authenticated
  using (exists (select 1 from public.customer_plans p where p.id = plan_id and p.user_id = (select auth.uid())));
create policy customer_plan_items_owner_select on public.customer_plan_items for select to authenticated
  using (exists (
    select 1 from public.customer_plan_days d join public.customer_plans p on p.id=d.plan_id
    where d.id=plan_day_id and p.user_id=(select auth.uid())
  ));
create policy plan_inputs_owner_select on public.plan_inputs for select to authenticated
  using (user_id = (select auth.uid()));
create policy plan_recommendations_owner_select on public.plan_recommendations for select to authenticated
  using (user_id = (select auth.uid()));
create policy plan_generations_owner_select on public.plan_generations for select to authenticated
  using (user_id = (select auth.uid()));

commit;
