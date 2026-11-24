// Excel (.xlsx) helpers. exceljs is large, so it is loaded only when the user exports or imports.

const loadExcel = async () => (await import('exceljs')).default;

const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

const safeName = (s, fallback) => (String(s || '').replace(/[\\/:*?"<>|[\]]+/g, ' ').trim() || fallback);

// A leading = + - @ makes Excel treat a text cell as a formula (CSV/formula injection). Neutralise it.
const cleanText = (v) => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

/**
 * Download rows as a styled .xlsx.
 * columns: [{ header, key?, value?: (row) => any, width?, numFmt? }]
 * rows: any[]; each cell is col.value(row) when given, otherwise row[col.key].
 */
export async function exportXlsx({ fileName, sheetName = 'Sheet1', columns, rows }) {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'IRUTICO';
  wb.created = new Date();
  const ws = wb.addWorksheet(safeName(sheetName, 'Sheet1').slice(0, 31), { views: [{ state: 'frozen', ySplit: 1 }] });

  ws.columns = columns.map((c, i) => ({ header: c.header, key: `c${i}`, width: c.width || Math.min(40, Math.max(12, String(c.header).length + 4)) }));
  for (const row of rows) {
    const out = {};
    columns.forEach((c, i) => {
      let v = c.value ? c.value(row) : row?.[c.key];
      if (v === undefined || v === null) v = '';
      out[`c${i}`] = cleanText(v);
    });
    ws.addRow(out);
  }
  columns.forEach((c, i) => { if (c.numFmt) ws.getColumn(i + 1).numFmt = c.numFmt; });

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00754A' } };
  head.alignment = { vertical: 'middle' };
  head.height = 20;
  if (columns.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  const buf = await wb.xlsx.writeBuffer();
  const name = safeName(fileName, 'export');
  saveBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), name.endsWith('.xlsx') ? name : `${name}.xlsx`);
}

/** File-name date stamp, e.g. "2026-11-24". */
export const stamp = () => new Date().toISOString().slice(0, 10);

/**
 * Read the first worksheet of an .xlsx file. Returns { headers: string[], rows: any[][] }
 * where row values are plain strings / numbers / booleans / Date.
 */
export async function readXlsx(file) {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) return { headers: [], rows: [] };

  const plain = (v) => {
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v;
    if (typeof v === 'object') {
      if ('result' in v) return plain(v.result);                       // formula → its cached value
      if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('');
      if ('text' in v) return String(v.text);                          // hyperlink
      if ('error' in v) return '';
      return '';
    }
    return v;
  };

  const all = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const vals = [];
    for (let i = 1; i <= ws.columnCount; i++) vals.push(plain(row.getCell(i).value));
    all.push(vals);
  });
  const [headerRow = [], ...rows] = all;
  const headers = headerRow.map((h, i) => String(h || '').trim() || `Column ${i + 1}`);
  return { headers, rows: rows.filter((r) => r.some((v) => v !== '' && v !== null)) };
}
