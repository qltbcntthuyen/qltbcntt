-- =============================================
-- THIET BI: them co dap_ung_cds, nhom_cds (phuc vu bao cao "Danh gia dap ung CDS")
-- =============================================

alter table public.thiet_bi
  add column if not exists dap_ung_cds boolean not null default false,
  add column if not exists nhom_cds text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'thiet_bi_nhom_cds_check'
      and conrelid = 'public.thiet_bi'::regclass
  ) then
    alter table public.thiet_bi
      add constraint thiet_bi_nhom_cds_check
      check (
        nhom_cds is null
        or nhom_cds in (
          'may_tinh_de_ban',
          'laptop',
          'may_in',
          'may_photocopy',
          'may_scan',
          'may_chieu',
          'may_huy_tai_lieu',
          'khac'
        )
      );
  end if;
end $$;

create index if not exists idx_thiet_bi_dap_ung_cds on public.thiet_bi (dap_ung_cds);
create index if not exists idx_thiet_bi_nhom_cds on public.thiet_bi (nhom_cds);

comment on column public.thiet_bi.dap_ung_cds is 'Co dap ung yeu cau chuyen doi so hay khong; phuc vu bao cao 1.1.';
comment on column public.thiet_bi.nhom_cds is 'Phan nhom thiet bi cho bao cao chuyen doi so (PC, Laptop, MayIn, ...).';
