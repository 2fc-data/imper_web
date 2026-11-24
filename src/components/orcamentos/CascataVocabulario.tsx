import { useEffect, useState } from 'react';
import {
  listarEtapas,
  listarServicos,
  listarSubServicos,
  listarTermos,
  type Etapa,
  type OpcaoCascata,
  type ServicoMarketing,
  type SubServico,
} from '../../lib/api';
import {
  labelClasses,
  selectClasses,
  type ValorCascata,
} from './tipos';

interface Props {
  valor: ValorCascata;
  onChange: (v: ValorCascata) => void;
  /**
   * `reduzida` — só Etapa + Serviço (seleção do que será feito).
   * `termos` — só Verbo/Objeto/Local/Característica (etapa/serviço vêm de fora).
   * `completa` (padrão) — todas as dimensões.
   */
  modo?: 'reduzida' | 'completa' | 'termos';
  /** Se true, usa `servicos_marketing` (título) no select em vez de `sub_servicos`. Padrão: true no wizard de orçamento. */
  usarServicosMarketing?: boolean;
}

/**
 * Seletor etapa → serviço → verbo/objeto/local/característica.
 * Termos (verbo/objeto/local/característica) listam todas as opções ativas,
 * sem filtragem cruzada.
 */
export function CascataVocabulario({
  valor,
  onChange,
  modo = 'completa',
  usarServicosMarketing = true,
}: Props) {
  const soEtapasSubs = modo === 'reduzida';
  const soTermos = modo === 'termos';
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [subs, setSubs] = useState<SubServico[]>([]);
  const [servicosMarketing, setServicosMarketing] = useState<ServicoMarketing[]>([]);
  const [locais, setLocais] = useState<OpcaoCascata[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<OpcaoCascata[]>([]);
  const [verbos, setVerbos] = useState<OpcaoCascata[]>([]);
  const [objetos, setObjetos] = useState<OpcaoCascata[]>([]);

  const nomeEtapa = (id: number): string =>
    etapas.find((e) => e.id === id)?.nome ?? `#${id}`;

  // termos (locais, características, verbos, objetos)
  useEffect(() => {
    if (soEtapasSubs) return;
    let vivo = true;
    Promise.all([
      listarTermos('locais', { ativo: true }),
      listarTermos('caracteristicas', { ativo: true }),
      listarTermos('verbos', { ativo: true }),
      listarTermos('objetos', { ativo: true }),
    ])
      .then(([locs, chars, vs, obs]) => {
        if (vivo) {
          setLocais(locs);
          setCaracteristicas(chars);
          setVerbos(vs);
          setObjetos(obs);
        }
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [soEtapasSubs]);

  // etapas (uma vez; não busca em modo `termos` — não são renderizadas)
  useEffect(() => {
    if (soTermos) return;
    let vivo = true;
    listarEtapas(true)
      .then((r) => {
        if (vivo) setEtapas(r);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [soTermos]);

  // serviços de marketing: carregados quando usarServicosMarketing for true
  useEffect(() => {
    if (soTermos || !usarServicosMarketing) return;
    let vivo = true;
    listarServicos()
      .then((r) => {
        if (!vivo) return;
        const ativos = r.filter((s) => s.ativo);
        setServicosMarketing(ativos);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [soTermos, usarServicosMarketing]);

  // sub-serviços: filtrados pela etapa quando selecionada; sem etapa, todos
  // os ativos (com prefixo de etapa no label para desambiguar)
  useEffect(() => {
    if (soTermos || usarServicosMarketing) return;
    let vivo = true;
    listarSubServicos(valor.etapaId ?? undefined, true)
      .then((r) => {
        if (!vivo) return;
        setSubs(r);
        // limpa sub que não pertence à nova etapa (ou não existe mais)
        if (
          valor.subServicoId != null &&
          !r.some((s) => s.id === valor.subServicoId)
        ) {
          onChange({
            ...valor,
            subServicoId: null,
            subServicoNome: null,
          });
        }
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soTermos, usarServicosMarketing, valor.etapaId]);

  const mudarEtapa = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null;
    const etapa = etapas.find((x) => x.id === id) ?? null;
    const subValido =
      usarServicosMarketing
        ? valor.subServicoId != null
        : id != null && valor.subServicoId != null
          ? subs.some((s) => s.id === valor.subServicoId && s.etapaId === id)
          : false;
    onChange({
      ...valor,
      etapaId: id,
      etapaNome: etapa?.nome ?? null,
      etapaOrdem: etapa?.ordem ?? null,
      ...(subValido
        ? {}
        : { subServicoId: null, subServicoNome: null }),
    });
  };

  const mudarSub = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null;
    let nome: string | null = null;
    if (usarServicosMarketing) {
      nome = servicosMarketing.find((x) => x.id === id)?.titulo ?? null;
    } else {
      nome = subs.find((x) => x.id === id)?.nome ?? null;
    }
    onChange({ ...valor, subServicoId: id, subServicoNome: nome });
  };

  const nomeOpcao = (
    lista: OpcaoCascata[],
    id: number | null,
  ): string | null =>
    id == null ? null : (lista.find((o) => o.id === id)?.nome ?? null);

  const mudarOpcao = (
    dim: 'verbo' | 'objeto' | 'local' | 'caracteristica',
    lista: OpcaoCascata[],
  ) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null;
    const nome = nomeOpcao(lista, id);
    const nomeUpper = nome ? nome.toUpperCase() : null;
    const base: ValorCascata = { ...valor };
    if (dim === 'verbo') {
      base.verboId = id;
      base.verboNome = nomeUpper;
    } else if (dim === 'objeto') {
      base.objetoId = id;
      base.objetoNome = nomeUpper;
    } else if (dim === 'local') {
      base.localId = id;
      base.localNome = nomeUpper;
    } else {
      base.caracteristicaId = id;
      base.caracteristicaNome = nomeUpper;
    }
    onChange(base);
  };

  return (
    <div
      className={
        soEtapasSubs
          ? 'grid gap-3 sm:grid-cols-2'
          : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
      }
    >
      {soTermos ? null : (
        <>
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
            <span className={labelClasses}>
              {usarServicosMarketing ? 'Serviço' : 'Sub-serviço'}
            </span>
            <select
              className={selectClasses}
              value={valor.subServicoId ?? ''}
              onChange={mudarSub}
            >
              <option value="">
                {usarServicosMarketing
                  ? 'Selecione o serviço…'
                  : 'Selecione o sub-serviço…'}
              </option>
              {usarServicosMarketing
                ? servicosMarketing.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.titulo}
                    </option>
                  ))
                : subs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {valor.etapaId == null
                        ? `${nomeEtapa(s.etapaId)} › ${s.nome}`
                        : s.nome}
                    </option>
                  ))}
            </select>
          </label>
        </>
      )}

      {soEtapasSubs ? null : (
        <>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Verbo</span>
            <select
              className={`${selectClasses} uppercase`}
              value={valor.verboId ?? ''}
              onChange={mudarOpcao('verbo', verbos)}
            >
              <option value="">Selecione…</option>
              {verbos.map((o) => (
                <option key={o.id} value={o.id} className="uppercase">
                  {o.nome.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Objeto</span>
            <select
              className={`${selectClasses} uppercase`}
              value={valor.objetoId ?? ''}
              onChange={mudarOpcao('objeto', objetos)}
            >
              <option value="">Selecione…</option>
              {objetos.map((o) => (
                <option key={o.id} value={o.id} className="uppercase">
                  {o.nome.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Local</span>
            <select
              className={`${selectClasses} uppercase`}
              value={valor.localId ?? ''}
              onChange={mudarOpcao('local', locais)}
            >
              <option value="">(qualquer)</option>
              {locais.map((o) => (
                <option key={o.id} value={o.id} className="uppercase">
                  {o.nome.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Característica</span>
            <select
              className={`${selectClasses} uppercase`}
              value={valor.caracteristicaId ?? ''}
              onChange={mudarOpcao('caracteristica', caracteristicas)}
            >
              <option value="">(qualquer)</option>
              {caracteristicas.map((o) => (
                <option key={o.id} value={o.id} className="uppercase">
                  {o.nome.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}
