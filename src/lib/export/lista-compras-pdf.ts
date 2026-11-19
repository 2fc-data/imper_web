import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImper from '../../assets/logo_imper.webp';
import { EMPRESA, empresaContatoLinha } from '../empresa';
import type { ListaCompraDto } from '../api/listas-compras';
import {
  formatarData, fornecedorItem, MESES_CURTOS, nomeItem, totalGasto,
  unidadeItem, valorTotalItem, valorUnitarioItem,
} from '../lista-compras';

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

async function carregarLogoDataUrl(): Promise<string | null> {
  try {
    const resp = await fetch(logoImper);
    const blob = await resp.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function gerarPdfListaCompras(
  lista: ListaCompraDto,
  tituloDominio: string,
  rodada?: number,
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logo = await carregarLogoDataUrl();
  const sufixoRodada = rodada ? ` · Compra ${rodada}` : '';

  const topo = 12;

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 15, topo, 40, 16, undefined, 'FAST');
    } catch {
      // webp pode falhar no jsPDF; segue sem logo
    }
  }

  // Identidade da empresa (esquerda) — começa após o logo para não sobrepor
  const identX = 60;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(EMPRESA.nome, identX, topo + 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(EMPRESA.tagline, identX, topo + 8);
  doc.text(`CNPJ ${EMPRESA.cnpj}`, identX, topo + 12);
  doc.text(`${EMPRESA.endereco} — ${EMPRESA.cidade}`, identX, topo + 16);
  const alturaEsquerda = topo + 18;

  // Documento (direita)
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('LISTA DE COMPRAS', 195, topo + 3, { align: 'right' });
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  const tituloLinhas = doc.splitTextToSize(
    `${tituloDominio}${sufixoRodada}`,
    120,
  ) as string[];
  tituloLinhas.forEach((linha, i) => {
    doc.text(linha, 195, topo + 10 + i * 5.5, { align: 'right' });
  });
  const baseTitulo = topo + 10 + tituloLinhas.length * 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(
    `${MESES_CURTOS[lista.mes - 1]}/${lista.ano} · Status: ${
      ROTULO_STATUS[lista.status] ?? lista.status
    }`,
    195,
    baseTitulo,
    { align: 'right' },
  );
  const alturaDireita = baseTitulo + 1;

  // Linha de contato em largura total, abaixo dos dois blocos
  let y = Math.max(alturaEsquerda, alturaDireita) + 4;
  doc.setFontSize(7);
  doc.setTextColor(100);
  const contatoLinhas = doc.splitTextToSize(
    empresaContatoLinha(),
    180,
  ) as string[];
  doc.text(contatoLinhas, 15, y);
  const alturaContato = (contatoLinhas.length - 1) * 3.2;

  y += alturaContato + 5;
  doc.setDrawColor(200);
  doc.line(15, y, 195, y);
  y += 8;

  // Setor
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('SETOR', 15, y);
  y += 4;
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(lista.setor === 'LOJA' ? 'Loja' : 'Almoxarifado', 15, y);
  y += 8;

  if (lista.motivoRecusa) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('MOTIVO DA RECUSA', 15, y);
    y += 4;
    doc.setFontSize(9);
    doc.setTextColor(0);
    const linhas = doc.splitTextToSize(lista.motivoRecusa, 180) as string[];
    doc.text(linhas, 15, y);
    y += linhas.length * 4 + 6;
  }

  // Itens recusados não entram na lista
  const itens = lista.itens.filter((item) => item.status !== 'RECUSADO');

  const corpo = itens.map((item) => {
    const unitario = valorUnitarioItem(item);
    const total = valorTotalItem(item);
    return [
      nomeItem(item),
      fmtQtd(item.quantidade),
      unidadeItem(item),
      fornecedorItem(item)?.nome ?? '—',
      unitario !== null ? `R$ ${fmt(unitario)}` : '—',
      total !== null ? `R$ ${fmt(total)}` : '—',
      formatarData(item.dataCompra),
      item.status === 'COMPRADO' ? 'Comprado' : 'Pendente',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qtd', 'Un.', 'Fornecedor', 'Valor unit.', 'Valor total', 'Data', 'Status']],
    body: corpo,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 15, right: 15 },
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Total gasto: R$ ${fmt(totalGasto(itens))}`,
    15,
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
  );

  const nomeArquivo =
    `lista-compras-${lista.tipo.toLowerCase()}-${lista.setor.toLowerCase()}-` +
    `${lista.ano}-${String(lista.mes).padStart(2, '0')}` +
    `${rodada ? `-c${rodada}` : ''}.pdf`;
  doc.save(nomeArquivo);
}
