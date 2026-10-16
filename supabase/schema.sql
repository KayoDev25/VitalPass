-- ============================================================
-- REJOAR - tablas y datos de demo
-- Pegar completo en Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1) TABLAS (las "hojas" de la planilla) ----------------------

create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  career text not null,
  institution text not null
);

create table credentials (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  code text not null unique,            -- el codigo que se pega en /verificar
  issuer text not null,                 -- institucion que emite la credencial
  issued_at date not null default current_date,
  verified_at timestamptz,              -- vacio = todavia nadie la verifico
  hedera_tx text                        -- mas adelante: enlace al registro en Hedera
);

create table scholarships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  entity text not null,
  deadline date not null
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  scholarship_id uuid not null references scholarships(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, scholarship_id)   -- nadie postula dos veces a la misma beca
);

create table contributions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'simulado',
  stellar_tx text,                      -- mas adelante: hash de la transaccion en Stellar
  created_at timestamptz not null default now()
);

-- 2) PERMISOS (quien puede leer y escribir) -------------------
-- RLS = "Row Level Security": la base bloquea todo salvo lo que permitamos.
-- Esto es para la DEMO. En un producto real se limita por usuario con login.

alter table students      enable row level security;
alter table credentials   enable row level security;
alter table scholarships  enable row level security;
alter table applications  enable row level security;
alter table contributions enable row level security;

create policy "demo: leer estudiantes"   on students      for select to anon using (true);
create policy "demo: leer credenciales"  on credentials   for select to anon using (true);
create policy "demo: leer becas"         on scholarships  for select to anon using (true);
create policy "demo: leer postulaciones" on applications  for select to anon using (true);
create policy "demo: leer aportes"       on contributions for select to anon using (true);

-- La pagina solo puede: marcar una credencial como verificada y registrar aportes.
create policy "demo: verificar credencial" on credentials   for update to anon using (true) with check (true);
create policy "demo: registrar aporte"     on contributions for insert to anon with check (true);

-- Permisos explicitos: primero se saca todo, despues se da solo lo necesario.
-- (asi no dependemos de lo que Supabase de por defecto)
revoke all on students, credentials, scholarships, applications, contributions from anon;

grant usage on schema public to anon;
grant select on students, credentials, scholarships, applications, contributions to anon;
grant insert on contributions to anon;
-- De credentials solo se pueden modificar estas dos columnas:
-- nadie puede cambiar un codigo o el nombre de la institucion desde la pagina.
grant update (verified_at, hedera_tx) on credentials to anon;

-- 3) DATOS DE EJEMPLO (todos ficticios: DATO SIMULADO) --------

insert into students (id, name, career, institution) values
  ('00000000-0000-0000-0000-000000000001', 'Julieta Martínez', 'Licenciatura en Diseño',     'Instituto Superior del Sur'),
  ('00000000-0000-0000-0000-000000000002', 'Mateo Gómez',      'Tecnicatura en Programación', 'Instituto Superior del Sur'),
  ('00000000-0000-0000-0000-000000000003', 'Camila Ibáñez',    'Profesorado de Biología',     'Instituto Superior del Norte');

insert into credentials (student_id, code, issuer, issued_at) values
  ('00000000-0000-0000-0000-000000000001', 'REJOAR-2026-001', 'Instituto Superior del Sur',   '2026-03-12'),
  ('00000000-0000-0000-0000-000000000002', 'REJOAR-2026-002', 'Instituto Superior del Sur',   '2026-03-12'),
  ('00000000-0000-0000-0000-000000000003', 'REJOAR-2026-003', 'Instituto Superior del Norte', '2026-03-20');

insert into scholarships (id, name, entity, deadline) values
  ('10000000-0000-0000-0000-000000000001', 'Beca Impulso Universitario', 'Fundación Horizonte',     '2026-11-30'),
  ('10000000-0000-0000-0000-000000000002', 'Beca Primer Paso',           'Red de Educación Abierta', '2026-12-15'),
  ('10000000-0000-0000-0000-000000000003', 'Beca Talento Digital',       'Comunidad Código Sur',     '2027-01-20');

insert into applications (student_id, scholarship_id) values
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002');

insert into contributions (student_id, amount, status, created_at) values
  ('00000000-0000-0000-0000-000000000002', 150, 'simulado', '2026-10-02 15:00+00'),
  ('00000000-0000-0000-0000-000000000003', 200, 'simulado', '2026-09-18 15:00+00');
