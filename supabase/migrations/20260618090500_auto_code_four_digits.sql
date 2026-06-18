-- =============================================
-- AUTO CODE: dung 4 chu so cho ma tu sinh (NS0001, TB0001, PB0001)
-- =============================================

create sequence if not exists public.seq_ma_nhan_su start with 1 increment by 1;
create sequence if not exists public.seq_ma_thiet_bi start with 1 increment by 1;
create sequence if not exists public.seq_ma_phong_ban start with 1 increment by 1;

create or replace function public.gen_ma_nhan_su()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_value bigint;
  max_existing bigint;
  candidate text;
begin
  select coalesce(max((substring(ten_dang_nhap from '^NS([0-9]+)$'))::bigint), 0)
  into max_existing
  from public.nguoi_dung
  where ten_dang_nhap ~ '^NS[0-9]+$';

  perform setval('public.seq_ma_nhan_su', greatest(max_existing, 1), max_existing > 0);

  loop
    next_value := nextval('public.seq_ma_nhan_su');
    candidate := 'NS' || lpad(next_value::text, 4, '0');
    exit when not exists (
      select 1 from public.nguoi_dung where ten_dang_nhap = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.gen_ma_thiet_bi()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_value bigint;
  max_existing bigint;
  candidate text;
begin
  select coalesce(max((substring(ma_thiet_bi from '^TB([0-9]+)$'))::bigint), 0)
  into max_existing
  from public.thiet_bi
  where ma_thiet_bi ~ '^TB[0-9]+$';

  perform setval('public.seq_ma_thiet_bi', greatest(max_existing, 1), max_existing > 0);

  loop
    next_value := nextval('public.seq_ma_thiet_bi');
    candidate := 'TB' || lpad(next_value::text, 4, '0');
    exit when not exists (
      select 1 from public.thiet_bi where ma_thiet_bi = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.gen_ma_phong_ban()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_value bigint;
  max_existing bigint;
  candidate text;
begin
  select coalesce(max((substring(ma_phong_ban from '^PB([0-9]+)$'))::bigint), 0)
  into max_existing
  from public.phong_ban
  where ma_phong_ban ~ '^PB[0-9]+$';

  perform setval('public.seq_ma_phong_ban', greatest(max_existing, 1), max_existing > 0);

  loop
    next_value := nextval('public.seq_ma_phong_ban');
    candidate := 'PB' || lpad(next_value::text, 4, '0');
    exit when not exists (
      select 1 from public.phong_ban where ma_phong_ban = candidate
    );
  end loop;

  return candidate;
end;
$$;

grant execute on function public.gen_ma_nhan_su() to authenticated;
grant execute on function public.gen_ma_thiet_bi() to authenticated;
grant execute on function public.gen_ma_phong_ban() to authenticated;

comment on function public.gen_ma_nhan_su() is 'Sinh ma ho so nhan su tu dong dang NS0001, NS0002, ... va tranh trung voi cac ma da co.';
comment on function public.gen_ma_thiet_bi() is 'Sinh ma thiet bi tu dong dang TB0001, TB0002, ... va tranh trung voi cac ma da co.';
comment on function public.gen_ma_phong_ban() is 'Sinh ma phong ban tu dong dang PB0001, PB0002, ... va tranh trung voi cac ma da co.';
