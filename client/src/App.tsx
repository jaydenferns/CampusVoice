import { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Navbar } from './components/Navbar';
import { api } from './api';
import type { User, Notification } from './api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Check login state on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch student notifications when logged in
  const fetchNotifications = async () => {
    if (!user || user.role !== 'student') return;
    try {
      const data = await api.complaints.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchNotifications();
      // Poll notifications every 10 seconds
      const timer = setInterval(fetchNotifications, 10000);
      return () => clearInterval(timer);
    }
  }, [user]);

  const handleLoginSuccess = (loggedInUser: User, receivedToken: string) => {
    setUser(loggedInUser);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Render Portals
  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Navbar
        user={user}
        onLogout={handleLogout}
        notifications={notifications}
        onRefreshNotifications={fetchNotifications}
      />
      
      <main className="flex-1">
        {user.role === 'student' ? (
          <StudentDashboard
            user={user}
            onRefreshNotifications={fetchNotifications}
          />
        ) : (
          <AdminDashboard user={user} />
        )}
      </main>
    </div>
  );
}
