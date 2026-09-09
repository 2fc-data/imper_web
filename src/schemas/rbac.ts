import { z } from 'zod';

export const criarPapelSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
});

export const atualizarPapelSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
});

export const definirPermissoesSchema = z.object({
  permissoesIds: z.array(z.number()),
});

export type CriarPapelInput = z.infer<typeof criarPapelSchema>;
export type AtualizarPapelInput = z.infer<typeof atualizarPapelSchema>;
export type DefinirPermissoesInput = z.infer<typeof definirPermissoesSchema>;