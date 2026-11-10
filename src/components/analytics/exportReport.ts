import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportarCsv(nomeArquivo: string, colunas: string[], linhas: (string | number)[][]) {
  const cabecalho = colunas.map((c) => `"${c.replace(/"/g, '""')}"`).join(';');
  const corpo = linhas
    .map((linha) =>
      linha
        .map((celula) => `"${String(celula ?? '').replace(/"/g, '""')}"`)
        .join(';'),
    )
    .join('\n');

  const conteudoCsv = `\uFEFF${cabecalho}\n${corpo}`;
  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export interface StorytellingRelatorio {
  resumoExecutivo?: string;
  statusGeral?: string;
  cenario?: string[];
  resumo?: string;
  destaques?: string[];
  diagnostico?: string[];
  recomendacoes?: string[];
}

export function exportarPdfRelatorio(
  titulo: string,
  subtitulo: string,
  colunas: string[],
  linhas: (string | number)[][],
  kpis?: { rotulo: string; valor: string | number }[],
  storytelling?: StorytellingRelatorio,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Cabeçalho
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(titulo, 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${subtitulo} • Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 25);

  let currentY = 32;

  // Box de KPIs se houver
  if (kpis && kpis.length > 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, 182, 18, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    const stepX = 182 / kpis.length;
    kpis.forEach((kpi, idx) => {
      const posX = 16 + idx * stepX;
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.rotulo, posX, currentY + 6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(kpi.valor), posX, currentY + 13);
      doc.setTextColor(71, 85, 105);
    });

    currentY += 24;
  }

  // Box de Diagnóstico Executivo & Storytelling no PDF
  if (storytelling) {
    const boxStartY = currentY;
    let textCursorY = boxStartY + 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DIAGNÓSTICO EXECUTIVO & STORYTELLING', 18, textCursorY);
    textCursorY += 5;

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    if (storytelling.resumo) {
      doc.setFont('helvetica', 'bold');
      doc.text('Síntese: ', 18, textCursorY);
      doc.setFont('helvetica', 'normal');
      const linhasResumo = doc.splitTextToSize(storytelling.resumo, 155);
      doc.text(linhasResumo, 32, textCursorY);
      textCursorY += linhasResumo.length * 3.8 + 2;
    }

    const renderItens = (tituloSecao: string, itens?: string[]) => {
      if (!itens || itens.length === 0) return;
      doc.setFont('helvetica', 'bold');
      doc.text(tituloSecao, 18, textCursorY);
      textCursorY += 3.8;
      doc.setFont('helvetica', 'normal');
      itens.forEach((it) => {
        const wrapped = doc.splitTextToSize(`• ${it}`, 170);
        doc.text(wrapped, 20, textCursorY);
        textCursorY += wrapped.length * 3.5;
      });
      textCursorY += 1.5;
    };

    renderItens('Cenário & Fatos:', storytelling.destaques);
    renderItens('Diagnóstico & Impacto:', storytelling.diagnostico);
    renderItens('Ações Recomendadas:', storytelling.recomendacoes);

    const boxHeight = textCursorY - boxStartY + 2;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, boxStartY, 182, boxHeight, 2, 2, 'S');

    currentY = textCursorY + 5;
  }

  // Tabela
  autoTable(doc, {
    startY: currentY,
    head: [colunas],
    body: linhas,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`${titulo.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

