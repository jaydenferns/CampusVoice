import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, Legend
} from 'recharts';
import {
  FileText, CheckCircle, Clock, Trash2, Edit, Save,
  BarChart2, Map, LayoutGrid, Star, UserCheck, AlertTriangle, Loader2
} from 'lucide-react';
import { api } from '../api';
import type { User, Complaint, AnalyticsData } from '../api';
import { motion } from 'framer-motion';

interface AdminDashboardProps {
  user: User;
}

type TabType = 'table' | 'analytics' | 'heatmap';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<TabType>('table');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit / Assign Staff state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editStaff, setEditStaff] = useState<string>('');

  // Table Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchData = async () => {
    try {
      const list = await api.complaints.getAll();
      setComplaints(list);
      const stats = await api.complaints.getAnalytics();
      setAnalytics(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async (id: string) => {
    try {
      await api.complaints.updateStatus(id, editStatus, editStaff);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete complaint ${id}?`)) return;
    try {
      await api.complaints.delete(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Recharts color palettes
  const COLORS = ['#06b6d4', '#6366f1', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];
  const PRIORITY_COLORS: Record<string, string> = {
    High: '#ef4444',
    Medium: '#eab308',
    Low: '#10b981'
  };

  // Filter complaints
  const filtered = complaints.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.studentName && c.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.assignedStaff && c.assignedStaff.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = filterDept === 'All' || c.department === filterDept;
    const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesDept && matchesPriority && matchesStatus;
  });

  // Heatmap helper to get fill color based on complaint count
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'rgba(6, 182, 212, 0.08)'; // cool cyan glow
    if (count === 1) return 'rgba(234, 179, 8, 0.25)'; // low amber
    if (count === 2) return 'rgba(239, 68, 68, 0.45)'; // medium orange/red
    return 'rgba(239, 68, 68, 0.8)'; // heavy red glowing
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Tabs Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Admin Panel <span className="text-xs py-1 px-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md font-bold uppercase tracking-wider">{user.adminRole || 'Super Admin'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Review active complaints, assign wardens, track metrics, and manage campus facilities.</p>
        </div>

        <div className="flex gap-2">
          {(['table', 'analytics', 'heatmap'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === tab
                  ? 'glass-btn-primary'
                  : 'glass-btn-secondary text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'table' && <LayoutGrid className="w-3.5 h-3.5" />}
              {tab === 'analytics' && <BarChart2 className="w-3.5 h-3.5" />}
              {tab === 'heatmap' && <Map className="w-3.5 h-3.5" />}
              {tab === 'table' ? 'Management Table' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Summary Header Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-white/5 bg-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Complaints</span>
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <h4 className="text-2xl font-bold">{analytics.summary.total}</h4>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active/Open Issues</span>
              <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
            <h4 className="text-2xl font-bold">{analytics.summary.open}</h4>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Resolved Issues</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-2xl font-bold">{analytics.summary.resolved}</h4>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Resolution Time</span>
              <UserCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <h4 className="text-2xl font-bold">{analytics.summary.avgResolutionTime}</h4>
          </div>
        </div>
      )}

      {/* TABLE VIEW */}
      {activeTab === 'table' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Table Filters */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search by ID, title, student name, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs glass-input"
              />
              <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="text-xs px-2 py-1.5 bg-dark-900 border border-white/10 rounded-lg text-slate-300"
              >
                <option value="All">All Departments</option>
                <option value="Hostel">Hostel</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Security">Security</option>
                <option value="IT Support">IT Support</option>
                <option value="Transport">Transport</option>
                <option value="Canteen">Canteen</option>
                <option value="Academic">Academic</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="text-xs px-2 py-1.5 bg-dark-900 border border-white/10 rounded-lg text-slate-300"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs px-2 py-1.5 bg-dark-900 border border-white/10 rounded-lg text-slate-300"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-300 border-b border-white/10 font-bold uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Complaint Info</th>
                  <th className="p-4">Dept / Priority</th>
                  <th className="p-4">Assigned Staff</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No complaints found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map(comp => {
                    const isEditing = editingId === comp.id;

                    return (
                      <tr key={comp.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                          {comp.id}
                        </td>
                        <td className="p-4 whitespace-nowrap font-medium text-slate-200">
                          {comp.anonymous ? (
                            <span className="text-slate-500 italic">Anonymous</span>
                          ) : (
                            comp.studentName || 'Student'
                          )}
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="font-semibold text-slate-100 truncate">{comp.title}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{comp.description}</p>
                          {comp.rating && (
                            <div className="flex gap-1 items-center text-[10px] mt-1 text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded w-max">
                              <Star className="w-3 h-3 fill-current" /> Rating Left (S:{comp.rating.speed} B:{comp.rating.behavior} S:{comp.rating.satisfaction})
                            </div>
                          )}
                        </td>
                        <td className="p-4 space-y-1">
                          <span className="block text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 w-max text-slate-300 font-semibold">
                            {comp.department}
                          </span>
                          <span className={`block text-[9px] uppercase font-bold tracking-wider rounded px-1 w-max ${
                            comp.priority === 'High' ? 'bg-rose-500/15 text-rose-400' :
                            comp.priority === 'Medium' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-emerald-500/15 text-emerald-400'
                          }`}>
                            {comp.priority} Priority
                          </span>
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editStaff}
                              onChange={(e) => setEditStaff(e.target.value)}
                              className="px-2 py-1 text-xs glass-input w-28"
                              placeholder="Staff Name"
                            />
                          ) : (
                            <span className="text-slate-300">{comp.assignedStaff || 'Unassigned'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="px-2 py-1 text-xs bg-dark-900 border border-white/10 rounded-lg text-slate-300"
                            >
                              <option value="Submitted">Submitted</option>
                              <option value="Assigned">Assigned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                              comp.status === 'Submitted' ? 'bg-white/10 text-slate-300' :
                              comp.status === 'Assigned' ? 'bg-indigo-500/10 text-indigo-400' :
                              comp.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400' :
                              comp.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/30 text-slate-400'
                            }`}>
                              {comp.status}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-1">
                            {isEditing ? (
                              <button
                                onClick={() => handleSave(comp.id)}
                                className="p-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded cursor-pointer"
                                title="Save"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(comp.id);
                                  setEditStatus(comp.status);
                                  setEditStaff(comp.assignedStaff || '');
                                }}
                                className="p-1 text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 rounded cursor-pointer"
                                title="Edit Status / Staff"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(comp.id)}
                              className="p-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ANALYTICS PAGE (RECHARTS) */}
      {activeTab === 'analytics' && analytics && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Trends: Filed vs Resolved */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 glass-panel col-span-1 md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6">Monthly Complaint Trends</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trends}>
                  <defs>
                    <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#374151', color: '#fff', fontSize: '11px', borderRadius: '8px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="complaints" name="Complaints Filed" stroke="#6366f1" fillOpacity={1} fill="url(#colorComplaints)" />
                  <Area type="monotone" dataKey="resolved" name="Complaints Resolved" stroke="#06b6d4" fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department breakdown */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 glass-panel">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6">Complaints by Department</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byDept}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#374151', color: '#fff', fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="value" name="Complaints" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {analytics.byDept.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Breakdown & Rating Stats */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 glass-panel space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Complaints by Priority</h3>
              <div className="h-32 flex items-center justify-between">
                <div className="h-full w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.byPriority}
                        innerRadius={25}
                        outerRadius={45}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.byPriority.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 text-xs space-y-1.5 pr-4">
                  {analytics.byPriority.map(item => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[item.name] }}></span>
                        {item.name}
                      </span>
                      <span className="font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Satisfaction Rating Stats */}
            <div className="border-t border-white/5 pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Resolution Quality Feedback</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Staff Behavior</span>
                  <span className="text-lg font-extrabold text-cyan-400 mt-1 block">{analytics.averageRatings.behavior} <Star className="w-3.5 h-3.5 inline fill-current" /></span>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Resolution Speed</span>
                  <span className="text-lg font-extrabold text-indigo-400 mt-1 block">{analytics.averageRatings.speed} <Star className="w-3.5 h-3.5 inline fill-current" /></span>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Satisfaction</span>
                  <span className="text-lg font-extrabold text-emerald-400 mt-1 block">{analytics.averageRatings.satisfaction} <Star className="w-3.5 h-3.5 inline fill-current" /></span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-2">Aggregate metrics computed from {analytics.averageRatings.totalRatings} student reviews.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* CAMPUS HEATMAP */}
      {activeTab === 'heatmap' && analytics && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 glass-panel space-y-6"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Campus Issue Heatmap <AlertTriangle className="w-4 h-4 text-cyan-400 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Regions highlight in glowing colors based on the count of unresolved issues.</p>
            </div>
            {/* Heatmap Legend */}
            <div className="flex gap-3 text-[10px] text-slate-400 font-semibold items-center">
              <span>Legend:</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-500/10 border border-cyan-500/20"></span> 0 Issues</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-yellow-500/25"></span> 1 Issue</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/45"></span> 2 Issues</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/80"></span> 3+ Issues</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* SVG Visual Map Layout */}
            <div className="lg:col-span-2 relative border border-white/5 bg-dark-900/60 rounded-xl p-4 flex items-center justify-center">
              <svg viewBox="0 0 600 400" className="w-full max-w-xl h-auto">
                {/* SVG Definitions */}
                <defs>
                  <filter id="glow-heavy" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-light" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Background Campus Grid Grid Lines */}
                <g stroke="rgba(255,255,255,0.02)" strokeWidth="1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line key={i} x1={i * 50} y1="0" x2={i * 50} y2="400" />
                  ))}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <line key={i} x1="0" y1={i * 50} x2="600" y2={i * 50} />
                  ))}
                </g>

                {/* Map Regions Mapping */}
                {([
                  { name: 'Hostel A', x: 50, y: 50, w: 140, h: 100, rx: 12 },
                  { name: 'Hostel B', x: 230, y: 50, w: 140, h: 100, rx: 12 },
                  { name: 'Library', x: 410, y: 50, w: 140, h: 130, rx: 12 },
                  { name: 'Canteen', x: 50, y: 220, w: 140, h: 130, rx: 12 },
                  { name: 'Sports Complex', x: 230, y: 220, w: 140, h: 130, rx: 12 },
                  { name: 'Academic Block', x: 410, y: 220, w: 140, h: 130, rx: 12 }
                ]).map(loc => {
                  const data = analytics.heatmap.find(h => h.name.toLowerCase() === loc.name.toLowerCase());
                  const count = data ? data.count : 0;
                  const glowFilter = count > 1 ? 'url(#glow-heavy)' : count === 1 ? 'url(#glow-light)' : 'none';

                  return (
                    <g key={loc.name} className="cursor-pointer group">
                      <rect
                        x={loc.x}
                        y={loc.y}
                        width={loc.w}
                        height={loc.h}
                        rx={loc.rx}
                        fill={getHeatmapColor(count)}
                        stroke={count > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}
                        strokeWidth="1.5"
                        filter={glowFilter}
                        className="transition-all duration-500 hover:brightness-110"
                      />
                      {/* Name Label */}
                      <text
                        x={loc.x + loc.w / 2}
                        y={loc.y + loc.h / 2 - 5}
                        textAnchor="middle"
                        fill="#f1f5f9"
                        fontSize="12"
                        fontWeight="bold"
                        fontFamily="Outfit"
                      >
                        {loc.name}
                      </text>
                      {/* Active Count */}
                      <text
                        x={loc.x + loc.w / 2}
                        y={loc.y + loc.h / 2 + 15}
                        textAnchor="middle"
                        fill={count > 0 ? '#ef4444' : '#64748b'}
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {count} Active {count === 1 ? 'Issue' : 'Issues'}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Heatmap List Sidebar */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Unresolved Issues Breakdown</h4>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {analytics.heatmap.map(loc => (
                  <div
                    key={loc.name}
                    className="p-3 border border-white/5 bg-white/5 rounded-xl flex items-center justify-between transition-all hover:bg-white/10"
                  >
                    <span className="font-bold text-xs text-slate-200">{loc.name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      loc.count > 1 ? 'bg-rose-500/20 text-rose-400' :
                      loc.count === 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {loc.count} Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
