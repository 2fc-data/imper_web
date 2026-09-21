// SYNC: Keep in sync with imper_api/src/schemas/enums.ts
// This file contains only the types used by the web frontend.
// Unused types have been removed. If you need a type not here, check the API schemas.
export type StatusAtendimento =
  | 'NOVO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'INATIVO';

export type CanalAtendimento = 'WHATSAPP' | 'FORMULARIO' | 'LOJA' | 'TELEFONE';

export type Urgencia = 'NORMAL' | 'URGENTE' | 'URGENTISSIMO';

export type StatusOrcamento =
  | 'RASCUNHO'
  | 'ENVIADO'
  | 'APROVADO'
  | 'RECUSADO'
  | 'EXPIRADO'
  | 'CANCELADO';

export type TipoItemServico = 'SERVICO' | 'MATERIAL' | 'EQUIPAMENTO';

export type StatusOS =
  | 'AGUARDANDO_APROVACAO'
  | 'AGENDADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'CONFIRMADO'
  | 'EM_SEPARACAO'
  | 'SEPARADO'
  | 'ENTREGUE'
  | 'CANCELADO';

export type TipoAgendamento = 'VISITA' | 'ORCAMENTO' | 'RETORNO' | 'REUNIAO';

export type StatusAgendamento =
  | 'PENDENTE'
  | 'CONFIRMADO'
  | 'REALIZADO'
  | 'CANCELADO'
  | 'NAO_COMPARECEU';

export type ResultadoVisita =
  | 'SEM_ACAO'
  | 'ORCAMENTO_NECESSARIO'
  | 'OBRA_NECESSARIA'
  | 'CLIENTE_AUSENTE';

export type StatusManutencao =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type TipoMaterial = 'MATERIAL' | 'EQUIPAMENTO';

export type StatusMaterial = 'ATIVO' | 'INATIVO';

export type TipoMovimento = 'ENTRADA' | 'SAIDA';