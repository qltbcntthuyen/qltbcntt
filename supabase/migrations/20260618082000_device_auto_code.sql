-- =============================================
-- THIET BI: tu sinh ma thiet bi dang TB001, TB002, ...
-- =============================================

create sequence if not exists public.seq_ma_thiet_bi start with 1 increment by 1;

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
  -- Sync sequence voi cac ma da ton tai dang TB<number> de tranh trung.
  select coalesce(max((substring(ma_thiet_bi from '^TB([0-9]+)$'))::bigint), 0)
  into max_existing
  from public.thiet_bi
  where ma_thiet_bi ~ '^TB[0-9]+$';

  perform setval(
    'public.seq_ma_thiet_bi',
    greatest(max_existing, 1),
    max_existing > 0
  );

  loop
    next_value := nextval('public.seq_ma_thiet_bi');
    candidate := 'TB' || lpad(next_value::text, 3, '0');
    exit when not exists (
      select 1 from public.thiet_bi where ma_thiet_bi = candidate
    );
  end loop;

  return candidate;
end;
$$;

grant execute on function public.gen_ma_thiet_bi() to authenticated;

comment on function public.gen_ma_thiet_bi() is 'Sinh ma thiet bi tu dong dang TB001, TB002, ... va tranh trung voi cac ma da co.';
