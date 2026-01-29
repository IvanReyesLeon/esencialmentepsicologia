# 🏥 PSYCHO-SAAS BLUEPRINT
**Guía Maestra de Replicación del Sistema de Gestión Clínica**

Este documento detalla la arquitectura, lógica de negocio y especificaciones técnicas para construir desde cero un sistema de gestión para clínicas de psicología (basado en *Esencialmente Psicología*).

---

## 1. 🏗️ Arquitectura General

*   **Frontend**: React.js (Create React App). Estilos CSS modulares/Vanilla.
*   **Backend**: Node.js + Express.
*   **Base de Datos**: PostgreSQL.
*   **Integraciones Clave**:
    *   📅 **Google Calendar API**: Fuente de verdad para las sesiones.
    *   📧 **Resend**: Envío de correos transaccionales (bienvenida, recordatorios).
    *   🔐 **JWT**: Autenticación.

---

## 2. 💾 Base de Datos (Esquema Crítico)

El sistema se basa en estas tablas principales. Al iniciar un nuevo proyecto, este es el SQL base necesario.

### A. Terapeutas y Usuarios
*   **`therapists`**: Perfil profesional y configuración de calendario.
    *   `id` (PK), `full_name`, `slug`, `bio`, `photo` (URL), `calendar_color_id` (Google Color ID).
    *   `calendar_alias`: **CRÍTICO**. Texto para detectar sesiones en Calendar (ej: "mariana").
    *   `percentage`: Porcentaje de comisión del terapeuta (ej: 60%).
    *   `is_active`: Boolean.
*   **`users`**: Acceso al panel.
    *   `username`, `email`, `password` (hash), `role` ('admin' | 'therapist').
    *   `therapist_id`: FK a `therapists` (1:1).

### B. Core de Negocio (Facturación)
*   **`session_payments`**: Estado de cada sesión detectada.
    *   `event_id`: ID único del evento de Google Calendar (PK).
    *   `therapist_id`: FK.
    *   `payment_type`: 'pending', 'cash', 'transfer', 'bizum', 'cancelled', 'unpaid'.
    *   `amount`, `original_price`, `modified_price`.
    *   `reviewed_at`: Fecha revisión admin.
    *   `payment_date`: Fecha real del pago.
*   **`pricing`**: Tarifas.
    *   `session_type_id`, `price`, `duration`.
*   **`expenses`**: Gastos del centro (Alquiler, Luz, etc) para calcular beneficios netos.

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
1.  **Captura**: El terapeuta ve sus sesiones detectadas.
2.  **Estado**: Por defecto `pending`.
3.  **Acción**: El terapeuta marca "Pagado en efectivo" o "Transferencia".
    *   Se crea registro en `session_payments`.
4.  **Revisión (Role Admin)**:
    *   El admin ve las sesiones marcadas como "Pagado".
    *   Verifica que el dinero entró en el banco o caja.
    *   Marca como `reviewed`.
5.  **Cierre Mensual**:
    *   Se genera PDF con: Total Facturado - Retención IRPF - Comisión Centro = **A Pagar al Terapeuta**.

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
1.  **Cron Jobs** (`weeklyReminderService.js`):
    *   Viernes 10:00 AM -> Email a terapeutas "Revisa tus sesiones pendientes".
2.  **Auto-Migration**: Al arrancar, verificar que columnas críticas (`calendar_alias`) existan.

### Frontend
1.  **Panel de Administración**:
    *   Dashboard con gráficas (Recharts).
    *   Gestión de Terapeutas (CRUD + asignación de color Google).
    *   **Gestión de Pagos**: La vista más compleja. Tabla con filtros de fechas (Mes actual por defecto) y estado.
2.  **Web Pública (Opcional pero recomendada)**:
    *   `/equipo`: Lista dinámica de `therapists`.
    *   `/blog`: CMS sencillo guardado en tabla `posts`.

---

## 6. 🛡️ Protocolo de Seguridad
*   **Service Account de Google**: Crear una cuenta de servicio en Google Cloud Console. Descargar JSON. Dar permiso a ese email en el calendario principal.
*   **GitGuardian**: NUNCA subir `credentials.json` al repositorio. Usar variables de entorno.

---

## 📝 Instrucciones para la IA (Prompt de Inicio)
*Cuando quieras crear este proyecto de nuevo, copia y pega esto a la IA:*

> "Quiero crear un SaaS de gestión para una clínica de psicología. La arquitectura debe ser Node/Express + React + Postgres.
> El requisito CLAVE es que **Google Calendar es la fuente de verdad**.
> Necesito un sistema que lea los eventos de un calendario compartido, detecte a qué psicólogo pertenece cada sesión buscando un **alias entre barras** (ej: `/juan/`) en el título del evento, y genere un panel de facturación donde cada psicólogo pueda marcar si ha cobrado la sesión.
> La base de datos debe almacenar la configuración de los terapeutas (incluyendo su alias y color) y el estado de los pagos, pero NO los eventos en sí (esos viven en Google)."
