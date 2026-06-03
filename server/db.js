import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_DB_PATH = path.join(__dirname, 'db_fallback.json');

// Memory cache for fallback mode
let fallbackData = {
  students: [],
  admins: [],
  complaints: [],
  notifications: []
};

// Seed Helper
const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

const seedFallbackData = () => {
  fallbackData.students = [
    {
      id: 'STU-1001',
      name: 'Jayden Smith',
      rollNumber: 'CS2023045',
      email: 'student@campusvoice.edu',
      password: hashPassword('student123'),
      department: 'Academic'
    },
    {
      id: 'STU-1002',
      name: 'Emma Watson',
      rollNumber: 'EC2023012',
      email: 'emma@campusvoice.edu',
      password: hashPassword('student123'),
      department: 'Hostel'
    }
  ];

  fallbackData.admins = [
    {
      id: 'ADM-2001',
      name: 'Prof. Richard Feynman',
      role: 'Super Admin',
      email: 'admin@campusvoice.edu',
      password: hashPassword('admin123')
    },
    {
      id: 'ADM-2002',
      name: 'Dr. Jane Goodall',
      role: 'Hostel Warden',
      email: 'warden@campusvoice.edu',
      password: hashPassword('admin123')
    }
  ];

  fallbackData.complaints = [
    {
      id: 'CMP-2026-001',
      title: 'Water Cooler Leaking in Hostel Block A',
      description: 'The water cooler on the 2nd floor of Hostel A has been leaking since yesterday. There is a lot of water on the floor which is a slip hazard.',
      department: 'Maintenance',
      category: 'Plumbing',
      priority: 'High',
      status: 'In Progress',
      studentId: 'STU-1001',
      anonymous: false,
      attachments: '',
      assignedStaff: 'Ramesh (Plumber)',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'CMP-2026-002',
      title: 'WiFi Router Offline in Library 3rd Floor',
      description: 'The WiFi signal is extremely weak or disconnected on the entire 3rd floor of the central library. Students are unable to access research materials.',
      department: 'IT Support',
      category: 'Network',
      priority: 'Medium',
      status: 'Assigned',
      studentId: 'STU-1002',
      anonymous: false,
      attachments: '',
      assignedStaff: 'Suresh (Network Eng.)',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'CMP-2026-003',
      title: 'Library Air Conditioner is making clicking noise',
      description: 'The AC unit in the study section is making a loud clicking sound that makes it impossible to concentrate. Please repair it.',
      department: 'Maintenance',
      category: 'Electrical',
      priority: 'Low',
      status: 'Submitted',
      studentId: 'STU-1001',
      anonymous: true,
      attachments: '',
      assignedStaff: '',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'CMP-2026-004',
      title: 'Broken desk in Room 102 Academic Block',
      description: 'One of the front row desks has a broken leg and is unstable. Needs to be replaced or fixed.',
      department: 'Academic',
      category: 'Furniture',
      priority: 'Low',
      status: 'Resolved',
      studentId: 'STU-1001',
      anonymous: false,
      attachments: '',
      assignedStaff: 'Mr. Verma (Carpentry)',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      rating: {
        speed: 4,
        behavior: 5,
        satisfaction: 4,
        feedback: 'Fixed quickly and staff was very polite.'
      }
    }
  ];

  fallbackData.notifications = [
    {
      id: 'notif-1',
      userId: 'STU-1001',
      message: 'Your complaint CMP-2026-001 has been moved to In Progress.',
      type: 'status_update',
      read: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-2',
      userId: 'STU-1001',
      message: 'Your complaint CMP-2026-004 has been Resolved! Please provide feedback.',
      type: 'resolved',
      read: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  saveFallbackToFile();
};

const saveFallbackToFile = () => {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(fallbackData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local fallback database:', err);
  }
};

const loadFallbackFromFile = () => {
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      const content = fs.readFileSync(FALLBACK_DB_PATH, 'utf-8');
      fallbackData = JSON.parse(content);
    } else {
      seedFallbackData();
    }
  } catch (err) {
    console.error('Error loading local fallback database, reseeding:', err);
    seedFallbackData();
  }
};

// Initialize fallback DB cache
loadFallbackFromFile();

// Define clean Database operations API
export const db = {
  students: {
    find: async (query = {}) => {
      return fallbackData.students.filter(s => {
        for (let key in query) {
          if (s[key] !== query[key]) return false;
        }
        return true;
      });
    },
    findOne: async (query = {}) => {
      return fallbackData.students.find(s => {
        for (let key in query) {
          if (s[key] !== query[key]) return false;
        }
        return true;
      }) || null;
    },
    create: async (studentData) => {
      const newStudent = {
        id: 'STU-' + (1000 + fallbackData.students.length + 1),
        ...studentData,
        password: studentData.password ? hashPassword(studentData.password) : hashPassword('student123')
      };
      fallbackData.students.push(newStudent);
      saveFallbackToFile();
      return newStudent;
    }
  },

  admins: {
    find: async (query = {}) => {
      return fallbackData.admins.filter(a => {
        for (let key in query) {
          if (a[key] !== query[key]) return false;
        }
        return true;
      });
    },
    findOne: async (query = {}) => {
      return fallbackData.admins.find(a => {
        for (let key in query) {
          if (a[key] !== query[key]) return false;
        }
        return true;
      }) || null;
    }
  },

  complaints: {
    find: async (query = {}) => {
      return fallbackData.complaints.filter(c => {
        for (let key in query) {
          if (query[key] !== undefined && c[key] !== query[key]) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    findById: async (id) => {
      return fallbackData.complaints.find(c => c.id === id) || null;
    },
    findOne: async (query = {}) => {
      return fallbackData.complaints.find(c => {
        for (let key in query) {
          if (c[key] !== query[key]) return false;
        }
        return true;
      }) || null;
    },
    create: async (complaintData) => {
      // Generate ID like CMP-2026-005
      const year = new Date().getFullYear();
      const count = fallbackData.complaints.length + 1;
      const id = `CMP-${year}-${String(count).padStart(3, '0')}`;
      
      const newComplaint = {
        id,
        title: complaintData.title,
        description: complaintData.description,
        department: complaintData.department,
        category: complaintData.category || 'General',
        priority: complaintData.priority || 'Low',
        status: 'Submitted',
        studentId: complaintData.studentId,
        anonymous: complaintData.anonymous || false,
        attachments: complaintData.attachments || '',
        assignedStaff: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      fallbackData.complaints.push(newComplaint);
      saveFallbackToFile();
      return newComplaint;
    },
    update: async (id, updates) => {
      const index = fallbackData.complaints.findIndex(c => c.id === id);
      if (index === -1) return null;
      
      fallbackData.complaints[index] = {
        ...fallbackData.complaints[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveFallbackToFile();
      return fallbackData.complaints[index];
    },
    delete: async (id) => {
      const index = fallbackData.complaints.findIndex(c => c.id === id);
      if (index === -1) return false;
      fallbackData.complaints.splice(index, 1);
      saveFallbackToFile();
      return true;
    }
  },

  notifications: {
    find: async (query = {}) => {
      return fallbackData.notifications.filter(n => {
        for (let key in query) {
          if (n[key] !== query[key]) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    create: async (notifData) => {
      const newNotif = {
        id: 'notif-' + Math.random().toString(36).substr(2, 9),
        userId: notifData.userId,
        message: notifData.message,
        type: notifData.type || 'status_update',
        read: false,
        createdAt: new Date().toISOString()
      };
      fallbackData.notifications.push(newNotif);
      saveFallbackToFile();
      return newNotif;
    },
    markAsRead: async (userId) => {
      fallbackData.notifications.forEach(n => {
        if (n.userId === userId) n.read = true;
      });
      saveFallbackToFile();
      return true;
    }
  }
};
