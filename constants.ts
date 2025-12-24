
import { Student, FeeRecord, ClassSession, Assignment, TransportRoute, LibraryBook, UserRole } from './types';

// RICH MOCK DATA FOR DEMO MODE
export const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Alex Chen', gradeLevel: 10, gpa: 3.8, attendance: 98, behaviorScore: 95, riskLevel: 'Low', notes: 'Excellent logic skills.' },
  { id: 's2', name: 'Samira Khan', gradeLevel: 10, gpa: 2.4, attendance: 85, behaviorScore: 88, riskLevel: 'High', notes: 'Struggling with Physics.' },
  { id: 's3', name: 'Jordan Smith', gradeLevel: 11, gpa: 3.1, attendance: 92, behaviorScore: 75, riskLevel: 'Medium', notes: 'Distracted in class.' },
  { id: 's4', name: 'Maria Garcia', gradeLevel: 9, gpa: 4.0, attendance: 100, behaviorScore: 99, riskLevel: 'Low', notes: 'Potential scholarship candidate.' },
  { id: 's5', name: 'Kevin O\'Connor', gradeLevel: 12, gpa: 1.9, attendance: 70, behaviorScore: 60, riskLevel: 'High', notes: 'At risk of dropping out.' },
];

export const MOCK_FEES: FeeRecord[] = [
  { id: 'f1', studentId: 's1', studentName: 'Alex Chen', amount: 5000, dueDate: '2024-05-01', status: 'Paid', type: 'Tuition' },
  { id: 'f2', studentId: 's2', studentName: 'Samira Khan', amount: 5000, dueDate: '2024-05-01', status: 'Pending', type: 'Tuition' },
  { id: 'f3', studentId: 's5', studentName: 'Kevin O\'Connor', amount: 200, dueDate: '2024-04-15', status: 'Overdue', type: 'Lab' },
];

export const MOCK_CLASSES: ClassSession[] = [
  { id: 'c1', name: 'Adv. Physics', teacherId: 'Dr. Sarah', schedule: '09:00 AM', room: 'Lab 301', students: 24, subject: 'Physics' },
  { id: 'c2', name: 'World History', teacherId: 'Mr. James', schedule: '10:30 AM', room: 'Hall B', students: 30, subject: 'History' },
  { id: 'c3', name: 'AI Ethics', teacherId: 'Prof. Ada', schedule: '01:00 PM', room: 'Virtual', students: 150, subject: 'CS' },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'a1', title: 'Quantum Mechanics Essay', classId: 'c1', dueDate: '2024-05-10', submissions: 20, total: 24 },
  { id: 'a2', title: 'Calculus Midterm', classId: 'c2', dueDate: '2024-05-15', submissions: 0, total: 30 },
];

export const MOCK_TRANSPORT: TransportRoute[] = [
  { id: 't1', route: 'North Sector Loop', driver: 'John D.', status: 'Active', fuel: 78, plate: 'LX-8821' },
  { id: 't2', route: 'Downtown Express', driver: 'Sarah M.', status: 'Maintenance', fuel: 12, plate: 'LX-9901' },
];

export const MOCK_LIBRARY: LibraryBook[] = [
  { id: 'b1', title: 'The Neuromancer', author: 'William Gibson', status: 'Available', category: 'Sci-Fi' },
  { id: 'b2', title: 'Dune', author: 'Frank Herbert', status: 'Checked Out', category: 'Sci-Fi' },
];

export const SUBJECT_SUGGESTIONS = [
  // Science
  "Quantum Mechanics",
  "Photosynthesis",
  "Organic Chemistry",
  "Astrophysics",
  "Plate Tectonics",
  "Human Anatomy",
  "Genetics & DNA",
  "Electromagnetism",
  "Thermodynamics",
  "Marine Biology",
  
  // Mathematics
  "Calculus: Integrals",
  "Linear Algebra",
  "Statistics & Probability",
  "Trigonometry",
  "Number Theory",
  "Differential Equations",
  
  // Technology & CS
  "Artificial Intelligence",
  "Blockchain Technology",
  "Cybersecurity Basics",
  "Python Programming",
  "Web Development",
  "Cloud Computing",
  "Machine Learning",
  "Data Structures",
  
  // Humanities & History
  "World War II",
  "The Renaissance",
  "Ancient Egypt",
  "Microeconomics",
  "Macroeconomics",
  "Political Science",
  "World Religions",
  "Modern Literature",
  "Philosophy 101",
  "Social Psychology",
  
  // Arts & Others
  "Music Theory",
  "Art History",
  "Digital Marketing",
  "Entrepreneurship",
  "Creative Writing"
];
