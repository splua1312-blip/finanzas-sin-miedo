# Estrategia de producto: *Presupuesto Sin Miedo*
### Herramienta de presupuesto personal con inteligencia artificial y modelo de ingresos recurrentes

**Autor:** Equipo Finanzas Sin Miedo
**Fecha:** 29 de septiembre de 2026
**Nicho:** Finanzas personales — presupuesto y control de gasto

---

## 1. Resumen ejecutivo

*Presupuesto Sin Miedo* es una aplicación web que ayuda a personas de habla hispana
a tomar el control de sus finanzas personales mediante un flujo simple: registrar
ingresos y gastos, obtener una categorización automática con inteligencia
artificial (IA), visualizar la salud financiera con indicadores respaldados por
fórmulas verificables y recibir recomendaciones de ahorro accionables.

La propuesta se apoya en tres pilares:

1. **Utilidad diaria y recurrente.** El presupuesto no es una tarea única, sino un
   hábito. La herramienta está diseñada para consultarse con frecuencia (registro
   de gastos, revisión de la regla 50/30/20 y del fondo de emergencia), lo que
   justifica un modelo de suscripción mensual.
2. **Diferenciación por IA.** La categorización y las recomendaciones
   personalizadas reducen la fricción que hace que la mayoría de las personas
   abandonen las hojas de cálculo de presupuesto.
3. **Confianza y claridad.** Cada indicador muestra su fórmula, alineado con la
   filosofía de la marca "finanzas sin miedo": educar mientras se opera.

---

## 2. Capacidad de IA que la hace realmente útil

La IA es el elemento que convierte una hoja de cálculo en un asistente. Se emplea
el modelo Claude (Anthropic) a través de una función serverless. Las capacidades
implementadas y previstas son:

### 2.1 Categorización automática de gastos (implementada)
Cada gasto se clasifica en dos dimensiones simultáneas:
- **Categoría funcional:** vivienda, alimentación, transporte, servicios, salud,
  educación, deudas, entretenimiento, compras, suscripciones, ahorro/inversión u
  otros.
- **Bucket 50/30/20:** necesidades, deseos o ahorro.

Esto elimina la principal fricción del presupuesto manual: decidir "dónde va" cada
gasto. La IA infiere la categoría a partir de la descripción en lenguaje natural
(por ejemplo, "Uber al aeropuerto" → transporte / necesidad).

### 2.2 Recomendaciones personalizadas de ahorro (implementada)
A partir de los patrones de gasto y de la comparación contra la regla 50/30/20, la
IA genera de tres a cinco recomendaciones concretas, cada una con un **ahorro
mensual estimado**. Las recomendaciones son específicas del perfil del usuario, no
consejos genéricos.

### 2.3 Detección de patrones (evolución prevista)
Análisis de tendencias mes a mes: identificación de "fugas" de dinero (suscripciones
infrautilizadas, aumento sostenido en una categoría) y alertas tempranas.

### 2.4 Simulación de escenarios (evolución prevista)
Respuestas a preguntas del tipo "¿qué pasa si reduzco un 20% en restaurantes?",
proyectando el impacto sobre la tasa de ahorro y el tiempo para alcanzar una meta.

> **Nota de privacidad como argumento de valor:** en el MVP los datos se almacenan
> localmente en el navegador y solo se envían a la IA al solicitar el análisis. La
> transparencia sobre el tratamiento de datos es, en finanzas, un diferenciador de
> confianza.

---

## 3. Interfaz profesional que justifica el pago

Una interfaz que "se ve profesional" reduce la percepción de riesgo y sostiene la
disposición a pagar. Decisiones de diseño:

- **Dashboard claro:** tarjetas de ingresos, gastos y balance; gráfica de
  distribución por categoría; e indicadores de salud financiera.
- **Fórmulas a la vista:** cada indicador muestra su fórmula (tasa de ahorro, fondo
  de emergencia, ratio de endeudamiento, regla 50/30/20). Esto educa y genera
  confianza en los números.
- **Baja fricción de entrada:** alta de movimientos en segundos y datos de ejemplo
  precargados para que el usuario vea valor de inmediato ("time to value" mínimo).
- **Estética coherente y responsive:** paleta de marca, tipografía legible y diseño
  adaptable a móvil, donde ocurre la mayor parte del registro de gastos.

### 3.1 Fórmulas de los indicadores (desglose)

**Tasa de ahorro (%)**
$$\text{Tasa de ahorro} = \frac{\text{Ingresos} - \text{Gastos}}{\text{Ingresos}} \times 100$$
- Ejemplo: con ingresos de \$20 000 y gastos de \$15 000 →
  $(20\,000 - 15\,000) / 20\,000 \times 100 = 25\%$.
- Referencia: una tasa de ahorro ≥ 20% es coherente con la regla 50/30/20.

**Fondo de emergencia (meses de cobertura)**
$$\text{Meses} = \frac{\text{Ahorros líquidos}}{\text{Gastos esenciales mensuales}}$$
- Ejemplo: \$36 000 de ahorros / \$12 000 de gastos esenciales = 3 meses.
- Referencia: se recomienda de 3 a 6 meses de gastos esenciales.

**Ratio de endeudamiento (%)**
$$\text{Ratio} = \frac{\text{Pago mensual de deudas}}{\text{Ingresos mensuales}} \times 100$$
- Ejemplo: \$3 600 / \$10 000 × 100 = 36%.
- Referencia: por debajo de 36% se considera saludable.

**Regla 50/30/20 (objetivo por categoría)**
$$\text{Objetivo}_{\text{bucket}} = \text{Ingresos} \times p, \quad p \in \{0.50,\ 0.30,\ 0.20\}$$
- Necesidades = 50%, Deseos = 30%, Ahorro = 20% del ingreso.
- Ejemplo con ingreso de \$20 000: necesidades \$10 000, deseos \$6 000, ahorro \$4 000.

---

## 4. Modelo de precios para maximizar los ingresos recurrentes

### 4.1 Estructura propuesta (freemium con suscripción)

| Plan   | Precio            | Propósito                                             |
|--------|-------------------|-------------------------------------------------------|
| Gratis | \$0               | Adquisición y activación (hasta 15 movimientos, 1 análisis de IA/mes). |
| Pro    | \$99 MXN/mes      | Núcleo de ingresos: movimientos y análisis ilimitados. |
| Anual  | \$948 MXN/año     | Reduce el churn y adelanta caja (equivale a 2 meses gratis). |

**Racional del diseño:**
- El plan gratuito permite experimentar el valor (activación) sin barrera.
- El plan anual mejora dos métricas críticas: reduce la tasa de cancelación
  (*churn*) y aumenta el valor de vida del cliente (LTV).
- Un precio de referencia accesible (≈ el costo de un café por semana) baja la
  fricción de conversión en el nicho de finanzas personales.

### 4.2 Métricas de ingresos recurrentes (fórmulas con desglose)

**Ingreso recurrente mensual (MRR)**
$$\text{MRR} = \sum_{i} (\text{suscriptores}_i \times \text{precio mensual}_i)$$
- Ejemplo: 40 usuarios Pro × \$99 + 10 anuales × (\$948 / 12) =
  \$3 960 + \$790 = **\$4 750 de MRR**.
- El plan anual se prorratea a mensual para comparar de forma homogénea.

**Ingreso promedio por usuario (ARPU)**
$$\text{ARPU} = \frac{\text{MRR}}{\text{usuarios activos de pago}}$$
- Ejemplo: \$4 750 / 50 = **\$95 por usuario/mes**.

**Tasa de cancelación (churn) mensual**
$$\text{Churn} = \frac{\text{clientes perdidos en el periodo}}{\text{clientes al inicio del periodo}}$$
- Ejemplo: 2 bajas sobre 50 = 4% mensual.

**Valor de vida del cliente (LTV)**
$$\text{LTV} = \frac{\text{ARPU} \times \text{margen bruto}}{\text{churn}}$$
- Ejemplo: con ARPU \$95, margen bruto 80% y churn 4% →
  $(95 \times 0.80) / 0.04 = \$1\,900$.
- Interpretación: cada cliente aporta, en promedio, \$1 900 de margen a lo largo de
  su vida como suscriptor.

**Costo de adquisición de cliente (CAC)**
$$\text{CAC} = \frac{\text{gasto total en adquisición}}{\text{clientes nuevos adquiridos}}$$
- Ejemplo: \$5 000 de campañas / 25 clientes = \$200.

**Relación LTV : CAC** (indicador de salud del negocio)
$$\text{Relación} = \frac{\text{LTV}}{\text{CAC}}$$
- Ejemplo: \$1 900 / \$200 = **9.5**. Se considera saludable un valor ≥ 3.

**Periodo de recuperación del CAC (meses)**
$$\text{Payback} = \frac{\text{CAC}}{\text{ARPU} \times \text{margen bruto}}$$
- Ejemplo: \$200 / (\$95 × 0.80) = **2.6 meses**.

### 4.3 Palancas para maximizar el ingreso recurrente
1. **Reducir el churn** (mayor impacto en LTV): valor recurrente real + plan anual.
2. **Aumentar el ARPU**: complementos (exportación, metas, categorías avanzadas).
3. **Optimizar el CAC**: crecimiento orgánico apalancando la audiencia educativa.

---

## 5. Plan para conseguir los primeros 10 clientes de pago en la primera semana

El plan aprovecha un activo diferencial: **una audiencia previa de cursos digitales
de finanzas**. Conseguir 10 clientes no requiere publicidad pagada, sino conversión
de una audiencia cálida.

### 5.1 Preparación (Días 1–2)
- Publicar el MVP con el flujo completo (registro → análisis con IA → resultado).
- Definir una **oferta de fundadores**: plan Pro con precio preferente de por vida
  para los primeros 20 suscriptores, con **garantía de devolución de 14 días**
  (elimina el riesgo percibido).
- Preparar un enlace de pago y un formulario breve de retroalimentación.

### 5.2 Activación de la audiencia cálida (Días 3–5)
- **Lista de correo:** enviar a los alumnos actuales y anteriores un correo con un
  caso de uso concreto ("categoriza tus gastos del mes en 2 minutos") y la oferta
  de fundadores.
- **Redes sociales (Instagram/TikTok):** publicar 2–3 piezas cortas mostrando la
  herramienta en acción (registrar gasto → recomendación de la IA). Incluir llamado
  a la acción hacia la oferta de fundadores.
- **Comunidad/WhatsApp de estudiantes:** compartir el enlace con un mensaje
  personal y responder dudas en vivo.

### 5.3 Conversión y cierre (Días 6–7)
- **Sesión en vivo / demo grabada:** mostrar el flujo y responder objeciones;
  ofrecer el enlace de pago durante la sesión.
- **Seguimiento 1 a 1:** contactar a quienes probaron el plan gratuito y no
  convirtieron, ofreciendo ayuda para configurar su primer presupuesto.
- **Prueba social:** publicar los primeros testimonios en cuanto lleguen.

### 5.4 Metas y métricas de la semana
- Meta: **10 clientes de pago**.
- Con una tasa de conversión conservadora de 5% (oferta cálida) se requieren ≈ 200
  visitas cualificadas; con una audiencia existente esto es alcanzable con 1–2
  envíos de correo y contenido orgánico.
- Indicadores a vigilar: visitas → registros (activación) → suscripciones
  (conversión) → cancelaciones (churn temprano).

---

## 6. Riesgos y mitigaciones

| Riesgo                                   | Mitigación                                             |
|------------------------------------------|-------------------------------------------------------|
| Costo variable de la IA por uso          | Modelo eficiente (Sonnet), límite de análisis en plan gratuito, caché. |
| Abandono tras la primera semana (churn)  | Recordatorios de registro, valor recurrente, plan anual. |
| Preocupación por privacidad de datos     | Almacenamiento local en el MVP y comunicación transparente. |
| Dependencia de una sola audiencia        | Diversificar canales orgánicos tras validar el MVP.   |

---

## 7. Conclusión

*Presupuesto Sin Miedo* combina una necesidad recurrente (ordenar las finanzas
personales) con una capacidad diferencial (IA que categoriza y recomienda) y un
modelo de precios diseñado para maximizar el ingreso recurrente. El acceso a una
audiencia educativa previa hace viable la meta de 10 clientes de pago en la primera
semana sin inversión publicitaria, y las métricas SaaS (MRR, ARPU, churn, LTV, CAC)
proveen el tablero para escalar de forma sostenible.

---

## Referencias

Consumer Financial Protection Bureau. (s. f.). *An essential guide to building an
emergency fund*. Recuperado el 29 de septiembre de 2026, de
https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/

Croll, A., & Yoskovitz, B. (2013). *Lean analytics: Use data to build a better
startup faster*. O'Reilly Media.

Reichheld, F. F. (2003). The one number you need to grow. *Harvard Business
Review*, *81*(12), 46–54.

Ries, E. (2011). *The lean startup: How today's entrepreneurs use continuous
innovation to create radically successful businesses*. Crown Business.

Warren, E., & Tyagi, A. W. (2005). *All your worth: The ultimate lifetime money
plan*. Free Press.

> Nota metodológica: la regla 50/30/20 proviene de Warren y Tyagi (2005). Las
> referencias de umbrales de ratio de endeudamiento y fondo de emergencia
> corresponden a lineamientos de educación financiera de la Consumer Financial
> Protection Bureau. Las definiciones de métricas SaaS (MRR, ARPU, churn, LTV, CAC)
> se apoyan en Croll y Yoskovitz (2013). Verifique las URL en la fecha de consulta,
> ya que los recursos en línea pueden actualizarse.
