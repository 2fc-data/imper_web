import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ListaCompraDto } from '../api/listas-compras';
import { MESES_CURTOS, nomeItem, totalGasto, unidadeItem } from '../lista-compras';

const ROTULO_STATUS: Record<string, string> = {
  ABERTA: 'Aberta', ENVIADA: 'Enviada', APROVADA: 'Aprovada',
  RECUSADA: 'Recusada', COMPRADA: 'Comprada',
};

function fmt(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtQtd(v: number | string): string {
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

export function gerarPdfListaCompras(
  lista: ListaCompraDto,
  tituloDominio: string,
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Lista de Compras — ${tituloDominio}`, 15, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(
    `Setor: ${lista.setor === 'LOJA' ? 'Loja' : 'Almoxarifado'} · ` +
      `Período: ${MESES_CURTOS[lista.mes - 1]}/${lista.ano} · ` +
      `Status: ${ROTULO_STATUS[lista.status] ?? lista.status}`,
    15,
    23,
  );
  let yMotivo = 29;
  if (lista.motivoRecusa) {
    const linhas = doc.splitTextToSize(
      `Motivo da recusa: ${lista.motivoRecusa}`,
      180,
    ) as string[];
    for (const linha of linhas) {
      doc.text(linha, 15, yMotivo);
      yMotivo += 4;
    }
  }
  const yTabela = yMotivo + 3;

  const corpo = lista.itens.map((item) => [
    nomeItem(item),
    fmtQtd(item.quantidade),
    unidadeItem(item),
    item.status === 'COMPRADO' ? fmt(item.custoReal) : '—',
    item.status === 'COMPRADO'
      ? 'Comprado'
      : item.status === 'RECUSADO'
        ? 'Recusado'
        : 'Pendente',
  ]);

  autoTable(doc, {
    startY: yTabela,
    head: [['Item', 'Qtd', 'Un.', 'Custo real', 'Status']],
    body: corpo,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 15, right: 15 },
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Total gasto: R$ ${fmt(totalGasto(lista.itens))}`,
    15,
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
  );

  const nomeArquivo =
    `lista-compras-${lista.tipo.toLowerCase()}-${lista.setor.toLowerCase()}-` +
    `${lista.ano}-${String(lista.mes).padStart(2, '0')}.pdf`;
  doc.save(nomeArquivo);
}
