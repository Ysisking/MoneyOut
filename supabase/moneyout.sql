-- MoneyOut — skema database Supabase.
-- Jalankan seluruh isi file ini di Supabase > SQL Editor. Aman dijalankan ulang.
-- Semua tabel berawalan mo_ sehingga boleh memakai project yang sama dengan web lain.
-- Keamanan: Row Level Security — setiap pengguna hanya bisa membaca & mengubah datanya sendiri.

-- ---------------------------------------------------------------- Profil
create table if not exists public.mo_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text not null check (username ~ '^[A-Za-z0-9_.]{3,20}$'),
  occupation text not null default '' check (char_length(occupation) <= 60),
  created_at timestamptz not null default now()
);
create unique index if not exists mo_profiles_username_key on public.mo_profiles (lower(username));

-- Profil dibuat otomatis saat mendaftar lewat MoneyOut (metadata app = 'moneyout').
create or replace function public.mo_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ->> 'app' = 'moneyout' then
    insert into public.mo_profiles (id, email, username, occupation)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data ->> 'username',
      coalesce(left(new.raw_user_meta_data ->> 'occupation', 60), '')
    )
    on conflict (id) do nothing;
  end if;
  return new;
end $$;

revoke execute on function public.mo_handle_new_user() from public, anon, authenticated;

drop trigger if exists mo_on_auth_user_created on auth.users;
create trigger mo_on_auth_user_created
  after insert on auth.users
  for each row execute function public.mo_handle_new_user();

-- Cek ketersediaan username dari halaman daftar (tanpa membuka isi tabel profil).
-- Sengaja bisa dipanggil tanpa login (anon); hanya mengembalikan true/false.
create or replace function public.mo_username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.mo_profiles where lower(username) = lower(trim(p_username)));
$$;
revoke all on function public.mo_username_available(text) from public;
grant execute on function public.mo_username_available(text) to anon, authenticated;

-- ---------------------------------------------------------------- Kategori buatan pengguna
create table if not exists public.mo_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('pemasukan', 'pengeluaran', 'simpanan')),
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

-- ---------------------------------------------------------------- Transaksi (pemasukan, pengeluaran, simpanan)
create table if not exists public.mo_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('pemasukan', 'pengeluaran', 'simpanan')),
  category text not null check (char_length(category) between 1 and 40),
  amount numeric(15, 2) not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 200),
  date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists mo_transactions_user_date on public.mo_transactions (user_id, date desc);

-- ---------------------------------------------------------------- Hutang & piutang
create table if not exists public.mo_debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('hutang', 'piutang')),
  person text not null check (char_length(trim(person)) between 1 and 60),
  amount numeric(15, 2) not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 200),
  date date not null default current_date,
  due_date date,
  created_at timestamptz not null default now()
);
create index if not exists mo_debts_user on public.mo_debts (user_id);

create table if not exists public.mo_debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  debt_id uuid not null references public.mo_debts (id) on delete cascade,
  amount numeric(15, 2) not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 200),
  date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists mo_debt_payments_debt on public.mo_debt_payments (debt_id);

-- ---------------------------------------------------------------- Dompet (akun), transfer, anggaran
-- Mengikuti pola aplikasi keuangan klasik (Quicken, MS Money, GnuCash): setiap dompet
-- punya register sendiri dengan saldo berjalan; perpindahan uang antar-dompet = transfer.
create table if not exists public.mo_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  type text not null default 'tunai' check (type in ('tunai', 'bank', 'ewallet', 'lainnya')),
  opening_balance numeric(15, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists mo_accounts_user on public.mo_accounts (user_id);

alter table public.mo_transactions add column if not exists account_id uuid references public.mo_accounts (id) on delete set null;
create index if not exists mo_transactions_account on public.mo_transactions (account_id);

create table if not exists public.mo_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_account_id uuid not null references public.mo_accounts (id) on delete cascade,
  to_account_id uuid not null references public.mo_accounts (id) on delete cascade,
  amount numeric(15, 2) not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 200),
  date date not null default current_date,
  created_at timestamptz not null default now(),
  check (from_account_id <> to_account_id)
);
create index if not exists mo_transfers_user on public.mo_transfers (user_id);

-- Anggaran bulanan per kategori pengeluaran (metode amplop, seperti YNAB).
create table if not exists public.mo_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (char_length(category) between 1 and 40),
  amount numeric(15, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

-- ---------------------------------------------------------------- Row Level Security
alter table public.mo_profiles enable row level security;
alter table public.mo_categories enable row level security;
alter table public.mo_transactions enable row level security;
alter table public.mo_debts enable row level security;
alter table public.mo_debt_payments enable row level security;
alter table public.mo_accounts enable row level security;
alter table public.mo_transfers enable row level security;
alter table public.mo_budgets enable row level security;

drop policy if exists mo_profiles_select on public.mo_profiles;
drop policy if exists mo_profiles_insert on public.mo_profiles;
drop policy if exists mo_profiles_update on public.mo_profiles;
create policy mo_profiles_select on public.mo_profiles for select to authenticated using (id = (select auth.uid()));
create policy mo_profiles_insert on public.mo_profiles for insert to authenticated with check (id = (select auth.uid()));
create policy mo_profiles_update on public.mo_profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists mo_categories_own on public.mo_categories;
create policy mo_categories_own on public.mo_categories for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists mo_transactions_own on public.mo_transactions;
create policy mo_transactions_own on public.mo_transactions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (account_id is null or exists (select 1 from public.mo_accounts a where a.id = account_id and a.user_id = (select auth.uid())))
  );

drop policy if exists mo_accounts_own on public.mo_accounts;
create policy mo_accounts_own on public.mo_accounts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists mo_budgets_own on public.mo_budgets;
create policy mo_budgets_own on public.mo_budgets for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists mo_transfers_own on public.mo_transfers;
create policy mo_transfers_own on public.mo_transfers for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.mo_accounts a where a.id = from_account_id and a.user_id = (select auth.uid()))
    and exists (select 1 from public.mo_accounts a where a.id = to_account_id and a.user_id = (select auth.uid()))
  );

drop policy if exists mo_debts_own on public.mo_debts;
create policy mo_debts_own on public.mo_debts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists mo_debt_payments_own on public.mo_debt_payments;
create policy mo_debt_payments_own on public.mo_debt_payments for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.mo_debts d where d.id = debt_id and d.user_id = (select auth.uid()))
  );
