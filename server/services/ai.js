/**
 * CampusVoice AI Engine - Rule-based NLP for Complaint Categorization
 */

const DEPARTMENT_KEYWORDS = [
  {
    dept: 'Hostel',
    keywords: ['hostel', 'room', 'roommate', 'bed', 'warden', 'mess', 'dorm', 'pillow', 'mattress']
  },
  {
    dept: 'IT Support',
    keywords: ['wifi', 'wi-fi', 'internet', 'router', 'connection', 'network', 'login', 'portal', 'laptop', 'desktop', 'computer', 'server', 'email', 'software', 'moodle']
  },
  {
    dept: 'Canteen',
    keywords: ['canteen', 'food', 'cafeteria', 'lunch', 'dinner', 'breakfast', 'mess food', 'hygiene', 'plate', 'water filter', 'menu']
  },
  {
    dept: 'Transport',
    keywords: ['bus', 'shuttle', 'transport', 'cab', 'driver', 'parking', 'garage', 'vehicle', 'route']
  },
  {
    dept: 'Academic',
    keywords: ['class', 'lecture', 'professor', 'exam', 'grade', 'syllabus', 'attendance', 'lab manual', 'projector', 'classroom', 'desk', 'bench', 'blackboard', 'whiteboard']
  },
  {
    dept: 'Security',
    keywords: ['security', 'guard', 'gate', 'theft', 'stolen', 'cctv', 'camera', 'harass', 'fight', 'stranger', 'card', 'id card', 'lock']
  },
  {
    dept: 'Maintenance',
    // Catch-all for basic plumbing/structural repairs
    keywords: ['fan', 'light', 'ac', 'cooler', 'switch', 'socket', 'wire', 'plug', 'tap', 'leak', 'plumber', 'pipe', 'drain', 'basin', 'toilet', 'flush', 'door', 'window', 'wall', 'paint', 'plumbing', 'electrical', 'elevator', 'lift']
  }
];

const CATEGORY_MAPPINGS = [
  { category: 'Plumbing', keywords: ['leak', 'tap', 'pipe', 'drain', 'water', 'basin', 'toilet', 'flush', 'sink', 'plumber', 'clog', 'overflow'] },
  { category: 'Electrical', keywords: ['fan', 'light', 'ac', 'cooler', 'switch', 'socket', 'wire', 'plug', 'power', 'shock', 'fuse', 'generator', 'bulb'] },
  { category: 'Network', keywords: ['wifi', 'wi-fi', 'internet', 'router', 'connection', 'network', 'signal', 'offline', 'bandwidth'] },
  { category: 'Furniture', keywords: ['desk', 'chair', 'table', 'bench', 'bed', 'cupboard', 'wardrobe', 'drawer', 'furniture'] },
  { category: 'Food & Hygiene', keywords: ['food', 'insect', 'cockroach', 'hair', 'taste', 'dirty', 'hygiene', 'cleanliness', 'spill', 'dustbin'] },
  { category: 'Safety & Security', keywords: ['theft', 'stolen', 'guard', 'fight', 'stranger', 'harass', 'lock', 'broken window', 'cctv', 'card'] },
  { category: 'Academic Infrastructure', keywords: ['projector', 'blackboard', 'whiteboard', 'speaker', 'mic', 'air conditioner', 'lab equipment'] }
];

const HIGH_PRIORITY_KEYWORDS = [
  'leak', 'flood', 'overflow', 'shock', 'fire', 'harass', 'fight', 'theft', 'stolen', 'broken lock', 'injury', 'medical', 'emergency', 'blackout', 'short circuit'
];

const MEDIUM_PRIORITY_KEYWORDS = [
  'not working', 'offline', 'broken', 'slow', 'no signal', 'clicking', 'smell', 'no water', 'fan', 'ac', 'cooler', 'projector'
];

export function analyzeComplaintText(text = '') {
  const lowerText = text.toLowerCase();
  
  // 1. Identify Department
  let department = 'Maintenance'; // default fallback
  let maxDeptScore = 0;
  
  for (const group of DEPARTMENT_KEYWORDS) {
    let score = 0;
    for (const kw of group.keywords) {
      if (lowerText.includes(kw)) {
        score += 1;
        // Higher weight if exact match is found near the start
        if (lowerText.startsWith(kw)) score += 2;
      }
    }
    if (score > maxDeptScore) {
      maxDeptScore = score;
      department = group.dept;
    }
  }

  // 2. Identify Category
  let category = 'General';
  let maxCatScore = 0;
  
  for (const group of CATEGORY_MAPPINGS) {
    let score = 0;
    for (const kw of group.keywords) {
      if (lowerText.includes(kw)) {
        score += 1;
      }
    }
    if (score > maxCatScore) {
      maxCatScore = score;
      category = group.category;
    }
  }

  // 3. Suggest Priority
  let priority = 'Low';
  
  const hasHigh = HIGH_PRIORITY_KEYWORDS.some(kw => lowerText.includes(kw));
  const hasMedium = MEDIUM_PRIORITY_KEYWORDS.some(kw => lowerText.includes(kw));
  
  if (hasHigh) {
    priority = 'High';
  } else if (hasMedium) {
    priority = 'Medium';
  }
  
  return {
    department,
    category,
    priority
  };
}
