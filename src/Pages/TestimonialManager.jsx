import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Trash2, RefreshCw, CheckCircle, XCircle,
  Search, Download, AlertCircle, Quote, User
} from "lucide-react";
import toast from 'react-hot-toast';

const API = `/api/testimonials`;

export default function TestimonialManager() {
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
      toast.error(err.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) return setFiltered(leads);
    setFiltered(leads.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.content.toLowerCase().includes(q)
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
      toast.success("Deleted successfully.");
    } catch (err) {
      toast.error("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleApprove = async (id, status) => {
    try {
      const res = await fetch(`${API}/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: status }),
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setLeads(prev => prev.map(l => l._id === id ? { ...l, isApproved: status } : l));
      toast.success(status ? "Approved" : "Unapproved");
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  const exportCSV = () => {
    const rows = [["Name", "Content", "Rating", "Gender", "Approved", "Date"], ...leads.map(l => [l.name, l.content, l.rating, l.gender, l.isApproved, new Date(l.createdAt).toLocaleString()])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "testimonials.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Testimonial Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve customer feedback</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchLeads} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button onClick={exportCSV} disabled={!leads.length} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-colors text-sm font-semibold disabled:opacity-50">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Reviews", value: leads.length, icon: Quote, color: "bg-blue-50 text-blue-600" },
          { label: "Pending Approval", value: leads.filter(l => !l.isApproved).length, icon: AlertCircle, color: "bg-orange-50 text-orange-600" },
          { label: "Approved", value: leads.filter(l => l.isApproved).length, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
        ].map((stat, i) => (
          <motion.div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
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

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or content…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-inter text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-gray-400 text-sm">Loading testimonials…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Quote className="w-10 h-10 text-gray-300" />
            <p className="text-gray-400 text-sm">No testimonials found.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Review</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((lead) => (
                    <motion.tr key={lead._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${lead.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{lead.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{lead.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-xs font-inter italic">"{lead.content}"</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < lead.rating ? "fill-mango-orange text-mango-orange" : "text-gray-200"}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleApprove(lead._id, !lead.isApproved)}
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all
                            ${lead.isApproved ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}
                        >
                          {lead.isApproved ? "Approved" : "Pending"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(lead._id, !lead.isApproved)}
                            className={`p-2 rounded-xl transition-all ${lead.isApproved ? "text-orange-400 hover:bg-orange-50" : "text-emerald-400 hover:bg-emerald-50"}`}
                            title={lead.isApproved ? "Unapprove" : "Approve"}
                          >
                            {lead.isApproved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(lead._id)}
                            disabled={deletingId === lead._id}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            {deletingId === lead._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col p-4 gap-4 bg-gray-50/30">
              {filtered.map((lead) => (
                <motion.div key={lead._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4 relative">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${lead.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-gray-900 leading-tight">{lead.name}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5">{lead.gender}</div>
                      </div>
                      <div className="flex gap-0.5 bg-gray-50 px-2 py-1 rounded-lg">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < lead.rating ? "fill-mango-orange text-mango-orange" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative">
                    <Quote className="w-4 h-4 text-gray-300 absolute top-2 right-2 opacity-50" />
                    <p className="text-sm text-gray-600 font-inter italic pr-6 leading-relaxed">"{lead.content}"</p>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <button
                      onClick={() => handleApprove(lead._id, !lead.isApproved)}
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all
                        ${lead.isApproved ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}
                    >
                      {lead.isApproved ? "Approved" : "Pending"}
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(lead._id, !lead.isApproved)}
                        className={`p-2.5 rounded-xl transition-all border ${lead.isApproved ? "text-orange-500 bg-orange-50 hover:bg-orange-100 border-orange-100" : "text-emerald-500 bg-emerald-50 hover:bg-emerald-100 border-emerald-100"}`}
                        title={lead.isApproved ? "Unapprove" : "Approve"}
                      >
                        {lead.isApproved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(lead._id)}
                        disabled={deletingId === lead._id}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-100 transition-all"
                      >
                        {deletingId === lead._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
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
