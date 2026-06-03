import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campusvoice_secret_key_12345';

// Student Login
router.post('/student/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or rollNumber
  if (!identifier || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Find student by email or rollNumber
    let student = await db.students.findOne({ email: identifier });
    if (!student) {
      student = await db.students.findOne({ rollNumber: identifier });
    }

    if (!student) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student.id, email: student.email, name: student.name, role: 'student', rollNumber: student.rollNumber },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        department: student.department,
        role: 'student'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student Registration (optional convenience, but good for testability)
router.post('/student/register', async (req, res) => {
  const { name, rollNumber, email, password, department } = req.body;
  if (!name || !rollNumber || !email || !password || !department) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingEmail = await db.students.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingRoll = await db.students.findOne({ rollNumber });
    if (existingRoll) {
      return res.status(400).json({ message: 'Roll number already registered' });
    }

    const newStudent = await db.students.create({
      name,
      rollNumber,
      email,
      password,
      department
    });

    const token = jwt.sign(
      { id: newStudent.id, email: newStudent.email, name: newStudent.name, role: 'student', rollNumber: newStudent.rollNumber },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        rollNumber: newStudent.rollNumber,
        department: newStudent.department,
        role: 'student'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const admin = await db.admins.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, role: 'admin', adminRole: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        adminRole: admin.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
