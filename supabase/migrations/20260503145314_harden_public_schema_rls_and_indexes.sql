create schema if not exists private;

alter table public.nguoi_dung
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

alter table public.nguoi_dung
  drop column if exists mat_khau;

update public.nguoi_dung
set vai_tro = 'user'
where vai_tro is null
   or vai_tro not in ('admin', 'it', 'user');

alter table public.nguoi_dung
  alter column vai_tro set default 'user',
  alter column vai_tro set not null,
  alter column trang_thai set default true,
  alter column trang_thai set not null;

alter table public.nguoi_dung
  drop constraint if exists nguoi_dung_vai_tro_check;

alter table public.nguoi_dung
  add constraint nguoi_dung_vai_tro_check check (vai_tro in ('admin', 'it', 'user'));

create or replace function private.current_nguoi_dung_id()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select nd.id
  from public.nguoi_dung nd
  where nd.auth_user_id = auth.uid()
    and nd.trang_thai is true
  limit 1
$$;

create or replace function private.current_vai_tro()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nd.vai_tro
  from public.nguoi_dung nd
  where nd.auth_user_id = auth.uid()
    and nd.trang_thai is true
  limit 1
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_vai_tro() in ('admin', 'it'), false)
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_thiet_bi_chung_thu_so_updated_at on public.thiet_bi_chung_thu_so;

create trigger set_thiet_bi_chung_thu_so_updated_at
before update on public.thiet_bi_chung_thu_so
for each row
execute function private.set_updated_at();

create index if not exists idx_nguoi_dung_phong_ban_id on public.nguoi_dung (phong_ban_id);
create index if not exists idx_thiet_bi_loai_thiet_bi_id on public.thiet_bi (loai_thiet_bi_id);
create index if not exists idx_thiet_bi_hang_model_id on public.thiet_bi (hang_model_id);
create index if not exists idx_thiet_bi_phong_ban_id on public.thiet_bi (phong_ban_id);
create index if not exists idx_thiet_bi_nguoi_su_dung_id on public.thiet_bi (nguoi_su_dung_id);
create index if not exists idx_thiet_bi_nguon_goc_id on public.thiet_bi (nguon_goc_id);
create index if not exists idx_thiet_bi_tinh_trang_id on public.thiet_bi (tinh_trang_id);
create index if not exists idx_lich_su_ban_giao_thiet_bi_id on public.lich_su_ban_giao (thiet_bi_id);
create index if not exists idx_lich_su_ban_giao_nguoi_nhan_id on public.lich_su_ban_giao (nguoi_nhan_id);
create index if not exists idx_lich_su_ban_giao_phong_ban_nhan_id on public.lich_su_ban_giao (phong_ban_nhan_id);
create index if not exists idx_sua_chua_bao_tri_thiet_bi_id on public.sua_chua_bao_tri (thiet_bi_id);
create index if not exists idx_cau_hinh_may_tinh_he_dieu_hanh_id on public.cau_hinh_may_tinh (he_dieu_hanh_id);
create index if not exists idx_cau_hinh_may_tinh_phan_mem_diet_virus_id on public.cau_hinh_may_tinh (phan_mem_diet_virus_id);
create index if not exists idx_lich_su_chung_thu_so_nguoi_su_dung_id_truoc on public.lich_su_chung_thu_so (nguoi_su_dung_id_truoc);
create index if not exists idx_lich_su_chung_thu_so_nguoi_su_dung_id_sau on public.lich_su_chung_thu_so (nguoi_su_dung_id_sau);

alter table public.phong_ban enable row level security;
alter table public.loai_thiet_bi enable row level security;
alter table public.hang_model enable row level security;
alter table public.he_dieu_hanh enable row level security;
alter table public.phan_mem_diet_virus enable row level security;
alter table public.tinh_trang_thiet_bi enable row level security;
alter table public.nguon_goc_tai_san enable row level security;
alter table public.nguoi_dung enable row level security;
alter table public.thiet_bi enable row level security;
alter table public.cau_hinh_may_tinh enable row level security;
alter table public.lich_su_ban_giao enable row level security;
alter table public.sua_chua_bao_tri enable row level security;
alter table public.thiet_bi_chung_thu_so enable row level security;
alter table public.lich_su_chung_thu_so enable row level security;

revoke all on schema public from anon;
grant usage on schema public to authenticated;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant select, insert, update, delete on
  public.phong_ban,
  public.loai_thiet_bi,
  public.hang_model,
  public.he_dieu_hanh,
  public.phan_mem_diet_virus,
  public.tinh_trang_thiet_bi,
  public.nguon_goc_tai_san,
  public.nguoi_dung,
  public.thiet_bi,
  public.cau_hinh_may_tinh,
  public.lich_su_ban_giao,
  public.sua_chua_bao_tri,
  public.thiet_bi_chung_thu_so,
  public.lich_su_chung_thu_so
to authenticated;

grant select on public.v_bao_cao_chung_thu_so to authenticated;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.current_nguoi_dung_id() to authenticated;
grant execute on function private.current_vai_tro() to authenticated;
grant execute on function private.is_staff() to authenticated;

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'graphql') then
    execute 'revoke usage on schema graphql from anon, authenticated';
    execute 'revoke execute on all functions in schema graphql from anon, authenticated';
  end if;
end $$;

comment on schema private is 'Internal helper schema for RLS and database triggers. Not exposed through the Supabase API.';
comment on column public.nguoi_dung.auth_user_id is 'Supabase Auth user id linked to this internal user profile.';
