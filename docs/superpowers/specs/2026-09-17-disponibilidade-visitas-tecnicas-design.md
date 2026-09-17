# Disponibilidade de Visitas Técnicas — Design Spec

**Date:** 2026-09-17
**Status:** Approved
**Author:** opencode

---

## 1. Goal

Allow ADMIN/SUPERVISOR to pre-define available dates and time ranges for technical visits. When scheduling a visit, only pre-approved available slots are shown. A monthly calendar provides visual overview of availability. Capacity per slot is tracked and auto-blocked when full.

---

## 2. Access Control

| Action | Roles |
|--------|-------|
| Manage availability (CRUD patterns + dates) | ADMIN, SUPERVISOR |
| Schedule visits (pick from available slots) | ADMIN, SUPERVISOR, ATENDENTE |

No new RBAC role is created. Existing roles are sufficient.

---

## 3. Data Model

### 3.1 `DisponibilidadePadrao` (Recurring Pattern)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Int | PK, autoincrement | |
| `userId` | Int | FK → User, cascade delete | Professional who owns this pattern |
| `diaSemana` | Int | 1 (Monday) to 6 (Saturday) | Day of week |
| `horaInicio` | String | "HH:MM" format | Start time (e.g., "08:00") |
| `horaFim` | String | "HH:MM" format | End time (e.g., "12:00") |
| `capacidade` | Int | default 1, min 0 | Max visits per slot. 0 = unlimited |
| `ativo` | Boolean | default true | Soft-toggle without deleting |
| `createdAt` | DateTime | default now() | |
| `updatedAt` | DateTime | @updatedAt | |

**One row = one time block on a recurring day.** A professional with "Monday 08:00-12:00 and Monday 14:00-18:00" has **2 rows**.

### 3.2 `DisponibilidadeData` (Specific Date Override)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Int | PK, autoincrement | |
| `userId` | Int | FK → User, cascade delete | Professional |
| `data` | DateTime | Date only (time 00:00) | The specific date |
| `horaInicio` | String | "HH:MM" format | Start time |
| `horaFim` | String | "HH:MM" format | End time |
| `capacidade` | Int | default 1, min 0 | Max visits. 0 = unlimited |
| `excluida` | Boolean | default false | If true, blocks all slots for this date (holiday) |
| `createdAt` | DateTime | default now() | |
| `updatedAt` | DateTime | @updatedAt | |

---

## 4. Slot Generation Logic

When building available slots for a given month:

1. **Generate from patterns:** For each `DisponibilidadePadrao` where `ativo = true`, create a slot for every matching day-of-week in the target month.

2. **Overlay specific dates:** For each `DisponibilidadeData` entry in the target month:
   - If `excluida = true` → remove ALL slots for that date (overrides any matching pattern)
   - If `excluida = false` → use the specific date's slots instead of the pattern for that date

3. **Count existing agendamentos:** For each generated slot, count `Agendamento` records where:
   - `dataPrevista` matches the slot's date + time range
   - `status != 'CANCELADO'`

4. **Compute availability:** If `capacidade > 0` and `ocupados >= capacidade` → `disponivel = false`

**Response shape:**

```json
{
  "slots": [
    {
      "data": "2026-03-15",
      "diaSemana": "DOMINGO",
      "horaInicio": "08:00",
      "horaFim": "12:00",
      "capacidade": 2,
      "ocupados": 1,
      "disponivel": true
    }
  ]
}
```

---

## 5. Backend API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/disponibilidade/padroes` | ADMIN, SUPERVISOR | List recurring patterns (filter by userId) |
| `POST` | `/api/disponibilidade/padroes` | ADMIN, SUPERVISOR | Create recurring pattern |
| `PATCH` | `/api/disponibilidade/padroes/:id` | ADMIN, SUPERVISOR | Update pattern (toggle ativo, change hours) |
| `DELETE` | `/api/disponibilidade/padroes/:id` | ADMIN, SUPERVISOR | Delete pattern |
| `GET` | `/api/disponibilidade/datas` | ADMIN, SUPERVISOR | List specific date overrides (filter by month/year) |
| `POST` | `/api/disponibilidade/datas` | ADMIN, SUPERVISOR | Create specific date override |
| `PATCH` | `/api/disponibilidade/datas/:id` | ADMIN, SUPERVISOR | Update (toggle excluida, change capacity) |
| `DELETE` | `/api/disponibilidade/datas/:id` | ADMIN, SUPERVISOR | Delete override |
| `GET` | `/api/disponibilidade/slots` | ADMIN, SUPERVISOR, ATENDENTE | Computed available slots for a month (params: `mes`, `ano`, `userId?`) |

### 5.1 Validation Rules

**Pattern creation:**
- `diaSemana` must be 1-6 (Monday-Saturday)
- `horaInicio` must be before `horaFim`
- `capacidade` must be >= 0
- No overlapping patterns for the same user on the same day (e.g., Monday 08:00-12:00 and Monday 10:00-14:00 overlap)

**Specific date creation:**
- `data` must be today or future
- `horaInicio` must be before `horaFim`
- `capacidade` must be >= 0

**Slot query:**
- `mes` must be 1-12
- `ano` must be current year or next year
- Max 3 months ahead from current date

### 5.2 Slot Endpoint Response

`GET /api/disponibilidade/slots?mes=3&ano=2026&userId=5`

Returns only slots with `disponivel: true` (full/excluded slots are hidden by default). Include optional `mostrarTodas=true` param to return all slots regardless of availability.

---

## 6. Frontend Components

### 6.1 Sidebar Navigation (AgendamentosAdminPage)

New sidebar entries below existing views:

```
┌─────────────────────┐
│ Análises            │
│ Lista               │
│ Novo Agendamento    │
│ ─────────────────── │
│ Calendário          │  ← NEW
│ Gerenciar           │  ← NEW (Disponibilidade)
└─────────────────────┘
```

### 6.2 `CalendarioDisponibilidade` (Calendar View)

**Layout:** Monthly grid calendar (Mon-Sat columns, 5-6 rows).

**Header:** Month/year label, left/right arrows, "Hoje" button.

**Day cells:**
- Available slots count: "3 horários"
- Capacity indicator: green (available), yellow (limited), gray (full), red (excluded)
- Click → expand panel showing all time slots for that day with capacity bars

**Toggle:** Calendar ↔ List view (top-right corner).

### 6.3 `ListaDisponibilidade` (List View)

**Layout:** Sorted list of upcoming available slots.

**Columns:** Date, Time Range, Capacity (X/Y), Professional, Actions.

**Filters:** Month selector, Professional selector, Status (disponível/lotado/excluído).

**Actions per row:** Edit capacity, toggle active/inactive, delete.

### 6.4 `GerenciarPadroes` (Pattern Management)

**Layout:** Table of recurring patterns.

**Columns:** Day of Week, Time Range, Capacity, Active toggle, Actions (edit/delete).

**Add pattern:** Button → inline form row or modal with: Day (select), Start Time, End Time, Capacity.

**Validation:** No overlapping time ranges on the same day for the same professional.

### 6.5 `GerenciarDatas` (Specific Dates Management)

**Layout:** Table of specific date overrides.

**Columns:** Date, Time Range, Capacity, Excluded toggle, Actions (edit/delete).

**Add date:** Button → inline form or modal with: Date picker, Start Time, End Time, Capacity, Excluded checkbox.

### 6.6 `SlotPicker` (Inline in Agendamento Form)

**Replaces:** Current `<input type="datetime-local">` in "Agendar visita técnica para:" field.

**Behavior:**
- Fetches slots from `GET /api/disponibilidade/slots?mes=X&ano=Y`
- Shows available slots grouped by date
- Disabled/grayed slots shown but not selectable
- Shows capacity info: "2 vagas restantes"

---

## 7. Data Flow — End-to-End Scheduling

**Scenario:** ATENDENTE schedules a technical visit for an existing atendimento.

1. **ATENDENTE opens scheduling form**
   - `SlotPicker` fetches available slots
   - Only `disponivel: true` slots are selectable

2. **ATENDENTE picks a slot**
   - Selects date → sees available time ranges
   - Selects time range → clicks confirm

3. **System processes:**
   - Creates `Agendamento`: `tipo='VISITA'`, `status='PENDENTE'`, `dataPrevista=selected`
   - Updates `Atendimento.status`: `EM_ANDAMENTO` → `CONCLUIDO`
   - Returns to "Lista de Agendamentos" view with status PENDENTE, type VISITA

4. **Capacity updates:**
   - Slot's `ocupados` increments by 1
   - If `ocupados >= capacidade` → slot auto-blocked

---

## 8. Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| Two users book same slot simultaneously | DB transaction with row-level lock. Second request gets `409 Conflict` |
| Past dates in slot query | Filtered out — never returned |
| Patterns generate indefinitely | Bounded by query month/year params (max 3 months ahead) |
| Specific date with `excluida=true` | Blocks ALL slots for that date (holiday override) |
| Capacity = 0 | Treated as "no limit" — always available |
| Professional with no availability | Empty slots array. Scheduling blocked |
| Deleting pattern with existing agendamentos | Soft-delete (`ativo: false`). Existing agendamentos unchanged |
| Overlapping patterns on same day | Backend validation rejects with 400 error |

---

## 9. Database Migrations

1. Create `disponibilidade_padrao` table
2. Create `disponibilidade_data` table
3. Add composite index on `(userId, diaSemana)` for pattern lookups
4. Add composite index on `(userId, data)` for date override lookups
5. Add composite index on `data` for slot generation queries

---

## 10. Non-Goals (YAGNI)

- Recurring patterns with end dates (patterns auto-generate indefinitely)
- Multi-professional slot assignment (slots are per-professional)
- Waitlist for full slots
- Automatic slot assignment (manual selection only)
- Integration with external calendars (Google Calendar, Outlook)
- Notification system for slot changes
