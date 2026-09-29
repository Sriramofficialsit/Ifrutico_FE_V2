import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';
import { createPortal } from 'react-dom';

const defaultForm = {
  shopName: '',
  phoneNumber: '',
  address: '',
  gstNumber: '',
  openingHours: '',
  openTime: '09:00',
  closeTime: '21:00',
  whatsappNumber: '',
  whatsappApiKey: '',
  currency: 'INR',
};

export default function Settings() {
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  useEffect(() => {
    apiFetch('/settings')
      .then((data) => {
        if (data?.data) {
          let openT = '09:00';
          let closeT = '21:00';
          const oh = data.data.openingHours || '';
          
          if (oh.includes('-')) {
            const parts = oh.split('-');
            const parseTo24 = (tStr) => {
              const match = tStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (match) {
                let h = parseInt(match[1], 10);
                const m = match[2];
                const ampm = match[3].toUpperCase();
                if (ampm === 'PM' && h < 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return `${h.toString().padStart(2, '0')}:${m}`;
              }
              return null;
            };
            const parsedOpen = parseTo24(parts[0]);
            const parsedClose = parseTo24(parts[1]);
            if (parsedOpen) openT = parsedOpen;
            if (parsedClose) closeT = parsedClose;
          }

          setFormData({
            shopName: data.data.shopName || '',
            phoneNumber: data.data.phoneNumber || '',
            address: data.data.address || '',
            gstNumber: data.data.gstNumber || '',
            openingHours: oh,
            openTime: openT,
            closeTime: closeT,
            whatsappNumber: data.data.whatsappNumber || '',
            whatsappApiKey: '',
            currency: data.data.currency || 'INR',
          });
        }
      })
      .catch(() => {
        // 404 = no settings yet — keep empty form, that's fine
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.shopName.trim()) { toast.error('Shop name is required.'); return; }
    if (!/^[0-9]{10}$/.test(formData.phoneNumber)) { toast.error('Phone number must be 10 digits.'); return; }
    if (!formData.address.trim()) { toast.error('Address is required.'); return; }
    setIsSaveModalOpen(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData };
      
      const formatTime = (time24) => {
        if (!time24) return '';
        const [h, m] = time24.split(':');
        let hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour}:${m} ${ampm}`;
      };
      
      if (payload.openTime && payload.closeTime) {
        payload.openingHours = `${formatTime(payload.openTime)} - ${formatTime(payload.closeTime)}`;
      }
      
      delete payload.openTime;
      delete payload.closeTime;

      if (!payload.gstNumber) delete payload.gstNumber;
      if (!payload.whatsappNumber) delete payload.whatsappNumber;

      await apiFetch('/settings/save', { method: 'POST', body: payload });
      toast.success('Settings saved successfully!');
      setIsSaveModalOpen(false);
    } catch (err) {
      toast.error(err.message);
      setIsSaveModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-emerald-500/20 rounded-full" />
          <div className="absolute inset-0 w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-4xl space-y-8 md:space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="text-base sm:text-lg text-gray-600">Manage your shop details and preferences</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8 animate-fade-in-up opacity-0 stagger-1">
          
          {/* Shop Details */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-white/60">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Shop Details</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name *</label>
                  <input type="text" name="shopName" value={formData.shopName} onChange={handleChange}
                    className="w-full h-11 px-4 rounded-lg border border-white/50 bg-white/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                    maxLength={10} placeholder="10-digit number"
                    className="w-full h-11 px-4 rounded-lg border border-white/50 bg-white/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Address *</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-white/50 bg-white/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">GST Number</label>
                  <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange}
                    placeholder="e.g. 33ABCDE1234F1Z5"
                    className="w-full h-11 px-4 rounded-lg border border-white/50 bg-white/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Hours</label>
                  <div className="flex items-center gap-2">
                    <input type="time" name="openTime" value={formData.openTime} onChange={handleChange}
                      className="flex-1 h-11 px-4 rounded-lg border border-white/50 bg-white/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                    <span className="text-gray-500 font-medium">to</span>
                    <input type="time" name="closeTime" value={formData.closeTime} onChange={handleChange}
                      className="flex-1 h-11 px-4 rounded-lg border border-white/50 bg-white/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Business Number</label>
                  <input type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange}
                    maxLength={10} placeholder="10-digit number"
                    className="w-full h-11 px-4 rounded-lg border border-white/50 bg-white/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp API Key</label>
                  <input type="password" name="whatsappApiKey" value={formData.whatsappApiKey} onChange={handleChange}
                    placeholder="Enter WhatsApp API Key"
                    className="w-full h-11 px-4 rounded-lg border border-white/50 bg-white/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleChange}
                    className="w-full h-11 px-4 rounded-lg border border-white/50 bg-white/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving}
              className="px-8 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold flex items-center gap-2 transition-all shadow-lg">
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirm Modal */}
      {isSaveModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 max-w-lg w-full overflow-hidden animate-zoom-in">
            <div className="px-6 py-5 border-b border-white/60 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Confirm Save</h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">Save the following settings?</p>
              <div className="bg-white/60 p-4 rounded-xl space-y-2 text-sm border border-white/50">
                {[['Shop Name', formData.shopName], ['Phone', formData.phoneNumber], ['Address', formData.address], ['GST', formData.gstNumber || 'Not set']].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 h-11 border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors">Cancel</button>
                <button onClick={confirmSave} disabled={saving} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors">
                  {saving ? 'Saving...' : 'Confirm & Save'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
