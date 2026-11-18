-- Partidas de Puchamon en Supabase (proyecto "puchamon"). Ya está aplicada en la base; queda aquí como referencia.
-- Se guarda todo el paquete de ranuras con un "código de partida" (como las claves de los juegos viejos).
-- El código nunca se guarda: la fila se identifica con su huella sha256. Nadie lee ni escribe la tabla directo
-- (RLS sin políticas); sólo se puede guardar o leer con las dos funciones, sabiendo el código.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.partidas (
  id text primary key,
  datos jsonb not null,
  creada timestamptz not null default now(),
  actualizada timestamptz not null default now()
);
alter table public.partidas enable row level security;
revoke all on table public.partidas from anon, authenticated;

create or replace function public.puchamon_guardar(codigo text, datos jsonb)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare k text; t timestamptz := now();
begin
  if codigo is null or length(codigo) < 16 or length(codigo) > 64 then raise exception 'codigo invalido'; end if;
  if datos is null or jsonb_typeof(datos) <> 'object' then raise exception 'datos invalidos'; end if;
  if pg_column_size(datos) > 2000000 then raise exception 'partida muy grande'; end if;
  k := encode(extensions.digest(codigo, 'sha256'), 'hex');
  insert into public.partidas (id, datos, actualizada) values (k, datos, t)
  on conflict (id) do update set datos = excluded.datos, actualizada = t;
  return t;
end; $$;

create or replace function public.puchamon_leer(codigo text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if codigo is null or length(codigo) < 16 or length(codigo) > 64 then return null; end if;
  select p.datos into r from public.partidas p where p.id = encode(extensions.digest(codigo, 'sha256'), 'hex');
  return r;
end; $$;

revoke all on function public.puchamon_guardar(text, jsonb) from public;
revoke all on function public.puchamon_leer(text) from public;
grant execute on function public.puchamon_guardar(text, jsonb) to anon, authenticated;
grant execute on function public.puchamon_leer(text) to anon, authenticated;
