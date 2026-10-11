# HeartCry — Plataforma Ministerial y Educativa

Plataforma web de alcance global inspirada en la estética sobria y editorial de HeartCry
Missionary Society. Construida con Next.js 14 (App Router), TypeScript, Tailwind CSS,
Prisma (PostgreSQL) y Zustand + localStorage para la demo local.

## Estructura

```
heartcry-platform/
├── prisma/schema.prisma        # Modelos Prisma (PostgreSQL)
├── schema.sql                  # DDL completo + vistas + funciones + datos demo
├── src/
│   ├── app/                    # App Router
│   │   ├── page.tsx            # Hero + Doctrina + Enfoque + Esperanza + Mapa
│   │   ├── paises/page.tsx     # Listado de países
│   │   ├── paises/[id]/        # Perfil dinámico del país (Joshua Project)
│   │   ├── educacion/page.tsx  # Muro educativo (cursos/charlas/eventos)
│   │   ├── donar/page.tsx      # Formulario de donaciones simulado
│   │   ├── login/page.tsx      # Login / Registro
│   │   └── dashboard/page.tsx  # Panel admin (CRUD publicaciones)
│   ├── components/
│   │   ├── ui/                 # Button, Input, Card, Modal, Badge, Progress...
│   │   ├── layout/             # Navbar, Footer
│   │   ├── map/                # WorldMap + CountryList/Cards
│   │   ├── country/            # CountryDetail
│   │   ├── posts/              # PostCard + PostFeed (contenido bloqueado)
│   │   ├── donations/          # DonationForm (PayPal/Tarjeta)
│   │   └── modals/             # LoginModal, CountryModal, DonationModal
│   ├── store/index.ts          # Zustand + persist (localStorage) para demo 100% funcional
│   ├── lib/mockData.ts         # Datos semilla (10 países, 8 publicaciones)
│   └── types/index.ts          # Tipos TypeScript compartidos
└── package.json
```

## Puesta en marcha (demo local, sin BD)

```bash
npm install
npm run dev
# http://localhost:3000
```

La app funciona al 100% con Zustand + localStorage. Cuentas demo:

| Rol      | Email                   | Password    |
|----------|-------------------------|-------------|
| Admin    | admin@heartcry.org      | admin123    |
| Visitante| visitor@heartcry.org    | visitor123  |

## Conectar la base de datos real

1. Crea la BD: `psql -U postgres -f schema.sql`
2. Configura `.env` a partir de `.env.example`
3. `npx prisma generate && npx prisma db push`
4. Reemplaza el store mock por consultas Prisma en las páginas/API routes.

## Modelo de datos

- `users` (id, name, email, password_hash, role, country, created_at)
- `joshua_project_countries` (población, grupos étnicos, no alcanzados, idioma, religión, % cristianos, % evangélicos, barra de progreso, overview)
- `educational_posts` (título, tipo curso/charla/evento, meeting_link protegido, drive_mega_link protegido, event_date, created_by → users)
- `subscriptions` (user_id, email, phone, receive_whatsapp, receive_email, enrolled_courses JSONB)
- `donations` (donor_name, donor_email, amount, currency, target_country_id FK, status)

## Características clave

- Mapa interactivo con nodos por país coloreados según progreso evangélico.
- `/paises/[id]` con todos los campos Joshua Project y barras de progreso.
- Muro educativo con vista previa pública; enlaces Zoom/Meet y Drive/Mega bloqueados hasta iniciar sesión.
- Donaciones simuladas con PayPal/Tarjeta, montos predefinidos y selector de país destino.
- Diseño sobrio editorial: serif Cormorant Garamond para títulos, Inter para lectura, paleta cálida oscura.