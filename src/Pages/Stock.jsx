import { useState, useEffect } from 'react';
import { UNITS, unitOf, isLowStock, formatQty } from '../utils/units';
import { Plus, Edit, AlertCircle, X, Trash2, ArrowRightLeft, Layers, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import { apiFetch, assetUrl } from '../utils/api';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const VALID_CATEGORIES = ["fruits", "vegetables", "flowers", "nuts", "spices", "herbals"];

export default function Stock() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState([]);
  // Admin: 'central' or a branch id. Staff are always pinned to their own branch by the API.
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('central');
  const [transferItem, setTransferItem] = useState(null);
  const [transfer, setTransfer] = useState({ branchId: '', quantity: '', direction: 'to_branch' });

  // Bulk transfer: selection persists across pages (keyed by SKU)
  const [selected, setSelected] = useState({});
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState({ branchId: '', direction: 'to_branch', qty: {} });
  const selectedItems = Object.values(selected);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const LIMIT = 10;
  
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    itemName: '',
    sku: '',
    category: 'fruits',
    price: '',
    unit: 'pcs',
    gstIncluded: false, // false = price is before GST (5% added at billing)
    stock: '',
  });
  const [imageFiles, setImageFiles] = useState([]);

  const fetchItems = (p = 1) => {
    setLoading(true);
    let url = `/product/fetch?page=${p}&limit=${LIMIT}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (isAdmin && branchFilter !== 'central') url += `&branch=${branchFilter}`;
    
    apiFetch(url)
      .then((data) => {
        setItems(data.data || []);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchItems(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, branchFilter]);

  useEffect(() => {
    if (!isAdmin) return;
    apiFetch('/sales/all?page=1&limit=100')
      .then((d) => setBranches((d.data || []).filter((u) => u.role === 'staff')))
      .catch(console.error);
  }, [isAdmin]);

  const openTransfer = (item) => {
    setTransferItem(item);
    setTransfer({ branchId: branches[0]?._id || '', quantity: '', direction: 'to_branch' });
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transfer.branchId || !(Number(transfer.quantity) > 0)) {
      toast.error('Choose a branch and enter a quantity greater than 0');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/product/transfer', {
        method: 'POST',
        body: { sku: transferItem.sku, branchId: transfer.branchId, quantity: Number(transfer.quantity), direction: transfer.direction },
      });
      toast.success('Stock transferred');
      setTransferItem(null);
      fetchItems(page);
    } catch (err) {
      toast.error(err.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelect = (item) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item.sku]) delete next[item.sku]; else next[item.sku] = item;
      return next;
    });
  const pageAllSelected = items.length > 0 && items.every((i) => selected[i.sku]);
  const togglePage = () =>
    setSelected((prev) => {
      const next = { ...prev };
      items.forEach((i) => { if (pageAllSelected) delete next[i.sku]; else next[i.sku] = i; });
      return next;
    });

  // What can actually move for a line, given the direction and chosen branch
  const availableFor = (item, branchId, direction) =>
    direction === 'to_branch'
      ? (item.centralStock ?? item.stock)
      : (item.branchStocks?.find((b) => b.branchId === branchId)?.stock || 0);

  const openBulk = () => {
    setBulk({ branchId: branches[0]?._id || '', direction: 'to_branch', qty: {} });
    setBulkOpen(true);
  };

  const fillMax = () =>
    setBulk((b) => ({
      ...b,
      qty: Object.fromEntries(selectedItems.map((i) => [i.sku, String(availableFor(i, b.branchId, b.direction))])),
    }));

  const bulkLines = selectedItems
    .map((i) => ({ item: i, quantity: Number(bulk.qty[i.sku]) || 0, available: availableFor(i, bulk.branchId, bulk.direction) }));
  const bulkReady = bulk.branchId && bulkLines.some((l) => l.quantity > 0) && bulkLines.every((l) => l.quantity <= l.available);

  const handleBulkTransfer = async (e) => {
    e.preventDefault();
    const lines = bulkLines.filter((l) => l.quantity > 0);
    if (!bulk.branchId || lines.length === 0) { toast.error('Choose a branch and enter at least one quantity'); return; }
    const over = lines.find((l) => l.quantity > l.available);
    if (over) { toast.error(`${over.item.itemName}: only ${formatQty(over.available, unitOf(over.item))} available`); return; }
    setSubmitting(true);
    try {
      const res = await apiFetch('/product/transfer-bulk', {
        method: 'POST',
        body: { branchId: bulk.branchId, direction: bulk.direction, items: lines.map((l) => ({ sku: l.item.sku, quantity: l.quantity })) },
      });
      toast.success(res.message || 'Stock transferred');
      setBulkOpen(false);
      setSelected({});
      fetchItems(page);
    } catch (err) {
      toast.error(err.message || 'Bulk transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const viewingBranch = isAdmin && branchFilter !== 'central';
  const branchName = branches.find((b) => b._id === branchFilter)?.name;

  const openModal = (item = null) => {
    setImageFiles([]);
    if (item) {
      setCurrentItem(item);
      setFormData({
        itemName: item.itemName || '',
        sku: item.sku || '',
        category: item.category || 'fruits',
        price: item.price !== undefined ? item.price.toString() : '',
        unit: unitOf(item),
        gstIncluded: !!item.gstIncluded,
        stock: item.stock !== undefined ? item.stock.toString() : '',
      });
    } else {
      setCurrentItem(null);
      setFormData({
        itemName: '',
        sku: '',
        category: 'fruits',
        price: '',
        unit: 'pcs',
        gstIncluded: false,
        stock: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files).slice(0, 5)); // Cap at 5
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.itemName.trim() || !formData.sku.trim() || !formData.price || formData.stock === '') {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    const payload = new FormData();
    payload.append('itemName', formData.itemName.trim());
    if (!currentItem) payload.append('sku', formData.sku.trim().toUpperCase());
    payload.append('category', formData.category);
    payload.append('price', formData.price);
    payload.append('unit', formData.unit);
    payload.append('gstIncluded', formData.gstIncluded ? 'true' : 'false');
    payload.append('stock', formData.stock);
    
    imageFiles.forEach(file => {
      payload.append('images', file);
    });

    try {
      if (currentItem) {
        await apiFetch(`/product/update/${currentItem.sku}`, { method: 'PUT', body: payload });
      } else {
        await apiFetch('/product/add', { method: 'POST', body: payload });
      }
      toast.success(currentItem ? 'Product updated successfully' : 'Product added successfully');
      setIsModalOpen(false);
      fetchItems(page);
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sku) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await apiFetch(`/product/delete/${sku}`, { method: 'DELETE' });
      toast.success('Product deleted successfully');
      fetchItems(page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-screen-2xl space-y-8 md:space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
              {isAdmin ? 'Stock Management' : 'Branch Stock'}
            </h1>
            <p className="mt-2 text-base sm:text-lg text-gray-600">
              {isAdmin
                ? (viewingBranch ? `Showing stock held at ${branchName || 'branch'}` : 'Central stock and branch-wise distribution')
                : 'Stock available at your branch'}
            </p>
          </div>

          {isAdmin && <button
            onClick={() => openModal()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} /> Add New Item
          </button>}
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm p-4 md:p-6 mb-6 animate-fade-in-up opacity-0 stagger-1">
          {isAdmin && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full sm:w-64 h-11 px-4 mb-3 rounded-xl border border-white/70 bg-white/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
            >
              <option value="central">Central stock (all branches below)</option>
              {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          )}
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-white/70 bg-white/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden animate-fade-in-up opacity-0 stagger-2">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-white/70">
                  {isAdmin && (
                    <th className="p-5 w-10">
                      <input type="checkbox" checked={pageAllSelected} onChange={togglePage} aria-label="Select all on this page" className="w-4 h-4" />
                    </th>
                  )}
                  <th className="text-left p-5 text-sm text-gray-700">Image</th>
                  <th className="text-left p-5 text-sm text-gray-700">SKU</th>
                  <th className="text-left p-5 text-sm text-gray-700">Item Name</th>
                  <th className="text-left p-5 text-sm text-gray-700">Category</th>
                  <th className="text-left p-5 text-sm text-gray-700">Price</th>
                  <th className="text-left p-5 text-sm text-gray-700">{viewingBranch ? 'Branch Stock' : isAdmin ? 'Central Stock' : 'Stock'}</th>
                  {isAdmin && !viewingBranch && <th className="text-left p-5 text-sm text-gray-700">Branches</th>}
                  {isAdmin && <th className="text-left p-5 text-sm text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="p-8 text-center">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-500">No items found</td></tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item._id} className={`border-b border-gray-100/80 hover:bg-white/80 transition-colors ${index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30'}`}>
                      {isAdmin && (
                        <td className="p-5">
                          <input type="checkbox" checked={!!selected[item.sku]} onChange={() => toggleSelect(item)} aria-label={`Select ${item.itemName}`} className="w-4 h-4" />
                        </td>
                      )}
                      <td className="p-5">
                        {item.images && item.images[0] ? (
                          <img src={assetUrl(item.images[0])} alt={item.itemName} loading="lazy" decoding="async" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td className="p-5 text-sm text-gray-600 font-mono">{item.sku}</td>
                      <td className="p-5 text-sm font-medium text-gray-900">{item.itemName}</td>
                      <td className="p-5 text-sm text-gray-600 capitalize">{item.category}</td>
                      <td className="p-5 text-sm font-semibold text-emerald-600">₹{item.price?.toLocaleString()}{unitOf(item) !== 'pcs' && <span className="text-xs font-normal text-gray-400"> /{unitOf(item)}</span>}<span className={`block mt-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.gstIncluded ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{item.gstIncluded ? 'Incl. GST' : '+5% GST'}</span></td>
                      <td className="p-5">
                        {isLowStock(item) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium"><AlertCircle size={14}/> {formatQty(item.stock, unitOf(item))} left</span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">{formatQty(item.stock, unitOf(item))} in stock</span>
                        )}
                      </td>
                      {isAdmin && !viewingBranch && (
                        <td className="p-5">
                          {item.branchStocks?.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {item.branchStocks.map((b) => (
                                <span key={b.branchId} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs">
                                  {b.branchName}: <b>{formatQty(b.stock, unitOf(item))}</b>
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-xs text-gray-400">Not transferred</span>}
                        </td>
                      )}
                      {isAdmin && (
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <button title="Transfer to branch" onClick={() => openTransfer(item)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600"><ArrowRightLeft size={18} /></button>
                            <button onClick={() => openModal(item)} className="p-2 rounded-lg hover:bg-gray-100 text-emerald-600"><Edit size={18} /></button>
                            <button onClick={() => handleDelete(item.sku)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col p-4 gap-4 bg-gray-50/30">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No items found</div>
            ) : (
              items.map((item) => (
                <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4 relative">
                  <div className="flex gap-4">
                    {isAdmin && <input type="checkbox" checked={!!selected[item.sku]} onChange={() => toggleSelect(item)} aria-label={`Select ${item.itemName}`} className="w-5 h-5 mt-1 flex-shrink-0" />}
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                      {item.images && item.images[0] ? (
                        <img src={assetUrl(item.images[0])} alt={item.itemName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon size={24} />
                        </div>
                      )}
                    </div>
                    {/* Item Info */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-gray-900 leading-tight truncate">{item.itemName}</h3>
                        <div className="font-bold text-emerald-600 flex-shrink-0 text-right">₹{item.price?.toLocaleString()}<span className={`block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.gstIncluded ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{item.gstIncluded ? 'Incl. GST' : '+5% GST'}</span></div>
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-1">{item.sku}</p>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">{item.category}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-gray-100"></div>

                  <div className="flex items-center justify-between">
                    {/* Stock Badge */}
                    <div>
                      {isLowStock(item) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold tracking-wide">
                          <AlertCircle size={12}/> {formatQty(item.stock, unitOf(item)).toUpperCase()} LEFT
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold tracking-wide">
                          {formatQty(item.stock, unitOf(item)).toUpperCase()} IN STOCK
                        </span>
                      )}
                    </div>
                    {/* Actions */}
                    {isAdmin && <div className="flex items-center gap-2">
                      <button onClick={() => openTransfer(item)} className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-emerald-600 border border-gray-100 hover:border-emerald-200 transition-all active:scale-95">
                        <ArrowRightLeft size={16} />
                      </button>
                      <button onClick={() => openModal(item)} className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-emerald-600 border border-gray-100 hover:border-emerald-200 transition-all active:scale-95">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.sku)} className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 text-red-500 border border-gray-100 hover:border-red-200 transition-all active:scale-95">
                        <Trash2 size={16}/>
                      </button>
                    </div>}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/60">
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => fetchItems(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50 text-sm">Prev</button>
                <button disabled={page >= totalPages} onClick={() => fetchItems(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50 text-sm">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdmin && selectedItems.length > 0 && !bulkOpen && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-40 flex items-center gap-3 pl-5 pr-2 py-2 rounded-full bg-emerald-800 text-white sb-keep-shadow" style={{ boxShadow: '0 0 6px rgba(0,0,0,.24), 0 8px 12px rgba(0,0,0,.14)' }}>
          <span className="text-sm font-semibold whitespace-nowrap">{selectedItems.length} selected</span>
          <button onClick={() => setSelected({})} className="px-3 py-2 text-sm text-white/70 hover:text-white">Clear</button>
          <button onClick={openBulk} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-500 text-sm font-semibold hover:bg-emerald-100">
            <Layers size={16} /> Bulk transfer
          </button>
        </div>
      )}

      {bulkOpen && createPortal(
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleBulkTransfer} className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Bulk transfer</h2>
                <p className="text-sm text-gray-500">{selectedItems.length} products · one action, all-or-nothing</p>
              </div>
              <button type="button" onClick={() => setBulkOpen(false)} aria-label="Close" className="p-2 text-gray-400 hover:bg-gray-100"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-full text-sm font-medium">
                {[['to_branch', 'Central → Branch'], ['to_central', 'Branch → Central']].map(([v, l]) => (
                  <button type="button" key={v} onClick={() => setBulk({ ...bulk, direction: v, qty: {} })}
                    className={`py-2 ${bulk.direction === v ? 'bg-white shadow text-emerald-600' : 'text-gray-600'}`}>{l}</button>
                ))}
              </div>

              <select value={bulk.branchId} onChange={(e) => setBulk({ ...bulk, branchId: e.target.value, qty: {} })}
                className="w-full h-12 px-4 border border-gray-200 outline-none">
                {branches.length === 0 && <option value="">No branches yet</option>}
                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quantities</span>
                <button type="button" onClick={fillMax} className="text-sm font-semibold text-emerald-500 hover:text-emerald-600">Fill all with max available</button>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
                {bulkLines.map(({ item, quantity, available }) => {
                  const over = quantity > available;
                  return (
                    <div key={item.sku} className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{item.itemName}</div>
                        <div className={`text-xs ${over ? 'text-red-600' : 'text-gray-500'}`}>
                          {over ? 'Exceeds available: ' : 'Available: '}{formatQty(available, unitOf(item))}
                        </div>
                      </div>
                      <input type="number" min="0" step={unitOf(item) === 'pcs' ? '1' : '0.001'} value={bulk.qty[item.sku] ?? ''}
                        onChange={(e) => setBulk({ ...bulk, qty: { ...bulk.qty, [item.sku]: e.target.value } })}
                        placeholder={unitOf(item)}
                        aria-label={`Quantity for ${item.itemName}`}
                        className={`w-28 h-10 px-3 border outline-none ${over ? 'border-red-400' : 'border-gray-200'}`} />
                      <button type="button" onClick={() => toggleSelect(item)} aria-label={`Remove ${item.itemName}`} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50"><X size={16} /></button>
                    </div>
                  );
                })}
                {bulkLines.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No products selected</div>}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100">
              <button type="submit" disabled={submitting || !bulkReady}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-50">
                {submitting ? 'Transferring...' : `Transfer ${bulkLines.filter((l) => l.quantity > 0).length} product${bulkLines.filter((l) => l.quantity > 0).length === 1 ? '' : 's'}`}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {transferItem && createPortal(
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleTransfer} className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Transfer Stock</h2>
                <p className="text-sm text-gray-500">{transferItem.itemName} · Central: {formatQty(transferItem.centralStock ?? transferItem.stock, unitOf(transferItem))}</p>
              </div>
              <button type="button" onClick={() => setTransferItem(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl text-sm font-medium">
              {[['to_branch', 'Central → Branch'], ['to_central', 'Branch → Central']].map(([v, l]) => (
                <button type="button" key={v} onClick={() => setTransfer({ ...transfer, direction: v })}
                  className={`py-2 rounded-lg ${transfer.direction === v ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}>{l}</button>
              ))}
            </div>
            <select value={transfer.branchId} onChange={(e) => setTransfer({ ...transfer, branchId: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none">
              {branches.length === 0 && <option value="">No branches yet</option>}
              {branches.map((b) => {
                const held = transferItem.branchStocks?.find((x) => x.branchId === b._id)?.stock || 0;
                return <option key={b._id} value={b._id}>{b.name} (has {formatQty(held, unitOf(transferItem))})</option>;
              })}
            </select>
            <input type="number" min="0" step={unitOf(transferItem) === 'pcs' ? '1' : '0.001'} value={transfer.quantity}
              onChange={(e) => setTransfer({ ...transfer, quantity: e.target.value })}
              placeholder={`Quantity (${unitOf(transferItem)})`}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none" />
            <button type="submit" disabled={submitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold disabled:opacity-60">
              {submitting ? 'Transferring...' : 'Transfer'}
            </button>
          </form>
        </div>,
        document.body
      )}

      {isModalOpen && createPortal(
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentItem ? 'Edit Product' : 'Add New Product'}</h2>
                <p className="text-sm text-gray-500 mt-1">Enter details to {currentItem ? 'update' : 'create'} inventory item</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Product Name</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        name="itemName" 
                        value={formData.itemName} 
                        onChange={handleInputChange} 
                        required 
                        placeholder="e.g. Red Delicious Apples"
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-400 shadow-sm group-hover:border-gray-300" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">SKU Code</label>
                      <input 
                        type="text" 
                        name="sku" 
                        value={formData.sku} 
                        onChange={handleInputChange} 
                        disabled={!!currentItem} 
                        required 
                        placeholder="AUTO-GEN"
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400 uppercase font-mono shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Category</label>
                      <div className="relative">
                        <select 
                          name="category" 
                          value={formData.category} 
                          onChange={handleInputChange} 
                          className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none bg-white capitalize appearance-none shadow-sm cursor-pointer"
                        >
                          {VALID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <Plus size={16} className="rotate-45" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Unit of Measure</label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none bg-white shadow-sm cursor-pointer"
                      >
                        {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Price (₹ per {formData.unit})</label>
                      <input 
                        type="number" 
                        name="price" 
                        value={formData.price} 
                        onChange={handleInputChange} 
                        required 
                        min="0" 
                        step="0.01" 
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">{currentItem ? 'Stock' : 'Initial Stock'} ({formData.unit})</label>
                      <input 
                        type="number" 
                        name="stock" 
                        value={formData.stock} 
                        onChange={handleInputChange} 
                        required 
                        min="0" 
                        step={formData.unit === 'pcs' ? '1' : '0.001'}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm" 
                      />
                    </div>
                  </div>

                  <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${formData.gstIncluded ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={formData.gstIncluded}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gstIncluded: e.target.checked }))}
                      className="mt-1 w-5 h-5 flex-shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">Price includes GST</span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {formData.gstIncluded
                          ? 'Customers pay exactly this price. The 5% GST is already inside it, so nothing is added at billing.'
                          : 'Leave unticked if the price is before GST. 5% GST is added on top at billing.'}
                      </span>
                      {Number(formData.price) > 0 && (
                        <span className="block text-xs font-semibold text-emerald-700 mt-1.5">
                          {formData.gstIncluded
                            ? `Customer pays ₹${Number(formData.price).toLocaleString('en-IN')} per ${formData.unit} (includes ₹${((Number(formData.price) * 5) / 105).toFixed(2)} GST)`
                            : `Customer pays ₹${(Number(formData.price) * 1.05).toFixed(2)} per ${formData.unit} (₹${Number(formData.price).toLocaleString('en-IN')} + ₹${(Number(formData.price) * 0.05).toFixed(2)} GST)`}
                        </span>
                      )}
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Product Images</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-2xl hover:border-emerald-400 transition-colors bg-gray-50 group cursor-pointer relative">
                      <div className="space-y-1 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        <div className="flex text-sm text-gray-600">
                          <span className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                            Upload files
                          </span>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        {imageFiles.length > 0 && (
                          <p className="text-sm font-semibold text-emerald-600 mt-2">
                            {imageFiles.length} file(s) selected
                          </p>
                        )}
                      </div>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-white/60 bg-gray-50/60 flex items-center justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-white transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting} 
                className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-lg shadow-emerald-200 disabled:opacity-60 flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  currentItem ? 'Update Product' : 'Create Product'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
