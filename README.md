# 💈 BarberFlow — Plataforma Inteligente de Agendamiento para Barberías

---

# 📌 Estado del Proyecto

**Última actualización:** 2026-05-17

## ✅ Módulos completados

### 🔐 Autenticación (`/auth/login`)
- Login con email + contraseña
- Registro de cuenta nueva
- Soporte para `?tab=registro` (va directo a pestaña registro)
- Recuperación de contraseña ("¿Olvidaste tu contraseña?")
- Redirects post-login al dashboard
- Protección de rutas via `proxy.ts` (Next.js 16)

### 🚀 Onboarding (`/onboarding`)
- Creación del perfil de barbería (nombre, slug, descripción, etc.)
- Creación automática de suscripción trial de 7 días
- Redirige al dashboard al completar

### 📊 Dashboard Principal (`/dashboard`)
- Banner de trial (días restantes, alerta cuando quedan ≤2 días, estado vencido)
- Tarjeta "Plan activo" con estado de suscripción
- Accesos rápidos a: Servicios, Barberos, Citas, Configuración
- Auth check server-side (sin flash de login)

### ✂️ Barberos (`/dashboard/barberos`)
- Grid de barberos con avatar (inicial o foto URL)
- Modal agregar/editar (nombre + foto URL)
- Toggle activo/inactivo
- Eliminar con confirmación inline
- Toast de feedback
- Estado vacío con CTA

### 🛠 Servicios (`/dashboard/servicios`)
- Tabla en desktop, tarjetas en móvil
- 4 tarjetas de stats (total, precio promedio, duración promedio, catálogo público)
- Búsqueda en tiempo real
- Filtros: Todos / Activos / Inactivos
- Orden: A-Z / Precio asc/desc / Duración
- Modal con duración rápida (botones predefinidos) + precio COP
- Toggle activo/inactivo
- Eliminar con confirmación inline
- Ingreso potencial por cliente en el footer

### 💳 Sistema de Suscripciones
- Enum `plan_suscripcion`: `trial | gratis | pro | business`
- Trial: 7 días gratis con fecha de expiración
- Estructura lista para Wompi (Colombia): Pro Mensual $49.900 COP / Pro Anual $479.000 COP
- Tabla `pagos` con RLS
- Ruta `/dashboard/upgrade` con planes
- Ruta `/dashboard/upgrade/success` con polling de confirmación
- API Route `POST /api/checkout/wompi` (genera referencia + URL de checkout)
- API Route `POST /api/webhooks/wompi` (procesa eventos de pago)

### 🌐 Landing Page (`/`)
- Hero, Features, HowItWorks, Pricing, Footer
- Verificación de sesión server-side (no flash)
- Navbar, Hero y Pricing adaptativos: muestra "Mi dashboard →" si está logueado
- Redirects: usuarios logueados van directo a `/dashboard`
- Precios actualizados: Trial 7 días / Pro Mensual COP $49.900 / Pro Anual COP $479.000

---

## 🔧 En progreso / Pendiente

| Módulo | Estado | Notas |
|--------|--------|-------|
| Debug listado servicios | ✅ Resuelto | Causa: grants de tabla faltantes en BD. Fix: aplicar migración `fix_servicios_grants.sql` en Supabase SQL Editor |
| Credenciales Wompi | ⏳ Pendiente | Agregar a `.env.local`: `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_KEY`, `WOMPI_EVENTS_KEY` |
| Configurar webhook Wompi | ⏳ Pendiente | URL: `https://dominio/api/webhooks/wompi` |
| `/dashboard/configuracion` | ⏳ Pendiente | Editar datos de la barbería |
| `/dashboard/citas/nueva` | ⏳ Pendiente | Creación manual de citas |
| `/b/[slug]` | ⏳ Pendiente | Página pública de agendamiento para clientes |

---

## 🗄 Base de Datos — Supabase

**Proyecto:** `ikinfcwknskmuhjuufqy`

### Tablas
- `profiles` — Perfil de usuarios (auto-creado al registrarse)
- `barberias` — Barberías registradas
- `barberos` — Barberos por barbería
- `servicios` — Servicios y precios
- `horarios` — Disponibilidad semanal de barberos
- `citas` — Citas agendadas
- `suscripciones` — Plan activo por barbería
- `pagos` — Historial de pagos Wompi

### Migraciones aplicadas
- `supabase/schema.sql` — Esquema inicial completo
- `supabase/migrations/001_add_trial_and_payments.sql` — Enum trial + columnas Wompi + tabla pagos
- `supabase/migrations/20260518043635_fix_servicios_grants.sql` — Grants explícitos para roles `anon` y `authenticated` *(pendiente de aplicar)*

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16.2.6 (App Router, Turbopack) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Animaciones | Framer Motion |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + contraseña) |
| Pagos | Wompi (Colombia) — pendiente credenciales |
| Hosting | Vercel (recomendado) |

---

## ⚙️ Variables de Entorno (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://ikinfcwknskmuhjuufqy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Pendiente — agregar cuando se verifique cuenta Wompi
WOMPI_PUBLIC_KEY=
WOMPI_INTEGRITY_KEY=
WOMPI_EVENTS_KEY=
```

---

## 🚀 Correr en desarrollo

```bash
npm install
npm run dev
# App en http://localhost:3000
```

---

# 📚 Recomendación de Commits

Se recomienda realizar commits frecuentes con el formato:
```bash
feat: agregar sistema de login
feat: crear dashboard del barbero
fix: corregir error en reservas
style: mejorar diseño responsive
refactor: optimizar consultas de Supabase
```
