import { useState } from 'react';
import { Shield, User as UserIcon, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../api';
import type { User } from '../api';
import { motion } from 'framer-motion';

interface AuthPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Academic');

  // Seed credentials handler
  const loadSeedCredentials = (role: 'student' | 'admin') => {
    setError('');
    setMessage('');
    if (role === 'student') {
      setEmail('student@campusvoice.edu');
      setPassword('student123');
    } else {
      setEmail('admin@campusvoice.edu');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (activeTab === 'student') {
        if (isRegister) {
          // Register student
          const data = await api.auth.studentRegister({
            name,
            rollNumber,
            email,
            password,
            department
          });
          onLoginSuccess(data.user, data.token);
        } else {
          // Login student
          const identifier = rollNumber || email;
          if (!identifier) {
            throw new Error('Please enter your Email or Roll Number');
          }
          const data = await api.auth.studentLogin(identifier, password);
          onLoginSuccess(data.user, data.token);
        }
      } else {
        // Login admin
        const data = await api.auth.adminLogin(email, password);
        onLoginSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Please enter your email to request password reset');
      return;
    }
    setMessage(`Password reset link sent to ${email} (Simulation)`);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-dark-950">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white font-bold text-3xl shadow-glow-cyan mb-4"
          >
            CV
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            CampusVoice
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">
            AI-Powered Digital Complaint Management System
          </p>
        </div>

        {/* Auth Panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-2xl border border-white/10 shadow-2xl glass-panel p-6 relative overflow-hidden"
        >
          {/* Toggles */}
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => {
                setActiveTab('student');
                setIsRegister(false);
                setError('');
                setMessage('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'student'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Student Portal
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setIsRegister(false);
                setError('');
                setMessage('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'admin'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin Portal
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-semibold rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {message}
              </div>
            )}

            {/* Registration specific fields */}
            {activeTab === 'student' && isRegister && (
              <>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm glass-input"
                    />
                    <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Roll Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS2023045"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm glass-input"
                    />
                    <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-dark-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Security">Security</option>
                    <option value="IT Support">IT Support</option>
                    <option value="Transport">Transport</option>
                    <option value="Canteen">Canteen</option>
                  </select>
                </div>
              </>
            )}

            {/* Common login fields */}
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                {activeTab === 'student' && !isRegister ? 'Email / Roll Number' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type={activeTab === 'student' && !isRegister ? 'text' : 'email'}
                  required
                  placeholder={
                    activeTab === 'student' && !isRegister
                      ? 'student@campusvoice.edu or CS2023045'
                      : 'email@campusvoice.edu'
                  }
                  value={activeTab === 'student' && !isRegister ? rollNumber || email : email}
                  onChange={(e) => {
                    if (activeTab === 'student' && !isRegister) {
                      // Set both to ease input
                      setRollNumber(e.target.value);
                      setEmail(e.target.value);
                    } else {
                      setEmail(e.target.value);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm glass-input"
                />
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Password</label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 text-sm glass-input"
                />
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer ${
                activeTab === 'student' ? 'glass-btn-primary' : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-glow-cyan hover:brightness-110 transition-all border border-cyan-400/20'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRegister ? (
                <>Register Student <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {/* Toggle Register/Login */}
            {activeTab === 'student' && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                    setMessage('');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                >
                  {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                </button>
              </div>
            )}
          </form>

          {/* Quick-fill Helper */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-[11px] text-slate-400 font-medium mb-2">
              For testing, click below to autofill preseeded accounts:
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('student');
                  setIsRegister(false);
                  loadSeedCredentials('student');
                }}
                className="text-[10px] px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 rounded-md font-semibold"
              >
                Autofill Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setIsRegister(false);
                  loadSeedCredentials('admin');
                }}
                className="text-[10px] px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 rounded-md font-semibold"
              >
                Autofill Admin
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
