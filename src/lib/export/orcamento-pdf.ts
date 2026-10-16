import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImper from '../../assets/logo_imper.webp';
import { brl } from '../format';
import { dataBr } from '../../components/orcamentos/tipos';

interface LinhaPdf {
  etapa: string;
  subServico: string;
  descricao: string;
  quantidade: string;
  mo: number;
  materiais: number;
  epis: number;
  subtotal: number;
}

export interface OrcamentoPdfInput {
  codigo: string | null | undefined;
  clienteNome: string;
  clienteTelefone: string | null;
  clienteEmail: string | null;
  endereco: string;
  urgencia: string;
  validade: string; // ISO yyyy-mm-dd
  observacoes: string;
  linhas: LinhaPdf[];
  totais: { valorMO: number; valorMateriais: number; valorEpis: number; total: number };
  riscos: { risco: string; acao: string }[];
  cuidados: string[];
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

export async function gerarPdfOrcamento(input: OrcamentoPdfInput): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logo = await carregarLogoDataUrl();
  const codigoLabel = input.codigo ? `Nº ${input.codigo}` : 'Nº — (novo)';
  const emitidoBr = dataBr(new Date().toISOString().slice(0, 10));
  const validadeBr = dataBr(input.validade);

  let y = 15;

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 15, y, 28, 10, undefined, 'FAST');
    } catch {
      // webp pode falhar no jsPDF; segue sem logo
    }
  }
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('PROPOSTA DE ORÇAMENTO', 48, y + 4);
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(codigoLabel, 48, y + 10);
  y += 16;
  doc.setDrawColor(200);
  doc.line(15, y, 195, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Emitido em ${emitidoBr}`, 195, y, { align: 'right' });
  y += 5;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(`Válida até ${validadeBr}`, 195, y, { align: 'right' });
  y += 10;

  // Cliente / Endereço / Urgência
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('CLIENTE', 15, y);
  doc.text('ENDEREÇO', 105, y);
  y += 4;
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(input.clienteNome || '—', 15, y);
  const endLines = doc.splitTextToSize(input.endereco || '—', 85);
  doc.text(endLines, 105, y);
  y += 5;
  if (input.clienteTelefone) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(input.clienteTelefone, 15, y);
    y += 4;
  }
  if (input.clienteEmail) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(input.clienteEmail, 15, y);
    y += 4;
  }
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`Urgência: ${input.urgencia}`, 15, y);
  y += 10;

  // Observações
  if (input.observacoes.trim()) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('OBSERVAÇÕES', 15, y);
    y += 4;
    doc.setFontSize(9);
    doc.setTextColor(0);
    const obsLines = doc.splitTextToSize(input.observacoes, 180);
    doc.text(obsLines, 15, y);
    y += obsLines.length * 4 + 6;
  }

  // Tabela de atividades
  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [[
      'Etapa › Sub-serviço',
      'Descrição',
      'Qtd.',
      'MO',
      'Materiais',
      'EPIs',
      'Subtotal',
    ]],
    body: input.linhas.map((l) => [
      l.etapa,
      l.descricao,
      l.quantidade,
      brl(l.mo),
      brl(l.materiais),
      brl(l.epis),
      brl(l.subtotal),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Totais
  const totaisX = 140;
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text('Mão de obra', totaisX, y);
  doc.setTextColor(0);
  doc.text(brl(input.totais.valorMO), 195, y, { align: 'right' });
  y += 5;
  doc.setTextColor(80);
  doc.text('Materiais', totaisX, y);
  doc.setTextColor(0);
  doc.text(brl(input.totais.valorMateriais), 195, y, { align: 'right' });
  y += 5;
  doc.setTextColor(80);
  doc.text('EPIs', totaisX, y);
  doc.setTextColor(0);
  doc.text(brl(input.totais.valorEpis), 195, y, { align: 'right' });
  y += 6;
  doc.setDrawColor(150);
  doc.line(totaisX, y, 195, y);
  y += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total', totaisX, y);
  doc.text(brl(input.totais.total), 195, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 10;

  // Riscos
  const riscosCompletos = input.riscos.filter((r) => r.risco && r.acao);
  if (riscosCompletos.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Análise crítica de riscos', 15, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    doc.setFontSize(9);
    for (const r of riscosCompletos) {
      doc.setTextColor(0);
      doc.text(`• ${r.risco} → ${r.acao}`, 18, y);
      y += 4.5;
    }
    y += 4;
  }

  // Cuidados
  const cuidadosFiltrados = input.cuidados.filter((c) => c.trim());
  if (cuidadosFiltrados.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Cuidados', 15, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(0);
    for (const c of cuidadosFiltrados) {
      doc.text(`• ${c}`, 18, y);
      y += 4.5;
    }
  }

  const nomeArquivo = input.codigo
    ? `imper-${input.codigo}.pdf`
    : 'imper-orcamento.pdf';
  doc.save(nomeArquivo);
}
