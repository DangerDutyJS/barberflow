# BarberFlow — Plataforma de Agendamiento para Barberías

**Deploy activo:** https://barber-rylax.vercel.app  
**Última actualización:** 2026-05-21

---

## Módulos completados

### Autenticación (`/auth/login`)
- Login con email + contraseña, registro, recuperación de contraseña
- Redirects post-login al dashboard
- Protección de rutas via `proxy.ts` (Next.js 16)

### Onboarding (`/onboarding`)
- Registro de barbería: nombre, slug, país, departamento, ciudad, dirección, teléfono, email
- Selects en cascada: País → Departamento → Ciudad
- Validación de slug único en tiempo real
- Suscripción trial de 7 días creada automáticamente

### Dashboard principal (`/dashboard`)
- Header sticky con nombre de barbería, avatar, toggle de tema y botón salir
- Banner de trial con días restantes
- Stats: Citas hoy, Total citas, Barberos activos, Plan activo
- Accesos rápidos a todos los módulos

### Barberos (`/dashboard/barberos`)
- CRUD completo con avatar (inicial o foto URL)
- Toggle activo/inactivo, eliminar con confirmación

### Servicios (`/dashboard/servicios`)
- Tabla/cards, búsqueda, filtros, orden, modal con precio y duración
- Toggle activo/inactivo, eliminar con confirmación

### Configuración (`/dashboard/configuracion`)
- Editar nombre, slug, descripción, logo, teléfono, email, dirección
- Carga de logo desde dispositivo (Supabase Storage, max 2 MB)
- Vista previa del link público

### Horarios (`/dashboard/horarios`)
- Disponibilidad semanal por barbero (Lunes–Domingo)
- Toggle activo por día + hora inicio y hora fin
- Upsert inmediato en Supabase

### Citas (`/dashboard/citas`)
- Tabs: **Por hacer** (pendiente + confirmada) y **Echos** (completada + cancelada)
- Filtro Hoy / Todas
- Acciones inline: marcar completada, cancelar

### Nueva Cita (`/dashboard/citas/nueva`)
- Wizard 4 pasos: Servicio → Barbero → Fecha & Hora → Cliente
- Grilla de slots con disponibilidad real (bloquea slots ocupados)
- Formulario de datos del cliente

### Reportes (`/dashboard/reportes`)
- Selector de período: últimos 7 días / este mes / este año
- Stats: total citas, completadas %, canceladas %, pendientes
- Ingresos estimados de citas completadas
- Barbero top y servicio más solicitado del período
- Historial completo de suscripciones Wompi

### Upgrade / Pagos (`/dashboard/upgrade`)
- Planes Pro Mensual ($49.900 COP) y Pro Anual ($479.000 COP)
- Integración Wompi producción: checkout + webhook + activación de plan
- API `POST /api/checkout/wompi` — genera URL de checkout con firma de integridad
- API `POST /api/webhooks/wompi` — procesa eventos y activa plan Pro

### PWA
- `manifest.json` con `display: standalone`
- Ícono generado por Next.js `ImageResponse`
- Tutorial de instalación (Android nativo + iOS Safari step-by-step)

### Temas (claro/oscuro)
- Toggle en el header, persiste en localStorage
- Script anti-flash en `<head>`
- Variables CSS semánticas en `globals.css`

---

## Pendiente

| Módulo | Descripción |
|--------|-------------|
| `/b/[slug]` | Página pública de agendamiento para clientes |

---

## Base de datos — Supabase

### Tablas
| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfil de usuarios |
| `barberias` | Barberías registradas |
| `barberos` | Barberos por barbería |
| `servicios` | Servicios y precios |
| `horarios` | Disponibilidad semanal por barbero |
| `citas` | Citas agendadas |
| `suscripciones` | Plan activo por barbería |
| `pagos` | Historial de pagos Wompi |

### Migraciones aplicadas
| Archivo | Descripción |
|---------|-------------|
| `supabase/schema.sql` | Esquema inicial completo |
| `migrations/001_add_trial_and_payments.sql` | Enum trial + columnas Wompi + tabla pagos |
| `migrations/20260518043635_fix_servicios_grants.sql` | Grants para roles anon y authenticated |
| `migrations/20260518120000_fix_profiles_rls_and_backfill.sql` | Política INSERT en profiles + backfill |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 + variables CSS semánticas |
| Animaciones | Framer Motion |
| Backend/DB | Supabase (PostgreSQL + Storage + Auth) |
| Pagos | Wompi (Colombia) — producción activa |
| Hosting | Vercel — https://barber-rylax.vercel.app |

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo servidor) |
| `WOMPI_PUBLIC_KEY` | Clave pública Wompi producción |
| `WOMPI_PRIVATE_KEY` | Clave privada Wompi producción |
| `WOMPI_INTEGRITY_KEY` | Clave de integridad Wompi producción |
| `WOMPI_EVENTS_KEY` | Clave de eventos/webhook Wompi producción |

---

## Correr en desarrollo

```bash
npm install
npm run dev
# App en http://localhost:3000
```

---

## Estructura de carpetas

```
src/
├── app/
│   ├── auth/login/
│   ├── dashboard/
│   │   ├── page.tsx               # Dashboard principal
│   │   ├── layout.tsx
│   │   ├── barberos/
│   │   ├── citas/
│   │   │   └── nueva/
│   │   ├── configuracion/
│   │   ├── horarios/              # Disponibilidad semanal
│   │   ├── reportes/              # Stats e ingresos
│   │   ├── servicios/
│   │   └── upgrade/
│   ├── onboarding/
│   ├── api/
│   │   ├── checkout/wompi/
│   │   └── webhooks/wompi/
│   └── icon.tsx
├── components/
├── lib/
│   ├── supabase/
│   ├── wompi.ts
│   └── subscriptions.ts
└── types/
    └── database.ts
```
