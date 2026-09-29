import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, UserCheck, UserX, X, Trash2, Shield, User, Lock, Send, Eye } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../Context/AuthContext';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

export default function Salespersons() {
  const { user } = useAuth();
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Change password states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    role: 'staff',
    isActive: true, // we represent this as status 'active' / 'inactive' in BE
  });

  const fetchSalespersons = (p = 1) => {
    setLoading(true);
    apiFetch(`/sales/all?page=${p}&limit=${LIMIT}`)
      .then((data) => {
        setSalespersons(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setPage(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSalespersons(1);
  }, []);

  const openModal = (person = null) => {
    if (person) {
      setEditingPerson(person);
      setFormData({
        name: person.name || '',
        email: person.email || '',
        password: '', // Hidden for editing
        mobile: person.mobile || '',
        role: person.role || 'staff',
        isActive: person.status === 'active',
      });
    } else {
      setEditingPerson(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        mobile: '',
        role: 'staff',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const openPasswordModal = (person) => {
    setPasswordUser(person);
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await apiFetch('/sales/change-password', {
        method: 'PUT',
        body: { userId: passwordUser._id, newPassword },
      });
      toast.success('Password changed successfully.');
      setIsPasswordModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Explicitly restrict mobile input to 10 digits
    if (name === 'mobile') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, mobile: numericValue }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim()) {
      toast.error('Name, Email, and Mobile are required.');
      return;
    }

    if (!editingPerson && (!formData.password || formData.password.length < 8)) {
      toast.error('Password is required and must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.replace(/\D/g, ''),
        role: formData.role,
        status: formData.isActive ? 'active' : 'inactive',
      };

      if (!editingPerson) {
        payload.password = formData.password;
        await apiFetch('/sales/add', { method: 'POST', body: payload });
      } else {
        await apiFetch(`/sales/update/${editingPerson._id}`, { method: 'PUT', body: payload });
      }

      toast.success(editingPerson ? 'User updated successfully' : 'User added successfully');
      fetchSalespersons(page);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await apiFetch(`/sales/delete/${id}`, { method: 'DELETE' });
      toast.success('User deleted successfully');
      fetchSalespersons(page);
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
              Branch Management
            </h1>
            <p className="mt-2 text-base sm:text-lg text-gray-600">
              Branch details and access for your team
            </p>
          </div>

          <button
            onClick={() => openModal()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} />
            Add Branch
          </button>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden animate-fade-in-up opacity-0 stagger-1">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-white/70">
                  <th className="text-left p-5 font-semibold text-sm text-gray-700">Branch Details</th>
                  <th className="text-left p-5 font-semibold text-sm text-gray-700">Role</th>
                  <th className="text-left p-5 font-semibold text-sm text-gray-700">Status</th>
                  <th className="text-left p-5 font-semibold text-sm text-gray-700">Joined Date</th>
                  <th className="text-left p-5 font-semibold text-sm text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading branches...</td></tr>
                ) : salespersons.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No branches found.</td></tr>
                ) : (
                  salespersons.map((person, index) => (
                    <tr key={person._id} className={`border-b border-gray-100/60 hover:bg-white/70 transition-colors ${index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30'}`}>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-semibold text-emerald-700 flex-shrink-0 overflow-hidden">
                            {person.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            {person.role === 'staff'
                              ? <Link to={`/team/${person._id}`} className="font-medium text-gray-900 hover:text-emerald-600 transition-colors">{person.name}</Link>
                              : <div className="font-medium text-gray-900">{person.name}</div>}
                            <div className="text-xs text-gray-500">{person.email} • {person.mobile}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${person.role === 'admin' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                          {person.role === 'admin' ? <Shield size={12}/> : <User size={12}/>}
                          {person.role.charAt(0).toUpperCase() + person.role.slice(1)}
                        </span>
                      </td>
                      <td className="p-5">
                        {person.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                            <UserCheck size={14} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
                            <UserX size={14} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-sm text-gray-600">
                        {new Date(person.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          {person.role === 'staff' && (
                            <Link to={`/team/${person._id}`} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="View branch details">
                              <Eye size={18} />
                            </Link>
                          )}
                          <button
                            onClick={() => openPasswordModal(person)}
                            className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors"
                            title="Change Password"
                          >
                            <Lock size={18} />
                          </button>
                          <button
                            onClick={() => openModal(person)}
                            className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          {user?._id !== person._id && (
                            <button
                              onClick={() => handleDelete(person._id)}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col p-4 gap-4 bg-gray-50/30">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading branches...</div>
            ) : salespersons.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No branches found.</div>
            ) : (
              salespersons.map((person) => (
                <div key={person._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-700 flex-shrink-0 shadow-sm overflow-hidden">
                      {person.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {person.role === 'staff'
                        ? <Link to={`/team/${person._id}`} className="block font-bold text-gray-900 truncate text-lg leading-tight hover:text-emerald-600">{person.name}</Link>
                        : <div className="font-bold text-gray-900 truncate text-lg leading-tight">{person.name}</div>}
                      <div className="text-sm text-gray-500 truncate mt-0.5">{person.email}</div>
                      <div className="text-sm text-gray-500 font-mono mt-0.5">{person.mobile}</div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-gray-100"></div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide uppercase ${person.role === 'admin' ? 'bg-emerald-800 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {person.role === 'admin' ? <Shield size={12}/> : <User size={12}/>}
                        {person.role}
                      </span>
                      {person.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold tracking-wide uppercase">
                          <UserCheck size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 text-xs font-bold tracking-wide uppercase">
                          <UserX size={12} /> Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-px w-full bg-gray-50"></div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-gray-400 font-medium">
                      Joined: {new Date(person.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openPasswordModal(person)} className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-emerald-600 border border-gray-100 hover:border-emerald-200 transition-colors active:scale-95" title="Change Password">
                        <Lock size={16} />
                      </button>
                      <button onClick={() => openModal(person)} className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-emerald-600 border border-gray-100 hover:border-emerald-200 transition-colors active:scale-95" title="Edit">
                        <Edit size={16} />
                      </button>
                      {user?._id !== person._id && (
                        <button onClick={() => handleDelete(person._id)} className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 text-red-500 border border-gray-100 hover:border-red-200 transition-colors active:scale-95" title="Delete">
                          <Trash2 size={16}/>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-white/60 px-6 py-4 flex items-center justify-between">
               <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
               <div className="flex gap-2">
                 <button disabled={page <= 1} onClick={() => fetchSalespersons(page - 1)} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">Prev</button>
                 <button disabled={page >= totalPages} onClick={() => fetchSalespersons(page + 1)} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">Next</button>
               </div>
            </div>
          )}
        </div>
      </div>
      
      {isModalOpen && createPortal (
        <div className="fixed inset-0  backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 max-w-md w-full overflow-hidden animate-zoom-in">
            <div className="px-6 py-5 border-b border-white/60 flex justify-between items-center bg-white/40">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPerson ? 'Edit Branch' : 'Add Branch'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Configure access and profile details</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Branch Name</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                        <User size={18} />
                      </div>
                      <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g. Anna Nagar Branch"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                        <Send size={16} className="rotate-45" />
                      </div>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                        placeholder="john@example.com"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm" 
                      />
                    </div>
                  </div>

                  {!editingPerson && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Initial Password</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                          <Lock size={18} />
                        </div>
                        <input 
                          type="password" 
                          name="password" 
                          value={formData.password} 
                          onChange={handleChange} 
                          required 
                          minLength={8} 
                          placeholder="Min. 8 characters"
                          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm" 
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Mobile</label>
                      <input 
                        type="tel" 
                        name="mobile" 
                        value={formData.mobile} 
                        onChange={handleChange} 
                        required 
                        pattern="[0-9]{10}" 
                        maxLength="10" 
                        placeholder="10 digits" 
                        className="w-full h-12 px-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Role</label>
                      <select 
                        name="role" 
                        value={formData.role} 
                        onChange={handleChange} 
                        className="w-full h-12 px-4 rounded-2xl border border-gray-200 focus:border-emerald-500 bg-white outline-none shadow-sm cursor-pointer"
                      >
                        <option value="staff">Staff Member</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        id="isActive"
                        name="isActive" 
                        checked={formData.isActive} 
                        onChange={handleChange} 
                        className="peer hidden" 
                      />
                      <div 
                        onClick={() => handleChange({ target: { name: 'isActive', type: 'checkbox', checked: !formData.isActive } })}
                        className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-emerald-500 transition-all relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"
                      ></div>
                    </div>
                    <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Account is Active</label>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 h-12 border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100"
                  >
                    {submitting ? 'Processing...' : editingPerson ? 'Update Profile' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isPasswordModalOpen && createPortal (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 max-w-md w-full overflow-hidden animate-zoom-in">
            <div className="px-6 py-5 border-b border-white/60 flex justify-between items-center bg-white/40">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Security Update</h3>
                <p className="text-sm text-gray-500 mt-0.5">Change password for {passwordUser?.name}</p>
              </div>
              <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">New Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                      minLength={8} 
                      placeholder="Enter new secure password"
                      className="w-full h-12 pl-11 pr-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                      <Shield size={18} />
                    </div>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      required 
                      minLength={8} 
                      placeholder="Repeat new password"
                      className="w-full h-12 pl-11 pr-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm" 
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsPasswordModalOpen(false)} 
                    className="flex-1 h-12 border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={passwordSubmitting} 
                    className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100"
                  >
                    {passwordSubmitting ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}