-- =============================================
-- BANG CAU HINH HE THONG: luu cac tham so cau hinh dung chung (vd nguong canh bao het han CTS)
-- =============================================

create table if not exists public.he_thong_cau_hinh (
  key text primary key,
  value jsonb not null,
  mo_ta text,
  updated_at timestamp with time zone not null default now()
);

alter table public.he_thong_cau_hinh enable row level security;

drop trigger if exists set_he_thong_cau_hinh_updated_at on public.he_thong_cau_hinh;

create trigger set_he_thong_cau_hinh_updated_at
before update on public.he_thong_cau_hinh
for each row
execute function private.set_updated_at();

drop policy if exists he_thong_cau_hinh_read_authenticated on public.he_thong_cau_hinh;
drop policy if exists he_thong_cau_hinh_insert_staff on public.he_thong_cau_hinh;
drop policy if exists he_thong_cau_hinh_update_staff on public.he_thong_cau_hinh;
drop policy if exists he_thong_cau_hinh_delete_staff on public.he_thong_cau_hinh;

create policy he_thong_cau_hinh_read_authenticated
  on public.he_thong_cau_hinh
  for select to authenticated using (true);
create policy he_thong_cau_hinh_insert_staff
  on public.he_thong_cau_hinh
  for insert to authenticated with check ((select private.is_staff()));
create policy he_thong_cau_hinh_update_staff
  on public.he_thong_cau_hinh
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy he_thong_cau_hinh_delete_staff
  on public.he_thong_cau_hinh
  for delete to authenticated using ((select private.is_staff()));

grant select, insert, update, delete on public.he_thong_cau_hinh to authenticated;

-- Seed gia tri mac dinh: nguong canh bao het han chung thu so = 30 ngay
insert into public.he_thong_cau_hinh (key, value, mo_ta)
values
  ('cts_canh_bao_so_ngay', to_jsonb(30), 'So ngay truoc khi het hieu luc se danh dau CTS la sap_het_han.')
on conflict (key) do nothing;

-- Helper function: tra ve nguong canh bao (default 30 neu chua cau hinh)
create or replace function private.cts_canh_bao_so_ngay()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select (value)::int from public.he_thong_cau_hinh where key = 'cts_canh_bao_so_ngay' limit 1),
    30
  )
$$;

grant execute on function private.cts_canh_bao_so_ngay() to authenticated;

comment on table public.he_thong_cau_hinh is 'Cau hinh he thong dang key/value JSON; sua qua trang Cau hinh.';
comment on function private.cts_canh_bao_so_ngay() is 'So ngay nguong de tinh trang thai sap_het_han, doc tu he_thong_cau_hinh.';
