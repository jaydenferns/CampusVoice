import { useState, useEffect } from 'react';
import {
  FileText, CheckCircle, Clock, AlertTriangle, Send,
  Plus, History, Search, Filter, Eye, Star, Bot, Sparkles, Upload, AlertCircle, X, ChevronRight, Loader2
} from 'lucide-react';
import { api } from '../api';
import type { User, Complaint } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentDashboardProps {
  user: User;
  onRefreshNotifications: () => void;
}

type TabType = 'overview' | 'submit' | 'history' | 'track';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onRefreshNotifications }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Maintenance');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [anonymous, setAnonymous] = useState(false);
  const [category, setCategory] = useState('General');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate Check Modal
  const [duplicateWarning, setDuplicateWarning] = useState<Complaint | null>(null);

  // AI Assistant Chatbot
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string; data?: any }[]>([
    { sender: 'bot', text: 'Hello! I am your CampusVoice AI Assistant. Describe your problem (e.g., "The bathroom tap is leaking in Hostel B room 302") and I will categorize it and auto-fill the form for you!' }
  ]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Feedback Rating states
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
  const [ratingSpeed, setRatingSpeed] = useState(5);
  const [ratingBehavior, setRatingBehavior] = useState(5);
  const [ratingSatisfaction, setRatingSatisfaction] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Search & Filter History
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Load complaints
  const fetchComplaints = async () => {
    try {
      const data = await api.complaints.getAll();
      setComplaints(data);
      
      // Update selected tracking complaint if it's currently selected
      if (selectedComplaint) {
        const updated = data.find(c => c.id === selectedComplaint.id);
        if (updated) setSelectedComplaint(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 8000); // Poll complaints status
    return () => clearInterval(interval);
  }, [selectedComplaint]);

  // Handle Form Submit
  const executeSubmission = async (ignoreDuplicate = false) => {
    setIsSubmitting(true);
    try {
      if (!ignoreDuplicate) {
        // Trigger Duplicate check
        const check = await api.complaints.checkDuplicate(title, description, department);
        if (check.found) {
          setDuplicateWarning(check.complaint);
          setIsSubmitting(false);
          return; // Stop and warn user
        }
      }

      await api.complaints.create({
        title,
        description,
        department,
        category,
        priority,
        anonymous,
        attachments: fileName
      });

      // Clear Form
      setTitle('');
      setDescription('');
      setDepartment('Maintenance');
      setCategory('General');
      setPriority('Low');
      setAnonymous(false);
      setFileName('');
      setDuplicateWarning(null);

      // Refresh
      fetchComplaints();
      onRefreshNotifications();
      setActiveTab('history');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSubmission(false);
  };

  // AI Chat Process
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAiAnalyzing(true);

    try {
      // Small simulated typing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const analysis = await api.complaints.aiAnalyze(userMsg);
      
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `I analyzed your complaint! Here is the classification:`,
          data: {
            Department: analysis.department,
            Category: analysis.category,
            Priority: analysis.priority,
            originalText: userMsg
          }
        }
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I failed to process that query. Please try again.' }]);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Apply AI classifications to main Form
  const handleApplyAI = (data: any) => {
    setDepartment(data.Department);
    setCategory(data.Category);
    setPriority(data.Priority);
    setTitle(data.originalText.length > 50 ? data.originalText.substring(0, 47) + '...' : data.originalText);
    setDescription(data.originalText);
    setActiveTab('submit');
  };

  // Handle Feedback Rating
  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRatingModal) return;
    setRatingSubmitting(true);
    try {
      await api.complaints.rate(showRatingModal, {
        speed: ratingSpeed,
        behavior: ratingBehavior,
        satisfaction: ratingSatisfaction,
        feedback: ratingFeedback
      });
      setShowRatingModal(null);
      setRatingFeedback('');
      fetchComplaints();
      onRefreshNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Stats computation
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Submitted').length;
  const inProgressCount = complaints.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;

  // Filtered History
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'All' || c.department === filterDept;
    const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesDept && matchesPriority && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
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
            Welcome, <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{user.name}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage your complaints and monitor resolution speed.</p>
        </div>

        <div className="flex gap-2">
          {(['overview', 'submit', 'history'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'history') setSelectedComplaint(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === tab
                  ? 'glass-btn-primary'
                  : 'glass-btn-secondary text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'overview' && <FileText className="w-3.5 h-3.5" />}
              {tab === 'submit' && <Plus className="w-3.5 h-3.5" />}
              {tab === 'history' && <History className="w-3.5 h-3.5" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Panel Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-white/5 bg-white/5 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Filed</span>
                    <FileText className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h4 className="text-2xl font-bold">{totalCount}</h4>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/5 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending</span>
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <h4 className="text-2xl font-bold">{pendingCount}</h4>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/5 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">In Progress</span>
                    <AlertTriangle className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h4 className="text-2xl font-bold">{inProgressCount}</h4>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/5 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Resolved</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-2xl font-bold">{resolvedCount}</h4>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 glass-card">
                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('submit')}
                    className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/40 text-left flex items-start gap-4 transition-all hover:bg-white/10 group cursor-pointer"
                  >
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:scale-105 transition-transform">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">New Complaint</h4>
                      <p className="text-xs text-slate-400 mt-1">Submit issues regarding hostels, IT support, classrooms, etc.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('history')}
                    className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/40 text-left flex items-start gap-4 transition-all hover:bg-white/10 group cursor-pointer"
                  >
                    <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg group-hover:scale-105 transition-transform">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Track Complaint Status</h4>
                      <p className="text-xs text-slate-400 mt-1">Check progress, view responses, or provide feedback.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Complaints Short List */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Recent Submissions</h3>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {complaints.length === 0 ? (
                    <p className="text-slate-400 text-sm py-4 text-center">No complaints filed yet.</p>
                  ) : (
                    complaints.slice(0, 3).map(comp => (
                      <div
                        key={comp.id}
                        onClick={() => {
                          setSelectedComplaint(comp);
                          setActiveTab('track');
                        }}
                        className="p-4 rounded-lg border border-white/5 bg-dark-900/50 hover:bg-white/5 flex items-center justify-between transition-all cursor-pointer hover:translate-x-1"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-indigo-400">{comp.id}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                              {comp.department}
                            </span>
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                              comp.priority === 'High' ? 'bg-rose-500/10 text-rose-400' :
                              comp.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {comp.priority}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-200 mt-1">{comp.title}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                            comp.status === 'Submitted' ? 'bg-white/10 text-slate-300' :
                            comp.status === 'Assigned' ? 'bg-indigo-500/10 text-indigo-400' :
                            comp.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400' :
                            comp.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' : 'bg-slate-700/30 text-slate-400'
                          }`}>
                            {comp.status}
                          </span>
                          <Eye className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* SUBMIT COMPLAINT FORM */}
          {activeTab === 'submit' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 glass-panel"
            >
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> Submit Complaint
              </h3>
              <p className="text-xs text-slate-400 mb-6">File a new issue. Duplicate warning triggers on overlap.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-dark-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Hostel">Hostel</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Security">Security</option>
                      <option value="IT Support">IT Support</option>
                      <option value="Transport">Transport</option>
                      <option value="Canteen">Canteen</option>
                      <option value="Academic">Academic</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">Category (Autofills)</label>
                    <input
                      type="text"
                      placeholder="e.g. Plumbing, Electrical"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Complaint Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Short description of the issue"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm glass-input"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Please explain the details including location (e.g. Hostel A room 302, Library 3rd floor AC, Canteen)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm glass-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">Priority</label>
                    <div className="flex gap-2">
                      {(['Low', 'Medium', 'High'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            priority === p
                              ? p === 'High' ? 'bg-rose-500/20 border-rose-500 text-rose-400' :
                                p === 'Medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' :
                                'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-transparent border-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">Attachments (Image/Video Mock)</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-between px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-slate-400 cursor-pointer hover:bg-white/5 transition-colors">
                        <span className="text-xs truncate">{fileName || 'Choose image/video...'}</span>
                        <Upload className="w-4 h-4 text-slate-500" />
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFileName(e.target.files[0].name);
                            }
                          }}
                        />
                      </label>
                      {fileName && (
                        <button
                          type="button"
                          onClick={() => setFileName('')}
                          className="p-2 border border-white/10 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 bg-dark-900"
                    />
                    <label htmlFor="anonymous" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      File as Anonymous Complaint
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg glass-btn-primary flex items-center gap-2 text-sm cursor-pointer"
                  >
                    Submit Complaint
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* HISTORY TABLE & SEARCH/FILTER */}
          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Search & Filters */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Search by ID or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs glass-input"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
                  <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
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

              {/* History List */}
              <div className="space-y-3">
                {filteredComplaints.length === 0 ? (
                  <div className="p-8 border border-white/5 rounded-xl text-center bg-white/5">
                    <p className="text-slate-400 text-sm">No complaints matching current filters.</p>
                  </div>
                ) : (
                  filteredComplaints.map(comp => (
                    <div
                      key={comp.id}
                      className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-indigo-400">{comp.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-semibold">
                            {comp.department}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comp.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                            comp.priority === 'High' ? 'bg-rose-500/10 text-rose-400' :
                            comp.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {comp.priority}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-100">{comp.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 max-w-lg">{comp.description}</p>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                          comp.status === 'Submitted' ? 'bg-white/10 text-slate-300' :
                          comp.status === 'Assigned' ? 'bg-indigo-500/10 text-indigo-400' :
                          comp.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400' :
                          comp.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' : 'bg-slate-700/30 text-slate-400'
                        }`}>
                          {comp.status}
                        </span>

                        <div className="flex items-center gap-2">
                          {comp.status === 'Resolved' && (
                            <button
                              onClick={() => {
                                setShowRatingModal(comp.id);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500 border border-emerald-400/20 rounded-md text-dark-950 flex items-center gap-1 cursor-pointer hover:bg-emerald-400 transition-colors"
                            >
                              <Star className="w-3.5 h-3.5 fill-current" /> Rate Resolution
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedComplaint(comp);
                              setActiveTab('track');
                            }}
                            className="p-1.5 rounded-lg border border-white/10 bg-dark-900 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Track Status"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* VISUAL TIMELINE COMPLAINT TRACKING PAGE */}
          {activeTab === 'track' && selectedComplaint && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 glass-panel space-y-6"
            >
              {/* Header Details */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-xs text-slate-400 hover:text-white mr-2"
                    >
                      ← Back
                    </button>
                    <span className="text-sm font-mono font-bold text-indigo-400">{selectedComplaint.id}</span>
                    <span className="text-xs text-slate-400">| Submitted: {new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedComplaint.title}</h3>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    selectedComplaint.status === 'Submitted' ? 'bg-white/10 text-slate-300' :
                    selectedComplaint.status === 'Assigned' ? 'bg-indigo-500/10 text-indigo-400' :
                    selectedComplaint.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400' :
                    selectedComplaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/30 text-slate-400'
                  }`}>
                    {selectedComplaint.status}
                  </span>
                </div>
              </div>

              {/* Status Tracking Visual Timeline */}
              <div className="py-6">
                <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 w-full">
                  {/* Timeline Background Connector Line */}
                  <div className="absolute left-[17px] md:left-0 md:right-0 md:top-[18px] top-0 bottom-0 md:bottom-auto md:h-1 w-1 md:w-auto bg-white/10 -z-10"></div>
                  
                  {/* Timeline Active Progress Line */}
                  <div
                    className="absolute left-[17px] md:left-0 md:top-[18px] top-0 bottom-0 md:bottom-auto md:h-1 w-1 md:w-auto bg-gradient-to-r from-cyan-500 to-indigo-500 -z-10 transition-all duration-700"
                    style={{
                      width: window.innerWidth >= 768 ? (
                        selectedComplaint.status === 'Submitted' ? '25%' :
                        selectedComplaint.status === 'Assigned' ? '50%' :
                        selectedComplaint.status === 'In Progress' ? '75%' : '100%'
                      ) : 'auto',
                      height: window.innerWidth < 768 ? (
                        selectedComplaint.status === 'Submitted' ? '25%' :
                        selectedComplaint.status === 'Assigned' ? '50%' :
                        selectedComplaint.status === 'In Progress' ? '75%' : '100%'
                      ) : 'auto'
                    }}
                  ></div>

                  {/* Steps */}
                  {([
                    { step: 'Submitted', label: 'Complaint Submitted', desc: 'Logged on portal' },
                    { step: 'Assigned', label: 'Staff Assigned', desc: selectedComplaint.assignedStaff || 'Assigning soon' },
                    { step: 'In Progress', label: 'In Progress', desc: 'Work is underway' },
                    { step: 'Resolved', label: 'Resolved', desc: 'Fix verified by admin' },
                    { step: 'Closed', label: 'Closed', desc: 'Rating feedback logged' }
                  ]).map((item, idx) => {
                    const statuses = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
                    const currentIdx = statuses.indexOf(selectedComplaint.status);
                    const isPastOrCurrent = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={idx} className="flex md:flex-col items-center md:text-center gap-4 md:gap-2 z-10 w-full md:w-1/5 relative">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                            isCurrent ? 'bg-cyan-500 border-cyan-400 text-dark-950 shadow-glow-cyan scale-110' :
                            isPastOrCurrent ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-dark-950 border-white/25 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="text-left md:text-center">
                          <h4 className={`text-xs font-bold ${isPastOrCurrent ? 'text-white' : 'text-slate-500'}`}>{item.label}</h4>
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Specific info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 border border-white/5 p-4 rounded-xl text-xs">
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-400 text-xs">Complaint Details</h4>
                  <p><span className="text-slate-400 font-medium">Department:</span> {selectedComplaint.department}</p>
                  <p><span className="text-slate-400 font-medium">Category:</span> {selectedComplaint.category}</p>
                  <p><span className="text-slate-400 font-medium">Priority:</span> {selectedComplaint.priority}</p>
                  <p><span className="text-slate-400 font-medium">Anonymous:</span> {selectedComplaint.anonymous ? 'Yes' : 'No'}</p>
                  <p><span className="text-slate-400 font-medium">Description:</span> {selectedComplaint.description}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-cyan-400 text-xs">Resolution Progress</h4>
                  <p><span className="text-slate-400 font-medium">Assigned Staff:</span> {selectedComplaint.assignedStaff || 'Pending Assignment'}</p>
                  <p><span className="text-slate-400 font-medium">Expected Resolution:</span> {
                    selectedComplaint.priority === 'High' ? '24 Hours' :
                    selectedComplaint.priority === 'Medium' ? '48 Hours' : '72 Hours'
                  }</p>
                  {selectedComplaint.rating && (
                    <div className="pt-2 border-t border-white/5 mt-2 space-y-1">
                      <p className="font-bold text-emerald-400">Rating Left:</p>
                      <p>Speed: {selectedComplaint.rating.speed} ★ | Behavior: {selectedComplaint.rating.behavior} ★ | Satisfaction: {selectedComplaint.rating.satisfaction} ★</p>
                      {selectedComplaint.rating.feedback && <p className="italic">"{selectedComplaint.rating.feedback}"</p>}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* AI Assistant Chatbot Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/5 shadow-xl glass-panel p-4 flex flex-col h-[500px]">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
              <Bot className="w-5 h-5 text-cyan-400 animate-bounce" />
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  CampusVoice AI Assistant <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h3>
                <p className="text-[10px] text-slate-400">Auto-fill complaint form in one click</p>
              </div>
            </div>

            {/* Messages Panel */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 text-xs">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2.5 rounded-lg max-w-[85%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-500/20 border border-indigo-500/30 text-slate-200'
                      : 'bg-white/5 border border-white/5 text-slate-300'
                  }`}>
                    <p>{msg.text}</p>
                    
                    {msg.data && (
                      <div className="mt-2.5 p-2 bg-dark-900 border border-white/10 rounded space-y-1 text-[11px]">
                        <p><span className="text-slate-400">Department:</span> <span className="font-bold text-indigo-400">{msg.data.Department}</span></p>
                        <p><span className="text-slate-400">Category:</span> <span className="font-bold text-cyan-400">{msg.data.Category}</span></p>
                        <p><span className="text-slate-400">Priority:</span> <span className="font-bold text-yellow-400">{msg.data.Priority}</span></p>
                        <button
                          type="button"
                          onClick={() => handleApplyAI(msg.data)}
                          className="w-full mt-2 py-1 bg-cyan-500 text-dark-950 font-bold rounded hover:bg-cyan-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Create Complaint Form
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {aiAnalyzing && (
                <div className="flex justify-start">
                  <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>AI is categorizing complaint...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                required
                disabled={aiAnalyzing}
                placeholder="Describe your issue..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs glass-input"
              />
              <button
                type="submit"
                disabled={aiAnalyzing}
                className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Duplicate Complaint Warning Modal */}
      <AnimatePresence>
        {duplicateWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 bg-dark-900 border border-white/10 rounded-2xl glass-panel-glow shadow-2xl relative"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Similar Complaint Found</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    An active complaint exists matching this issue. You can follow that complaint or submit yours anyway.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/5 rounded-lg text-xs space-y-1.5 mb-6">
                <p><span className="text-slate-400 font-semibold">Complaint ID:</span> <span className="font-mono font-bold text-indigo-400">{duplicateWarning.id}</span></p>
                <p><span className="text-slate-400 font-semibold">Department:</span> {duplicateWarning.department}</p>
                <p><span className="text-slate-400 font-semibold">Title:</span> {duplicateWarning.title}</p>
                <p><span className="text-slate-400 font-semibold">Description:</span> {duplicateWarning.description}</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedComplaint(duplicateWarning);
                    setDuplicateWarning(null);
                    setActiveTab('track');
                  }}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all"
                >
                  Track Existing Complaint
                </button>
                <button
                  type="button"
                  onClick={() => executeSubmission(true)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer border border-white/10 transition-all"
                >
                  Submit Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Star Rating Modal for Resolved Complaints */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 bg-dark-900 border border-white/10 rounded-2xl glass-panel shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-emerald-400 fill-current" /> Resolution Feedback
                </h3>
                <button onClick={() => setShowRatingModal(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRatingSubmit} className="space-y-4 text-xs">
                {/* 3 Categories: Speed, behavior, satisfaction */}
                {([
                  { key: 'speed', label: 'Resolution Speed', value: ratingSpeed, setter: setRatingSpeed },
                  { key: 'behavior', label: 'Staff Behavior', value: ratingBehavior, setter: setRatingBehavior },
                  { key: 'satisfaction', label: 'Overall Satisfaction', value: ratingSatisfaction, setter: setRatingSatisfaction }
                ] as const).map(cat => (
                  <div key={cat.key} className="space-y-1">
                    <label className="text-slate-300 font-semibold block">{cat.label}</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => cat.setter(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-6 h-6 ${star <= cat.value ? 'text-yellow-400 fill-current' : 'text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Comments / Suggestions</label>
                  <textarea
                    rows={3}
                    placeholder="Provide any feedback on how we can improve..."
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                    className="w-full px-3 py-2 text-xs glass-input"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(null)}
                    className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg font-semibold hover:bg-white/10 border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ratingSubmitting}
                    className="px-4 py-2 rounded-lg glass-btn-primary flex items-center gap-1 font-bold text-xs"
                  >
                    {ratingSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
