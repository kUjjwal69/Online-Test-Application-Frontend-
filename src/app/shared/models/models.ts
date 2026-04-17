// ─── Auth Models ─────────────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  Email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  username: string;
  role: string;
  expiresAt: string;
}

export interface DecodedToken {
  sub: string;
  username?: string;
  email?: string;
  name: string;
  role: string;
  exp: number;
  iat: number;
}

// ─── User Models ──────────────────────────────────────────────────────
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Test Models ──────────────────────────────────────────────────────
export interface Test {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  isActive: boolean;
  screenshotIntervalSeconds: number;
  maxViolations: number;
  createdAt: string;
  updatedAt: string;
  questionCount?: number;
}

export interface CreateTestRequest {
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  isActive: boolean;
  screenshotIntervalSeconds: number;
  maxViolations: number;
}

// ─── Question Models ──────────────────────────────────────────────────
export interface Question {
  id: string;
  testId: string;
  questionText: string;
  options: QuestionOption[];
  marks: number;
  order: number;
}

export interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect?: boolean; // only visible to admin
}

export interface CreateQuestionRequest {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption:string;
  marks: number;
  order: number;
}

export interface CreateOptionRequest {
  optionText: string;
  isCorrect: boolean;
}

// ─── Test Assignment Models ────────────────────────────────────────────
export interface TestAssignment {
  id: string;
  sessionId?: string;
  testId: string;
  userId: string;
  testTitle: string;
  userName: string;
  userEmail: string;
  assignedAt: string;
  expiresAt?: string;
  status: AssignmentStatus;
}

export type AssignmentStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Suspended';

export interface AssignTestRequest {
  testId: string;
  userId?: string;
  userIds: string[];
  expiresAt?: string;
}

// ─── Test Session Models ───────────────────────────────────────────────
export interface TestSession {
  id: string;
  testId: string;
  userId: string;
  testTitle: string;
  userName: string;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  score?: number;
  percentage?: number;
  violationCount: number;
  isSuspended: boolean;
  suspendReason?: string;
  timeRemainingSeconds?: number;
}

export type SessionStatus = 'Active' | 'Completed' | 'Suspended' | 'Abandoned';

export interface StartSessionRequest {
  testId: string;
}

export interface StartSessionResponse {
  sessionId: string;
  testId: string;
  testTitle: string;
  durationMinutes: number;
  screenshotIntervalSeconds: number;
  maxViolations: number;
  startTime: string;
  questions: Question[];
}

// ─── Answer Models ─────────────────────────────────────────────────────
export interface SubmitAnswerRequest {
  questionId: string;
  selectedOptionId: string;
}

export interface SubmitTestRequest {
sessionId: string;
  testTitle: string;
  totalMarks: number;
  PassingMarks: number;
  score: number;
  percentage: number;
  Ispassed: boolean;
  status: string;
  startTime: Date;
  endTime: Date;
  violationCount: number;
  totalQuestions: number;
  correctAnswers: number;
  errotrs?: string[];
}

export interface GetMyResult {
[x: string]: any;
  sessionId: string;
  testTitle: string;
  totalMarks: number;
  passingMarks: number;
  score: number;
  percentage: number;
  isPassed: boolean;
  status: string;
  startTime: string;
  endTime: string;
  violationCount: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface TestResult {
  data: any;
  sessionId: string;
  testTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
  correctAnswers: number;
  totalQuestions: number;
  questionResults?: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  marks: number;
}

// ─── Proctoring Models ──────────────────────────────────────────────────
export interface ScreenshotRequest {
  sessionId: string;
  imageBase64: string;
  capturedAt: string;
}

export interface ViolationRequest {
  sessionId: string;
  violationType: ViolationType;
  description: string;
  occurredAt: string;
}

export type ViolationType = 'TabSwitch' | 'WindowBlur' | 'FullscreenExit' | 'CopyPaste' | 'ContextMenu' | 'KeyboardShortcut';

export interface Violation {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  violationType: ViolationType;
  description: string;
  occurredAt: string;
}

export interface Screenshot {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  imageUrl: string;
  filePath?: string;
  imageBase64?: string;
  capturedAt: string;
}

export interface VideoChunkRequest {
  sessionId: string;
  chunkIndex: number;
  videoBase64: string;
  sourceType: 'screen' | 'webcam';
  capturedAt: string;
}

export interface SuspendSessionRequest {
  sessionId: string;
  reason: string;
}

// ─── API Response Wrapper ───────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
