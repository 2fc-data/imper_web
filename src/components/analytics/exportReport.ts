import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SecaoRelatorio {
  titulo: string;
  colunas: string[];
  linhas: (string | number)[][];
}

function escaparCelula(valor: string | number): string {
  return `"${String(valor ?? '').replace(/"/g, '""')}"`;
}

function montarBlocoCsv(colunas: string[], linhas: (string | number)[][]): string {
  const cabecalho = colunas.map(escaparCelula).join(';');
  const corpo = linhas.map((linha) => linha.map(escaparCelula).join(';')).join('\n');
  return `${cabecalho}\n${corpo}`;
}

function baixarCsv(nomeArquivo: string, conteudo: string) {
  const blob = new Blob([`\uFEFF${conteudo}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportarCsv(nomeArquivo: string, colunas: string[], linhas: (string | number)[][]) {
  baixarCsv(nomeArquivo, montarBlocoCsv(colunas, linhas));
}

export function exportarCsvSecoes(nomeArquivo: string, secoes: SecaoRelatorio[]) {
  const conteudo = secoes
    .map((secao, indice) => {
      const bloco = montarBlocoCsv(secao.colunas, secao.linhas);
      return `${indice > 0 ? '\n' : ''}"${secao.titulo.replace(/"/g, '""')}"\n${bloco}`;
    })
    .join('\n');
  baixarCsv(nomeArquivo, conteudo);
}

function adicionarPaginaSePreciso(doc: jsPDF, y: number, altura = 20): number {
  if (y + altura > 282) {
    doc.addPage();
    return 20;
  }
  return y;
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
  secoes?: SecaoRelatorio[],
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

  // Diagnóstico Executivo & Storytelling
  if (storytelling) {
    currentY = adicionarPaginaSePreciso(doc, currentY, 28);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DIAGNÓSTICO EXECUTIVO & STORYTELLING', 14, currentY);
    currentY += 2;

    doc.setDrawColor(203, 213, 225);
    doc.line(14, currentY + 2, 196, currentY + 2);
    currentY += 8;

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const escreverParagrafo = (rotulo: string, texto?: string) => {
      if (!texto) return;
      currentY = adicionarPaginaSePreciso(doc, currentY, 12);
      doc.setFont('helvetica', 'bold');
      doc.text(rotulo, 14, currentY);
      doc.setFont('helvetica', 'normal');

      const linhas = doc.splitTextToSize(texto, 158);
      const porPagina = 60;
      for (let indice = 0; indice < linhas.length; indice += porPagina) {
        if (indice > 0) {
          doc.addPage();
          currentY = 20;
          doc.setFont('helvetica', 'normal');
        }
        const trecho = linhas.slice(indice, indice + porPagina);
        doc.text(trecho, 30, currentY);
        currentY += trecho.length * 3.6;
      }
      currentY += 1.5;
    };

    const renderItens = (tituloSecao: string, itens?: string[]) => {
      if (!itens || itens.length === 0) return;
      currentY = adicionarPaginaSePreciso(doc, currentY, 12);
      doc.setFont('helvetica', 'bold');
      doc.text(tituloSecao, 14, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');

      itens.forEach((item) => {
        const linhas = doc.splitTextToSize(`• ${item}`, 176);
        if (currentY + linhas.length * 3.5 > 280) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(linhas, 16, currentY);
        currentY += linhas.length * 3.5;
      });
      currentY += 1.5;
    };

    escreverParagrafo('Status geral:', storytelling.statusGeral);
    escreverParagrafo('Síntese:', storytelling.resumo ?? storytelling.resumoExecutivo);
    renderItens('Cenário & Fatos:', storytelling.destaques ?? storytelling.cenario);
    renderItens('Diagnóstico & Impacto:', storytelling.diagnostico);
    renderItens('Ações Recomendadas:', storytelling.recomendacoes);

    currentY += 4;
  }

  // Tabela principal
  currentY = adicionarPaginaSePreciso(doc, currentY, 28);
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

  const docComAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  let finalY = docComAutoTable.lastAutoTable?.finalY ?? currentY;

  if (secoes && secoes.length > 0) {
    secoes.forEach((secao) => {
      finalY = adicionarPaginaSePreciso(doc, finalY + 8, 24);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(secao.titulo, 14, finalY);
      finalY += 6;

      autoTable(doc, {
        startY: finalY,
        head: [secao.colunas],
        body: secao.linhas,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [51, 65, 85],
        },
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      finalY = docComAutoTable.lastAutoTable?.finalY ?? finalY;
    });
  }

  doc.save(`${titulo.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

