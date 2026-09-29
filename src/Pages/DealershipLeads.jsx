import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Trash2, RefreshCw, CheckCircle, XCircle,
  Search, Download, AlertCircle, MapPin, Mail, Phone
} from "lucide-react";
import toast from 'react-hot-toast';

const API = `/api/dealership-leads`;

export default function DealershipLeads() {
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
      l.location.toLowerCase().includes(q) || 
      l.email.toLowerCase().includes(q)
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

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  const exportCSV = () => {
    const rows = [["Name", "Location", "Email", "Contact", "Status", "Date"], ...leads.map(l => [l.name, l.location, l.email, l.contact, l.status, new Date(l.createdAt).toLocaleString()])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dealership_leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dealership Enquiries</h1>
          <p className="text-sm text-gray-500 mt-1">Manage partner applications and enquiries</p>
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
          { label: "Total Applications", value: leads.length, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "New Enquiries", value: leads.filter(l => l.status === "Pending").length, icon: AlertCircle, color: "bg-orange-50 text-orange-600" },
          { label: "Approved Partners", value: leads.filter(l => l.status === "Approved").length, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
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
          placeholder="Search by name, email or location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-inter text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-gray-400 text-sm">Loading enquiries…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="w-10 h-10 text-gray-300" />
            <p className="text-gray-400 text-sm">No enquiries found.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((lead) => (
                    <motion.tr key={lead._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{lead.name}</p>
                          <p className="text-xs text-gray-400 font-inter">{new Date(lead.createdAt).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {lead.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {lead.contact}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusUpdate(lead._id, e.target.value)}
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-white cursor-pointer outline-none transition-all
                            ${lead.status === "Approved" ? "text-emerald-600 border-emerald-100" : 
                              lead.status === "Pending" ? "text-orange-600 border-orange-100" : 
                              lead.status === "Rejected" ? "text-red-600 border-red-100" : "text-blue-600 border-blue-100"}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(lead._id)}
                          disabled={deletingId === lead._id}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
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
                <motion.div key={lead._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase block mb-0.5">Applicant</span>
                      <div className="font-bold text-gray-900 text-lg leading-tight">{lead.name}</div>
                      <div className="text-xs text-gray-400 font-inter mt-1">{new Date(lead.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-gray-100"></div>

                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {lead.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {lead.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {lead.contact}
                    </div>
                  </div>

                  <div className="h-px w-full bg-gray-100"></div>

                  <div className="flex items-center justify-between">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusUpdate(lead._id, e.target.value)}
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-white cursor-pointer outline-none transition-all
                        ${lead.status === "Approved" ? "text-emerald-600 border-emerald-100" : 
                          lead.status === "Pending" ? "text-orange-600 border-orange-100" : 
                          lead.status === "Rejected" ? "text-red-600 border-red-100" : "text-blue-600 border-blue-100"}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      onClick={() => handleDelete(lead._id)}
                      disabled={deletingId === lead._id}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
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
