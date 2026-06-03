import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, Shield, User as UserIcon, Check } from 'lucide-react';
import { api } from '../api';
import type { User, Notification } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  notifications: Notification[];
  onRefreshNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, notifications, onRefreshNotifications }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.complaints.markNotificationsRead();
      onRefreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-dark-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white font-bold text-lg shadow-glow-cyan">
          CV
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-950"></div>
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            CampusVoice
          </span>
          <span className="hidden sm:inline-block ml-2 text-xs py-0.5 px-2 bg-white/5 rounded-full border border-white/10 text-slate-400">
            v1.0
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        {user.role === 'student' && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-dark-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-dark-900 shadow-xl glass-panel p-4 z-50"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-2.5 rounded-lg border text-xs transition-colors ${
                            notif.read
                              ? 'bg-transparent border-transparent text-slate-400'
                              : 'bg-white/5 border-white/5 text-slate-200'
                          }`}
                        >
                          <p className="font-medium leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-200">{user.name}</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
              {user.role === 'admin' ? (
                <>
                  <Shield className="w-3 h-3 text-cyan-400" />
                  Admin
                </>
              ) : (
                <>
                  <UserIcon className="w-3 h-3 text-indigo-400" />
                  Student ({user.rollNumber})
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-slate-300">
            {user.role === 'admin' ? <Shield className="w-4 h-4 text-cyan-400" /> : <UserIcon className="w-4 h-4 text-indigo-400" />}
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
