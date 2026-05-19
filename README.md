# 💈 BarberFlow — Plataforma Inteligente de Agendamiento para Barberías

---

# 📌 Estado del Proyecto

**Última actualización:** 2026-05-18  
**Deploy activo:** https://barber-rylax.vercel.app

---

## ✅ Módulos completados

### 🔐 Autenticación (`/auth/login`)
- Login con email + contraseña
- Registro de cuenta nueva
- Soporte para `?tab=registro` (va directo a pestaña registro)
- Recuperación de contraseña ("¿Olvidaste tu contraseña?")
- Redirects post-login al dashboard
- Protección de rutas via `proxy.ts` (Next.js 16)
- Supabase Auth URL configurada en producción (`https://barber-rylax.vercel.app`)

### 🚀 Onboarding (`/onboarding`)
- Creación del perfil de barbería (nombre, slug, país, departamento, ciudad, dirección, teléfono, email)
- Selects en cascada: País → Departamento → Ciudad (Colombia incluida con 33 departamentos)
- Upsert de `profiles` antes de insertar barbería (evita FK violation para usuarios sin perfil)
- Comprobación de slug único en tiempo real
- Creación automática de suscripción trial de 7 días
- Redirección al dashboard si la barbería ya existe (fix 409)

### 📊 Dashboard Principal (`/dashboard`)
- Header sticky con logo, nombre de barbería, avatar, toggle de tema y botón de salir
- Banner de trial (días restantes, alerta ≤2 días, estado vencido)
- Tarjetas de stats: Citas hoy, Total citas, Barberos activos, Plan activo
- Banner de upgrade (solo cuando no es Pro)
- Accesos rápidos a: Nueva cita, Barberos, Servicios, Horarios, Reportes, Configuración
- Info resumen de la barbería
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

### ⚙️ Configuración (`/dashboard/configuracion`)
- Editar información básica: nombre, slug, descripción
- Vista previa del link público (`/b/{slug}`)
- Carga de logo desde computadora/móvil (Supabase Storage, max 2 MB, upsert)
- Selects en cascada: País → Departamento → Ciudad
- Editar contacto: dirección, teléfono, email
- Validación de slug único
- Toast de feedback en guardado

### 💳 Sistema de Suscripciones y Pagos (Wompi)
- Enum `plan_suscripcion`: `trial | gratis | pro | business`
- Trial: 7 días gratis con fecha de expiración
- Planes Pro: Mensual $49.900 COP / Anual $479.000 COP
- Tabla `pagos` con RLS
- Ruta `/dashboard/upgrade` con comparativa de planes
- Ruta `/dashboard/upgrade/success` con polling de confirmación
- API Route `POST /api/checkout/wompi` — genera referencia + URL de checkout
  - URL de redirect derivada de `new URL(request.url).origin` (fix 403 CloudFront)
- API Route `POST /api/webhooks/wompi` — procesa eventos de pago

### 📱 PWA (Progressive Web App)
- `manifest.json` con `display: standalone`, `start_url: /dashboard`
- Ícono generado con Next.js `ImageResponse` (`/icon` → 512×512 PNG, fondo oscuro + tijeras doradas)
- Meta tags: `theme-color`, `mobile-web-app-capable`, `apple-mobile-web-app-capable`
- Tutorial de instalación obligatorio (sin opción de omitir) al iniciar sesión por primera vez:
  - **Android/Desktop:** captura `beforeinstallprompt` y lanza el diálogo nativo con un solo toque
  - **iOS Safari:** 4 pasos con diagramas animados que muestran exactamente dónde tocar (botón Compartir, menú "Agregar a inicio", confirmación "Agregar")
  - Diagrama animado de la barra de direcciones para Desktop
  - Persiste en `localStorage` (`bf_install_tutorial_v1`) — se muestra solo una vez por navegador

### 🎨 Sistema de Temas (Claro / Oscuro)
- Toggle ☀️/🌙 en el header del dashboard
- Persiste en `localStorage` (`bf-theme`)
- Script anti-flash en `<head>` — aplica el tema antes de que React hidrate (sin parpadeo)
- Variables CSS semánticas en `globals.css`:

| Token | Oscuro | Claro |
|-------|--------|-------|
| `bg-base` | zinc-950 | #fff |
| `bg-card` | zinc-900 | zinc-100 |
| `bg-chip` | zinc-800 | zinc-200 |
| `border-line` | zinc-800 | zinc-200 |
| `border-line-2` | zinc-700 | zinc-300 |
| `text-ink` | #fff | zinc-950 |
| `text-ink-2` | zinc-400 | zinc-600 |
| `text-ink-3` | zinc-500 | zinc-500 |
| `text-ink-4` | zinc-600 | zinc-400 |

- Todos los componentes, inputs, placeholders y hovers usan los tokens semánticos

### 🌐 Landing Page (`/`)
- Hero, Features, HowItWorks, Pricing, Footer
- Verificación de sesión server-side (no flash)
- Navbar y Pricing adaptativos: muestra "Mi dashboard →" si está logueado
- Precios: Trial 7 días / Pro Mensual COP $49.900 / Pro Anual COP $479.000

---

## 🔧 Pendiente

| Módulo | Estado | Notas |
|--------|--------|-------|
| `/dashboard/citas/nueva` | ⏳ Pendiente | Creación manual de citas |
| `/dashboard/horarios` | ⏳ Pendiente | Configurar disponibilidad semanal por barbero |
| `/dashboard/reportes` | ⏳ Pendiente | Ingresos y estadísticas |
| `/b/[slug]` | ⏳ Pendiente | Página pública de agendamiento para clientes |
| Webhook Wompi prod | ⏳ Pendiente | Configurar URL en dashboard Wompi |

---

## 🗄 Base de Datos — Supabase

**Proyecto ID:** `ikinfcwknskmuhjuufqy`  
**Dashboard:** https://supabase.com/dashboard/project/ikinfcwknskmuhjuufqy

### Tablas
- `profiles` — Perfil de usuarios (auto-creado al registrarse via trigger; upsert en onboarding como fallback)
- `barberias` — Barberías registradas (pais, departamento, ciudad, slug único)
- `barberos` — Barberos por barbería
- `servicios` — Servicios y precios
- `horarios` — Disponibilidad semanal de barberos
- `citas` — Citas agendadas
- `suscripciones` — Plan activo por barbería
- `pagos` — Historial de pagos Wompi

### Migraciones aplicadas
| Archivo | Descripción |
|---------|-------------|
| `supabase/schema.sql` | Esquema inicial completo |
| `migrations/001_add_trial_and_payments.sql` | Enum trial + columnas Wompi + tabla pagos |
| `migrations/20260518043635_fix_servicios_grants.sql` | Grants para roles `anon` y `authenticated` en servicios |
| `migrations/20260518120000_fix_profiles_rls_and_backfill.sql` | Política INSERT en profiles + backfill de usuarios existentes |

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 + variables CSS semánticas |
| Animaciones | Framer Motion |
| Backend/DB | Supabase (PostgreSQL + Storage + Auth) |
| Auth | Supabase Auth (email + contraseña) |
| Pagos | Wompi (Colombia) — sandbox activo |
| Hosting | Vercel — https://barber-rylax.vercel.app |

---

## ⚙️ Variables de Entorno

### Local (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://ikinfcwknskmuhjuufqy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_INTEGRITY_KEY=...
WOMPI_EVENTS_KEY=...
```

### Producción (Vercel → Settings → Environment Variables)
```env
NEXT_PUBLIC_SUPABASE_URL=https://ikinfcwknskmuhjuufqy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://barber-rylax.vercel.app
NEXT_PUBLIC_APP_URL=https://barber-rylax.vercel.app
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_INTEGRITY_KEY=...
WOMPI_EVENTS_KEY=...
```

### Supabase Auth → URL Configuration
- **Site URL:** `https://barber-rylax.vercel.app`
- **Redirect URLs:** `https://barber-rylax.vercel.app/**`

---

## 🚀 Correr en desarrollo

```bash
npm install
npm run dev
# App en http://localhost:3000
```

---

## 📦 Estructura de carpetas relevante

```
src/
├── app/
│   ├── auth/login/          # Login + registro
│   ├── dashboard/
│   │   ├── page.tsx         # Dashboard principal
│   │   ├── layout.tsx       # Layout con InstallTutorial
│   │   ├── barberos/        # Gestión de barberos
│   │   ├── servicios/       # Catálogo de servicios
│   │   ├── configuracion/   # Config de la barbería
│   │   └── upgrade/         # Planes y pagos
│   ├── onboarding/          # Registro inicial de barbería
│   ├── api/
│   │   ├── checkout/wompi/  # Genera checkout URL
│   │   └── webhooks/wompi/  # Procesa pagos
│   ├── icon.tsx             # Ícono PWA (ImageResponse)
│   └── layout.tsx           # Root layout + ThemeProvider
├── components/
│   ├── ThemeProvider.tsx    # Contexto de tema claro/oscuro
│   ├── ThemeToggle.tsx      # Botón ☀️/🌙
│   ├── InstallTutorial.tsx  # Tutorial PWA obligatorio
│   ├── SignOutButton.tsx
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── Pricing.tsx
│   └── Footer.tsx
├── lib/
│   ├── supabase/            # Client, server, service clients
│   ├── locations.ts         # Países, departamentos, ciudades
│   └── subscriptions.ts     # Lógica de estado de suscripción
└── types/
    └── database.ts          # Tipos TypeScript del schema
```
