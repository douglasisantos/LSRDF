const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

function cleanText(value) {
  return String(value ?? '')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '')
    .slice(0, 120);
}

function escapePdf(value) {
  return cleanText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createCanvas() {
  const commands = [];
  const line = (x1, y1, x2, y2) => commands.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  const rect = (x, y, w, h, fill = false) => commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${fill ? 'f' : 'S'}`);
  const color = (r, g, b) => commands.push(`${r} ${g} ${b} rg ${r} ${g} ${b} RG`);
  const width = (value, size = 8) => cleanText(value).length * size * 0.46;
  const text = (value, x, y, size = 8, options = {}) => {
    const font = options.bold ? 'F2' : 'F1';
    commands.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdf(value)}) Tj ET`);
  };
  const center = (value, x, y, width, size = 8, options = {}) => {
    const approx = cleanText(value).length * size * 0.46;
    text(value, x + Math.max(0, (width - approx) / 2), y, size, options);
  };
  const right = (value, x, y, size = 8, options = {}) => {
    text(value, x - width(value, size), y, size, options);
  };
  return { commands, line, rect, color, text, center, right, width };
}

function drawCell(pdf, x, y, w, h, label, options = {}) {
  if (options.fill) {
    pdf.color(...options.fill);
    pdf.rect(x, y, w, h, true);
    pdf.color(0, 0, 0);
  } else {
    pdf.rect(x, y, w, h);
  }
  if (label) {
    if (options.textColor) pdf.color(...options.textColor);
    pdf.text(label, x + 3, y + h - 9, options.size || 6, { bold: options.bold });
    pdf.color(0, 0, 0);
  }
}

function drawHeader(pdf, sheet) {
  pdf.color(0, 0, 0);
  pdf.center(sheet.match.championship, 0, 565, PAGE_WIDTH, 14);
  pdf.center(`Local: ${sheet.match.venue}`, 0, 548, PAGE_WIDTH, 11);
  pdf.center(`Dia e Horário: ${formatDate(sheet.match.date)} - ${sheet.match.time}`, 0, 533, PAGE_WIDTH, 11);
  pdf.text(sheet.match.homeTeam.toUpperCase(), 28, 516, 12);
  pdf.center(sheet.match.awayTeam.toUpperCase(), 430, 516, 386, 12);
  pdf.rect(351, 468, 57, 45);
  pdf.rect(430, 468, 57, 45);
  pdf.center('X', 407, 480, 27, 20);
  pdf.rect(379, 441, 29, 22);
  pdf.rect(430, 441, 29, 22);
  pdf.center('x', 407, 449, 27, 11);
}

function drawTeam(pdf, side, athletes, staff) {
  const x = side === 'home' ? 28 : 430;
  const staffX = side === 'home' ? 28 : 535;
  const width = 386;
  const blue = [0, 0.29, 0.65];
  const red = [0.76, 0, 0];
  const yellow = [1, 0.82, 0];
  const green = [0, 0.48, 0.18];
  const gray = [0.87, 0.87, 0.87];
  const rowHeight = 9.65;

  drawCell(pdf, staffX, 498, 142, 11, 'Comissão técnica - Cargo', { fill: blue, textColor: [1, 1, 1] });
  drawCell(pdf, staffX + 142, 498, 91, 11, 'Assinatura', { fill: blue, textColor: [1, 1, 1] });
  drawCell(pdf, staffX + 233, 498, 20, 11, 'CA', { fill: yellow });
  drawCell(pdf, staffX + 253, 498, 20, 11, 'CV', { fill: red, textColor: [1, 1, 1] });

  for (let index = 0; index < 5; index += 1) {
    const item = staff[index];
    const y = 487 - index * 11;
    drawCell(pdf, staffX, y, 142, 11, item ? `${item.name} - ${item.role}` : '', { size: 5.8 });
    drawCell(pdf, staffX + 142, y, 91, 11, '');
    drawCell(pdf, staffX + 233, y, 20, 11, '');
    drawCell(pdf, staffX + 253, y, 20, 11, '');
  }

  const tableY = 430;
  const columns = [
    [54, 'Documento'],
    [130, 'Nome do Atleta'],
    [18, 'No'],
    [56, 'Substituições'],
    [28, 'CAm'],
    [28, 'CV'],
    [32, 'Gol (no)'],
    [40, 'Gol (min)']
  ];
  let cursor = x;
  columns.forEach(([w, label], index) => {
    const fill = index === 4 ? yellow : index === 5 ? red : blue;
    const textColor = index === 4 ? [0, 0, 0] : [1, 1, 1];
    drawCell(pdf, cursor, tableY, w, 10, label, { fill, textColor, size: 5.5 });
    cursor += w;
  });

  for (let rowIndex = 0; rowIndex < 30; rowIndex += 1) {
    const athlete = athletes[rowIndex];
    const y = tableY - (rowIndex + 1) * rowHeight;
    if (rowIndex % 2 === 1) {
      pdf.color(...gray);
      pdf.rect(x, y, width, rowHeight, true);
      pdf.color(0, 0, 0);
    }
    cursor = x;
    columns.forEach(([w], colIndex) => {
      drawCell(pdf, cursor, y, w, rowHeight, '');
      if (colIndex === 3) {
        for (let mark = 1; mark < 5; mark += 1) {
          pdf.line(cursor + mark * 11.2, y, cursor + mark * 11.2, y + rowHeight);
        }
      }
      cursor += w;
    });
    if (athlete) {
      const suspended = athlete.registrationStatus === 'Suspenso';
      pdf.color(suspended ? 1 : 0, 0, 0);
      pdf.text(suspended ? '*****SUSPENSO*****' : athlete.document, x + 3, y + 2.7, 5.5);
      pdf.text(`${athlete.name}${athlete.position === 'Goleiro' ? ' (G)' : ''}`, x + 58, y + 2.7, 5.5);
      pdf.text(athlete.jerseyNumber, x + 188, y + 2.7, 5.5);
      pdf.color(0, 0, 0);
    }
  }

  drawDetailBlocks(pdf, x, { blue, red, green });
}

function drawNumberCells(pdf, x, y, totalWidth, count, label = 'Nº') {
  const cell = totalWidth / count;
  for (let index = 0; index < count; index += 1) {
    drawCell(pdf, x + index * cell, y, cell, 10, label, { size: 5.2, textColor: [0.55, 0.55, 0.55] });
  }
}

function drawDetailBlocks(pdf, x, colors) {
  const { blue, red, green } = colors;
  const y = 126;
  drawCell(pdf, x, y, 52, 11, 'Gol Contra', { fill: red, textColor: [1, 1, 1], size: 5.4 });
  drawCell(pdf, x + 54, y, 120, 11, 'Defesa Difícil', { fill: blue, textColor: [1, 1, 1], size: 5.4 });
  drawCell(pdf, x + 176, y, 70, 11, 'Defesa de Penalti', { fill: blue, textColor: [1, 1, 1], size: 5.4 });
  drawCell(pdf, x + 248, y, 136, 11, 'Jogador Destaque', { fill: blue, textColor: [1, 1, 1], size: 5.4 });
  drawNumberCells(pdf, x, y - 10, 52, 3);
  drawNumberCells(pdf, x + 54, y - 10, 120, 6);
  drawNumberCells(pdf, x + 176, y - 10, 70, 3);
  drawCell(pdf, x + 248, y - 10, 120, 10, '');
  drawCell(pdf, x + 368, y - 10, 16, 10, 'Nº', { size: 5.2, textColor: [0.55, 0.55, 0.55] });

  const bottom = 76;
  drawCell(pdf, x, bottom + 20, 128, 11, 'Substituições', { fill: blue, textColor: [1, 1, 1], size: 5.4 });
  drawCell(pdf, x + 132, bottom + 20, 66, 11, 'Pedido de Tempo', { fill: blue, textColor: [1, 1, 1], size: 5.4 });
  drawCell(pdf, x + 202, bottom + 20, 182, 11, 'Faltas Acumulativas', { fill: blue, textColor: [1, 1, 1], size: 5.4 });
  drawCell(pdf, x, bottom + 10, 28, 10, 'Entra', { fill: green, textColor: [1, 1, 1], size: 5.4 });
  drawNumberCells(pdf, x + 28, bottom + 10, 100, 7);
  drawCell(pdf, x, bottom, 28, 10, 'Sai', { fill: red, textColor: [1, 1, 1], size: 5.4 });
  drawNumberCells(pdf, x + 28, bottom, 100, 7);
  drawCell(pdf, x + 132, bottom + 10, 22, 10, '1º T', { size: 5.4 });
  drawCell(pdf, x + 154, bottom + 10, 22, 10, '');
  drawCell(pdf, x + 176, bottom + 10, 22, 10, '');
  drawCell(pdf, x + 132, bottom, 22, 10, '2º T', { size: 5.4 });
  drawCell(pdf, x + 154, bottom, 22, 10, '');
  drawCell(pdf, x + 176, bottom, 22, 10, '');
  drawCell(pdf, x + 202, bottom + 10, 24, 10, '1º T', { size: 5.4 });
  drawNumberCells(pdf, x + 226, bottom + 10, 158, 10);
  drawCell(pdf, x + 202, bottom, 24, 10, '2º T', { size: 5.4 });
  drawNumberCells(pdf, x + 226, bottom, 158, 10);
}

function drawFooter(pdf, sheet) {
  const green = [0.2, 0.48, 0.28];
  drawCell(pdf, 28, 62, 138, 10, 'Arbitragem', { fill: green, textColor: [1, 1, 1], size: 5.3 });
  drawCell(pdf, 166, 62, 58, 10, 'Documento', { fill: green, textColor: [1, 1, 1], size: 5.3 });
  drawCell(pdf, 224, 62, 115, 10, 'Assinatura', { fill: green, textColor: [1, 1, 1], size: 5.3 });
  sheet.referees.slice(0, 4).forEach((referee, index) => {
    const y = 52 - index * 10;
    drawCell(pdf, 28, y, 138, 10, referee.name, { size: 5.2 });
    drawCell(pdf, 166, y, 58, 10, referee.phone, { size: 5.2 });
    drawCell(pdf, 224, y, 115, 10, '');
  });
  drawCell(pdf, 342, 12, 286, 60, 'Relatório do árbitro:', { size: 5.7 });
  pdf.text(sheet.sheet.report, 348, 48, 5.2);
  pdf.text('Início 1º Tempo:', 633, 58, 6);
  pdf.line(703, 56, 760, 56);
  pdf.text('Início 2º Tempo:', 633, 34, 6);
  pdf.line(703, 32, 760, 32);
  pdf.text('Período Extra:', 633, 12, 6);
  pdf.line(703, 10, 760, 10);
  pdf.text('Fim 1º Tempo:', 762, 58, 6);
  pdf.line(817, 56, 836, 56);
  pdf.text('Fim 2º Tempo:', 762, 34, 6);
  pdf.line(817, 32, 836, 32);
}

function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = String(value).split('-');
  return year && month && day ? `${day}/${month}/${year.slice(-2)}` : value;
}

function buildPdf(objects) {
  const offsets = [0];
  let body = '';
  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(body, 'latin1');
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(body, 'latin1') + 9;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset + 9).padStart(10, '0')} 00000 n \n`;
  });
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(`%PDF-1.4\n${body}${xref}${trailer}`, 'latin1');
}

export function generateMatchSheetPdf(sheet) {
  const pdf = createCanvas();
  drawHeader(pdf, sheet);
  drawTeam(pdf, 'home', sheet.homeAthletes, sheet.homeStaff);
  drawTeam(pdf, 'away', sheet.awayAthletes, sheet.awayStaff);
  drawFooter(pdf, sheet);

  const stream = pdf.commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`
  ];
  return buildPdf(objects);
}
