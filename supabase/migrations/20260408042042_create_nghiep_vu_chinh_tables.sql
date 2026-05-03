-- =============================================
-- NHOM NGHIEP VU CHINH
-- =============================================

create table nguoi_dung (
  id serial primary key,
  phong_ban_id int references phong_ban(id),
  ho_ten varchar(100) not null,
  ten_dang_nhap varchar(50) not null unique,
  mat_khau varchar(255) not null,
  email varchar(100),
  so_dien_thoai varchar(20),
  vai_tro varchar(50),
  trang_thai boolean default true
);

create table thiet_bi (
  id serial primary key,
  ma_thiet_bi varchar(50) not null unique,
  ten_thiet_bi varchar(150) not null,
  loai_thiet_bi_id int not null references loai_thiet_bi(id),
  hang_model_id int references hang_model(id),
  serial varchar(100) unique,
  nam_trang_bi int,
  ngay_tiep_nhan date,
  nguon_goc_id int references nguon_goc_tai_san(id),
  tinh_trang_id int references tinh_trang_thiet_bi(id),
  phong_ban_id int references phong_ban(id),
  nguoi_su_dung_id int references nguoi_dung(id),
  la_thiet_bi_dung_chung boolean default false,
  thiet_bi_mat boolean default false,
  ghi_chu varchar(255)
);

create table cau_hinh_may_tinh (
  id serial primary key,
  thiet_bi_id int not null unique references thiet_bi(id),
  mainboard varchar(100),
  cpu varchar(100),
  ram varchar(50),
  o_cung varchar(100),
  man_hinh varchar(100),
  he_dieu_hanh_id int references he_dieu_hanh(id),
  phan_mem_diet_virus_id int references phan_mem_diet_virus(id),
  ghi_chu varchar(255)
);
