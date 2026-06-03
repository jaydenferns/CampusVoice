export const API_BASE = 'http://localhost:5000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  department?: string;
  role: 'student' | 'admin';
  adminRole?: string;
}

export interface Rating {
  speed: number;
  behavior: number;
  satisfaction: number;
  feedback?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  department: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  studentId: string;
  studentName?: string;
  anonymous: boolean;
  attachments?: string;
  assignedStaff?: string;
  createdAt: string;
  updatedAt: string;
  rating?: Rating;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface AnalyticsData {
  summary: {
    total: number;
    open: number;
    resolved: number;
    avgResolutionTime: string;
  };
  byDept: { name: string; value: number }[];
  byPriority: { name: string; value: number }[];
  trends: { month: string; complaints: number; resolved: number }[];
  averageRatings: {
    speed: number;
    behavior: number;
    satisfaction: number;
    totalRatings: number;
  };
  heatmap: { name: string; count: number }[];
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  auth: {
    studentLogin: async (identifier: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/student/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ identifier, password })
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
      return res.json();
    },
    studentRegister: async (studentData: any) => {
      const res = await fetch(`${API_BASE}/auth/student/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(studentData)
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Registration failed');
      return res.json();
    },
    adminLogin: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
      return res.json();
    }
  },

  complaints: {
    getAll: async (): Promise<Complaint[]> => {
      const res = await fetch(`${API_BASE}/complaints`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch complaints');
      return res.json();
    },
    checkDuplicate: async (title: string, description: string, department: string) => {
      const res = await fetch(`${API_BASE}/complaints/check-duplicate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, description, department })
      });
      if (!res.ok) throw new Error('Duplicate check failed');
      return res.json();
    },
    create: async (complaintData: Partial<Complaint>): Promise<Complaint> => {
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(complaintData)
      });
      if (!res.ok) throw new Error('Failed to create complaint');
      return res.json();
    },
    updateStatus: async (id: string, status: string, assignedStaff?: string): Promise<Complaint> => {
      const res = await fetch(`${API_BASE}/complaints/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, assignedStaff })
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    rate: async (id: string, rating: Rating): Promise<Complaint> => {
      const res = await fetch(`${API_BASE}/complaints/${id}/rate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(rating)
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/complaints/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete complaint');
    },
    aiAnalyze: async (text: string): Promise<{ department: string; category: string; priority: 'Low' | 'Medium' | 'High' }> => {
      const res = await fetch(`${API_BASE}/complaints/ai-analyze`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('AI analysis failed');
      return res.json();
    },
    getNotifications: async (): Promise<Notification[]> => {
      const res = await fetch(`${API_BASE}/complaints/notifications`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    markNotificationsRead: async (): Promise<void> => {
      const res = await fetch(`${API_BASE}/complaints/notifications/read`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to clear notifications');
    },
    getAnalytics: async (): Promise<AnalyticsData> => {
      const res = await fetch(`${API_BASE}/complaints/analytics`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    }
  }
};
