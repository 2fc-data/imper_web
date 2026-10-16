import { useEffect, useState } from 'react';
import {
  listarEtapas,
  listarSubServicos,
  listarTermos,
  type Etapa,
  type OpcaoCascata,
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
   * `reduzida` — só Etapa + Sub-serviço (seleção do que será feito).
   * `termos` — só Verbo/Objeto/Local/Característica (etapa/sub vêm de fora).
   * `completa` (padrão) — todas as dimensões.
   */
  modo?: 'reduzida' | 'completa' | 'termos';
}

/**
 * Seletor etapa → sub-serviço → verbo/objeto/local/característica.
 * Selects totalmente independentes: cada um lista todas as opções ativas,
 * sem filtragem cruzada, sem `disabled` e sem limpar os demais ao mudar.
 */
export function CascataVocabulario({
  valor,
  onChange,
  modo = 'completa',
}: Props) {
  const soEtapasSubs = modo === 'reduzida';
  const soTermos = modo === 'termos';
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [subs, setSubs] = useState<SubServico[]>([]);
  const [locais, setLocais] = useState<OpcaoCascata[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<OpcaoCascata[]>([]);
  const [verbos, setVerbos] = useState<OpcaoCascata[]>([]);
  const [objetos, setObjetos] = useState<OpcaoCascata[]>([]);

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

  // sub-serviços: todos os ativos de uma vez (independente da etapa)
  useEffect(() => {
    if (soTermos) return;
    let vivo = true;
    listarSubServicos(undefined, true)
      .then((r) => {
        if (vivo) setSubs(r);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [soTermos]);

  const mudarEtapa = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null;
    const etapa = etapas.find((x) => x.id === id) ?? null;
    onChange({
      ...valor,
      etapaId: id,
      etapaNome: etapa?.nome ?? null,
      etapaOrdem: etapa?.ordem ?? null,
    });
  };

  const mudarSub = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null;
    const nome = subs.find((x) => x.id === id)?.nome ?? null;
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
            <span className={labelClasses}>Sub-serviço</span>
            <select
              className={selectClasses}
              value={valor.subServicoId ?? ''}
              onChange={mudarSub}
            >
              <option value="">Selecione o sub-serviço…</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
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
              className={selectClasses}
              value={valor.verboId ?? ''}
              onChange={mudarOpcao('verbo', verbos)}
            >
              <option value="">Selecione…</option>
              {verbos.map((o) => (
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
              onChange={mudarOpcao('objeto', objetos)}
            >
              <option value="">Selecione…</option>
              {objetos.map((o) => (
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
              onChange={mudarOpcao('local', locais)}
            >
              <option value="">(qualquer)</option>
              {locais.map((o) => (
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
              onChange={mudarOpcao('caracteristica', caracteristicas)}
            >
              <option value="">(qualquer)</option>
              {caracteristicas.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}
