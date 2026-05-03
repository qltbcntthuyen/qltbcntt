-- =============================================
-- NHOM LICH SU PHAT SINH
-- =============================================

create table lich_su_ban_giao (
  id serial primary key,
  thiet_bi_id int not null references thiet_bi(id),
  nguoi_nhan_id int references nguoi_dung(id),
  phong_ban_nhan_id int references phong_ban(id),
  ngay_ban_giao date not null,
  ngay_thu_hoi date,
  hinh_thuc varchar(50),
  noi_dung varchar(255),
  ghi_chu varchar(255)
);

create table sua_chua_bao_tri (
  id serial primary key,
  thiet_bi_id int not null references thiet_bi(id),
  ngay_ghi_nhan date not null,
  ngay_sua_chua date,
  loai_xu_ly varchar(50),
  mo_ta_loi varchar(255),
  ket_qua_xu_ly varchar(255),
  chi_phi numeric(18,2),
  don_vi_sua_chua varchar(150),
  ghi_chu varchar(255)
);
