-- =============================================
-- PHONG BAN: tu sinh ma phong ban dang PB001, PB002, ...
-- =============================================

create sequence if not exists public.seq_ma_phong_ban start with 1 increment by 1;

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
  -- Sync sequence voi cac ma da ton tai dang PB<number> de tranh trung.
  select coalesce(max((substring(ma_phong_ban from '^PB([0-9]+)$'))::bigint), 0)
  into max_existing
  from public.phong_ban
  where ma_phong_ban ~ '^PB[0-9]+$';

  perform setval(
    'public.seq_ma_phong_ban',
    greatest(max_existing, 1),
    max_existing > 0
  );

  loop
    next_value := nextval('public.seq_ma_phong_ban');
    candidate := 'PB' || lpad(next_value::text, 3, '0');
    exit when not exists (
      select 1 from public.phong_ban where ma_phong_ban = candidate
    );
  end loop;

  return candidate;
end;
$$;

grant execute on function public.gen_ma_phong_ban() to authenticated;

comment on function public.gen_ma_phong_ban() is 'Sinh ma phong ban tu dong dang PB001, PB002, ... va tranh trung voi cac ma da co.';
