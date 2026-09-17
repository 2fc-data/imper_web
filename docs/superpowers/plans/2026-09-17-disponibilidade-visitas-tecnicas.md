# Disponibilidade de Visitas Técnicas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add availability management for technical visits with monthly calendar UI, recurring patterns, specific date overrides, and capacity tracking.

**Architecture:** New Prisma models for availability data, new REST API endpoints, new React components in the AgendamentosAdminPage sidebar. The `SlotPicker` component replaces the native datetime-local input in the agendamento creation form.

**Tech Stack:** Prisma ORM, Express.js (backend), React + TypeScript (frontend), existing UI components (Input, Button, Table, Select, Modal)

## Global Constraints

- PT-BR error messages throughout
- All forms emit inline per-field error messages via `ErrorMessage` component (already exists at `src/components/ui/ErrorMessage.tsx`)
- Zod validation on backend, manual validation on frontend
- No new major dependencies (no react-hook-form, no date-fns)
- Existing patterns: sidebar-driven view switching, `SidebarButton` components, `try/catch` submit handlers
- `Agendamento.tipo` enum already includes `VISITA`; `StatusAgendamento` includes `PENDENTE`
- Access: ADMIN/SUPERVISOR manage availability; ADMIN/SUPERVISOR/ATENDENTE schedule visits

---

## File Structure

| File | Responsibility |
|------|---------------|
| `imper_api/prisma/schema.prisma` | Add `DisponibilidadePadrao` and `DisponibilidadeData` models |
| `imper_api/prisma/migrations/...` | Database migration |
| `imper_api/src/routes/disponibilidade.ts` | Backend API routes (CRUD + slot generation) |
| `imper_api/src/index.ts` | Register disponibilidade routes |
| `imper_web/src/lib/api.ts` | Frontend API client functions |
| `imper_web/src/components/disponibilidade/CalendarioDisponibilidade.tsx` | Monthly calendar view |
| `imper_web/src/components/disponibilidade/ListaDisponibilidade.tsx` | List view of upcoming slots |
| `imper_web/src/components/disponibilidade/GerenciarPadroes.tsx` | Recurring pattern management table |
| `imper_web/src/components/disponibilidade/GerenciarDatas.tsx` | Specific dates management table |
| `imper_web/src/components/disponibilidade/SlotPicker.tsx` | Date/time picker using computed slots |
| `imper_web/src/pages/AgendamentosAdminPage.tsx` | Add new sidebar views, replace datetime-local with SlotPicker |

---

### Task 1: Prisma Schema — Add Availability Models

**Files:**
- Modify: `imper_api/prisma/schema.prisma`

**Interfaces:**
- Produces: `DisponibilidadePadrao` and `DisponibilidadeData` Prisma models

- [ ] **Step 1: Add DisponibilidadePadrao model**

Add after the `Agendamento` model (around line 261):

```prisma
model DisponibilidadePadrao {
  id          Int      @id @default(autoincrement())
  userId      Int
  diaSemana   Int      // 1=Monday ... 6=Saturday
  horaInicio  String   @db.VarChar(5)
  horaFim     String   @db.VarChar(5)
  capacidade  Int      @default(1)
  ativo       Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([diaSemana])
  @@map("disponibilidade_padroes")
}
```

- [ ] **Step 2: Add DisponibilidadeData model**

Add immediately after `DisponibilidadePadrao`:

```prisma
model DisponibilidadeData {
  id          Int      @id @default(autoincrement())
  userId      Int
  data        DateTime
  horaInicio  String   @db.VarChar(5)
  horaFim     String   @db.VarChar(5)
  capacidade  Int      @default(1)
  excluida    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([data])
  @@map("disponibilidade_datas")
}
```

- [ ] **Step 3: Add User relations**

In the `User` model, add the two new relations:

```prisma
  disponibilidadePadroes DisponibilidadePadrao[]
  disponibilidadeDatas   DisponibilidadeData[]
```

- [ ] **Step 4: Run migration**

Run: `cd imper_api && npx prisma migrate dev --name add_disponibilidade_models`

Expected: Migration created successfully, Prisma client regenerated.

- [ ] **Step 5: Verify schema**

Run: `cd imper_api && npx prisma validate`

Expected: `Valid schema`

- [ ] **Step 6: Commit**

```bash
git add imper_api/prisma/schema.prisma imper_api/prisma/migrations/
git commit -m "feat(api): add DisponibilidadePadrao and DisponibilidadeData models"
```

---

### Task 2: Backend API — Disponibilidade Routes

**Files:**
- Create: `imper_api/src/routes/disponibilidade.ts`
- Modify: `imper_api/src/index.ts`

**Interfaces:**
- Consumes: Prisma models from Task 1
- Produces: Express router with 9 endpoints

- [ ] **Step 1: Create the routes file**

Create `imper_api/src/routes/disponibilidade.ts`:

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// ---------- Validation Schemas ----------

const criarPadraoSchema = z.object({
  userId: z.number().int().positive(),
  diaSemana: z.number().int().min(1).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  capacidade: z.number().int().min(0).default(1),
});

const criarDataSchema = z.object({
  userId: z.number().int().positive(),
  data: z.string().datetime(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  capacidade: z.number().int().min(0).default(1),
  excluida: z.boolean().default(false),
});

// ---------- Helper: check time overlap ----------

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// ---------- GET /padroes ----------

router.get('/padroes', async (req, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const where = userId ? { userId } : {};
    const padroes = await prisma.disponibilidadePadrao.findMany({
      where,
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
    res.json(padroes);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Erro ao buscar padrões' });
  }
});

// ---------- POST /padroes ----------

router.post('/padroes', async (req, res) => {
  try {
    const data = criarPadraoSchema.parse(req.body);

    if (data.horaInicio >= data.horaFim) {
      return res.status(400).json({ message: 'Hora início deve ser anterior à hora fim' });
    }

    // Check overlapping patterns for same user/day
    const existing = await prisma.disponibilidadePadrao.findMany({
      where: {
        userId: data.userId,
        diaSemana: data.diaSemana,
        ativo: true,
      },
    });

    for (const padrao of existing) {
      if (timesOverlap(data.horaInicio, data.horaFim, padrao.horaInicio, padrao.horaFim)) {
        return res.status(400).json({
          message: `Conflito com padrão existente: ${padrao.horaInicio}-${padrao.horaFim}`,
        });
      }
    }

    const padrao = await prisma.disponibilidadePadrao.create({ data });
    res.status(201).json(padrao);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || 'Dados inválidos' });
    }
    res.status(500).json({ message: err?.message || 'Erro ao criar padrão' });
  }
});

// ---------- PATCH /padroes/:id ----------

router.patch('/padroes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const padrao = await prisma.disponibilidadePadrao.findUnique({ where: { id } });
    if (!padrao) return res.status(404).json({ message: 'Padrão não encontrado' });

    const updated = await prisma.disponibilidadePadrao.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Erro ao atualizar padrão' });
  }
});

// ---------- DELETE /padroes/:id ----------

router.delete('/padroes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const padrao = await prisma.disponibilidadePadrao.findUnique({ where: { id } });
    if (!padrao) return res.status(404).json({ message: 'Padrão não encontrado' });

    await prisma.disponibilidadePadrao.delete({ where: { id } });
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Erro ao excluir padrão' });
  }
});

// ---------- GET /datas ----------

router.get('/datas', async (req, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const mes = req.query.mes ? Number(req.query.mes) : undefined;
    const ano = req.query.ano ? Number(req.query.ano) : undefined;

    const where: any = {};
    if (userId) where.userId = userId;
    if (mes && ano) {
      where.data = {
        gte: new Date(ano, mes - 1, 1),
        lt: new Date(ano, mes, 1),
      };
    }

    const datas = await prisma.disponibilidadeData.findMany({
      where,
      orderBy: { data: 'asc' },
    });
    res.json(datas);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Erro ao buscar datas' });
  }
});

// ---------- POST /datas ----------

router.post('/datas', async (req, res) => {
  try {
    const data = criarDataSchema.parse(req.body);

    if (data.horaInicio >= data.horaFim) {
      return res.status(400).json({ message: 'Hora início deve ser anterior à hora fim' });
    }

    const created = await prisma.disponibilidadeData.create({ data });
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || 'Dados inválidos' });
    }
    res.status(500).json({ message: err?.message || 'Erro ao criar data' });
  }
});

// ---------- PATCH /datas/:id ----------

router.patch('/datas/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const registro = await prisma.disponibilidadeData.findUnique({ where: { id } });
    if (!registro) return res.status(404).json({ message: 'Registro não encontrado' });

    const updated = await prisma.disponibilidadeData.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Erro ao atualizar data' });
  }
});

// ---------- DELETE /datas/:id ----------

router.delete('/datas/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const registro = await prisma.disponibilidadeData.findUnique({ where: { id } });
    if (!registro) return res.status(404).json({ message: 'Registro não encontrado' });

    await prisma.disponibilidadeData.delete({ where: { id } });
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Erro ao excluir data' });
  }
});

// ---------- GET /slots ----------

const DIA_SEMANA_MAP: Record<number, string> = {
  0: 'DOMINGO',
  1: 'SEGUNDA',
  2: 'TERCA',
  3: 'QUARTA',
  4: 'QUINTA',
  5: 'SEXTA',
  6: 'SABADO',
};

router.get('/slots', async (req, res) => {
  try {
    const mes = Number(req.query.mes);
    const ano = Number(req.query.ano);
    const userId = req.query.userId ? Number(req.query.userId) : undefined;

    if (!mes || !ano || mes < 1 || mes > 12) {
      return res.status(400).json({ message: 'Parâmetros mes e ano são obrigatórios (1-12)' });
    }

    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);

    // 1. Get recurring patterns
    const padroesWhere: any = { ativo: true };
    if (userId) padroesWhere.userId = userId;
    const padroes = await prisma.disponibilidadePadrao.findMany({ where: padroesWhere });

    // 2. Get specific date overrides
    const datasWhere: any = {
      data: { gte: primeiroDia, lte: ultimoDia },
    };
    if (userId) datasWhere.userId = userId;
    const datas = await prisma.disponibilidadeData.findMany({ where: datasWhere });

    // 3. Get existing agendamentos for this month (for capacity counting)
    const agendamentosWhere: any = {
      tipo: 'VISITA',
      status: { not: 'CANCELADO' },
      dataPrevista: { gte: primeiroDia, lte: ultimoDia },
    };
    if (userId) agendamentosWhere.userId = userId;
    const agendamentos = await prisma.agendamento.findMany({ where: agendamentosWhere });

    // 4. Generate slots
    const slots: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const dataAtual = new Date(ano, mes - 1, dia);
      if (dataAtual < today) continue; // Skip past dates

      const diaSemana = dataAtual.getDay(); // 0=Sunday ... 6=Saturday
      if (diaSemana === 0) continue; // No Sunday slots

      const dataStr = dataAtual.toISOString().split('T')[0];

      // Check if there's a specific date override
      const override = datas.find((d) => {
        const dStr = d.data.toISOString().split('T')[0];
        return dStr === dataStr;
      });

      if (override) {
        if (override.excluida) continue; // Date excluded, skip all slots

        // Use override slot
        const ocupados = agendamentos.filter((a) => {
          const aDate = a.dataPrevista.toISOString().split('T')[0];
          const aTime = a.dataPrevista.toISOString().substring(11, 16);
          return aDate === dataStr && aTime >= override.horaInicio && aTime < override.horaFim;
        }).length;

        const disponivel = override.capacidade === 0 || ocupados < override.capacidade;
        slots.push({
          data: dataStr,
          diaSemana: DIA_SEMANA_MAP[diaSemana],
          horaInicio: override.horaInicio,
          horaFim: override.horaFim,
          capacidade: override.capacidade,
          ocupados,
          disponivel,
        });
      } else {
        // Use recurring patterns
        const padroesDoDia = padroes.filter((p) => p.diaSemana === diaSemana);
        for (const padrao of padroesDoDia) {
          const ocupados = agendamentos.filter((a) => {
            const aDate = a.dataPrevista.toISOString().split('T')[0];
            const aTime = a.dataPrevista.toISOString().substring(11, 16);
            return aDate === dataStr && aTime >= padrao.horaInicio && aTime < padrao.horaFim;
          }).length;

          const disponivel = padrao.capacidade === 0 || ocupados < padrao.capacidade;
          slots.push({
            data: dataStr,
            diaSemana: DIA_SEMANA_MAP[diaSemana],
            horaInicio: padrao.horaInicio,
            horaFim: padrao.horaFim,
            capacidade: padrao.capacidade,
            ocupados,
            disponivel,
          });
        }
      }
    }

    res.json({ slots });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Erro ao gerar slots' });
  }
});

export default router;
```

- [ ] **Step 2: Register routes in index.ts**

In `imper_api/src/index.ts`, find the existing route registrations (search for `app.use('/api/`) and add:

```typescript
import disponibilidadeRouter from './routes/disponibilidade';
// ... after existing route registrations:
app.use('/api/disponibilidade', disponibilidadeRouter);
```

- [ ] **Step 3: Test routes compile**

Run: `cd imper_api && npx ts-node --transpile-only -e "import './routes/disponibilidade'"`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add imper_api/src/routes/disponibilidade.ts imper_api/src/index.ts
git commit -m "feat(api): add disponibilidade routes with slot generation"
```

---

### Task 3: Frontend API Client — Add Disponibilidade Functions

**Files:**
- Modify: `imper_web/src/lib/api.ts`

**Interfaces:**
- Consumes: Backend routes from Task 2
- Produces: `apiListarPadroes`, `apiCriarPadrao`, `apiAtualizarPadrao`, `apiExcluirPadrao`, `apiListarDatas`, `apiCriarData`, `apiAtualizarData`, `apiExcluirData`, `apiObterSlots` functions

- [ ] **Step 1: Add types and API functions**

Append to `imper_web/src/lib/api.ts`:

```typescript
// ---------- Disponibilidade Types ----------

export interface DisponibilidadePadrao {
  id: number;
  userId: number;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DisponibilidadeData {
  id: number;
  userId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  excluida: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DisponibilidadeSlot {
  data: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  ocupados: number;
  disponivel: boolean;
}

// ---------- Disponibilidade API ----------

export async function apiListarPadroes(userId?: number): Promise<DisponibilidadePadrao[]> {
  const queryStr = userId ? `?userId=${userId}` : '';
  return api.get<DisponibilidadePadrao[]>(`/disponibilidade/padroes${queryStr}`);
}

export async function apiCriarPadrao(data: {
  userId: number;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
}): Promise<DisponibilidadePadrao> {
  return api.post<DisponibilidadePadrao>('/disponibilidade/padroes', data);
}

export async function apiAtualizarPadrao(
  id: number,
  data: Partial<{ ativo: boolean; capacidade: number; horaInicio: string; horaFim: string }>
): Promise<DisponibilidadePadrao> {
  return api.patch<DisponibilidadePadrao>(`/disponibilidade/padroes/${id}`, data);
}

export async function apiExcluirPadrao(id: number): Promise<void> {
  return api.del(`/disponibilidade/padroes/${id}`);
}

export async function apiListarDatas(
  userId?: number,
  mes?: number,
  ano?: number
): Promise<DisponibilidadeData[]> {
  const params = new URLSearchParams();
  if (userId) params.set('userId', String(userId));
  if (mes) params.set('mes', String(mes));
  if (ano) params.set('ano', String(ano));
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return api.get<DisponibilidadeData[]>(`/disponibilidade/datas${queryStr}`);
}

export async function apiCriarData(data: {
  userId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  excluida?: boolean;
}): Promise<DisponibilidadeData> {
  return api.post<DisponibilidadeData>('/disponibilidade/datas', data);
}

export async function apiAtualizarData(
  id: number,
  data: Partial<{ excluida: boolean; capacidade: number }>
): Promise<DisponibilidadeData> {
  return api.patch<DisponibilidadeData>(`/disponibilidade/datas/${id}`, data);
}

export async function apiExcluirData(id: number): Promise<void> {
  return api.del(`/disponibilidade/datas/${id}`);
}

export async function apiObterSlots(
  mes: number,
  ano: number,
  userId?: number
): Promise<{ slots: DisponibilidadeSlot[] }> {
  const params = new URLSearchParams({ mes: String(mes), ano: String(ano) });
  if (userId) params.set('userId', String(userId));
  return api.get<{ slots: DisponibilidadeSlot[] }>(`/disponibilidade/slots?${params.toString()}`);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd imper_web && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add imper_web/src/lib/api.ts
git commit -m "feat(web): add disponibilidade API client functions"
```

---

### Task 4: Frontend Component — SlotPicker

**Files:**
- Create: `imper_web/src/components/disponibilidade/SlotPicker.tsx`

**Interfaces:**
- Consumes: `apiObterSlots` from Task 3
- Produces: `SlotPicker` React component (used by AgendamentosAdminPage)

- [ ] **Step 1: Create the SlotPicker component**

Create `imper_web/src/components/disponibilidade/SlotPicker.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { apiObterSlots, type DisponibilidadeSlot } from '../../lib/api';

interface SlotPickerProps {
  value: string; // ISO datetime string
  onChange: (isoDatetime: string) => void;
  className?: string;
  disabled?: boolean;
  erro?: string | null;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function SlotPicker({ value, onChange, className, disabled, erro }: SlotPickerProps) {
  const now = new Date();
  const [mesAtual, setMesAtual] = useState(now.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  const [slots, setSlots] = useState<DisponibilidadeSlot[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erroFetch, setErroFetch] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErroFetch(null);

    apiObterSlots(mesAtual, anoAtual)
      .then((res) => {
        if (!cancelado) setSlots(res.slots);
      })
      .catch((err) => {
        if (!cancelado) setErroFetch(err?.message || 'Erro ao carregar horários');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => { cancelado = true; };
  }, [mesAtual, anoAtual]);

  const slotsDisponiveis = slots.filter((s) => s.disponivel);
  const slotsPorData = slotsDisponiveis.reduce<Record<string, DisponibilidadeSlot[]>>((acc, slot) => {
    if (!acc[slot.data]) acc[slot.data] = [];
    acc[slot.data].push(slot);
    return acc;
  }, {});

  const datasOrdenadas = Object.keys(slotsPorData).sort();

  function voltarMes() {
    if (mesAtual === 1) {
      setMesAtual(12);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  }

  function avancarMes() {
    if (mesAtual === 12) {
      setMesAtual(1);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  }

  function selecionarSlot(slot: DisponibilidadeSlot) {
    const iso = `${slot.data}T${slot.horaInicio}:00`;
    onChange(iso);
  }

  function formatarDataBR(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  const valorSelecionado = value ? value.substring(0, 16) : '';

  return (
    <div className={className}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={voltarMes}
          disabled={disabled}
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          &larr; Anterior
        </button>
        <span className="text-sm font-medium">
          {MESES[mesAtual - 1]} {anoAtual}
        </span>
        <button
          type="button"
          onClick={avancarMes}
          disabled={disabled}
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Próximo &rarr;
        </button>
      </div>

      {/* Loading / Error */}
      {carregando && (
        <p className="text-sm text-muted-foreground text-center py-4">Carregando horários...</p>
      )}
      {erroFetch && (
        <p className="text-sm text-destructive text-center py-4">{erroFetch}</p>
      )}

      {/* Slots List */}
      {!carregando && !erroFetch && datasOrdenadas.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum horário disponível neste mês.
        </p>
      )}

      {!carregando && !erroFetch && (
        <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
          {datasOrdenadas.map((data) => (
            <div key={data} className="p-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {formatarDataBR(data)}
              </p>
              <div className="flex flex-wrap gap-1">
                {slotsPorData[data].map((slot) => {
                  const slotIso = `${slot.data}T${slot.horaInicio}:00`;
                  const selecionado = valorSelecionado === slotIso;
                  return (
                    <button
                      key={`${slot.data}-${slot.horaInicio}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => selecionarSlot(slot)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        selecionado
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {slot.horaInicio}-{slot.horaFim}
                      {slot.capacidade > 0 && (
                        <span className="ml-1 opacity-70">
                          ({slot.capacidade - slot.ocupados}v)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-field error */}
      {erro && <p className="text-xs text-destructive mt-1">{erro}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd imper_web && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add imper_web/src/components/disponibilidade/
git commit -m "feat(web): add SlotPicker component for availability-based scheduling"
```

---

### Task 5: Frontend Component — GerenciarPadroes

**Files:**
- Create: `imper_web/src/components/disponibilidade/GerenciarPadroes.tsx`

**Interfaces:**
- Consumes: `apiListarPadroes`, `apiCriarPadrao`, `apiAtualizarPadrao`, `apiExcluirPadrao` from Task 3
- Produces: `GerenciarPadroes` React component

- [ ] **Step 1: Create the component**

Create `imper_web/src/components/disponibilidade/GerenciarPadroes.tsx`:

```tsx
import { useState, useEffect } from 'react';
import {
  apiListarPadroes,
  apiCriarPadrao,
  apiAtualizarPadrao,
  apiExcluirPadrao,
  type DisponibilidadePadrao,
} from '../../lib/api';

const DIAS_SEMANA = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface GerenciarPadroesProps {
  userId: number;
}

export function GerenciarPadroes({ userId }: GerenciarPadroesProps) {
  const [padroes, setPadroes] = useState<DisponibilidadePadrao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // New pattern form state
  const [novoDia, setNovoDia] = useState(1);
  const [novoInicio, setNovoInicio] = useState('08:00');
  const [novoFim, setNovoFim] = useState('12:00');
  const [novaCapacidade, setNovaCapacidade] = useState(1);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const data = await apiListarPadroes(userId);
      setPadroes(data);
    } catch (err: any) {
      setErro(err?.message || 'Erro ao carregar padrões');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [userId]);

  async function handleCriar() {
    if (novoInicio >= novoFim) {
      setErro('Hora início deve ser anterior à hora fim');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await apiCriarPadrao({
        userId,
        diaSemana: novoDia,
        horaInicio: novoInicio,
        horaFim: novoFim,
        capacidade: novaCapacidade,
      });
      setNovoInicio('08:00');
      setNovoFim('12:00');
      setNovaCapacidade(1);
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao criar padrão');
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggleAtivo(id: number, ativo: boolean) {
    try {
      await apiAtualizarPadrao(id, { ativo: !ativo });
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao atualizar padrão');
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm('Excluir este padrão?')) return;
    try {
      await apiExcluirPadrao(id);
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao excluir padrão');
    }
  }

  if (carregando) {
    return <p className="text-sm text-muted-foreground py-4">Carregando padrões...</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Horários Recorrentes</h3>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {/* New Pattern Form */}
      <div className="border rounded-md p-3 space-y-3">
        <p className="text-sm font-medium">Novo horário recorrente</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Dia da semana</label>
            <select
              value={novoDia}
              onChange={(e) => setNovoDia(Number(e.target.value))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>{DIAS_SEMANA[d]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Início</label>
            <input
              type="time"
              value={novoInicio}
              onChange={(e) => setNovoInicio(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fim</label>
            <input
              type="time"
              value={novoFim}
              onChange={(e) => setNovoFim(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Capacidade</label>
            <input
              type="number"
              min={0}
              value={novaCapacidade}
              onChange={(e) => setNovaCapacidade(Number(e.target.value))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleCriar}
              disabled={salvando}
              className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>

      {/* Patterns Table */}
      {padroes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Nenhum padrão cadastrado.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2">Dia</th>
                <th className="text-left px-3 py-2">Horário</th>
                <th className="text-left px-3 py-2">Capacidade</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {padroes.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{DIAS_SEMANA[p.diaSemana]}</td>
                  <td className="px-3 py-2">{p.horaInicio} - {p.horaFim}</td>
                  <td className="px-3 py-2">{p.capacidade === 0 ? 'Ilimitado' : p.capacidade}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(p.id, p.ativo)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {p.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluir(p.id)}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd imper_web && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add imper_web/src/components/disponibilidade/GerenciarPadroes.tsx
git commit -m "feat(web): add GerenciarPadroes component"
```

---

### Task 6: Frontend Component — GerenciarDatas

**Files:**
- Create: `imper_web/src/components/disponibilidade/GerenciarDatas.tsx`

**Interfaces:**
- Consumes: `apiListarDatas`, `apiCriarData`, `apiAtualizarData`, `apiExcluirData` from Task 3
- Produces: `GerenciarDatas` React component

- [ ] **Step 1: Create the component**

Create `imper_web/src/components/disponibilidade/GerenciarDatas.tsx`:

```tsx
import { useState, useEffect } from 'react';
import {
  apiListarDatas,
  apiCriarData,
  apiAtualizarData,
  apiExcluirData,
  type DisponibilidadeData,
} from '../../lib/api';

interface GerenciarDatasProps {
  userId: number;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function GerenciarDatas({ userId }: GerenciarDatasProps) {
  const now = new Date();
  const [mesAtual, setMesAtual] = useState(now.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  const [datas, setDatas] = useState<DisponibilidadeData[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // New date form state
  const [novaData, setNovaData] = useState('');
  const [novoInicio, setNovoInicio] = useState('08:00');
  const [novoFim, setNovoFim] = useState('18:00');
  const [novaCapacidade, setNovaCapacidade] = useState(1);
  const [novaExcluida, setNovaExcluida] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const data = await apiListarDatas(userId, mesAtual, anoAtual);
      setDatas(data);
    } catch (err: any) {
      setErro(err?.message || 'Erro ao carregar datas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [userId, mesAtual, anoAtual]);

  function voltarMes() {
    if (mesAtual === 1) { setMesAtual(12); setAnoAtual(anoAtual - 1); }
    else setMesAtual(mesAtual - 1);
  }

  function avancarMes() {
    if (mesAtual === 12) { setMesAtual(1); setAnoAtual(anoAtual + 1); }
    else setMesAtual(mesAtual + 1);
  }

  async function handleCriar() {
    if (!novaData) { setErro('Selecione uma data'); return; }
    if (novoInicio >= novoFim) { setErro('Hora início deve ser anterior à hora fim'); return; }

    setSalvando(true);
    setErro(null);
    try {
      await apiCriarData({
        userId,
        data: `${novaData}T00:00:00.000Z`,
        horaInicio: novoInicio,
        horaFim: novoFim,
        capacidade: novaCapacidade,
        excluida: novaExcluida,
      });
      setNovaData('');
      setNovoInicio('08:00');
      setNovoFim('18:00');
      setNovaCapacidade(1);
      setNovaExcluida(false);
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao criar data');
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggleExcluida(id: number, excluida: boolean) {
    try {
      await apiAtualizarData(id, { excluida: !excluida });
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao atualizar data');
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm('Excluir este registro?')) return;
    try {
      await apiExcluirData(id);
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao excluir data');
    }
  }

  function formatarDataBR(iso: string): string {
    const d = new Date(iso);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Datas Específicas</h3>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={voltarMes} className="text-sm text-muted-foreground hover:text-foreground">&larr; Anterior</button>
        <span className="text-sm font-medium">{MESES[mesAtual - 1]} {anoAtual}</span>
        <button type="button" onClick={avancarMes} className="text-sm text-muted-foreground hover:text-foreground">Próximo &rarr;</button>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {/* New Date Form */}
      <div className="border rounded-md p-3 space-y-3">
        <p className="text-sm font-medium">Adicionar data específica</p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Data</label>
            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Início</label>
            <input type="time" value={novoInicio} onChange={(e) => setNovoInicio(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fim</label>
            <input type="time" value={novoFim} onChange={(e) => setNovoFim(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Capacidade</label>
            <input type="number" min={0} value={novaCapacidade} onChange={(e) => setNovaCapacidade(Number(e.target.value))} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={novaExcluida} onChange={(e) => setNovaExcluida(e.target.checked)} />
              Excluir (bloquear data)
            </label>
          </div>
          <div className="flex items-end">
            <button type="button" onClick={handleCriar} disabled={salvando} className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>

      {/* Dates Table */}
      {carregando ? (
        <p className="text-sm text-muted-foreground py-4">Carregando...</p>
      ) : datas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Nenhuma data específica neste mês.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2">Data</th>
                <th className="text-left px-3 py-2">Horário</th>
                <th className="text-left px-3 py-2">Capacidade</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {datas.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-3 py-2">{formatarDataBR(d.data)}</td>
                  <td className="px-3 py-2">{d.horaInicio} - {d.horaFim}</td>
                  <td className="px-3 py-2">{d.capacidade === 0 ? 'Ilimitado' : d.capacidade}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${d.excluida ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {d.excluida ? 'Bloqueada' : 'Ativa'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button type="button" onClick={() => handleToggleExcluida(d.id, d.excluida)} className="text-xs text-muted-foreground hover:text-foreground">
                      {d.excluida ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button type="button" onClick={() => handleExcluir(d.id)} className="text-xs text-destructive hover:text-destructive/80">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd imper_web && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add imper_web/src/components/disponibilidade/GerenciarDatas.tsx
git commit -m "feat(web): add GerenciarDatas component"
```

---

### Task 7: Frontend Component — CalendarioDisponibilidade

**Files:**
- Create: `imper_web/src/components/disponibilidade/CalendarioDisponibilidade.tsx`

**Interfaces:**
- Consumes: `apiObterSlots` from Task 3
- Produces: `CalendarioDisponibilidade` React component (calendar view + list view toggle)

- [ ] **Step 1: Create the component**

Create `imper_web/src/components/disponibilidade/CalendarioDisponibilidade.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { apiObterSlots, type DisponibilidadeSlot } from '../../lib/api';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIAS_CABECALHO = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDiasDoMes(ano: number, mes: number): (number | null)[] {
  const primeiroDia = new Date(ano, mes - 1, 1).getDay(); // 0=Sun
  const totalDias = new Date(ano, mes, 0).getDate();
  const dias: (number | null)[] = [];
  // Adjust for Monday start (0=Mon ... 6=Sun)
  const offset = primeiroDia === 0 ? 6 : primeiroDia - 1;
  for (let i = 0; i < offset; i++) dias.push(null);
  for (let d = 1; d <= totalDias; d++) dias.push(d);
  return dias;
}

export function CalendarioDisponibilidade() {
  const now = new Date();
  const [mesAtual, setMesAtual] = useState(now.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  const [slots, setSlots] = useState<DisponibilidadeSlot[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [modoLista, setModoLista] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    apiObterSlots(mesAtual, anoAtual)
      .then((res) => { if (!cancelado) setSlots(res.slots); })
      .catch(() => {})
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [mesAtual, anoAtual]);

  function voltarMes() {
    if (mesAtual === 1) { setMesAtual(12); setAnoAtual(anoAtual - 1); }
    else setMesAtual(mesAtual - 1);
    setDiaSelecionado(null);
  }

  function avancarMes() {
    if (mesAtual === 12) { setMesAtual(1); setAnoAtual(anoAtual + 1); }
    else setMesAtual(mesAtual + 1);
    setDiaSelecionado(null);
  }

  function irParaHoje() {
    setMesAtual(now.getMonth() + 1);
    setAnoAtual(now.getFullYear());
    setDiaSelecionado(null);
  }

  function formatarDataISO(dia: number): string {
    return `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  function slotsDoDia(dataISO: string): DisponibilidadeSlot[] {
    return slots.filter((s) => s.data === dataISO);
  }

  function statusDia(dataISO: string): 'available' | 'limited' | 'full' | 'none' {
    const diaSlots = slotsDoDia(dataISO);
    if (diaSlots.length === 0) return 'none';
    const todosLotados = diaSlots.every((s) => !s.disponivel);
    if (todosLotados) return 'full';
    const algumLimitado = diaSlots.some((s) => s.ocupados > 0 && s.disponivel);
    if (algumLimitado) return 'limited';
    return 'available';
  }

  const diasDoMes = getDiasDoMes(anoAtual, mesAtual);
  const slotsOrdenados = [...slots].sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.horaInicio.localeCompare(b.horaInicio);
  });

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    limited: 'bg-yellow-100 text-yellow-800',
    full: 'bg-gray-100 text-gray-500',
    none: 'bg-white',
  };

  const statusLabels: Record<string, string> = {
    available: 'Disponível',
    limited: 'Parcial',
    full: 'Lotado',
    none: 'Sem slots',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={voltarMes} className="text-sm text-muted-foreground hover:text-foreground">&larr;</button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {MESES[mesAtual - 1]} {anoAtual}
          </span>
          <button type="button" onClick={avancarMes} className="text-sm text-muted-foreground hover:text-foreground">&rarr;</button>
          <button type="button" onClick={irParaHoje} className="text-xs text-primary hover:underline ml-2">Hoje</button>
        </div>
        <button
          type="button"
          onClick={() => setModoLista(!modoLista)}
          className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1"
        >
          {modoLista ? 'Calendário' : 'Lista'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs">
        {Object.entries(statusLabels).filter(([k]) => k !== 'none').map(([key, label]) => (
          <span key={key} className={`px-2 py-0.5 rounded ${statusColors[key]}`}>{label}</span>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Carregando calendário...</p>
      ) : modoLista ? (
        /* List View */
        <div className="border rounded-md max-h-96 overflow-y-auto">
          {slotsOrdenados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum horário disponível neste mês.</p>
          ) : (
            <div className="divide-y">
              {slotsOrdenados.map((slot, i) => (
                <div key={i} className={`px-3 py-2 flex items-center justify-between ${!slot.disponivel ? 'opacity-50' : ''}`}>
                  <div>
                    <span className="text-sm font-medium">
                      {slot.data.split('-').reverse().join('/')}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {slot.horaInicio} - {slot.horaFim}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {slot.capacidade === 0 ? 'Ilimitado' : `${slot.ocupados}/${slot.capacidade}`}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${slot.disponivel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {slot.disponivel ? 'Disponível' : 'Lotado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <>
          <div className="border rounded-md overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-muted">
              {DIAS_CABECALHO.map((dia) => (
                <div key={dia} className="text-xs font-medium text-center py-2 border-r last:border-r-0">
                  {dia}
                </div>
              ))}
            </div>
            {/* Day Cells */}
            <div className="grid grid-cols-7">
              {diasDoMes.map((dia, idx) => {
                if (dia === null) return <div key={`empty-${idx}`} className="border-r border-b last:border-r-0 min-h-[60px]" />;
                const dataISO = formatarDataISO(dia);
                const status = statusDia(dataISO);
                const selecionado = diaSelecionado === dataISO;
                const diaSlots = slotsDoDia(dataISO);
                const disponiveisCount = diaSlots.filter((s) => s.disponivel).length;

                return (
                  <div
                    key={dia}
                    className={`border-r border-b last:border-r-0 min-h-[60px] p-1 cursor-pointer transition-colors ${
                      selecionado ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted/50'
                    } ${statusColors[status] === 'bg-white' ? '' : statusColors[status] + '/30'}`}
                    onClick={() => setDiaSelecionado(selecionado ? null : dataISO)}
                  >
                    <p className="text-xs font-medium">{dia}</p>
                    {diaSlots.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {disponiveisCount}/{diaSlots.length}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details */}
          {diaSelecionado && (
            <div className="border rounded-md p-3 space-y-2">
              <p className="text-sm font-medium">
                {diaSelecionado.split('-').reverse().join('/')}
              </p>
              {slotsDoDia(diaSelecionado).length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum horário neste dia.</p>
              ) : (
                <div className="space-y-1">
                  {slotsDoDia(diaSelecionado).map((slot, i) => (
                    <div key={i} className={`flex items-center justify-between text-sm px-2 py-1 rounded ${!slot.disponivel ? 'opacity-50' : ''}`}>
                      <span>{slot.horaInicio} - {slot.horaFim}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {slot.capacidade === 0 ? 'Ilimitado' : `${slot.ocupados}/${slot.capacidade}`}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${slot.disponivel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                          {slot.disponivel ? 'Disponível' : 'Lotado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd imper_web && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add imper_web/src/components/disponibilidade/CalendarioDisponibilidade.tsx
git commit -m "feat(web): add CalendarioDisponibilidade with calendar and list views"
```

---

### Task 8: Frontend Component — ListaDisponibilidade

**Files:**
- Create: `imper_web/src/components/disponibilidade/ListaDisponibilidade.tsx`

**Interfaces:**
- Consumes: `apiObterSlots` from Task 3
- Produces: `ListaDisponibilidade` React component (compact list of upcoming available slots)

- [ ] **Step 1: Create the component**

Create `imper_web/src/components/disponibilidade/ListaDisponibilidade.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { apiObterSlots, type DisponibilidadeSlot } from '../../lib/api';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function ListaDisponibilidade() {
  const now = new Date();
  const [mesAtual, setMesAtual] = useState(now.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  const [slots, setSlots] = useState<DisponibilidadeSlot[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'disponivel' | 'lotado'>('todos');

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    apiObterSlots(mesAtual, anoAtual)
      .then((res) => { if (!cancelado) setSlots(res.slots); })
      .catch(() => {})
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [mesAtual, anoAtual]);

  function voltarMes() {
    if (mesAtual === 1) { setMesAtual(12); setAnoAtual(anoAtual - 1); }
    else setMesAtual(mesAtual - 1);
  }

  function avancarMes() {
    if (mesAtual === 12) { setMesAtual(1); setAnoAtual(anoAtual + 1); }
    else setMesAtual(mesAtual + 1);
  }

  const slotsFiltrados = slots.filter((s) => {
    if (filtro === 'disponivel') return s.disponivel;
    if (filtro === 'lotado') return !s.disponivel;
    return true;
  }).sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.horaInicio.localeCompare(b.horaInicio);
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Próximos Horários</h3>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={voltarMes} className="text-sm text-muted-foreground hover:text-foreground">&larr; Anterior</button>
        <span className="text-sm font-medium">{MESES[mesAtual - 1]} {anoAtual}</span>
        <button type="button" onClick={avancarMes} className="text-sm text-muted-foreground hover:text-foreground">Próximo &rarr;</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['todos', 'disponivel', 'lotado'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`text-xs px-2 py-1 rounded ${filtro === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {f === 'todos' ? 'Todos' : f === 'disponivel' ? 'Disponíveis' : 'Lotados'}
          </button>
        ))}
      </div>

      {/* Slots List */}
      {carregando ? (
        <p className="text-sm text-muted-foreground py-4">Carregando...</p>
      ) : slotsFiltrados.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Nenhum horário encontrado.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2">Data</th>
                <th className="text-left px-3 py-2">Horário</th>
                <th className="text-left px-3 py-2">Capacidade</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {slotsFiltrados.map((slot, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">
                    {slot.data.split('-').reverse().join('/')}
                    <span className="text-xs text-muted-foreground ml-1">{slot.diaSemana}</span>
                  </td>
                  <td className="px-3 py-2">{slot.horaInicio} - {slot.horaFim}</td>
                  <td className="px-3 py-2">
                    {slot.capacidade === 0 ? 'Ilimitado' : (
                      <span>
                        {slot.ocupados}/{slot.capacidade}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({slot.capacidade - slot.ocupados} vagas)
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${slot.disponivel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {slot.disponivel ? 'Disponível' : 'Lotado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd imper_web && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add imper_web/src/components/disponibilidade/ListaDisponibilidade.tsx
git commit -m "feat(web): add ListaDisponibilidade component"
```

---

### Task 9: Integration — Update AgendamentosAdminPage

**Files:**
- Modify: `imper_web/src/pages/AgendamentosAdminPage.tsx`

**Interfaces:**
- Consumes: All components from Tasks 4-8
- Produces: Updated AgendamentosAdminPage with new sidebar views and SlotPicker

- [ ] **Step 1: Add imports at top of file**

Add after existing imports:

```typescript
import { CalendarioDisponibilidade } from '../components/disponibilidade/CalendarioDisponibilidade';
import { ListaDisponibilidade } from '../components/disponibilidade/ListaDisponibilidade';
import { GerenciarPadroes } from '../components/disponibilidade/GerenciarPadroes';
import { GerenciarDatas } from '../components/disponibilidade/GerenciarDatas';
import { SlotPicker } from '../components/disponibilidade/SlotPicker';
```

- [ ] **Step 2: Add new view state**

In the `AgendamentosAdminPage` component, find the `viewAtiva` state and add new view options. The `viewAtiva` variable should include:

```typescript
type ViewType = 'analises' | 'lista' | 'novo' | 'calendario' | 'disponibilidade';
```

- [ ] **Step 3: Add new SidebarButton entries**

Find the sidebar section and add after the existing buttons:

```tsx
<SidebarButton
  active={viewAtiva === 'calendario'}
  onClick={() => setViewAtiva('calendario')}
>
  Calendário
</SidebarButton>
<SidebarButton
  active={viewAtiva === 'disponibilidade'}
  onClick={() => setViewAtiva('disponibilidade')}
>
  Gerenciar Disponibilidade
</SidebarButton>
```

- [ ] **Step 4: Add new view rendering**

In the view rendering section (where `viewAtiva === 'lista'` etc. are checked), add:

```tsx
{viewAtiva === 'calendario' && (
  <CalendarioDisponibilidade />
)}

{viewAtiva === 'disponibilidade' && (
  <div className="space-y-6">
    <GerenciarPadroes userId={currentUser.id} />
    <GerenciarDatas userId={currentUser.id} />
  </div>
)}
```

- [ ] **Step 5: Replace datetime-local with SlotPicker in NovoAgendamentoForm**

Find the "Agendar visita técnica para:" section and replace the `<input type="datetime-local">` with:

```tsx
<SlotPicker
  value={novoAgendamento.dataPrevista}
  onChange={(iso) => setNovoAgendamento({ ...novoAgendamento, dataPrevista: iso })}
  erro={erroCampo('dataPrevista')}
/>
```

- [ ] **Step 6: Add current user context**

The `currentUser` object should already be available in the component (from auth context). Verify it has an `id` property. If not, adjust the `userId` prop to use the correct property name.

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd imper_web && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add imper_web/src/pages/AgendamentosAdminPage.tsx
git commit -m "feat(web): integrate disponibilidade views and SlotPicker into AgendamentosAdminPage"
```

---

### Task 10: Final Build Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Backend build check**

Run: `cd imper_api && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 2: Frontend build check**

Run: `cd imper_web && npm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 3: Final commit (if needed)**

If any fixes were needed in steps 1-2, commit them:

```bash
git add -A
git commit -m "fix: resolve build issues for disponibilidade feature"
```

---

## Self-Review Checklist

- [ ] Spec coverage: All 10 spec sections have corresponding tasks
- [ ] Placeholder scan: No TBD/TODO/placeholder text found
- [ ] Type consistency: `DisponibilidadePadrao`, `DisponibilidadeData`, `DisponibilidadeSlot` types match across api.ts and all components
- [ ] File paths: All paths are exact and match existing project structure
- [ ] Code completeness: Every step contains complete, copy-pasteable code
