-- =============================================
-- Doi nhan loai thiet bi 'Sim PKI' -> 'SIM ky so' theo gop y (II.1)
-- Dam bao CTS tren SIM ky so duoc tinh/xuat cung token USB.
-- =============================================

update public.loai_thiet_bi
set ten_loai = 'SIM ký số'
where ma_loai = 'SIM_PKI';
