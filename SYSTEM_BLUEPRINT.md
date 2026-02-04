# 🏥 PSYCHO-SAAS BLUEPRINT
**Guía Maestra de Replicación del Sistema de Gestión Clínica**

Este documento detalla la arquitectura, lógica de negocio y especificaciones técnicas para construir desde cero un sistema de gestión para clínicas de psicología (basado en *Esencialmente Psicología*).

---

## 1. 🏗️ Arquitectura General

## 1. 🏗️ Arquitectura General

*   **Framework**: Next.js (App Router). **Crucial para SEO y Prerender**.
    *   Backend: Next.js API Routes / Server Actions (o Express separado si se prefiere, pero Next.js Fullstack simplifica).
*   **Base de Datos**: PostgreSQL.
*   **Integraciones Clave**:
    *   📅 **Google Calendar API**: Fuente de verdad para las sesiones.
    *   📧 **Resend**: Envío de correos transaccionales (bienvenida, recordatorios).
    *   🔐 **Auth.js (NextAuth)**: Autenticación segura.

---

## 2. 💾 Base de Datos (Esquema Crítico)

### A. Usuarios y Seguridad (Tabla Unificada)
*   **`users`**: Tabla única para todos (Admins y Terapeutas).
    *   `id` (PK), `name`, `email`, `password_hash`, `role` ('admin' | 'therapist').
    *   `photo_url`.
    *   `is_active`: Boolean.
    *   **Campos específicos de Terapeuta** (Nullables para admins):
        *   `calendar_alias`: **CRÍTICO**. Ej: "mariana".
        *   `calendar_color_id`: Google Color ID.
        *   `commission_percentage`: Ej: 60.
    *   **Datos Fiscales (Integrados o 1:1)**:
        *   `nif`, `address`, `iban`. (Puede ir en la misma tabla o en `user_billing_data` para limpieza).

### B. Core de Negocio (Facturación y Pagos)
*   **`session_payments`**: Estado de cada sesión detectada.
    *   `event_id`: ID único del evento de Google Calendar (PK).
    *   `therapist_id`: FK.
    *   `payment_type`: 'pending', 'cash', 'transfer', 'bizum', 'cancelled', 'unpaid'.
    *   `amount`, `original_price`, `modified_price`.
    *   `reviewed_at`: Fecha revisión admin.
    *   `payment_date`: Fecha real del pago.
    *   `marked_at`: Fecha en que se marcó el estado.
*   **`invoice_submissions`**: Facturas generadas y enviadas.
    *   `id`, `invoice_number` (Ej: 2024-001).
    *   `therapist_id`, `month`, `year`.
    *   `subtotal`, `center_amount` (Retención centro), `irpf_amount`.
    *   `total_amount`: A percibir por el terapeuta.
    *   `excluded_session_ids`: JSON Array de IDs de sesiones excluidas manualmente.
    *   `submitted_at`.
*   **`payment_audit_log`**: Historial de cambios en pagos.
    *   `event_id`, `user_id`, `action` (marked_paid, price_changed, revoked...), `old_status`, `new_status`.

### C. Datos Fiscales y Configuración
*   **`center_billing_data`**: Datos fiscales de la clínica (Única fila).
    *   `legal_name`, `nif`, `address`, `iban` (para recibir pagos).
*   **`therapist_billing_data`**: Datos fiscales de los terapeutas.
    *   `therapist_id` (FK), `nif`, `address`, `iban`.
*   **`notifications`**: Sistema de avisos internos.
    *   `user_id`, `message`, `type` (info/warning/error), `is_read`.

---

## 3. 🧠 Lógica del Core: "Calendar-First Billing"

El sistema **NO** tiene agenda propia. Usa Google Calendar como "Backend de Agenda".

### A. Detección de Sesiones (`calendarService.js`)
1.  **Sync**: El backend lee los eventos de Google Calendar en tiempo real (o cache corto).
2.  **Algoritmo de Detección**:
    *   Analiza el `summary` (título) del evento.
    *   Busca el patrón `/alias/` (ej: `Sesión /mariana/`).
    *   Si encuentra `/mariana/`, busca en la BD qué terapeuta tiene `calendar_alias = 'mariana'` y le asigna la sesión.
    *   Si no hay alias explícito, intenta coincidencia difusa por Nombre.
3.  **Filtrado**:
    *   Ignora eventos con títulos: "Libre", "Anulada", "No disponible".
    *   Calcula precio basado en duración (60min -> 55€, 90min -> 80€, configurable).

### B. Ciclo de Facturación (`billingController.js`)
1.  **Captura y Pre-Facturación**:
    *   El terapeuta ve sus sesiones.
    *   Puede **modificar el precio** de una sesión específica (ej: sesión reducida) antes de marcarla.
    *   El Admin recibe notificación de cualquier cambio de precio.
2.  **Estado del Pago**:
    *   Marca "Pagado en efectivo/transferencia".
    *   Se guarda fecha de pago real.
    *   **Bloqueo**: Tras 24h, el terapeuta no puede cambiar el estado de una sesión pagada (requiere Admin).
3.  **Generación de Factura (Cierre Mensual)**:
    *   El sistema recupera los datos fiscales de `center_billing_data` y `therapist_billing_data`.
    *   Calcula: Total Sesiones - % Centro - % IRPF = Total a Pagar.
    *   Permite **excluir sesiones** específicas de la factura actual.
    *   Genera un **registro inmutable** en `invoice_submissions`.
    *   Asigna número de factura correlativo.
4.  **Recuperación en Admin**:
    *   La IA recalcula importes si el Admin modifica precios o estados a posteriori, manteniendo la coherencia fiscal.

---

## 4. ⚙️ Configuración del Entorno (.env)

Variables indispensables para el nuevo proyecto:
```env
# Server
PORT=5000
NODE_ENV=production
CLIENT_ORIGINS=https://midominio.com

# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Auth
JWT_SECRET=super_secret_key_random

# Integrations
GOOGLE_CREDENTIALS={...json_google_service_account...}
CALENDAR_ID=email_del_calendario@gmail.com
RESEND_API_KEY=re_123456789
```

---

## 5. 🚀 Funcionalidades Clave a Implementar

### Backend
1.  **Fiscal Data Management**: Endpoints para actualizar datos de centro y terapeutas.
2.  **Invoice Recalculation Engine**: Script robusto (`recalculate_invoices.js`) para corregir facturas emitidas si cambian datos subyacentes.
3.  **Cron Jobs**:
    *   Recordatorio de pagos (Viernes).
    *   Detección de incongruencias (sesiones marcadas pero no encontradas en Calendar).

### Frontend (Next.js)
1.  **Panel de Administración (Super Admin)**:
    *   **Gestión del Negocio y Fiscalidad**:
        *   Edición completa de datos fiscales del Centro (`center_billing_data`).
        *   **Visión Global**: Dashboard financiero con facturación total, beneficios del centro vs pagos a terapeutas.
        *   **Auditoría**: Acceso al log de cambios de estado de pagos (`payment_audit_log`).
    *   **Gestión de Terapeutas**:
        *   **CRUD Usuarios**: Crear/Editar usuario y asignar su `calendar_alias` (clave para la sincro) y porcentaje.
        *   **Corrección de Pagos**: Capacidad de 'imponer' cambios de precio o estado en sesiones bloqueadas (más de 24h).
        *   **Disparo de Pagos**: Revisar sesiones marcadas por terapeutas y generar sus facturas definitivas.
2.  **Portal del Terapeuta**:
    *   **Mis Sesiones**: Vista filtrada solo con sus eventos.
    *   **Facturación**: Generación de sus facturas PDF personales.

---

## 6. 🛡️ Protocolo de Seguridad
*   **Service Account de Google**: Crear una cuenta de servicio en Google Cloud Console. Descargar JSON. Dar permiso a ese email en el calendario principal.
*   **GitGuardian**: NUNCA subir `credentials.json` al repositorio. Usar variables de entorno.

---

## 📝 Instrucciones para la IA (Prompt de Inicio)
*Cuando quieras crear este proyecto de nuevo, copia y pega esto a la IA:*

> "Quiero crear un SaaS de gestión para una clínica de psicología. Stack: **Next.js (App Router) + PostgreSQL**.
>
> **1. Arquitectura de Datos Unificada**:
> *   Quiero **una sola tabla `users`**. No separes usuarios/autenticación de perfiles de terapeuta.
> *   Esta tabla tendrá roles ('admin', 'therapist') y columnas nullables para datos de terapeuta (alias de calendario, porcentaje, color).
>
> **2. Core - Calendar First**: Google Calendar es la fuente de verdad. El sistema lee eventos, detecta al usuario (terapeuta) por su `calendar_alias` en el título (ej: `/juan/`) y calcula el precio.
>
> **2. Facturación Compleja**:
> *   **Datos Fiscales**: Tablas separadas para datos fiscales del Centro (admin) y de cada Terapeuta. Estos datos se usan para rellenar las facturas.
> *   **Ciclo de Cobro**: Los terapeutas marcan sesiones como 'Pagadas'. Si pasan 24h, el estado se bloquea y solo el Admin puede cambiarlo.
> *   **Emisión de Facturas**: Al cerrar el mes, se genera un registro inmutable (`invoice_submissions`) que captura los importes y cálculos. Si luego cambian los precios de las sesiones, la factura emitida NO debe cambiar automáticamente (se requiere recalculo explícito).
>
> **3. Auditoría**: Necesito un log de auditoría (`payment_audit_log`) que registre quién cambió el estado de pago de una sesión y cuándo."
