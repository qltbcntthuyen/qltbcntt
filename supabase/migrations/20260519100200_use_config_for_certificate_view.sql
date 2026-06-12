-- =============================================
-- VIEW v_bao_cao_chung_thu_so: doc nguong sap_het_han tu he_thong_cau_hinh
-- =============================================

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
  cts.email,
  cts.ten_chung_thu_so,
  cts.loai_chung_thu_so,
  cts.to_chuc,
  cts.thong_tin_chung,
  cts.id_chung_thu_so_nguon,
  cts.da_gia_han,
  cts.la_hien_hanh,
  cts.chung_thu_goc_id,
  cts.chung_thu_thay_the_id,
  cts.ngay_hieu_luc,
  cts.ngay_het_hieu_luc,
  cts.han_gia_han_lan_dau,
  cts.thoi_diem_gia_han_gan_nhat,
  cts.thoi_diem_thay_doi_thong_tin_gan_nhat,
  cts.thoi_diem_thu_hoi,
  cts.ly_do_thu_hoi,
  coalesce(
    cts.han_gia_han_lan_dau,
    case when cts.chung_thu_goc_id is not null then cts.ngay_het_hieu_luc else null end
  ) as ngay_can_thu_hoi,
  cts.ngay_het_hieu_luc - current_date as so_ngay_con_lai,
  case
    when cts.thoi_diem_thu_hoi is not null then 'da_thu_hoi'
    when cts.da_gia_han is true then 'da_gia_han'
    when cts.la_hien_hanh is false then 'da_thay_the'
    when cts.han_gia_han_lan_dau is not null and current_date > cts.han_gia_han_lan_dau then 'can_thu_hoi'
    when cts.chung_thu_goc_id is not null and current_date > cts.ngay_het_hieu_luc then 'can_cap_moi'
    when current_date > cts.ngay_het_hieu_luc then 'het_han'
    when cts.ngay_het_hieu_luc <= current_date + private.cts_canh_bao_so_ngay() then 'sap_het_han'
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

grant select on public.v_bao_cao_chung_thu_so to authenticated;
revoke all on public.v_bao_cao_chung_thu_so from anon;

comment on view public.v_bao_cao_chung_thu_so is
  'View bao cao CTS; nguong sap_het_han doc tu he_thong_cau_hinh thay vi hardcode 30 ngay.';
