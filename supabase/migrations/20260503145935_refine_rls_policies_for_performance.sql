drop policy if exists authenticated_read_lookup on public.phong_ban;
drop policy if exists staff_manage_all on public.phong_ban;
drop policy if exists authenticated_read_lookup on public.loai_thiet_bi;
drop policy if exists staff_manage_all on public.loai_thiet_bi;
drop policy if exists authenticated_read_lookup on public.hang_model;
drop policy if exists staff_manage_all on public.hang_model;
drop policy if exists authenticated_read_lookup on public.he_dieu_hanh;
drop policy if exists staff_manage_all on public.he_dieu_hanh;
drop policy if exists authenticated_read_lookup on public.phan_mem_diet_virus;
drop policy if exists staff_manage_all on public.phan_mem_diet_virus;
drop policy if exists authenticated_read_lookup on public.tinh_trang_thiet_bi;
drop policy if exists staff_manage_all on public.tinh_trang_thiet_bi;
drop policy if exists authenticated_read_lookup on public.nguon_goc_tai_san;
drop policy if exists staff_manage_all on public.nguon_goc_tai_san;
drop policy if exists users_read_own_profile on public.nguoi_dung;
drop policy if exists users_insert_own_profile on public.nguoi_dung;
drop policy if exists staff_manage_all on public.nguoi_dung;
drop policy if exists users_read_own_devices on public.thiet_bi;
drop policy if exists staff_manage_all on public.thiet_bi;
drop policy if exists users_read_own_computer_config on public.cau_hinh_may_tinh;
drop policy if exists staff_manage_all on public.cau_hinh_may_tinh;
drop policy if exists users_read_own_handover_history on public.lich_su_ban_giao;
drop policy if exists staff_manage_all on public.lich_su_ban_giao;
drop policy if exists users_read_own_maintenance on public.sua_chua_bao_tri;
drop policy if exists staff_manage_all on public.sua_chua_bao_tri;
drop policy if exists users_read_own_cert_devices on public.thiet_bi_chung_thu_so;
drop policy if exists staff_manage_all on public.thiet_bi_chung_thu_so;
drop policy if exists users_read_own_cert_history on public.lich_su_chung_thu_so;
drop policy if exists staff_manage_all on public.lich_su_chung_thu_so;

create policy phong_ban_read_authenticated on public.phong_ban
  for select to authenticated using (true);
create policy phong_ban_insert_staff on public.phong_ban
  for insert to authenticated with check ((select private.is_staff()));
create policy phong_ban_update_staff on public.phong_ban
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy phong_ban_delete_staff on public.phong_ban
  for delete to authenticated using ((select private.is_staff()));

create policy loai_thiet_bi_read_authenticated on public.loai_thiet_bi
  for select to authenticated using (true);
create policy loai_thiet_bi_insert_staff on public.loai_thiet_bi
  for insert to authenticated with check ((select private.is_staff()));
create policy loai_thiet_bi_update_staff on public.loai_thiet_bi
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy loai_thiet_bi_delete_staff on public.loai_thiet_bi
  for delete to authenticated using ((select private.is_staff()));

create policy hang_model_read_authenticated on public.hang_model
  for select to authenticated using (true);
create policy hang_model_insert_staff on public.hang_model
  for insert to authenticated with check ((select private.is_staff()));
create policy hang_model_update_staff on public.hang_model
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy hang_model_delete_staff on public.hang_model
  for delete to authenticated using ((select private.is_staff()));

create policy he_dieu_hanh_read_authenticated on public.he_dieu_hanh
  for select to authenticated using (true);
create policy he_dieu_hanh_insert_staff on public.he_dieu_hanh
  for insert to authenticated with check ((select private.is_staff()));
create policy he_dieu_hanh_update_staff on public.he_dieu_hanh
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy he_dieu_hanh_delete_staff on public.he_dieu_hanh
  for delete to authenticated using ((select private.is_staff()));

create policy phan_mem_diet_virus_read_authenticated on public.phan_mem_diet_virus
  for select to authenticated using (true);
create policy phan_mem_diet_virus_insert_staff on public.phan_mem_diet_virus
  for insert to authenticated with check ((select private.is_staff()));
create policy phan_mem_diet_virus_update_staff on public.phan_mem_diet_virus
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy phan_mem_diet_virus_delete_staff on public.phan_mem_diet_virus
  for delete to authenticated using ((select private.is_staff()));

create policy tinh_trang_thiet_bi_read_authenticated on public.tinh_trang_thiet_bi
  for select to authenticated using (true);
create policy tinh_trang_thiet_bi_insert_staff on public.tinh_trang_thiet_bi
  for insert to authenticated with check ((select private.is_staff()));
create policy tinh_trang_thiet_bi_update_staff on public.tinh_trang_thiet_bi
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy tinh_trang_thiet_bi_delete_staff on public.tinh_trang_thiet_bi
  for delete to authenticated using ((select private.is_staff()));

create policy nguon_goc_tai_san_read_authenticated on public.nguon_goc_tai_san
  for select to authenticated using (true);
create policy nguon_goc_tai_san_insert_staff on public.nguon_goc_tai_san
  for insert to authenticated with check ((select private.is_staff()));
create policy nguon_goc_tai_san_update_staff on public.nguon_goc_tai_san
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy nguon_goc_tai_san_delete_staff on public.nguon_goc_tai_san
  for delete to authenticated using ((select private.is_staff()));

create policy nguoi_dung_read_self_or_staff on public.nguoi_dung
  for select to authenticated using (
    (select private.is_staff())
    or auth_user_id = (select auth.uid())
  );
create policy nguoi_dung_insert_staff on public.nguoi_dung
  for insert to authenticated with check ((select private.is_staff()));
create policy nguoi_dung_update_staff on public.nguoi_dung
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy nguoi_dung_delete_staff on public.nguoi_dung
  for delete to authenticated using ((select private.is_staff()));

create policy thiet_bi_read_self_or_staff on public.thiet_bi
  for select to authenticated using (
    (select private.is_staff())
    or nguoi_su_dung_id = (select private.current_nguoi_dung_id())
  );
create policy thiet_bi_insert_staff on public.thiet_bi
  for insert to authenticated with check ((select private.is_staff()));
create policy thiet_bi_update_staff on public.thiet_bi
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy thiet_bi_delete_staff on public.thiet_bi
  for delete to authenticated using ((select private.is_staff()));

create policy cau_hinh_may_tinh_read_self_or_staff on public.cau_hinh_may_tinh
  for select to authenticated using (
    (select private.is_staff())
    or exists (
      select 1
      from public.thiet_bi tb
      where tb.id = cau_hinh_may_tinh.thiet_bi_id
        and tb.nguoi_su_dung_id = (select private.current_nguoi_dung_id())
    )
  );
create policy cau_hinh_may_tinh_insert_staff on public.cau_hinh_may_tinh
  for insert to authenticated with check ((select private.is_staff()));
create policy cau_hinh_may_tinh_update_staff on public.cau_hinh_may_tinh
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy cau_hinh_may_tinh_delete_staff on public.cau_hinh_may_tinh
  for delete to authenticated using ((select private.is_staff()));

create policy lich_su_ban_giao_read_self_or_staff on public.lich_su_ban_giao
  for select to authenticated using (
    (select private.is_staff())
    or nguoi_nhan_id = (select private.current_nguoi_dung_id())
    or exists (
      select 1
      from public.thiet_bi tb
      where tb.id = lich_su_ban_giao.thiet_bi_id
        and tb.nguoi_su_dung_id = (select private.current_nguoi_dung_id())
    )
  );
create policy lich_su_ban_giao_insert_staff on public.lich_su_ban_giao
  for insert to authenticated with check ((select private.is_staff()));
create policy lich_su_ban_giao_update_staff on public.lich_su_ban_giao
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy lich_su_ban_giao_delete_staff on public.lich_su_ban_giao
  for delete to authenticated using ((select private.is_staff()));

create policy sua_chua_bao_tri_read_self_or_staff on public.sua_chua_bao_tri
  for select to authenticated using (
    (select private.is_staff())
    or exists (
      select 1
      from public.thiet_bi tb
      where tb.id = sua_chua_bao_tri.thiet_bi_id
        and tb.nguoi_su_dung_id = (select private.current_nguoi_dung_id())
    )
  );
create policy sua_chua_bao_tri_insert_staff on public.sua_chua_bao_tri
  for insert to authenticated with check ((select private.is_staff()));
create policy sua_chua_bao_tri_update_staff on public.sua_chua_bao_tri
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy sua_chua_bao_tri_delete_staff on public.sua_chua_bao_tri
  for delete to authenticated using ((select private.is_staff()));

create policy thiet_bi_chung_thu_so_read_self_or_staff on public.thiet_bi_chung_thu_so
  for select to authenticated using (
    (select private.is_staff())
    or nguoi_su_dung_id = (select private.current_nguoi_dung_id())
  );
create policy thiet_bi_chung_thu_so_insert_staff on public.thiet_bi_chung_thu_so
  for insert to authenticated with check ((select private.is_staff()));
create policy thiet_bi_chung_thu_so_update_staff on public.thiet_bi_chung_thu_so
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy thiet_bi_chung_thu_so_delete_staff on public.thiet_bi_chung_thu_so
  for delete to authenticated using ((select private.is_staff()));

create policy lich_su_chung_thu_so_read_self_or_staff on public.lich_su_chung_thu_so
  for select to authenticated using (
    (select private.is_staff())
    or nguoi_su_dung_id_truoc = (select private.current_nguoi_dung_id())
    or nguoi_su_dung_id_sau = (select private.current_nguoi_dung_id())
    or exists (
      select 1
      from public.thiet_bi tb
      where tb.id = lich_su_chung_thu_so.thiet_bi_id
        and tb.nguoi_su_dung_id = (select private.current_nguoi_dung_id())
    )
  );
create policy lich_su_chung_thu_so_insert_staff on public.lich_su_chung_thu_so
  for insert to authenticated with check ((select private.is_staff()));
create policy lich_su_chung_thu_so_update_staff on public.lich_su_chung_thu_so
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy lich_su_chung_thu_so_delete_staff on public.lich_su_chung_thu_so
  for delete to authenticated using ((select private.is_staff()));
