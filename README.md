# Presupuesto Sin Miedo

Herramienta de **presupuesto personal con inteligencia artificial**. Registra tus
ingresos y gastos y la IA los **categoriza**, mide tu **salud financiera** (con las
fórmulas visibles) y te entrega **recomendaciones de ahorro personalizadas**
basadas en la metodología 50/30/20.

Construida con **Next.js (App Router) + TypeScript + Tailwind CSS**, con una función
serverless que llama a la **API de Claude (Anthropic)**. Pensada para desplegarse en
**Netlify**.

> El documento de estrategia de negocio (propuesta de valor, capacidad de IA,
> modelo de precios con fórmulas y plan de adquisición) está en
> [`docs/ESTRATEGIA.md`](docs/ESTRATEGIA.md).

## Requisitos

- Node.js 18.18+ (probado en Node 22).
- Una clave de API de Anthropic: <https://console.anthropic.com/>.

## Configuración local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea tu archivo de variables de entorno a partir del ejemplo:

   ```bash
   cp .env.example .env.local
   ```

3. Edita `.env.local` y coloca tu clave:

   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   # opcional: ANTHROPIC_MODEL=claude-sonnet-5-5
   ```

4. Arranca el entorno de desarrollo:

   ```bash
   npm run dev
   ```

   Abre <http://localhost:3000>.

> **Sin clave de API:** el dashboard, las gráficas y los indicadores funcionan sin
> IA. El botón «Analizar con IA» devolverá un mensaje indicando que falta
> `ANTHROPIC_API_KEY`; en cuanto la agregues, la categorización y las
> recomendaciones se activan automáticamente.

## Modelo de IA

Por defecto se usa `claude-sonnet-5-5` (buen balance costo/latencia para
categorización de alto volumen). Puedes cambiarlo con la variable
`ANTHROPIC_MODEL` (por ejemplo `claude-opus-5-5` para mayor calidad a mayor costo).
El modelo se define en [`lib/anthropic.ts`](lib/anthropic.ts).

## Pruebas

Las fórmulas financieras (`lib/finance.ts`) tienen pruebas unitarias:

```bash
npm run test
```

## Despliegue en Netlify

1. Sube el repositorio a GitHub (ya conectado).
2. En Netlify: **Add new site → Import an existing project** y selecciona el repo.
3. Netlify detecta Next.js mediante `netlify.toml` y el plugin `@netlify/plugin-nextjs`.
4. En **Site settings → Environment variables**, agrega `ANTHROPIC_API_KEY`
   (y opcionalmente `ANTHROPIC_MODEL`).
5. Despliega.

## Estructura

```
app/
  layout.tsx            Layout raíz y metadatos
  page.tsx              Landing + aplicación (estado, persistencia local)
  globals.css           Estilos base (Tailwind)
  api/analyze/route.ts  Función serverless → Claude API (categoriza + recomienda)
components/
  TransactionForm.tsx   Alta de ingresos/gastos
  Dashboard.tsx         Tarjetas resumen + gráfica + salud financiera
  BudgetChart.tsx       Gráfica de gasto por categoría (Recharts)
  HealthIndicators.tsx  Indicadores con fórmulas + regla 50/30/20
  AIRecommendations.tsx Panel de recomendaciones de IA
lib/
  types.ts              Tipos compartidos
  finance.ts            Fórmulas financieras (lógica pura, testeable)
  finance.test.ts       Pruebas unitarias de las fórmulas
  format.ts             Formato de moneda/porcentaje y etiquetas
  anthropic.ts          Cliente de Anthropic y configuración del modelo
docs/
  ESTRATEGIA.md         Documento de estrategia de negocio
```

## Alcance de esta versión (MVP) y siguientes pasos

Incluido: registro de movimientos, dashboard, indicadores de salud financiera,
regla 50/30/20, categorización y recomendaciones con IA, persistencia local
(`localStorage`).

Documentado como siguiente fase (fuera del MVP): autenticación de usuarios y base
de datos, cobro recurrente con Stripe (paywall) y sincronización bancaria
automática. La sección de planes ya está maquetada como preparación del paywall.

## Privacidad

Los movimientos se guardan únicamente en el navegador (`localStorage`). Al
«Analizar con IA», los datos de gastos se envían a la API de Anthropic para su
procesamiento. No se almacenan en ningún servidor propio en esta versión.
