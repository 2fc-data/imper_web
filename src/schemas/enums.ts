export type StatusAtendimento =
  | 'NOVO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'INATIVO';

export type CanalAtendimento = 'WHATSAPP' | 'FORMULARIO' | 'LOJA' | 'TELEFONE';

export type MotivoAtendimento =
  | 'DUVIDA'
  | 'AGENDAR_AVALIACAO_ORCAMENTO';

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

export type StatusVisita = 'AGENDADA' | 'REALIZADA' | 'CANCELADA';

export type StatusManutencao =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type TipoMaterial = 'MATERIAL' | 'EQUIPAMENTO';

export type TipoCategoria = 'EQUIPAMENTO' | 'EPI';

export type StatusMaterial = 'ATIVO' | 'INATIVO';

export type TipoMovimento = 'ENTRADA' | 'SAIDA';

export type EspecialidadeAtividade =
  | 'IMPERMEABILIZACAO'
  | 'PINTURA'
  | 'ELETRICA'
  | 'HIDRAULICA'
  | 'CIVIL'
  | 'LIMPEZA'
  | 'OUTROS';

export type EnumTipoRecursoAtividade =
  | 'EQUIPAMENTO'
  | 'EPI'
  | 'MATERIAL';

export type EnumStatusEquipe =
  | 'PENDENTE'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA';

export type EnumStatusAtividadeOS =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type EnumStatusChecklist =
  | 'PENDENTE'
  | 'CONCLUIDA'
  | 'BLOQUEADA';

export type EnumStatusSeparacaoNovo =
  | 'SEPARACAO_PENDENTE'
  | 'SEPARACAO_CONCLUIDA'
  | 'EQUIPE_NOTIFICADA'
  | 'RETIRADA_PENDENTE'
  | 'RETIRADA_CONCLUIDA'
  | 'DEVOLUCAO_PENDENTE'
  | 'DEVOLUCAO_CONCLUIDA';

export type EnumStatusEquipamento =
  | 'EM_USO'
  | 'DEVOLVIDO'
  | 'EM_MANUTENCAO';