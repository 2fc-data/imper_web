// Autosave por passo do wizard: funções puras do indicador de salvamento.
// Mantidas livres de React para serem cobertas por autosave.test.ts.

/** Estado do indicador de salvamento exibido no stepper. */
export type StatusAutosave = 'ocioso' | 'salvando' | 'salvo' | 'erro';

export interface EstadoAutosave {
  status: StatusAutosave;
  /** Epoch ms da última gravação concluída; null enquanto não salvar nada. */
  ultimaSalvoEm: number | null;
  /** Mensagem do último erro (presente apenas quando status === 'erro'). */
  erro: string | null;
}

export type EventoAutosave =
  | { tipo: 'iniciar' }
  | { tipo: 'sucesso'; em: number }
  | { tipo: 'falha'; mensagem: string };

export function estadoAutosaveInicial(): EstadoAutosave {
  return { status: 'ocioso', ultimaSalvoEm: null, erro: null };
}

/**
 * Transições do indicador: iniciar limpa o erro anterior, sucesso registra o
 * horário da gravação e falha preserva o horário do último sucesso.
 */
export function reducerAutosave(
  estado: EstadoAutosave,
  evento: EventoAutosave,
): EstadoAutosave {
  switch (evento.tipo) {
    case 'iniciar':
      return {
        status: 'salvando',
        ultimaSalvoEm: estado.ultimaSalvoEm,
        erro: null,
      };
    case 'sucesso':
      return { status: 'salvo', ultimaSalvoEm: evento.em, erro: null };
    case 'falha':
      return {
        status: 'erro',
        ultimaSalvoEm: estado.ultimaSalvoEm,
        erro: evento.mensagem,
      };
  }
}

/**
 * Criar na primeira gravação; atualizar assim que existir id. É o que evita
 * um segundo rascunho quando o autosave já criou o registro e o usuário
 * clica em "Salvar rascunho" no passo 3.
 */
export type AcaoSalvar = { tipo: 'criar' } | { tipo: 'editar'; id: number };

export function acaoDeSalvar(salvoId: number | null): AcaoSalvar {
  return salvoId == null ? { tipo: 'criar' } : { tipo: 'editar', id: salvoId };
}

export function formatarHora(epoch: number | null): string {
  if (epoch == null) return '';
  return new Date(epoch).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
