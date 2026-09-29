# Presupuesto Sin Miedo

Herramienta de **presupuesto personal con inteligencia artificial**. Registra tus
ingresos y gastos y la IA los **categoriza**, mide tu **salud financiera** (con las
fórmulas visibles) y te entrega **recomendaciones de ahorro personalizadas**
basadas en la metodología 50/30/20.

Incluye **autenticación** (email + contraseña) y **suscripción de pago** con Stripe:
el análisis con IA es el **plan de pago** (gratis: 1 análisis al mes; Pro: ilimitado).

Construida con **Next.js (App Router) + TypeScript + Tailwind CSS**, **Supabase**
(auth + base de datos Postgres) y **Stripe** (suscripciones). Pensada para
desplegarse en **Netlify**.

> El documento de estrategia de negocio está en
> [`docs/ESTRATEGIA.md`](docs/ESTRATEGIA.md).

## Cómo funciona el acceso

- El **dashboard**, las gráficas y los indicadores de salud financiera son **gratis**
  y no requieren cuenta.
- El botón **«Analizar con IA»** requiere **iniciar sesión**. En el plan gratuito se
  permite **1 análisis al mes**; los planes **Pro** (mensual) y **Anual** lo hacen
  ilimitado.
- **Persistencia:** con sesión iniciada, tus movimientos se **guardan en la base de
  datos** (Supabase) y se sincronizan entre dispositivos. Sin sesión, se guardan solo
  en el navegador (`localStorage`) y se migran a tu cuenta al iniciar sesión.
- **Modo de desarrollo:** si Supabase no está configurado, la app opera en «modo
  abierto» (sin login ni límite) para que puedas probar la IA solo con
  `ANTHROPIC_API_KEY`. Al configurar Supabase, se activan la autenticación y el
  paywall automáticamente.

## Requisitos

- Node.js 18.18+ (probado en Node 22).
- Cuenta de **Anthropic** (IA): <https://console.anthropic.com/>.
- Cuenta de **Supabase** (auth + BD): <https://supabase.com/>.
- Cuenta de **Stripe** (pagos): <https://dashboard.stripe.com/>.

## Configuración local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia el archivo de variables de entorno:

   ```bash
   cp .env.example .env.local
   ```

3. Completa `.env.local` (ver secciones siguientes) y arranca:

   ```bash
   npm run dev
   ```

   Abre <http://localhost:3000>.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí (IA) | Clave de la API de Anthropic. |
| `ANTHROPIC_MODEL` | No | Modelo de Claude. Por defecto `claude-sonnet-5-5`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí (auth) | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí (auth) | Clave pública (anon) de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí (pagos) | Clave service_role (SECRETA). La usa el webhook. |
| `STRIPE_SECRET_KEY` | Sí (pagos) | Clave secreta de Stripe. |
| `STRIPE_PRICE_ID` | Sí (pagos) | ID del precio del plan Pro mensual (`price_...`). |
| `STRIPE_PRICE_ID_ANUAL` | No | ID del precio del plan Anual (`price_...`). |
| `STRIPE_WEBHOOK_SECRET` | Sí (pagos) | Secreto de firma del webhook (`whsec_...`). |
| `NEXT_PUBLIC_APP_URL` | Recomendada | URL pública para las redirecciones de Stripe. |

## Configurar Supabase (auth + base de datos)

1. Crea un proyecto en <https://supabase.com/>.
2. En **Project Settings → API**, copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secreta) → `SUPABASE_SERVICE_ROLE_KEY`
3. En **SQL Editor**, ejecuta el script [`supabase/schema.sql`](supabase/schema.sql)
   (crea las tablas `profiles` y `ai_usage`, las políticas RLS y el trigger que
   crea el perfil al registrarse).
4. En **Authentication → Providers → Email**, habilita el proveedor de correo. Para
   un onboarding más rápido en pruebas puedes desactivar temporalmente
   «Confirm email» (en producción, mantenlo activo).

## Configurar Stripe (suscripciones)

1. En <https://dashboard.stripe.com/apikeys>, copia la **Secret key** →
   `STRIPE_SECRET_KEY`.
2. Crea un **producto** (por ejemplo, «Presupuesto Sin Miedo Pro») con un **precio
   recurrente mensual**. Copia el **Price ID** (`price_...`) → `STRIPE_PRICE_ID`.
   (Opcional) Agrega un segundo **precio recurrente anual** al mismo producto y
   copia su **Price ID** → `STRIPE_PRICE_ID_ANUAL` para habilitar el plan Anual.
3. Configura el **webhook**:
   - **Local:** con la [CLI de Stripe](https://docs.stripe.com/stripe-cli):
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
     Copia el `whsec_...` que imprime → `STRIPE_WEBHOOK_SECRET`.
   - **Producción:** en **Developers → Webhooks**, agrega un endpoint apuntando a
     `https://TU-DOMINIO/api/stripe/webhook` y suscríbelo a los eventos
     `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated` y `customer.subscription.deleted`. Copia su
     signing secret → `STRIPE_WEBHOOK_SECRET`.

El webhook actualiza `subscription_status` en Supabase, que es lo que desbloquea el
plan Pro (IA ilimitada).

## Modelo de IA

Por defecto se usa `claude-sonnet-5-5` (buen balance costo/latencia para
categorización de alto volumen). Cámbialo con `ANTHROPIC_MODEL` (por ejemplo
`claude-opus-5-5`). Se define en [`lib/anthropic.ts`](lib/anthropic.ts).

## Pruebas

```bash
npm run test   # pruebas de las fórmulas financieras (lib/finance.ts)
npm run build  # compila y valida tipos
```

## Despliegue en Netlify

Guía paso a paso completa en **[`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)**. En resumen:

1. Sube el repositorio a GitHub (ya conectado).
2. En Netlify: **Add new site → Import an existing project** y selecciona el repo.
3. Netlify detecta Next.js mediante `netlify.toml` y `@netlify/plugin-nextjs`.
4. En **Site configuration → Environment variables**, agrega todas las variables de
   la tabla anterior (las `NEXT_PUBLIC_*` deben existir antes del build).
5. Despliega, y luego configura el webhook de Stripe y las URLs de Supabase con el
   dominio final (ver la guía).

## Estructura

```
app/
  layout.tsx              Layout raíz y metadatos
  page.tsx                Landing + aplicación (estado, persistencia local)
  globals.css             Estilos base (Tailwind)
  login/ · signup/        Autenticación (email + contraseña)
  cuenta/                 Panel de cuenta y suscripción
  api/
    analyze/route.ts      Serverless → Claude API (categoriza + recomienda) + paywall
    account/route.ts      Estado de sesión y plan del usuario
    transactions/route.ts Carga (GET) y guarda (PUT) los movimientos del usuario
    stripe/
      checkout/route.ts   Crea la sesión de pago (suscripción)
      portal/route.ts     Portal de gestión de suscripción
      webhook/route.ts    Webhook de Stripe → actualiza el estado en Supabase
components/               Formulario, dashboard, gráfica, indicadores, IA, barra de cuenta
lib/
  finance.ts (+ test)     Fórmulas financieras (lógica pura, testeable)
  types.ts · format.ts    Tipos y formato
  anthropic.ts            Cliente de Anthropic y modelo
  stripe.ts               Cliente de Stripe y utilidades
  subscription.ts         Plan, límite de uso y estado de suscripción
  billing.ts              Helpers de cliente (checkout / portal)
  supabase/               Clientes (navegador, servidor, admin) y middleware de sesión
middleware.ts             Refresco de sesión de Supabase
supabase/schema.sql       Esquema de base de datos (tablas, RLS, trigger)
docs/ESTRATEGIA.md        Documento de estrategia de negocio
```

## Alcance actual y siguientes pasos

Incluido: registro de movimientos, dashboard, indicadores con fórmulas, regla
50/30/20, categorización y recomendaciones con IA, **autenticación** (email +
contraseña), **suscripción con Stripe** en planes **Pro (mensual)** y **Anual**
(paywall sobre la IA), **persistencia de movimientos en la base de datos** con
sesión iniciada (o `localStorage` en modo abierto) y **exportación a CSV**
(compatible con Excel), **metas de ahorro** con seguimiento visual y
**recuperación de contraseña** (enlace por correo).

Siguientes pasos sugeridos: detección de patrones y simulación de escenarios con IA.

## Privacidad

Los movimientos se guardan en el navegador (`localStorage`). Al «Analizar con IA»,
los datos de gastos se envían a la API de Anthropic para su procesamiento. Supabase
guarda tu cuenta y estado de suscripción; Stripe procesa los pagos. No se almacenan
los movimientos en un servidor propio en esta versión.
