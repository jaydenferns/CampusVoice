import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { analyzeComplaintText } from '../services/ai.js';

const router = express.Router();

// Helper to check for duplicate complaints
const findDuplicateComplaint = async (title, description, department) => {
  const allComplaints = await db.complaints.find({ department });
  const textToCheck = `${title} ${description}`.toLowerCase();
  
  // Locations we track in campus voice
  const locations = ['hostel a', 'hostel b', 'library', 'canteen', 'sports complex', 'academic block'];
  const foundLocation = locations.find(loc => textToCheck.includes(loc));
  
  for (const comp of allComplaints) {
    // Only check unresolved complaints
    if (['Resolved', 'Closed'].includes(comp.status)) continue;
    
    const compText = `${comp.title} ${comp.description}`.toLowerCase();
    
    // Check location match
    if (foundLocation && compText.includes(foundLocation)) {
      // Check keyword similarity (e.g., wifi/router, tap/leak/water, fan/ac/cooler)
      const keywordGroups = [
        ['wifi', 'internet', 'router', 'connection', 'network'],
        ['tap', 'pipe', 'water', 'leak', 'plumbing', 'toilet', 'flush'],
        ['fan', 'ac', 'cooler', 'light', 'electricity', 'socket'],
        ['food', 'mess', 'canteen', 'hygiene'],
        ['desk', 'chair', 'table', 'bench']
      ];
      
      for (const group of keywordGroups) {
        const hasKeywordMatch = group.some(kw => textToCheck.includes(kw)) && group.some(kw => compText.includes(kw));
        if (hasKeywordMatch) {
          return comp; // Found a duplicate!
        }
      }
    }
  }
  return null;
};

// 1. Get Complaints (Students get their own, Admins get all)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const all = await db.complaints.find();
      // Join student name for admins if they are not anonymous
      const resolvedList = await Promise.all(all.map(async (c) => {
        if (c.anonymous) {
          return { ...c, studentName: 'Anonymous Student' };
        }
        const student = await db.students.findOne({ id: c.studentId });
        return { ...c, studentName: student ? student.name : 'Unknown Student' };
      }));
      res.json(resolvedList);
    } else {
      const studentComplaints = await db.complaints.find({ studentId: req.user.id });
      res.json(studentComplaints);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Check Duplicate Before Submitting
router.post('/check-duplicate', authMiddleware, async (req, res) => {
  const { title, description, department } = req.body;
  if (!title || !department) {
    return res.status(400).json({ message: 'Title and Department are required' });
  }
  try {
    const duplicate = await findDuplicateComplaint(title, description || '', department);
    if (duplicate) {
      return res.json({
        found: true,
        complaint: duplicate
      });
    }
    res.json({ found: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Create Complaint
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, department, category, priority, anonymous, attachments } = req.body;
  if (!title || !description || !department) {
    return res.status(400).json({ message: 'Title, description and department are required' });
  }

  try {
    const newComplaint = await db.complaints.create({
      title,
      description,
      department,
      category,
      priority,
      studentId: req.user.id,
      anonymous: anonymous || false,
      attachments: attachments || ''
    });

    // Create student notification
    await db.notifications.create({
      userId: req.user.id,
      message: `Your complaint ${newComplaint.id} has been submitted successfully.`,
      type: 'submitted'
    });

    res.status(201).json(newComplaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. Update Complaint Status / Assign Staff (Admin Only)
router.patch('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { id } = req.params;
  const { status, assignedStaff } = req.body;

  try {
    const complaint = await db.complaints.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (assignedStaff !== undefined) updates.assignedStaff = assignedStaff;

    const updated = await db.complaints.update(id, updates);

    // Notify Student
    let message = `Your complaint ${id} has been updated.`;
    let type = 'status_update';
    if (status === 'Assigned' && assignedStaff) {
      message = `Your complaint ${id} has been assigned to ${assignedStaff}.`;
      type = 'assigned';
    } else if (status === 'In Progress') {
      message = `Work has started on your complaint ${id}.`;
      type = 'status_update';
    } else if (status === 'Resolved') {
      message = `Your complaint ${id} is resolved. Please provide feedback!`;
      type = 'resolved';
    }

    await db.notifications.create({
      userId: complaint.studentId,
      message,
      type
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 5. Rate Complaint Resolution (Student Only)
router.post('/:id/rate', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { speed, behavior, satisfaction, feedback } = req.body;

  if (speed === undefined || behavior === undefined || satisfaction === undefined) {
    return res.status(400).json({ message: 'Ratings are required for Speed, Staff Behavior, and Satisfaction' });
  }

  try {
    const complaint = await db.complaints.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updated = await db.complaints.update(id, {
      rating: {
        speed: Number(speed),
        behavior: Number(behavior),
        satisfaction: Number(satisfaction),
        feedback: feedback || ''
      },
      status: 'Closed' // Auto close after rating
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 6. Delete Complaint (Admin Only)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { id } = req.params;
  try {
    const deleted = await db.complaints.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 7. AI Analyze Complaint Text
router.post('/ai-analyze', authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Text input is required' });
  }
  try {
    const analysis = analyzeComplaintText(text);
    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 8. Notifications endpoints
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await db.notifications.find({ userId: req.user.id });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/notifications/read', authMiddleware, async (req, res) => {
  try {
    await db.notifications.markAsRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 9. Analytics endpoint
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const complaints = await db.complaints.find();
    
    // Total numbers
    const total = complaints.length;
    const open = complaints.filter(c => ['Submitted', 'Assigned', 'In Progress'].includes(c.status)).length;
    const resolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
    
    // Average resolution time (mock or calculated)
    const avgResolutionTime = "18 hours";

    // Recharts Data 1: Complaints by Department
    const depts = ['Hostel', 'Maintenance', 'Security', 'IT Support', 'Transport', 'Canteen', 'Academic'];
    const byDept = depts.map(d => ({
      name: d,
      value: complaints.filter(c => c.department === d).length
    }));

    // Recharts Data 2: Complaints by Priority
    const priorities = ['High', 'Medium', 'Low'];
    const byPriority = priorities.map(p => ({
      name: p,
      value: complaints.filter(c => c.priority === p).length
    }));

    // Recharts Data 3: Trends (last 6 months, mock combined with count)
    const trends = [
      { month: 'Jan', complaints: 12, resolved: 10 },
      { month: 'Feb', complaints: 18, resolved: 15 },
      { month: 'Mar', complaints: 24, resolved: 20 },
      { month: 'Apr', complaints: 15, resolved: 13 },
      { month: 'May', complaints: total + 4, resolved: resolved + 2 },
      { month: 'Jun', complaints: total, resolved: resolved }
    ];

    // Recharts Data 4: Rating Breakdown
    let totalSpeed = 0, totalBehavior = 0, totalSatisfaction = 0, ratingCount = 0;
    complaints.forEach(c => {
      if (c.rating) {
        totalSpeed += c.rating.speed;
        totalBehavior += c.rating.behavior;
        totalSatisfaction += c.rating.satisfaction;
        ratingCount += 1;
      }
    });

    const averageRatings = {
      speed: ratingCount > 0 ? Number((totalSpeed / ratingCount).toFixed(1)) : 4.2,
      behavior: ratingCount > 0 ? Number((totalBehavior / ratingCount).toFixed(1)) : 4.5,
      satisfaction: ratingCount > 0 ? Number((totalSatisfaction / ratingCount).toFixed(1)) : 4.1,
      totalRatings: ratingCount
    };

    // Campus Heatmap - location active count
    // Hostel A, Hostel B, Library, Canteen, Sports Complex, Academic Block
    const locations = [
      { name: 'Hostel A', count: 0 },
      { name: 'Hostel B', count: 0 },
      { name: 'Library', count: 0 },
      { name: 'Canteen', count: 0 },
      { name: 'Sports Complex', count: 0 },
      { name: 'Academic Block', count: 0 }
    ];

    complaints.forEach(c => {
      if (['Resolved', 'Closed'].includes(c.status)) return;
      const text = `${c.title} ${c.description}`.toLowerCase();
      locations.forEach(loc => {
        if (text.includes(loc.name.toLowerCase())) {
          loc.count += 1;
        }
      });
    });

    res.json({
      summary: { total, open, resolved, avgResolutionTime },
      byDept,
      byPriority,
      trends,
      averageRatings,
      heatmap: locations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
