alter table public.thiet_bi_chung_thu_so
  add column if not exists han_gia_han_lan_dau date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'thiet_bi_chung_thu_so_han_gia_han_check'
      and conrelid = 'public.thiet_bi_chung_thu_so'::regclass
  ) then
    alter table public.thiet_bi_chung_thu_so
      add constraint thiet_bi_chung_thu_so_han_gia_han_check
      check (han_gia_han_lan_dau is null or han_gia_han_lan_dau >= ngay_het_hieu_luc);
  end if;
end $$;

create index if not exists idx_thiet_bi_chung_thu_so_han_gia_han_lan_dau
  on public.thiet_bi_chung_thu_so (han_gia_han_lan_dau);

drop view if exists public.v_bao_cao_chung_thu_so;

create view public.v_bao_cao_chung_thu_so
with (security_invoker = true)
as
select
  cts.id as thiet_bi_chung_thu_so_id,
  tb.id as thiet_bi_id,
  tb.ma_thiet_bi as so_hieu_thiet_bi,
  tb.ten_thiet_bi,
  lt.id as loai_thiet_bi_id,
  lt.ten_loai as loai_thiet_bi,
  nd.id as nguoi_su_dung_id,
  nd.ho_ten as nguoi_su_dung,
  coalesce(nd.phong_ban_id, tb.phong_ban_id) as phong_ban_id,
  pb.ten_phong_ban,
  cts.so_hieu_chung_thu_so,
  cts.ngay_hieu_luc,
  cts.ngay_het_hieu_luc,
  cts.han_gia_han_lan_dau,
  cts.thoi_diem_gia_han_gan_nhat,
  cts.thoi_diem_thay_doi_thong_tin_gan_nhat,
  cts.thoi_diem_thu_hoi,
  cts.han_gia_han_lan_dau as ngay_can_thu_hoi,
  cts.ngay_het_hieu_luc - current_date as so_ngay_con_lai,
  case
    when cts.thoi_diem_thu_hoi is not null then 'da_thu_hoi'
    when cts.han_gia_han_lan_dau is not null and current_date > cts.han_gia_han_lan_dau then 'can_thu_hoi'
    when current_date > cts.ngay_het_hieu_luc then 'het_han_cho_gia_han'
    when cts.ngay_het_hieu_luc <= current_date + 30 then 'sap_het_han'
    else 'dang_hieu_luc'
  end as trang_thai,
  cts.ghi_chu,
  cts.created_at,
  cts.updated_at
from public.thiet_bi_chung_thu_so cts
join public.thiet_bi tb on tb.id = cts.thiet_bi_id
left join public.loai_thiet_bi lt on lt.id = tb.loai_thiet_bi_id
left join public.nguoi_dung nd on nd.id = cts.nguoi_su_dung_id
left join public.phong_ban pb on pb.id = coalesce(nd.phong_ban_id, tb.phong_ban_id);

comment on column public.thiet_bi_chung_thu_so.han_gia_han_lan_dau
  is 'Han cuoi cung cua dot gia han lan dau; qua ngay nay va chua thu hoi thi chung thu duoc tinh la can thu hoi.';

comment on view public.v_bao_cao_chung_thu_so
  is 'View bao cao chung thu so voi trang thai hieu luc tinh theo ngay hien tai va han gia han lan dau.';
