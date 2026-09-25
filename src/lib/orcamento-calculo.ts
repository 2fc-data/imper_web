// Espelho client-side de imper_api/src/orcamentos/orcamento-calculo.ts.
// As fórmulas DEVEM permanecer idênticas às do servidor (fonte de verdade do cálculo).

export type MOCampos = {
  moPessoas?: number | null;
  moHoras?: number | null;
  moValorHora?: number | null;
};

export type MateriaisLinha = {
  quantidade: number;
  custoUnitario: number;
};

export type LinhaCalculo = MOCampos & {
  materiais: MateriaisLinha[];
};

export type BasePrecos = {
  areaM2?: number | null;
  valorM2?: number | null;
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function moValorTotal(l: MOCampos): number {
  if (l.moPessoas == null || l.moHoras == null || l.moValorHora == null) {
    return 0;
  }
  return round2(l.moPessoas * l.moHoras * l.moValorHora);
}

export function materiaisValor(m: MateriaisLinha[]): number {
  return round2(m.reduce((acc, x) => acc + x.quantidade * x.custoUnitario, 0));
}

export function linhaValorTotal(
  l: MOCampos,
  mats: MateriaisLinha[],
): number {
  return round2(moValorTotal(l) + materiaisValor(mats));
}

export function valorTotalOrcamento(p: {
  areaM2?: number | null;
  valorM2?: number | null;
  linhas: number[];
}): number {
  const base = p.areaM2 != null && p.valorM2 != null ? p.areaM2 * p.valorM2 : 0;
  return round2(base + p.linhas.reduce((a, b) => a + b, 0));
}

export type TotaisOrcamento = {
  valorMO: number;
  valorMateriais: number;
  total: number;
};

export function calcularTotais(
  atividades: { linhas: LinhaCalculo[] }[],
  base?: BasePrecos,
): TotaisOrcamento {
  const linhas = atividades.flatMap((a) => a.linhas);
  const valorMO = round2(
    linhas.reduce((acc, l) => acc + moValorTotal(l), 0),
  );
  const valorMateriais = round2(
    linhas.reduce((acc, l) => acc + materiaisValor(l.materiais), 0),
  );
  const total = valorTotalOrcamento({
    areaM2: base?.areaM2 ?? null,
    valorM2: base?.valorM2 ?? null,
    linhas: linhas.map((l) => linhaValorTotal(l, l.materiais)),
  });
  return { valorMO, valorMateriais, total };
}
