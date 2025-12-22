
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'demo' | 'developer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface SchoolConfig {
    name: string;
    motto: string;
    logoUrl?: string;
    primaryColor: string; // Hex code
    isConfigured: boolean;
    websiteContext?: string; // New field: Stores the "Brain" of the school (policies, ethos)
    
    // New Power Features
    modules?: {
        transport: boolean;
        library: boolean;
        finance: boolean;
        nexus: boolean;
    };
    systemSettings?: {
        securityLevel: 'standard' | 'high' | 'fortress';
        aiCreativity: number; // 0 to 100
    };
}

export interface Student {
  id: string;
  name: string;
  gradeLevel: number; // 1-12
  gpa: number; // 0.0 - 4.0
  attendance: number; // Percentage 0-100
  behaviorScore: number; // 0-100
  notes: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  predictedOutcome?: string;
  parentId?: string;
  classId?: string;
  xp?: number;
  level?: number;
  badges?: string[];
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  type: 'Tuition' | 'Lab' | 'Transport' | 'Exam';
}

export interface ClassSession {
  id: string;
  name: string;
  teacherId: string;
  schedule: string; // e.g., "Mon 10:00 AM"
  room: string;
  students: number;
  subject: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  dueDate: string;
  submissions: number;
  total: number;
}

export enum AgentName {
  ASTRA = 'Astra', // ML/Prediction
  LUMEN = 'Lumen', // Analytics
  VEGA = 'Vega',   // Dashboard/UX
  NOVA = 'Nova',   // Backend/System
  LUMIX = 'LumiX Assistant', // Integration (Formerly Orion)
  LEXI = 'Lexi',   // Ethics/Bias
}

export interface AgentLog {
  id: string;
  timestamp: Date;
  agent: AgentName;
  action: string;
  status: 'success' | 'warning' | 'error' | 'processing';
  details?: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  averageGPA: number;
  averageAttendance: number;
  atRiskCount: number;
  revenue?: number;
  pendingFees?: number;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  agent: AgentName;
}

export interface TransportRoute {
  id: string;
  route: string;
  driver: string;
  status: string;
  fuel: number;
  plate: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  status: string;
  category: string;
}