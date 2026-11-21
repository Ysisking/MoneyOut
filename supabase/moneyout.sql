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

-- Aset: harta yang dimiliki di luar arus kas harian (rumah, kendaraan, emas, saham…).
-- Nilainya dicatat apa adanya, tidak dihitung sebagai pemasukan.
create table if not exists public.mo_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  type text not null default 'lainnya' check (type in ('properti', 'kendaraan', 'emas', 'investasi', 'tabungan', 'elektronik', 'lainnya')),
  value numeric(15, 2) not null check (value >= 0),
  as_of date not null default current_date,
  note text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists mo_assets_user on public.mo_assets (user_id);

-- ---------------------------------------------------------------- Row Level Security
alter table public.mo_profiles enable row level security;
alter table public.mo_categories enable row level security;
alter table public.mo_transactions enable row level security;
alter table public.mo_debts enable row level security;
alter table public.mo_debt_payments enable row level security;
alter table public.mo_accounts enable row level security;
alter table public.mo_transfers enable row level security;
alter table public.mo_budgets enable row level security;
alter table public.mo_assets enable row level security;

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

drop policy if exists mo_assets_own on public.mo_assets;
create policy mo_assets_own on public.mo_assets for all to authenticated
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

-- =================================================================== ADMIN, STATUS AKUN, NOTIFIKASI
-- Bagian ini aman dijalankan ulang. Admin dikunci ke akun yatufht@gmail.com yang SUDAH terdaftar
-- (disimpan per user id, bukan sekadar email). Perubahan fitur admin wajib disetujui pemilik.

create table if not exists public.mo_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.mo_admins enable row level security; -- tanpa policy: tidak bisa dibaca/diubah dari aplikasi
insert into public.mo_admins (user_id) select id from auth.users where lower(email) = 'yatufht@gmail.com' on conflict do nothing;

create or replace function public.mo_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mo_admins where user_id = auth.uid());
$$;
revoke all on function public.mo_is_admin() from public, anon;
grant execute on function public.mo_is_admin() to authenticated;

-- Status akun. Pengguna yang sudah ada saat kolom ini pertama dibuat langsung aktif;
-- pendaftar baru mulai sebagai 'pending' (masuk Purchase Order).
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mo_profiles' and column_name = 'status') then
    alter table public.mo_profiles add column status text not null default 'pending';
    alter table public.mo_profiles add column status_reason text not null default '';
    alter table public.mo_profiles add column status_updated_at timestamptz not null default now();
    alter table public.mo_profiles add column approved_at timestamptz;
    alter table public.mo_profiles add column last_seen_at timestamptz;
    update public.mo_profiles set status = 'active', approved_at = now();
  end if;
end $$;
alter table public.mo_profiles drop constraint if exists mo_profiles_status_check;
alter table public.mo_profiles add constraint mo_profiles_status_check check (status in ('pending', 'active', 'queued', 'blocked', 'frozen'));
alter table public.mo_profiles drop constraint if exists mo_profiles_reason_check;
alter table public.mo_profiles add constraint mo_profiles_reason_check check (char_length(status_reason) <= 200);

create or replace function public.mo_is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select public.mo_is_admin() or exists (select 1 from public.mo_profiles where id = auth.uid() and status = 'active');
$$;
revoke all on function public.mo_is_active() from public, anon;
grant execute on function public.mo_is_active() to authenticated;

-- Pengguna hanya boleh mengubah nama, pekerjaan, dan waktu terakhir aktif — bukan statusnya sendiri.
revoke insert, update on public.mo_profiles from anon, authenticated;
grant insert (id, email, username, occupation) on public.mo_profiles to authenticated;
grant update (username, occupation, last_seen_at) on public.mo_profiles to authenticated;

drop policy if exists mo_profiles_select on public.mo_profiles;
create policy mo_profiles_select on public.mo_profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.mo_is_admin()));

-- Aktivitas (masuk, keluar, daftar, perubahan status).
create table if not exists public.mo_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event text not null check (event in ('signup', 'login', 'logout', 'status')),
  detail text not null default '' check (char_length(detail) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists mo_activity_time on public.mo_activity (created_at desc);
alter table public.mo_activity enable row level security;
drop policy if exists mo_activity_insert on public.mo_activity;
create policy mo_activity_insert on public.mo_activity for insert to authenticated
  with check (user_id = (select auth.uid()) and event in ('login', 'logout'));
drop policy if exists mo_activity_select on public.mo_activity;
create policy mo_activity_select on public.mo_activity for select to authenticated using ((select public.mo_is_admin()));

-- Notifikasi: 'system' (dibuat sistem untuk satu pengguna) dan 'broadcast' (pengumuman admin untuk semua).
create table if not exists public.mo_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- null = untuk semua pengguna
  kind text not null check (kind in ('system', 'broadcast')),
  level text not null default 'info' check (level in ('info', 'success', 'warning', 'danger')),
  title text not null check (char_length(trim(title)) between 1 and 120),
  body text not null default '' check (char_length(body) <= 1000),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((kind = 'broadcast' and user_id is null) or (kind = 'system' and user_id is not null))
);
create index if not exists mo_notifications_user on public.mo_notifications (user_id, created_at desc);
alter table public.mo_notifications enable row level security;
drop policy if exists mo_notifications_select on public.mo_notifications;
create policy mo_notifications_select on public.mo_notifications for select to authenticated
  using (user_id = (select auth.uid()) or user_id is null);
drop policy if exists mo_notifications_broadcast on public.mo_notifications;
create policy mo_notifications_broadcast on public.mo_notifications for insert to authenticated
  with check (kind = 'broadcast' and user_id is null and (select public.mo_is_admin()));
drop policy if exists mo_notifications_delete on public.mo_notifications;
create policy mo_notifications_delete on public.mo_notifications for delete to authenticated
  using (kind = 'broadcast' and (select public.mo_is_admin()));

create table if not exists public.mo_notification_reads (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  notification_id uuid not null references public.mo_notifications (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);
alter table public.mo_notification_reads enable row level security;
drop policy if exists mo_notification_reads_own on public.mo_notification_reads;
create policy mo_notification_reads_own on public.mo_notification_reads for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Pendaftaran baru: profil 'pending', catat aktivitas, beri tahu admin dan pendaftar.
create or replace function public.mo_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_admin uuid;
begin
  if new.raw_user_meta_data ->> 'app' = 'moneyout' then
    insert into public.mo_profiles (id, email, username, occupation)
    values (new.id, new.email, new.raw_user_meta_data ->> 'username', coalesce(left(new.raw_user_meta_data ->> 'occupation', 60), ''))
    on conflict (id) do nothing;
    insert into public.mo_activity (user_id, event, detail) values (new.id, 'signup', '');
    insert into public.mo_notifications (user_id, kind, level, title, body)
    values (new.id, 'system', 'info', 'Pendaftaran diterima', 'Akunmu sedang menunggu persetujuan admin. Kamu akan diberi tahu di sini begitu akun aktif.');
    for v_admin in select user_id from public.mo_admins loop
      insert into public.mo_notifications (user_id, kind, level, title, body)
      values (v_admin, 'system', 'warning', 'Pendaftar baru menunggu',
              coalesce(new.raw_user_meta_data ->> 'username', new.email) || ' (' || new.email || ') masuk Purchase Order.');
    end loop;
  end if;
  return new;
end $$;
revoke execute on function public.mo_handle_new_user() from public, anon, authenticated;

-- Admin mengubah status pengguna: accept / queue / block / freeze.
create or replace function public.mo_admin_set_status(p_user uuid, p_status text, p_reason text default '')
returns void language plpgsql security definer set search_path = public as $$
declare v_old text; v_approved timestamptz; v_reason text := left(trim(coalesce(p_reason, '')), 200); v_title text; v_body text;
begin
  if not public.mo_is_admin() then raise exception 'Hanya admin yang boleh mengubah status pengguna.'; end if;
  if p_status not in ('active', 'queued', 'blocked', 'frozen') then raise exception 'Status tidak dikenal.'; end if;
  if exists (select 1 from public.mo_admins where user_id = p_user) then raise exception 'Status akun admin tidak bisa diubah.'; end if;
  select status, approved_at into v_old, v_approved from public.mo_profiles where id = p_user;
  if not found then raise exception 'Pengguna tidak ditemukan.'; end if;
  if p_status = 'frozen' and v_approved is null then raise exception 'Hanya pelanggan yang sudah diterima yang bisa dibekukan.'; end if;
  if p_status in ('blocked', 'frozen') and v_reason = '' then raise exception 'Tulis alasannya.'; end if;

  update public.mo_profiles
  set status = p_status, status_reason = case when p_status = 'active' then '' else v_reason end, status_updated_at = now(),
      approved_at = case when p_status = 'active' then coalesce(approved_at, now()) else approved_at end
  where id = p_user;

  v_title := case p_status when 'active' then 'Akunmu sudah aktif' when 'queued' then 'Kamu masuk antrean'
                           when 'blocked' then 'Akunmu diblokir' else 'Akunmu dibekukan' end;
  v_body := case p_status when 'active' then 'Kamu sudah bisa memakai MoneyOut. Selamat mencatat!'
                          when 'queued' then 'Sistem sedang sibuk. Akunmu akan diproses sesuai giliran.'
                          when 'blocked' then 'Kamu tidak bisa memakai MoneyOut sampai blokir dipulihkan.'
                          else 'Akunmu ditangguhkan sementara.' end;
  if v_reason <> '' and p_status <> 'active' then v_body := v_body || case when p_status = 'queued' then ' Catatan admin: ' else ' Alasan: ' end || v_reason; end if;
  insert into public.mo_notifications (user_id, kind, level, title, body, created_by)
  values (p_user, 'system', case p_status when 'active' then 'success' when 'queued' then 'info' else 'danger' end, v_title, v_body, auth.uid());
  insert into public.mo_activity (user_id, event, detail)
  values (p_user, 'status', v_old || ' → ' || p_status || case when v_reason <> '' and p_status <> 'active' then ' · ' || v_reason else '' end);
end $$;
revoke all on function public.mo_admin_set_status(uuid, text, text) from public, anon;
grant execute on function public.mo_admin_set_status(uuid, text, text) to authenticated;

-- Data keuangan hanya bisa dipakai akun berstatus aktif (atau admin).
drop policy if exists mo_categories_own on public.mo_categories;
create policy mo_categories_own on public.mo_categories for all to authenticated
  using (user_id = (select auth.uid()) and (select public.mo_is_active()))
  with check (user_id = (select auth.uid()) and (select public.mo_is_active()));
drop policy if exists mo_debts_own on public.mo_debts;
create policy mo_debts_own on public.mo_debts for all to authenticated
  using (user_id = (select auth.uid()) and (select public.mo_is_active()))
  with check (user_id = (select auth.uid()) and (select public.mo_is_active()));
drop policy if exists mo_accounts_own on public.mo_accounts;
create policy mo_accounts_own on public.mo_accounts for all to authenticated
  using (user_id = (select auth.uid()) and (select public.mo_is_active()))
  with check (user_id = (select auth.uid()) and (select public.mo_is_active()));
drop policy if exists mo_budgets_own on public.mo_budgets;
create policy mo_budgets_own on public.mo_budgets for all to authenticated
  using (user_id = (select auth.uid()) and (select public.mo_is_active()))
  with check (user_id = (select auth.uid()) and (select public.mo_is_active()));
drop policy if exists mo_assets_own on public.mo_assets;
create policy mo_assets_own on public.mo_assets for all to authenticated
  using (user_id = (select auth.uid()) and (select public.mo_is_active()))
  with check (user_id = (select auth.uid()) and (select public.mo_is_active()));
drop policy if exists mo_transactions_own on public.mo_transactions;
create policy mo_transactions_own on public.mo_transactions for all to authenticated
  using (user_id = (select auth.uid()) and (select public.mo_is_active()))
  with check (
    user_id = (select auth.uid()) and (select public.mo_is_active())
    and (account_id is null or exists (select 1 from public.mo_accounts a where a.id = account_id and a.user_id = (select auth.uid())))
  );
drop policy if exists mo_transfers_own on public.mo_transfers;
create policy mo_transfers_own on public.mo_transfers for all to authenticated
  using (user_id = (select auth.uid()) and (select public.mo_is_active()))
  with check (
    user_id = (select auth.uid()) and (select public.mo_is_active())
    and exists (select 1 from public.mo_accounts a where a.id = from_account_id and a.user_id = (select auth.uid()))
    and exists (select 1 from public.mo_accounts a where a.id = to_account_id and a.user_id = (select auth.uid()))
  );
drop policy if exists mo_debt_payments_own on public.mo_debt_payments;
create policy mo_debt_payments_own on public.mo_debt_payments for all to authenticated
  using (user_id = (select auth.uid()) and (select public.mo_is_active()))
  with check (
    user_id = (select auth.uid()) and (select public.mo_is_active())
    and exists (select 1 from public.mo_debts d where d.id = debt_id and d.user_id = (select auth.uid()))
  );
