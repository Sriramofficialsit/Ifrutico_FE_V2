import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Sheet, Plus, Upload, FileSpreadsheet, Trash2, ArrowLeft, Search, X, Rows3, Columns3, Pencil,
  ArrowUpAZ, ArrowDownAZ, ChevronLeft, ChevronRight, Type, Hash, Calendar, CheckSquare, ListChecks, RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { exportXlsx, readXlsx, stamp } from '../utils/xlsx';

// ---------------------------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------------------------

const MAX_ROWS = 5000;
const PAGE_SIZE = 200;
const TYPES = {
  text: { label: 'Text', icon: Type },
  number: { label: 'Number', icon: Hash },
  date: { label: 'Date', icon: Calendar },
  checkbox: { label: 'Checkbox', icon: CheckSquare },
  select: { label: 'Dropdown', icon: ListChecks },
};
const btn = 'inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none';
const btnPrimary = 'inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:pointer-events-none';
const inputCls = 'w-full h-11 px-3.5 border border-gray-200 rounded-xl bg-white text-sm outline-none transition-all focus:border-emerald-600';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

const newKey = () => 'c' + Math.random().toString(36).slice(2, 10).padEnd(8, '0');
const fmtWhen = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const fmtNum = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN', { maximumFractionDigits: 6 }) : '');
const fmtDate = (s) => (s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');

// Display text of a cell (also used for search and copy)
const cellText = (col, v) => {
  if (v === null || v === undefined || v === '') return '';
  if (col.type === 'number') return fmtNum(v);
  if (col.type === 'date') return fmtDate(v);
  if (col.type === 'checkbox') return v ? 'Yes' : 'No';
  return String(v);
};
// Raw value written to the clipboard / edit box
const rawText = (col, v) => {
  if (v === null || v === undefined) return '';
  if (col.type === 'checkbox') return v ? 'TRUE' : 'FALSE';
  return String(v);
};

// Excel serial or Date → yyyy-mm-dd (exceljs gives dates as UTC midnight)
const toIsoDate = (v) => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10);
  return v;
};
// Pick a column type from sample values of an imported column
function inferType(values) {
  const vals = values.filter((v) => v !== '' && v !== null && v !== undefined);
  if (!vals.length) return 'text';
  if (vals.every((v) => typeof v === 'boolean')) return 'checkbox';
  if (vals.every((v) => v instanceof Date)) return 'date';
  if (vals.every((v) => typeof v === 'number')) return 'number';
  return 'text';
}

// Upload rows in chunks that stay under the API's 100kb body limit
async function uploadRows(sheetId, rows, onProgress) {
  const created = [];
  let batch = [];
  let size = 0;
  const flush = async () => {
    if (!batch.length) return;
    const res = await apiFetch(`/records/${sheetId}/rows`, { method: 'POST', body: { rows: batch } });
    created.push(...res.data);
    onProgress?.(created.length);
    batch = []; size = 0;
  };
  for (const r of rows) {
    const s = JSON.stringify(r).length + 1;
    if (batch.length && (size + s > 80_000 || batch.length >= 500)) await flush();
    batch.push(r); size += s;
  }
  await flush();
  return created;
}

function Modal({ title, onClose, children, width = 'max-w-md' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${width} bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// In-app confirmation dialog. const [ask, confirmEl] = useConfirm(); if (await ask({...})) ...
function useConfirm() {
  const [req, setReq] = useState(null);
  const ask = useCallback((opts) => new Promise((resolve) => setReq({ ...opts, resolve })), []);
  const close = (ok) => { req?.resolve(ok); setReq(null); };
  const el = req && (
    <Modal title={req.title} onClose={() => close(false)}>
      <div className="space-y-5">
        <div className="flex gap-3">
          {req.danger !== false && <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0"><Trash2 size={18} /></div>}
          <p className="text-sm text-gray-600 whitespace-pre-line pt-2">{req.message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={btn} onClick={() => close(false)}>Cancel</button>
          <button type="button" autoFocus onClick={() => close(true)} className={req.danger === false ? btnPrimary : 'inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors'}>{req.confirmLabel || 'Delete'}</button>
        </div>
      </div>
    </Modal>
  );
  return [ask, el];
}

// ---------------------------------------------------------------------------------------------
// Route entry: list of sheets, or one sheet
// ---------------------------------------------------------------------------------------------

export default function Records() {
  const { id } = useParams();
  return id ? <SheetEditor key={id} id={id} /> : <SheetList />;
}

// ---------------------------------------------------------------------------------------------
// Sheet list
// ---------------------------------------------------------------------------------------------

const TEMPLATES = [
  { name: 'Blank sheet', description: '', columns: [['Name', 'text'], ['Notes', 'text']] },
  { name: 'Daily Expenses', description: 'Shop running costs', columns: [['Date', 'date'], ['Item', 'text'], ['Category', 'select', ['Raw material', 'Packaging', 'Rent', 'Salary', 'Electricity', 'Transport', 'Other']], ['Amount', 'number'], ['Paid by', 'text'], ['Paid', 'checkbox']] },
  { name: 'Suppliers', description: 'Vendor contacts', columns: [['Supplier', 'text'], ['Contact person', 'text'], ['Phone', 'text'], ['Supplies', 'text'], ['City', 'text'], ['Active', 'checkbox']] },
  { name: 'Staff Attendance', description: '', columns: [['Date', 'date'], ['Staff', 'text'], ['Status', 'select', ['Present', 'Absent', 'Half day', 'Leave']], ['In time', 'text'], ['Out time', 'text']] },
  { name: 'Equipment Maintenance', description: 'Freezers, machines, vehicles', columns: [['Equipment', 'text'], ['Location', 'text'], ['Last serviced', 'date'], ['Next due', 'date'], ['Cost', 'number'], ['Done', 'checkbox']] },
];
const buildColumns = (spec) => spec.map(([name, type, options]) => ({ key: newKey(), name, type, width: type === 'checkbox' ? 110 : type === 'date' ? 150 : 180, ...(options ? { options } : {}) }));

function SheetList() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState('');
  const fileRef = useRef(null);
  const [ask, confirmEl] = useConfirm();

  const deleteSheet = async (s) => {
    if (!(await ask({ title: 'Delete sheet', message: `Delete “${s.name}” and all ${s.rowCount} row${s.rowCount === 1 ? '' : 's'} in it?\nThis can’t be undone.`, confirmLabel: 'Delete sheet' }))) return;
    try {
      await apiFetch(`/records/${s._id}`, { method: 'DELETE' });
      setSheets((list) => list.filter((x) => x._id !== s._id));
      toast.success('Sheet deleted');
    } catch (e) { toast.error(e.message); }
  };

  const load = useCallback(() =>
    apiFetch('/records')
      .then((d) => setSheets(d.data || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);

  const importFile = async (file) => {
    if (!file) return;
    setImporting('Reading file…');
    let sheetId;
    try {
      const { headers, rows } = await readXlsx(file);
      if (!headers.length) throw new Error('The file has no data on its first sheet.');
      if (headers.length > 50) throw new Error('A sheet can have up to 50 columns.');
      const columns = headers.map((h, i) => {
        const type = inferType(rows.slice(0, 500).map((r) => r[i]));
        return { key: newKey(), name: h.slice(0, 60), type, width: type === 'checkbox' ? 110 : 170 };
      });
      const keep = rows.slice(0, MAX_ROWS);
      const name = file.name.replace(/\.xlsx$/i, '').slice(0, 80) || 'Imported sheet';
      const res = await apiFetch('/records', { method: 'POST', body: { name, description: `Imported from ${file.name}`.slice(0, 300), columns } });
      sheetId = res.data._id;
      const payload = keep.map((r) => ({ cells: Object.fromEntries(columns.map((c, i) => [c.key, toIsoDate(r[i] ?? '')])) }));
      await uploadRows(sheetId, payload, (n) => setImporting(`Importing ${n} / ${payload.length} rows…`));
      toast.success(`Imported ${payload.length} rows${rows.length > MAX_ROWS ? ` (first ${MAX_ROWS} of ${rows.length})` : ''}`);
      navigate(`/records/${sheetId}`);
    } catch (e) {
      toast.error(e.message || 'Could not import the file');
      if (sheetId) load();
    } finally {
      setImporting('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const shown = sheets.filter((s) => `${s.name} ${s.description}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Records</h1>
          <p className="text-sm text-gray-500 mt-1">Spreadsheet-style registers for anything the shop needs to track</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className={btn} onClick={() => { setLoading(true); load(); }}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
          <button className={btn} onClick={() => fileRef.current?.click()} disabled={!!importing}><Upload size={16} /> Import .xlsx</button>
          <button className={btnPrimary} onClick={() => setCreating(true)}><Plus size={16} /> New sheet</button>
          <input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => importFile(e.target.files?.[0])} />
        </div>
      </div>

      {importing && <div className="px-4 py-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-medium flex items-center gap-2"><RefreshCw size={15} className="animate-spin" /> {importing}</div>}

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sheets" className={`${inputCls} pl-10`} />
      </div>

      {loading && !sheets.length ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <div key={i} className="h-36 rounded-2xl bg-gray-50 animate-pulse" />)}</div>
      ) : !shown.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4"><Sheet size={26} /></div>
          <p className="font-semibold text-gray-900">{sheets.length ? 'No sheets match your search' : 'No sheets yet'}</p>
          <p className="text-sm text-gray-500 mt-1">Create one from a template or import an Excel file.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((s) => (
            <div key={s._id} className="relative group">
            <button onClick={() => navigate(`/records/${s._id}`)} className="w-full h-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 pr-12 hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><FileSpreadsheet size={22} /></div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{s.name}</div>
                  {s.description && <div className="text-sm text-gray-500 truncate">{s.description}</div>}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1"><Rows3 size={13} /> {s.rowCount} rows</span>
                <span className="inline-flex items-center gap-1"><Columns3 size={13} /> {s.columnCount} columns</span>
              </div>
              <div className="text-xs text-gray-400 mt-1.5">Updated {fmtWhen(s.updatedAt)}{s.updatedBy?.name ? ` by ${s.updatedBy.name}` : ''}</div>
            </button>
            <button onClick={() => deleteSheet(s)} className="absolute top-3 right-3 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" aria-label={`Delete sheet ${s.name}`} title="Delete sheet"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {confirmEl}
      {creating && <NewSheetModal onClose={() => setCreating(false)} onCreated={(id) => navigate(`/records/${id}`)} />}
    </div>
  );
}

function NewSheetModal({ onClose, onCreated }) {
  const [tpl, setTpl] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const t = TEMPLATES[tpl];
    const finalName = name.trim() || (tpl ? t.name : '');
    if (!finalName) { toast.error('Give the sheet a name.'); return; }
    setSaving(true);
    try {
      const res = await apiFetch('/records', { method: 'POST', body: { name: finalName, description: description.trim() || t.description, columns: buildColumns(t.columns) } });
      toast.success('Sheet created');
      onCreated(res.data._id);
    } catch (err) { toast.error(err.message); setSaving(false); }
  };

  return (
    <Modal title="New sheet" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Start from</label>
          <div className="grid grid-cols-1 gap-2">
            {TEMPLATES.map((t, i) => (
              <label key={t.name} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${tpl === i ? 'border-emerald-500 bg-emerald-50/60' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="tpl" className="mt-1 accent-emerald-600" checked={tpl === i} onChange={() => setTpl(i)} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{t.name}</span>
                  <span className="block text-xs text-gray-500 truncate">{t.columns.map((c) => c[0]).join(' · ')}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Name</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder={tpl ? TEMPLATES[tpl].name : 'e.g. Freezer temperature log'} autoFocus />
        </div>
        <div>
          <label className={labelCls}>Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btn} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} disabled={saving}>{saving ? 'Creating…' : 'Create sheet'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------------------------
// Column editor (add / edit)
// ---------------------------------------------------------------------------------------------

function ColumnModal({ column, onClose, onSave, onDelete }) {
  const [name, setName] = useState(column?.name || '');
  const [type, setType] = useState(column?.type || 'text');
  const [options, setOptions] = useState((column?.options || []).join(', '));
  const [width, setWidth] = useState(column?.width || 180);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Give the column a name.'); return; }
    const opts = [...new Set(options.split(',').map((o) => o.trim()).filter(Boolean))].slice(0, 50).map((o) => o.slice(0, 60));
    if (type === 'select' && !opts.length) { toast.error('Add at least one dropdown choice.'); return; }
    onSave({ key: column?.key || newKey(), name: name.trim().slice(0, 60), type, width: Math.min(600, Math.max(60, Number(width) || 160)), ...(type === 'select' ? { options: opts } : {}) });
  };

  return (
    <Modal title={column ? 'Edit column' : 'Add column'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Column name</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(TYPES).map(([k, t]) => (
              <button type="button" key={k} onClick={() => setType(k)} className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${type === k ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
          {column && column.type !== type && <p className="text-xs text-amber-700 mt-2">Existing values will be converted. Values that don’t fit the new type are cleared.</p>}
        </div>
        {type === 'select' && (
          <div>
            <label className={labelCls}>Choices <span className="text-gray-400 font-normal">(comma separated)</span></label>
            <input className={inputCls} value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Pending, Done, Cancelled" />
          </div>
        )}
        <div>
          <label className={labelCls}>Width (px)</label>
          <input className={inputCls} type="number" min={60} max={600} value={width} onChange={(e) => setWidth(e.target.value)} />
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          {onDelete ? <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"><Trash2 size={15} /> Delete column</button> : <span />}
          <div className="flex gap-2">
            <button type="button" className={btn} onClick={onClose}>Cancel</button>
            <button className={btnPrimary}>Save</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------------------------
// Sheet editor (the grid)
// ---------------------------------------------------------------------------------------------

function SheetEditor({ id }) {
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);     // { name, description, columns, updatedAt, updatedBy }
  const [rows, setRows] = useState([]);         // [{ _id, order, cells }]
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(null);       // { key, dir: 1 | -1 }
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [active, setActive] = useState(null);   // { r, c } index into visible rows / columns
  const [editing, setEditing] = useState(null); // { draft }
  const [colModal, setColModal] = useState(null); // { column? }
  const [renaming, setRenaming] = useState(false);
  const [busy, setBusy] = useState('');
  const [saving, setSaving] = useState(0);
  const gridRef = useRef(null);
  const fileRef = useRef(null);
  const [ask, confirmEl] = useConfirm();

  const load = useCallback(() =>
    apiFetch(`/records/${id}`)
      .then(({ data }) => { const { rows: r, ...s } = data; setSheet(s); setRows(r); })
      .catch((e) => {
        toast.error(e.message);
        if (/not found|invalid/i.test(e.message)) navigate('/records', { replace: true });
      })
      .finally(() => setLoading(false)), [id, navigate]);
  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => sheet?.columns || [], [sheet]);

  // Filter + sort (client side; a sheet holds at most 5000 rows)
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = term ? rows.filter((r) => columns.some((c) => cellText(c, r.cells?.[c.key]).toLowerCase().includes(term))) : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        list = [...list].sort((a, b) => {
          const x = a.cells?.[col.key]; const y = b.cells?.[col.key];
          const ex = x === null || x === undefined || x === ''; const ey = y === null || y === undefined || y === '';
          if (ex || ey) return ex === ey ? 0 : ex ? 1 : -1; // blanks always last
          if (col.type === 'number' || col.type === 'checkbox') return (Number(x) - Number(y)) * sort.dir;
          return String(x).localeCompare(String(y), 'en', { numeric: true, sensitivity: 'base' }) * sort.dir;
        });
      }
    }
    return list;
  }, [rows, columns, q, sort]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const curPage = Math.min(page, pages - 1);
  const pageRows = visible.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE);

  const totals = useMemo(() => Object.fromEntries(columns.filter((c) => c.type === 'number').map((c) => [c.key, visible.reduce((s, r) => s + (typeof r.cells?.[c.key] === 'number' ? r.cells[c.key] : 0), 0)])), [columns, visible]);

  // ---- saving ----
  const track = async (fn) => { setSaving((n) => n + 1); try { return await fn(); } finally { setSaving((n) => n - 1); } };

  const patchRow = useCallback(async (rowId, cells) => {
    const prev = rows.find((r) => r._id === rowId)?.cells;
    setRows((rs) => rs.map((r) => (r._id === rowId ? { ...r, cells: { ...r.cells, ...cells } } : r)));
    try {
      const { data } = await track(() => apiFetch(`/records/${id}/rows/${rowId}`, { method: 'PATCH', body: { cells } }));
      setRows((rs) => rs.map((r) => (r._id === rowId ? { ...r, cells: { ...r.cells, ...Object.fromEntries(Object.keys(cells).map((k) => [k, data.cells[k]])) } } : r)));
    } catch (e) {
      toast.error(e.message);
      setRows((rs) => rs.map((r) => (r._id === rowId ? { ...r, cells: prev || {} } : r)));
    }
  }, [id, rows]);

  const commitValue = (r, c, raw) => {
    const row = pageRows[r]; const col = columns[c];
    if (!row || !col) return;
    let v = raw;
    if (col.type === 'number') {
      const s = String(raw).replace(/,/g, '').trim();
      if (s === '') v = null; else { const n = Number(s); if (!Number.isFinite(n)) { toast.error(`“${raw}” is not a number`); return; } v = n; }
    } else if (col.type === 'checkbox') v = raw === true || /^(true|yes|y|1|x)$/i.test(String(raw).trim());
    else if (col.type === 'date') v = String(raw).trim() || null;
    else v = String(raw);
    const old = row.cells?.[col.key];
    if ((old ?? null) === (v ?? null) || (old === undefined && v === '')) return;
    patchRow(row._id, { [col.key]: v });
  };

  const addRows = async (n = 1) => {
    if (rows.length + n > MAX_ROWS) { toast.error(`A sheet can hold up to ${MAX_ROWS} rows.`); return; }
    try {
      const created = await track(() => uploadRows(id, Array.from({ length: n }, () => ({ cells: {} }))));
      setRows((rs) => [...rs, ...created]);
      setQ(''); setSort(null);
      const last = rows.length + created.length - 1;
      setPage(Math.floor(last / PAGE_SIZE));
      setActive({ r: last % PAGE_SIZE, c: 0 });
      setTimeout(() => gridRef.current?.focus(), 0);
    } catch (e) { toast.error(e.message); }
  };

  const deleteRows = async (ids, label) => {
    if (!ids.length) return;
    if (!(await ask({ title: ids.length === 1 ? 'Delete row' : 'Delete rows', message: `Delete ${label}?\nThis can’t be undone.`, confirmLabel: ids.length === 1 ? 'Delete row' : `Delete ${ids.length} rows` }))) return;
    try {
      const res = await track(() => apiFetch(`/records/${id}/rows/delete`, { method: 'POST', body: { ids } }));
      const gone = new Set(ids);
      setRows((rs) => rs.filter((r) => !gone.has(r._id)));
      setSelected((sel) => new Set([...sel].filter((x) => !gone.has(x))));
      setActive(null);
      toast.success(res.message);
    } catch (e) { toast.error(e.message); }
  };
  const deleteSelected = () => deleteRows([...selected], `${selected.size} selected row${selected.size === 1 ? '' : 's'}`);
  const deleteRow = (row, n) => deleteRows([row._id], `row ${n}`);
  const clearCells = async () => {
    const ids = [...selected];
    if (!ids.length || !(await ask({ title: 'Clear values', message: `Empty every cell in ${ids.length} selected row${ids.length === 1 ? '' : 's'}? The rows themselves stay.`, confirmLabel: 'Clear values' }))) return;
    const blank = Object.fromEntries(columns.map((c) => [c.key, c.type === 'checkbox' ? false : null]));
    for (let i = 0; i < ids.length; i += 6) await Promise.all(ids.slice(i, i + 6).map((rid) => patchRow(rid, blank)));
    toast.success('Values cleared');
  };

  const saveSheet = async (patch, msg) => {
    try {
      const { data } = await track(() => apiFetch(`/records/${id}`, { method: 'PUT', body: patch }));
      if (patch.columns) await load(); // values may have been converted server side
      else setSheet((s) => ({ ...s, ...data }));
      if (msg) toast.success(msg);
      return true;
    } catch (e) { toast.error(e.message); return false; }
  };
  const stripCols = (cols) => cols.map(({ key, name, type, options, width }) => ({ key, name, type, width, ...(type === 'select' ? { options } : {}) }));

  const saveColumn = async (col) => {
    const exists = columns.some((c) => c.key === col.key);
    if (!exists && columns.length >= 50) { toast.error('A sheet can have up to 50 columns.'); return; }
    const next = exists ? columns.map((c) => (c.key === col.key ? col : c)) : [...columns, col];
    if (await saveSheet({ columns: stripCols(next) }, exists ? 'Column updated' : 'Column added')) setColModal(null);
  };
  const deleteColumn = async (key) => {
    const col = columns.find((c) => c.key === key);
    if (!(await ask({ title: 'Delete column', message: `Delete the column “${col?.name}” and all its values?\nThis can’t be undone.`, confirmLabel: 'Delete column' }))) return;
    if (await saveSheet({ columns: stripCols(columns.filter((c) => c.key !== key)) }, 'Column deleted')) { setColModal(null); setActive(null); }
  };
  const moveColumn = (key, delta) => {
    const i = columns.findIndex((c) => c.key === key); const j = i + delta;
    if (i < 0 || j < 0 || j >= columns.length) return;
    const next = [...columns]; [next[i], next[j]] = [next[j], next[i]];
    setSheet((s) => ({ ...s, columns: next }));
    saveSheet({ columns: stripCols(next) });
  };

  const deleteSheet = async () => {
    if (!(await ask({ title: 'Delete sheet', message: `Delete “${sheet.name}” and all ${rows.length} row${rows.length === 1 ? '' : 's'} in it?\nThis can’t be undone.`, confirmLabel: 'Delete sheet' }))) return;
    try { await apiFetch(`/records/${id}`, { method: 'DELETE' }); toast.success('Sheet deleted'); navigate('/records'); } catch (e) { toast.error(e.message); }
  };

  // ---- xlsx ----
  const doExport = async () => {
    setBusy('export');
    try {
      await exportXlsx({
        fileName: `${sheet.name}_${stamp()}`,
        sheetName: sheet.name,
        columns: columns.map((c) => ({
          header: c.name,
          width: Math.round(c.width / 7),
          numFmt: c.type === 'date' ? 'dd-mmm-yyyy' : undefined,
          value: (r) => {
            const v = r.cells?.[c.key];
            if (v === null || v === undefined || v === '') return c.type === 'checkbox' ? false : '';
            if (c.type === 'date') return new Date(`${v}T00:00:00Z`);
            return v;
          },
        })),
        rows: visible,
      });
    } catch (e) { toast.error(e.message || 'Export failed'); } finally { setBusy(''); }
  };

  const doImport = async (file) => {
    if (!file) return;
    setBusy('Reading file…');
    try {
      const { headers, rows: data } = await readXlsx(file);
      if (!headers.length || !data.length) throw new Error('No rows found on the first sheet of that file.');
      // Match file columns to sheet columns by name; add the rest as new columns.
      let cols = columns;
      const keyFor = headers.map((h, i) => {
        const found = cols.find((c) => c.name.trim().toLowerCase() === h.trim().toLowerCase());
        if (found) return found.key;
        const type = inferType(data.slice(0, 500).map((r) => r[i]));
        const col = { key: newKey(), name: h.slice(0, 60), type, width: type === 'checkbox' ? 110 : 170 };
        cols = [...cols, col];
        return col.key;
      });
      const added = cols.length - columns.length;
      if (cols.length > 50) throw new Error('That would give the sheet more than 50 columns.');
      const room = MAX_ROWS - rows.length;
      if (room <= 0) throw new Error(`This sheet is full (${MAX_ROWS} rows).`);
      const keep = data.slice(0, room);
      if (!(await ask({ title: 'Import rows', danger: false, confirmLabel: 'Import', message: `Add ${keep.length} rows from “${file.name}”${added ? ` and ${added} new column${added === 1 ? '' : 's'}` : ''}?${data.length > room ? `\nOnly ${room} rows fit (limit ${MAX_ROWS}).` : ''}` }))) return;
      if (added) {
        const { data: s } = await apiFetch(`/records/${id}`, { method: 'PUT', body: { columns: stripCols(cols) } });
        setSheet((x) => ({ ...x, columns: s.columns }));
      }
      const payload = keep.map((r) => ({ cells: Object.fromEntries(keyFor.map((k, i) => [k, toIsoDate(r[i] ?? '')])) }));
      const created = await uploadRows(id, payload, (n) => setBusy(`Importing ${n} / ${payload.length} rows…`));
      setRows((rs) => [...rs, ...created]);
      toast.success(`Imported ${created.length} rows`);
    } catch (e) {
      toast.error(e.message || 'Import failed');
      load();
    } finally {
      setBusy('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ---- keyboard / clipboard ----
  const startEdit = (r, c, initial) => {
    const col = columns[c]; const row = pageRows[r];
    if (!col || !row) return;
    if (col.type === 'checkbox') { commitValue(r, c, !row.cells?.[col.key]); return; }
    setActive({ r, c });
    setEditing({ draft: initial !== undefined ? initial : rawText(col, row.cells?.[col.key]) });
  };
  const move = (dr, dc) => setActive((a) => {
    if (!a) return { r: 0, c: 0 };
    return { r: Math.min(pageRows.length - 1, Math.max(0, a.r + dr)), c: Math.min(columns.length - 1, Math.max(0, a.c + dc)) };
  });
  const finishEdit = (commit, dr = 0, dc = 0) => {
    if (commit && active && editing) commitValue(active.r, active.c, editing.draft);
    setEditing(null);
    if (dr || dc) move(dr, dc);
    setTimeout(() => gridRef.current?.focus({ preventScroll: true }), 0);
  };

  const onGridKey = (e) => {
    if (editing || !active || !pageRows.length || !columns.length) return;
    const k = e.key;
    if (k === 'ArrowDown') { e.preventDefault(); move(1, 0); }
    else if (k === 'ArrowUp') { e.preventDefault(); move(-1, 0); }
    else if (k === 'ArrowRight' || (k === 'Tab' && !e.shiftKey)) { e.preventDefault(); move(0, 1); }
    else if (k === 'ArrowLeft' || (k === 'Tab' && e.shiftKey)) { e.preventDefault(); move(0, -1); }
    else if (k === 'Enter' || k === 'F2') { e.preventDefault(); startEdit(active.r, active.c); }
    else if (k === ' ' && columns[active.c]?.type === 'checkbox') { e.preventDefault(); startEdit(active.r, active.c); }
    else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); commitValue(active.r, active.c, columns[active.c].type === 'checkbox' ? false : ''); }
    else if (k === 'Escape') setActive(null);
    else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !['checkbox', 'select', 'date'].includes(columns[active.c]?.type)) { e.preventDefault(); startEdit(active.r, active.c, k); }
  };

  const onCopy = (e) => {
    if (editing || !active) return;
    const col = columns[active.c]; const row = pageRows[active.r];
    if (!col || !row) return;
    e.clipboardData.setData('text/plain', rawText(col, row.cells?.[col.key]));
    e.preventDefault();
  };
  // Paste a block copied from Excel / Google Sheets (tab separated) starting at the active cell
  const onPaste = async (e) => {
    if (editing || !active) return;
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    const grid = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((l) => l.split('\t'));
    const updates = [];
    grid.forEach((line, i) => {
      const row = pageRows[active.r + i];
      if (!row) return;
      const cells = {};
      line.forEach((val, j) => {
        const col = columns[active.c + j];
        if (!col) return;
        let v = val.trim();
        if (col.type === 'number') { const n = Number(v.replace(/,/g, '')); v = v === '' || !Number.isFinite(n) ? null : n; }
        else if (col.type === 'checkbox') v = /^(true|yes|y|1|x|✓)$/i.test(v);
        else if (col.type === 'date') { const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : (v ? new Date(v) : null); v = d instanceof Date ? (Number.isNaN(d.getTime()) ? null : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)) : d; }
        cells[col.key] = v;
      });
      if (Object.keys(cells).length) updates.push([row._id, cells]);
    });
    const skipped = grid.length - updates.length;
    for (let i = 0; i < updates.length; i += 6) await Promise.all(updates.slice(i, i + 6).map(([rid, cells]) => patchRow(rid, cells)));
    if (skipped > 0) toast(`${skipped} pasted row${skipped === 1 ? '' : 's'} didn’t fit — add more rows first.`);
  };

  // keep the active cell in view
  useEffect(() => {
    if (!active) return;
    gridRef.current?.querySelector(`[data-cell="${active.r}-${active.c}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  if (loading && !sheet) return <div className="space-y-4"><div className="h-10 w-64 rounded-xl bg-gray-50 animate-pulse" /><div className="h-96 rounded-2xl bg-gray-50 animate-pulse" /></div>;
  if (!sheet) return null;

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r._id));
  const toggleAll = () => setSelected((s) => { const n = new Set(s); pageRows.forEach((r) => (allOnPageSelected ? n.delete(r._id) : n.add(r._id))); return n; });
  const toggleRow = (rid) => setSelected((s) => { const n = new Set(s); n.has(rid) ? n.delete(rid) : n.add(rid); return n; });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/records')} className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex-shrink-0" aria-label="All sheets"><ArrowLeft size={18} /></button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{sheet.name}</h1>
              <button onClick={() => setRenaming(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50" aria-label="Rename sheet"><Pencil size={15} /></button>
            </div>
            <p className="text-xs text-gray-500 truncate">
              {rows.length} rows · {columns.length} columns · {saving ? <span className="text-emerald-600 font-medium">Saving…</span> : <>Saved {fmtWhen(sheet.updatedAt)}{sheet.updatedBy?.name ? ` by ${sheet.updatedBy.name}` : ''}</>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className={btn} onClick={() => fileRef.current?.click()} disabled={!!busy}><Upload size={16} /> Import</button>
          <button className={btn} onClick={doExport} disabled={!!busy || !columns.length}><FileSpreadsheet size={16} /> {busy === 'export' ? 'Exporting…' : 'Export .xlsx'}</button>
          <button className={`${btn} text-red-600`} onClick={deleteSheet}><Trash2 size={16} /> Delete sheet</button>
          <input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => doImport(e.target.files?.[0])} />
        </div>
      </div>

      {busy && busy !== 'export' && <div className="px-4 py-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-medium flex items-center gap-2"><RefreshCw size={15} className="animate-spin" /> {busy}</div>}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); setActive(null); }} placeholder="Search in sheet" className={`${inputCls} h-10 pl-10`} />
        </div>
        <button className={btnPrimary} onClick={() => addRows(1)} disabled={!columns.length}><Plus size={16} /> Row</button>
        <button className={btn} onClick={() => addRows(10)} disabled={!columns.length}>+10 rows</button>
        <button className={btn} onClick={() => setColModal({})}><Columns3 size={16} /> Column</button>
        {selected.size > 0 && (
          <>
            <span className="text-sm text-gray-500 px-1">{selected.size} selected</span>
            <button className={`${btn} text-red-600`} onClick={deleteSelected}><Trash2 size={16} /> Delete rows</button>
            <button className={btn} onClick={clearCells}><X size={16} /> Clear values</button>
            <button className={btn} onClick={() => setSelected(new Set())}>Deselect</button>
          </>
        )}
        {sort && <button className={btn} onClick={() => setSort(null)}><X size={14} /> Clear sort</button>}
      </div>

      {/* Grid */}
      {!columns.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-500">This sheet has no columns yet. <button className="text-emerald-700 font-semibold" onClick={() => setColModal({})}>Add a column</button></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div
            ref={gridRef}
            tabIndex={0}
            onKeyDown={onGridKey}
            onCopy={onCopy}
            onPaste={onPaste}
            className="overflow-auto max-h-[calc(100vh-300px)] min-h-[260px] outline-none"
            aria-label={`${sheet.name} grid. Arrow keys move, Enter edits, paste from Excel supported.`}
          >
            <table className="border-separate border-spacing-0 text-sm" style={{ minWidth: '100%' }}>
              <thead className="sticky top-0 z-20">
                <tr>
                  <th className="sticky left-0 z-30 w-20 min-w-20 bg-gray-50 border-b border-r border-gray-200 px-2 py-2">
                    <input type="checkbox" className="accent-emerald-600" checked={allOnPageSelected} onChange={toggleAll} aria-label="Select all rows on this page" />
                  </th>
                  {columns.map((c, ci) => {
                    const Icon = TYPES[c.type]?.icon || Type;
                    const sorted = sort?.key === c.key ? sort.dir : 0;
                    return (
                      <th key={c.key} style={{ width: c.width, minWidth: c.width, maxWidth: c.width }} className="group bg-gray-50 border-b border-r border-gray-200 px-2 py-0 text-left font-semibold text-gray-700">
                        <div className="flex items-center gap-1 h-10">
                          <Icon size={13} className="text-gray-400 flex-shrink-0" />
                          <button className="truncate flex-1 text-left hover:text-emerald-700" onClick={() => setColModal({ column: c })} title={`Edit “${c.name}”`}>{c.name}</button>
                          <button onClick={() => setSort(sorted === 1 ? { key: c.key, dir: -1 } : sorted === -1 ? null : { key: c.key, dir: 1 })} className={`p-1 rounded ${sorted ? 'text-emerald-600' : 'text-gray-300 opacity-0 group-hover:opacity-100'} hover:bg-white`} aria-label={`Sort by ${c.name}`}>
                            {sorted === -1 ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />}
                          </button>
                          <span className="hidden group-hover:flex">
                            <button onClick={() => moveColumn(c.key, -1)} disabled={ci === 0} className="p-0.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move left"><ChevronLeft size={14} /></button>
                            <button onClick={() => moveColumn(c.key, 1)} disabled={ci === columns.length - 1} className="p-0.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move right"><ChevronRight size={14} /></button>
                            <button onClick={() => deleteColumn(c.key)} className="p-0.5 rounded text-gray-400 hover:text-red-600" aria-label={`Delete column ${c.name}`} title="Delete column"><Trash2 size={13} /></button>
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="bg-gray-50 border-b border-gray-200 w-12 min-w-12">
                    <button onClick={() => setColModal({})} className="w-full h-10 flex items-center justify-center text-gray-400 hover:text-emerald-700" aria-label="Add column"><Plus size={16} /></button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, ri) => {
                  const isSel = selected.has(row._id);
                  return (
                    <tr key={row._id} className={`group/row ${isSel ? 'bg-emerald-50/60' : ''}`}>
                      <td className={`sticky left-0 z-10 border-b border-r border-gray-200 px-2 text-xs text-gray-400 tabular-nums ${isSel ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                        <label className="flex items-center gap-1.5 h-9 cursor-pointer">
                          <input type="checkbox" className="accent-emerald-600" checked={isSel} onChange={() => toggleRow(row._id)} aria-label={`Select row ${curPage * PAGE_SIZE + ri + 1}`} />
                          <span className="flex-1">{curPage * PAGE_SIZE + ri + 1}</span>
                          <button type="button" onClick={(e) => { e.preventDefault(); deleteRow(row, curPage * PAGE_SIZE + ri + 1); }} className="p-0.5 rounded text-gray-400 hover:text-red-600 opacity-0 group-hover/row:opacity-100 focus:opacity-100" aria-label={`Delete row ${curPage * PAGE_SIZE + ri + 1}`} title="Delete row"><Trash2 size={13} /></button>
                        </label>
                      </td>
                      {columns.map((c, ci) => {
                        const isActive = active?.r === ri && active?.c === ci;
                        const isEditing = isActive && editing;
                        const v = row.cells?.[c.key];
                        return (
                          <td
                            key={c.key}
                            data-cell={`${ri}-${ci}`}
                            style={{ width: c.width, minWidth: c.width, maxWidth: c.width }}
                            className={`relative border-b border-r border-gray-100 p-0 h-9 ${isActive ? 'outline outline-2 -outline-offset-2 outline-emerald-500 z-[5]' : ''}`}
                            onMouseDown={() => { if (!isEditing) { if (editing) finishEdit(true); setActive({ r: ri, c: ci }); } }}
                            onDoubleClick={() => c.type !== 'checkbox' && startEdit(ri, ci)}
                          >
                            {isEditing ? (
                              <CellEditor col={c} value={editing.draft} onChange={(d) => setEditing({ draft: d })} onDone={finishEdit} />
                            ) : c.type === 'checkbox' ? (
                              <div className="h-9 flex items-center justify-center">
                                <input type="checkbox" className="w-4 h-4 accent-emerald-600 cursor-pointer" checked={!!v} onChange={() => commitValue(ri, ci, !v)} aria-label={c.name} />
                              </div>
                            ) : (
                              <div className={`h-9 px-2.5 flex items-center truncate cursor-cell ${c.type === 'number' ? 'justify-end tabular-nums' : ''} ${c.type === 'select' && v ? '' : 'text-gray-800'}`} title={cellText(c, v)}>
                                {c.type === 'select' && v ? <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium truncate">{v}</span> : cellText(c, v)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="border-b border-gray-100" />
                    </tr>
                  );
                })}
                {!pageRows.length && (
                  <tr><td colSpan={columns.length + 2} className="text-center text-sm text-gray-500 py-10">{rows.length ? 'No rows match your search.' : 'No rows yet — click “Row” to add one, or import an Excel file.'}</td></tr>
                )}
              </tbody>
              {Object.keys(totals).length > 0 && visible.length > 0 && (
                <tfoot className="sticky bottom-0 z-20">
                  <tr>
                    <td className="sticky left-0 z-30 bg-gray-50 border-t border-r border-gray-200 px-2 h-9 text-xs font-bold text-gray-600">Σ</td>
                    {columns.map((c) => (
                      <td key={c.key} className="bg-gray-50 border-t border-r border-gray-200 px-2.5 text-right tabular-nums text-sm font-semibold text-gray-900">
                        {c.key in totals ? fmtNum(Math.round(totals[c.key] * 1e6) / 1e6) : ''}
                      </td>
                    ))}
                    <td className="bg-gray-50 border-t border-gray-200" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-gray-100 text-xs text-gray-500">
            <span>{q ? `${visible.length} of ${rows.length} rows` : `${rows.length} rows`} · Click a cell, type to edit · Enter / Tab / arrows to move · Paste from Excel</span>
            {pages > 1 && (
              <span className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40" disabled={curPage === 0} onClick={() => { setPage(curPage - 1); setActive(null); }} aria-label="Previous page"><ChevronLeft size={14} /></button>
                Page {curPage + 1} / {pages}
                <button className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40" disabled={curPage >= pages - 1} onClick={() => { setPage(curPage + 1); setActive(null); }} aria-label="Next page"><ChevronRight size={14} /></button>
              </span>
            )}
          </div>
        </div>
      )}

      {colModal && (
        <ColumnModal
          column={colModal.column}
          onClose={() => setColModal(null)}
          onSave={saveColumn}
          onDelete={colModal.column ? () => deleteColumn(colModal.column.key) : undefined}
        />
      )}
      {confirmEl}
      {renaming && <RenameModal sheet={sheet} onClose={() => setRenaming(false)} onSave={async (p) => { if (await saveSheet(p, 'Sheet renamed')) setRenaming(false); }} />}
    </div>
  );
}

function CellEditor({ col, value, onChange, onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (el.setSelectionRange && col.type !== 'date' && col.type !== 'number') { const n = el.value.length; el.setSelectionRange(n, n); }
  }, [col.type]);
  const onKey = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); onDone(true, 1, 0); }
    else if (e.key === 'Tab') { e.preventDefault(); onDone(true, 0, e.shiftKey ? -1 : 1); }
    else if (e.key === 'Escape') { e.preventDefault(); onDone(false); }
  };
  const cls = 'absolute inset-0 w-full h-full px-2.5 text-sm bg-white outline-none text-gray-900';
  if (col.type === 'select') {
    return (
      <select ref={ref} className={cls} value={value} onKeyDown={onKey} onBlur={() => onDone(true)} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {(col.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        {value && !(col.options || []).includes(value) && <option value={value}>{value}</option>}
      </select>
    );
  }
  return (
    <input
      ref={ref}
      className={`${cls} ${col.type === 'number' ? 'text-right tabular-nums' : ''}`}
      type={col.type === 'date' ? 'date' : 'text'}
      inputMode={col.type === 'number' ? 'decimal' : undefined}
      value={value}
      maxLength={2000}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKey}
      onBlur={() => onDone(true)}
    />
  );
}

function RenameModal({ sheet, onClose, onSave }) {
  const [name, setName] = useState(sheet.name);
  const [description, setDescription] = useState(sheet.description || '');
  return (
    <Modal title="Rename sheet" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave({ name: name.trim(), description: description.trim() }); }} className="space-y-4">
        <div><label className={labelCls}>Name</label><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus /></div>
        <div><label className={labelCls}>Description</label><input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} /></div>
        <div className="flex justify-end gap-2"><button type="button" className={btn} onClick={onClose}>Cancel</button><button className={btnPrimary}>Save</button></div>
      </form>
    </Modal>
  );
}
