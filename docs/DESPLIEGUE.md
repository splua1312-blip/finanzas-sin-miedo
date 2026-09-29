# Guía de despliegue en Netlify

Esta guía lleva *Presupuesto Sin Miedo* a producción en Netlify, con la IA
(Anthropic), la autenticación y base de datos (Supabase) y los pagos (Stripe)
activados.

> Orden recomendado: **(1)** crear las cuentas y claves → **(2)** conectar el repo
> en Netlify y cargar las variables → **(3)** primer despliegue → **(4)** configurar
> los webhooks y URLs que dependen del dominio final → **(5)** verificar.

---

## 1. Requisitos previos (cuentas y claves)

Ten a la mano estas credenciales (ver detalles en el `README.md`):

- **Anthropic:** `ANTHROPIC_API_KEY`.
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, y el script `supabase/schema.sql` ya ejecutado en
  el proyecto (SQL Editor).
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` (Pro mensual) y, opcional,
  `STRIPE_PRICE_ID_ANUAL`. El `STRIPE_WEBHOOK_SECRET` se obtiene en el paso 4.

> Usa las **claves de prueba** de Stripe (`sk_test_...`) para el primer despliegue
> y cámbialas por las de producción (`sk_live_...`) cuando estés listo para cobrar.

---

## 2. Conectar el repositorio y cargar variables

1. En <https://app.netlify.com/> → **Add new site → Import an existing project**.
2. Elige **GitHub** y selecciona el repositorio `finanzas-sin-miedo`.
3. Netlify detecta Next.js automáticamente (por `netlify.toml`). Deja:
   - **Build command:** `npm run build`
   - No fijes «Publish directory» (lo gestiona el runtime de Next.js).
4. Antes de desplegar, ve a **Site configuration → Environment variables** y agrega:

   | Variable | Valor |
   |---|---|
   | `ANTHROPIC_API_KEY` | tu clave de Anthropic |
   | `ANTHROPIC_MODEL` | `claude-sonnet-5-5` (opcional) |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave anon de Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | clave service_role (secreta) |
   | `STRIPE_SECRET_KEY` | clave secreta de Stripe |
   | `STRIPE_PRICE_ID` | Price ID del plan Pro mensual |
   | `STRIPE_PRICE_ID_ANUAL` | Price ID del plan Anual (opcional) |
   | `STRIPE_WEBHOOK_SECRET` | (se completa en el paso 4) |
   | `NEXT_PUBLIC_APP_URL` | (se completa en el paso 4, con el dominio final) |

   > Las variables `NEXT_PUBLIC_*` se incrustan en el bundle del navegador durante
   > el build: deben estar presentes **antes** de compilar. Si las agregas después,
   > vuelve a desplegar («Trigger deploy → Deploy site»).

---

## 3. Primer despliegue

1. Pulsa **Deploy site**. Netlify instala dependencias, ejecuta `npm run build` y
   publica la app con sus funciones serverless (rutas `/api/*`) y el middleware.
2. Anota la URL asignada (por ejemplo `https://finanzas-sin-miedo.netlify.app`) o
   configura tu dominio en **Domain management**.

---

## 4. Configuración posterior (depende del dominio final)

Una vez que conoces la URL pública:

### 4.1 `NEXT_PUBLIC_APP_URL`
Agrega/actualiza `NEXT_PUBLIC_APP_URL` con la URL final y **vuelve a desplegar**.
(Se usa para las redirecciones de Stripe; si no se define, la app la deduce del
encabezado de la petición.)

### 4.2 Webhook de Stripe
1. En <https://dashboard.stripe.com/webhooks> → **Add endpoint**.
2. URL del endpoint: `https://TU-DOMINIO/api/stripe/webhook`.
3. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copia el **Signing secret** (`whsec_...`) y guárdalo como `STRIPE_WEBHOOK_SECRET`
   en Netlify. **Vuelve a desplegar** para que tome efecto.

### 4.3 Supabase (URLs de autenticación)
En Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://TU-DOMINIO`.
- **Redirect URLs:** agrega `https://TU-DOMINIO/**`.

Esto asegura que los enlaces de confirmación de correo y los redireccionamientos
funcionen en producción.

---

## 5. Verificación en producción

- [ ] La página principal carga y el dashboard funciona (con datos de ejemplo).
- [ ] Registro e inicio de sesión (email + contraseña) funcionan.
- [ ] Con sesión, los movimientos se guardan y persisten al recargar.
- [ ] «Analizar con IA» categoriza y da recomendaciones (plan gratis: 1/mes).
- [ ] «Mejorar a Pro» abre Stripe Checkout; tras pagar (modo prueba), la cuenta
      queda en **Pro** (el webhook actualizó el estado).
- [ ] «Gestionar suscripción» abre el portal de facturación de Stripe.

> **Prueba de pago (modo test):** usa la tarjeta de prueba de Stripe
> `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.

---

## 6. Solución de problemas

- **El build falla por variables faltantes:** confirma que las `NEXT_PUBLIC_*`
  están cargadas y vuelve a desplegar.
- **El pago se completa pero la cuenta sigue en «Gratis»:** revisa el webhook en
  Stripe (entregas y errores) y que `STRIPE_WEBHOOK_SECRET` y
  `SUPABASE_SERVICE_ROLE_KEY` estén bien configurados en Netlify.
- **La IA responde «no está configurada»:** falta `ANTHROPIC_API_KEY`.
- **Login sin efecto o redirección extraña:** revisa las URLs de Supabase (4.3).
- **Despliegues automáticos:** cada `push` a la rama conectada dispara un nuevo
  deploy en Netlify.
