-- =============================================
-- NHAN SU: tu sinh ma ho so dang NS001, NS002, ...
-- =============================================

create sequence if not exists public.seq_ma_nhan_su start with 1 increment by 1;

create or replace function public.gen_ma_nhan_su()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_value bigint;
  candidate text;
begin
  -- Sync sequence voi cac mac da ton tai dang NS<number> de tranh trung
  perform setval(
    'public.seq_ma_nhan_su',
    greatest(
      coalesce(
        (
          select max((substring(ten_dang_nhap from '^NS([0-9]+)$'))::bigint)
          from public.nguoi_dung
          where ten_dang_nhap ~ '^NS[0-9]+$'
        ),
        0
      ),
      coalesce(currval('public.seq_ma_nhan_su'), 0)
    ),
    true
  );

  loop
    next_value := nextval('public.seq_ma_nhan_su');
    candidate := 'NS' || lpad(next_value::text, 3, '0');
    exit when not exists (
      select 1 from public.nguoi_dung where ten_dang_nhap = candidate
    );
  end loop;

  return candidate;
exception
  when others then
    -- Neu sequence chua dung lan dau (currval khong xac dinh), fallback don gian
    next_value := nextval('public.seq_ma_nhan_su');
    return 'NS' || lpad(next_value::text, 3, '0');
end;
$$;

grant execute on function public.gen_ma_nhan_su() to authenticated;

comment on function public.gen_ma_nhan_su() is 'Sinh ma ho so nhan su tu dong dang NS001, NS002, ... va tranh trung voi cac ma da co.';
