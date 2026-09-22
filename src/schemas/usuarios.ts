import { z } from 'zod';

export const criarUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone: z.string().optional(),
  papelId: z.number(),
  cargoId: z.number().nullable().optional(),
});

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().optional(),
  papelId: z.number().optional(),
  cargoId: z.number().nullable().optional(),
  ativo: z.boolean().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
});

export const resetarSenhaSchema = z.object({
  novaSenha: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
export type ResetarSenhaInput = z.infer<typeof resetarSenhaSchema>;