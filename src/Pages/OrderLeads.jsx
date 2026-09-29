import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Trash2, RefreshCw, ShoppingBag, Download,
  Search, CheckCircle, AlertCircle, MessageSquare, Tag
} from "lucide-react";
import toast from 'react-hot-toast';

const API = `/api/order-leads`;

export default function OrderLeads() {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { credentials: "include" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setLeads(data.data);
      setFiltered(data.data);
    } catch (err) {
      toast.error(err.message || "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) return setFiltered(leads);
    setFiltered(leads.filter(l => 
      l.mobile.includes(q) || 
      l.productName.toLowerCase().includes(q)
    ));
  }, [search, leads]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setLeads(prev => prev.filter(l => l._id !== id));
      toast.success("Enquiry deleted.");
    } catch (err) {
      toast.error(err.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setLeads(prev => prev.map(l => l._id === id ? { ...l, status: newStatus } : l));
      toast.success("Status updated.");
    } catch (err) {
      toast.error(err.message || "Update failed.");
    }
  };

  const exportCSV = () => {
    const rows = [["Product", "Mobile", "Message", "Status", "Date"], ...leads.map(l => [l.productName, l.mobile, l.message, l.status, new Date(l.createdAt).toLocaleString()])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "order_enquiries.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Product Enquiries</h1>
          <p className="text-sm text-gray-500 mt-1">Direct order leads from the landing page</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            disabled={!leads.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Enquiries", value: leads.length, icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", value: leads.filter(l => l.status === "pending").length, icon: AlertCircle, color: "bg-orange-50 text-orange-600" },
          { label: "Completed", value: leads.filter(l => l.status === "completed").length, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by product name or mobile…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-inter text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-400 text-sm">Loading enquiries…</p>
          </div>
        ) : false ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-gray-500 text-sm">Error</p>
            <button onClick={fetchLeads} className="text-blue-600 text-sm font-medium hover:underline">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
            <p className="text-gray-400 text-sm">{search ? "No results found." : "No enquiries yet."}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((lead, i) => (
                    <motion.tr
                      key={lead._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Tag className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-bold text-gray-900">{lead.productName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-mono text-sm text-gray-700 tracking-tight">{lead.mobile}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.message ? (
                          <div className="flex items-start gap-2 max-w-xs">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-1 flex-shrink-0" />
                            <p className="text-sm text-gray-600 line-clamp-2">{lead.message}</p>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs italic">No message</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusUpdate(lead._id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1 rounded-full border-0 focus:ring-2 focus:ring-offset-1 outline-none cursor-pointer transition-all
                            ${lead.status === "pending" ? "bg-orange-100 text-orange-700 ring-orange-200" : 
                              lead.status === "contacted" ? "bg-blue-100 text-blue-700 ring-blue-200" : 
                              "bg-emerald-100 text-emerald-700 ring-emerald-200"}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(lead._id)}
                          disabled={deletingId === lead._id}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                        >
                          {deletingId === lead._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col p-4 gap-4 bg-gray-50/30">
              {filtered.map((lead) => (
                <motion.div
                  key={lead._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4 relative"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-0.5">Product</div>
                      <div className="font-bold text-gray-900 truncate leading-tight">{lead.productName}</div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-gray-100"></div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-sm text-gray-700 tracking-tight">{lead.mobile}</span>
                    </div>
                    {lead.message && (
                      <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 leading-relaxed">{lead.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="h-px w-full bg-gray-100"></div>

                  <div className="flex items-center justify-between">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusUpdate(lead._id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 focus:ring-2 focus:ring-offset-1 outline-none cursor-pointer transition-all
                        ${lead.status === "pending" ? "bg-orange-100 text-orange-700 ring-orange-200" : 
                          lead.status === "contacted" ? "bg-blue-100 text-blue-700 ring-blue-200" : 
                          "bg-emerald-100 text-emerald-700 ring-emerald-200"}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      onClick={() => handleDelete(lead._id)}
                      disabled={deletingId === lead._id}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all disabled:opacity-40"
                    >
                      {deletingId === lead._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
