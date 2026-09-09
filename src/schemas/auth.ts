import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
  turnstileToken: z.string().optional(),
});

export const cadastrarSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export const recuperarSenhaSchema = z.object({
  email: z.string().email('E-mail inválido'),
  turnstileToken: z.string().optional(),
});

export const redefinirSenhaSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  turnstileToken: z.string().optional(),
});

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual obrigatória'),
  novaSenha: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CadastrarInput = z.infer<typeof cadastrarSchema>;
export type RecuperarSenhaInput = z.infer<typeof recuperarSenhaSchema>;
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>;