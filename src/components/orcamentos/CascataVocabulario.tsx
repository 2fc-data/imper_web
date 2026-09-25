import { useEffect, useState } from 'react';
import {
  getCascata,
  listarEtapas,
  listarSubServicos,
  type Cascata,
  type Etapa,
  type OpcaoCascata,
  type SubServico,
} from '../../lib/api';
import {
  cascataVazia,
  labelClasses,
  selectClasses,
  type ValorCascata,
} from './tipos';

interface Props {
  valor: ValorCascata;
  onChange: (v: ValorCascata) => void;
}

/** Limpa as dimensões downstream de `dim` (mantém `dim` intacta). */
function limparDownstream(
  v: ValorCascata,
  dim: 'verbo' | 'objeto' | 'local' | 'caracteristica',
): ValorCascata {
  const out: ValorCascata = { ...v };
  if (dim === 'verbo') {
    out.objetoId = null;
    out.objetoNome = null;
    out.localId = null;
    out.localNome = null;
    out.caracteristicaId = null;
    out.caracteristicaNome = null;
  } else if (dim === 'objeto') {
    out.localId = null;
    out.localNome = null;
    out.caracteristicaId = null;
    out.caracteristicaNome = null;
  } else if (dim === 'local') {
    out.caracteristicaId = null;
    out.caracteristicaNome = null;
  }
  return out;
}

/**
 * Seletor cascata etapa → sub-serviço → verbo/objeto/local/característica.
 * Componente controlado: recebe `ValorCascata` e emite o novo valor já com
 * as dimensões downstream limpas (evita round-trips inválidos no servidor).
 */
export function CascataVocabulario({ valor, onChange }: Props) {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [subs, setSubs] = useState<SubServico[]>([]);
  const [cascata, setCascata] = useState<Cascata | null>(null);
  const [carregando, setCarregando] = useState(false);

  // etapas (uma vez)
  useEffect(() => {
    let vivo = true;
    listarEtapas(true)
      .then((r) => {
        if (vivo) setEtapas(r);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  // sub-serviços por etapa
  useEffect(() => {
    if (valor.etapaId == null) {
      setSubs([]);
      return;
    }
    let vivo = true;
    listarSubServicos(valor.etapaId, true)
      .then((r) => {
        if (vivo) setSubs(r);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [valor.etapaId]);

  // cascata: um único efeito, refaz a busca quando a seleção muda
  useEffect(() => {
    if (valor.subServicoId == null) {
      setCascata(null);
      return;
    }
    let vivo = true;
    setCarregando(true);
    getCascata(valor.subServicoId, {
      verboId: valor.verboId ?? undefined,
      objetoId: valor.objetoId ?? undefined,
      localId: valor.localId,
      caracteristicaId: valor.caracteristicaId,
    })
      .then((r) => {
        if (vivo) setCascata(r);
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [
    valor.subServicoId,
    valor.verboId,
    valor.objetoId,
    valor.localId,
    valor.caracteristicaId,
  ]);

  const mudarEtapa = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null;
    const nome = etapas.find((x) => x.id === id)?.nome ?? null;
    onChange({ ...cascataVazia(), etapaId: id, etapaNome: nome });
  };

  const mudarSub = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null;
    const nome = subs.find((x) => x.id === id)?.nome ?? null;
    onChange({
      ...valor,
      subServicoId: id,
      subServicoNome: nome,
      verboId: null,
      verboNome: null,
      objetoId: null,
      objetoNome: null,
      localId: null,
      localNome: null,
      caracteristicaId: null,
      caracteristicaNome: null,
    });
  };

  const nomeOpcao = (dim: keyof Cascata, id: number | null): string | null =>
    id == null
      ? null
      : (cascata?.[dim].find((o) => o?.id === id)?.nome ?? null);

  const mudarOpcao = (dim: 'verbo' | 'objeto' | 'local' | 'caracteristica') =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value ? Number(e.target.value) : null;
      const nome = nomeOpcao(dim, id);
      const base: ValorCascata = { ...valor };
      if (dim === 'verbo') {
        base.verboId = id;
        base.verboNome = nome;
      } else if (dim === 'objeto') {
        base.objetoId = id;
        base.objetoNome = nome;
      } else if (dim === 'local') {
        base.localId = id;
        base.localNome = nome;
      } else {
        base.caracteristicaId = id;
        base.caracteristicaNome = nome;
      }
      onChange(limparDownstream(base, dim));
    };

  const opts = (lista: (OpcaoCascata | null)[] | undefined) =>
    (lista ?? []).filter((o): o is OpcaoCascata => o != null);

  const desabilitadoSub = valor.etapaId == null;
  const desabilitadoDim = valor.subServicoId == null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Etapa</span>
        <select
          className={selectClasses}
          value={valor.etapaId ?? ''}
          onChange={mudarEtapa}
        >
          <option value="">Selecione a etapa…</option>
          {etapas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Sub-serviço</span>
        <select
          className={selectClasses}
          value={valor.subServicoId ?? ''}
          onChange={mudarSub}
          disabled={desabilitadoSub}
        >
          <option value="">Selecione o sub-serviço…</option>
          {subs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Verbo</span>
        <select
          className={selectClasses}
          value={valor.verboId ?? ''}
          onChange={mudarOpcao('verbo')}
          disabled={desabilitadoDim}
        >
          <option value="">Selecione…</option>
          {opts(cascata?.verbo).map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Objeto</span>
        <select
          className={selectClasses}
          value={valor.objetoId ?? ''}
          onChange={mudarOpcao('objeto')}
          disabled={desabilitadoDim || valor.verboId == null}
        >
          <option value="">Selecione…</option>
          {opts(cascata?.objeto).map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Local</span>
        <select
          className={selectClasses}
          value={valor.localId ?? ''}
          onChange={mudarOpcao('local')}
          disabled={desabilitadoDim || valor.objetoId == null}
        >
          <option value="">(qualquer)</option>
          {opts(cascata?.local).map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Característica</span>
        <select
          className={selectClasses}
          value={valor.caracteristicaId ?? ''}
          onChange={mudarOpcao('caracteristica')}
          disabled={desabilitadoDim || valor.objetoId == null}
        >
          <option value="">(qualquer)</option>
          {opts(cascata?.caracteristica).map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
      </label>

      {carregando ? (
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">
          Carregando combinações…
        </p>
      ) : null}
    </div>
  );
}
