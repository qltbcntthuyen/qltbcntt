-- =============================================
-- NHOM DANH MUC
-- =============================================

create table phong_ban (
  id serial primary key,
  ma_phong_ban varchar(20) unique,
  ten_phong_ban varchar(150) not null,
  ghi_chu varchar(255)
);

create table loai_thiet_bi (
  id serial primary key,
  ma_loai varchar(20) unique,
  ten_loai varchar(100) not null,
  ghi_chu varchar(255)
);

create table hang_model (
  id serial primary key,
  ten_hang varchar(100) not null,
  ten_model varchar(100),
  ghi_chu varchar(255)
);

create table he_dieu_hanh (
  id serial primary key,
  ten_he_dieu_hanh varchar(100) not null,
  phien_ban varchar(50)
);

create table phan_mem_diet_virus (
  id serial primary key,
  ten_phan_mem varchar(100) not null,
  phien_ban varchar(50)
);

create table tinh_trang_thiet_bi (
  id serial primary key,
  ma_tinh_trang varchar(20) unique,
  ten_tinh_trang varchar(100) not null,
  ghi_chu varchar(255)
);

create table nguon_goc_tai_san (
  id serial primary key,
  ma_nguon_goc varchar(20) unique,
  ten_nguon_goc varchar(100) not null,
  ghi_chu varchar(255)
);
