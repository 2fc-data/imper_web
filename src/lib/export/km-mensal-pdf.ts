import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatarKm } from '../km';

interface LinhaKm {
  data: string;
  kmAnterior: number | string;
  kmAtual: number | string;
  kmDoDia: number | string | null;
  observacao: string | null;
  colaborador?: string | null;
}

export interface KmMensalPdfInput {
  veiculoNome: string;
  veiculoPlaca: string;
  mes: number;
  ano: number;
  odometroAtual: number | string;
  linhas: LinhaKm[];
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatarDataCurta(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function gerarPdfKmMensal(input: KmMensalPdfInput): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Km Diário — Listagem Mensal', 15, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Veículo: ${input.veiculoNome} — ${input.veiculoPlaca}`, 15, 23);
  doc.text(
    `Período: ${MESES[input.mes - 1]} de ${input.ano}`,
    15,
    29,
  );
  doc.text(
    `Odômetro atual: ${formatarKm(input.odometroAtual)} km`,
    15,
    35,
  );

  const corpo = input.linhas.map((l) => [
    formatarDataCurta(l.data),
    `${formatarKm(l.kmAnterior)} km`,
    `${formatarKm(l.kmAtual)} km`,
    l.kmDoDia === null ? '—' : `${formatarKm(l.kmDoDia)} km`,
    l.colaborador ?? '—',
    l.observacao ?? '—',
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['Data', 'KM Anterior', 'KM Atual', 'KM do Dia', 'Colaborador', 'Observação']],
    body: corpo,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 15, right: 15 },
  });

  const nomeArquivo = `km-mensal-${input.veiculoPlaca}-${input.ano}-${String(input.mes).padStart(2, '0')}.pdf`;
  doc.save(nomeArquivo);
}
