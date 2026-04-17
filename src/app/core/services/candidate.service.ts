import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import {
  TestAssignment, StartSessionRequest, StartSessionResponse, Question,
  SubmitAnswerRequest, TestResult,
  ApiResponse,
  GetMyResult
} from '../../shared/models/models';
import { API_ENDPOINTS } from '../config/api-endpoints';

@Injectable({ providedIn: 'root' })
export class CandidateService {
  private readonly candidateApiUrl = API_ENDPOINTS.candidate;

  constructor(private http: HttpClient) {}

  getMyAssignments(): Observable<TestAssignment[]> {
    return this.http.get<any>(`${this.candidateApiUrl}/tests`).pipe(
      map(response => this.unwrapListResponse(response)),
      map(items => items.map(item => this.normalizeAssignment(item)))
    );
  }

  startSession(testId: string, request: StartSessionRequest): Observable<StartSessionResponse> {
    return this.http.post<any>(
      `${this.candidateApiUrl}/tests/${testId}/start`,
      request
    ).pipe(
      timeout(30000),
      map(response => this.unwrapItemResponse<any>(response)),
      map(payload => this.normalizeStartSession(payload))
    );
  }

  getSessionResult(sessionId: string): Observable<TestResult> {
    return this.http.get<any>(
      `${this.candidateApiUrl}/sessions/${sessionId}/result`
    ).pipe(
      map(response => this.normalizeTestResult(this.unwrapItemResponse<any>(response)))
    );
  }

  submitAnswer(sessionId: string, request: SubmitAnswerRequest): Observable<void> {
    const selectedOption = request.selectedOptionId;
    const payload = {
      questionId: request.questionId,
      selectedOptionId: selectedOption,
      selectedOption,
      SelectedOption: selectedOption
    };

    return this.http.post<void>(`${this.candidateApiUrl}/sessions/${sessionId}/answers`, payload);
  }

  submitTest(sessionId: string, request: SubmitAnswerRequest): Observable<TestResult> {
    const selectedOption = request.selectedOptionId || 'A';
    const payload = {
      questionId: request.questionId,
      selectedOptionId: selectedOption,
      selectedOption,
      SelectedOption: selectedOption
    };

    return this.http.post<any>(`${this.candidateApiUrl}/sessions/${sessionId}/submit`, payload).pipe(
      map(response => this.normalizeTestResult(this.unwrapItemResponse<any>(response)))
    );
  }

  getSessionStatus(sessionId: string): Observable<{ status: string; isSuspended: boolean; suspendReason?: string }> {
    return this.http.get<any>(`${this.candidateApiUrl}/sessions/${sessionId}/status`);
  }

  getMyResults(sessionId: string): Observable<ApiResponse<GetMyResult>> {
    return this.http.get<ApiResponse<GetMyResult>>(
      `${this.candidateApiUrl}/sessions/${sessionId}/result`
    );
  }

  getSessionQuestions(sessionId: string, testId: string): Observable<Question[]> {
    const endpoints = [
      `${this.candidateApiUrl}/sessions/${sessionId}/questions`,

    ];

    return this.http.get<any>(endpoints[0]).pipe(
      map(response => this.extractQuestions(response)),
      map(items => items.map((q, index) => this.normalizeQuestion(q, index))),
      catchError(() =>
        this.http.get<any>(endpoints[1]).pipe(
          map(response => this.extractQuestions(response)),
          map(items => items.map((q, index) => this.normalizeQuestion(q, index))),
          catchError(() =>
            this.http.get<any>(endpoints[2]).pipe(
              map(response => this.extractQuestions(response)),
              map(items => items.map((q, index) => this.normalizeQuestion(q, index))),
              catchError(() => of([]))
            )
          )
        )
      )
    );
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  private unwrapItemResponse<T>(response: any): T {
    if (response && typeof response === 'object') {
      const data = response.data ?? response.Data;
      if (data !== undefined && data !== null) return data as T;
    }
    return response as T;
  }

  private unwrapListResponse(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (!response || typeof response !== 'object') return [];

    const data = response.data ?? response.Data;
    if (Array.isArray(data)) return data;

    if (data && typeof data === 'object') {
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.Items)) return data.Items;
      if (Array.isArray(data.$values)) return data.$values;
    }

    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.Items)) return response.Items;
    if (Array.isArray(response.$values)) return response.$values;

    return [];
  }

  private normalizeAssignment(raw: any): TestAssignment {
    if (!raw || typeof raw !== 'object') {
      return this.emptyAssignment();
    }

    const src = raw as Record<string, any>;
    const user = (src['user'] ?? src['User'] ?? {}) as Record<string, any>;
    const test = (src['test'] ?? src['Test'] ?? {}) as Record<string, any>;
    const session = this.readObj(src, ['session', 'Session', 'testSession', 'TestSession']);
    const statusRaw =
      this.readStr(src, ['status', 'Status', 'assignmentStatus', 'AssignmentStatus', 'testStatus', 'TestStatus', 'sessionStatus', 'SessionStatus']) ??
      '';

    return {
      id: this.readStr(src, ['id', 'Id', 'assignmentId', 'AssignmentId']) ?? '',
      sessionId: this.readStr(src, ['sessionId', 'SessionId', 'testSessionId', 'TestSessionId'])
              ?? this.readStr(session, ['id', 'Id', 'sessionId', 'SessionId'])
              ?? undefined,
      testId: this.readStr(src, ['testId', 'TestId', 'examId', 'ExamId'])
           ?? this.readStr(test, ['id', 'Id']) ?? '',
      userId: this.readStr(src, ['userId', 'UserId', 'candidateId', 'CandidateId', 'assignedUserId', 'AssignedUserId'])
           ?? this.readStr(user, ['id', 'Id', 'userId', 'UserId']) ?? '',
      testTitle: this.readStr(src, ['testTitle', 'TestTitle', 'title', 'Title', 'examTitle', 'ExamTitle', 'name', 'Name'])
              ?? this.readStr(test, ['title', 'Title', 'name', 'Name']) ?? 'Untitled Test',
      userName: this.readStr(src, ['userName', 'UserName', 'candidateName', 'CandidateName', 'fullName', 'FullName'])
             ?? this.readStr(user, ['fullName', 'FullName', 'name', 'Name', 'username', 'Username', 'email', 'Email']) ?? '',
      userEmail: this.readStr(src, ['userEmail', 'UserEmail', 'candidateEmail', 'CandidateEmail', 'email', 'Email'])
              ?? this.readStr(user, ['email', 'Email', 'username', 'Username']) ?? '',
      assignedAt: this.readStr(src, ['assignedAt', 'AssignedAt', 'createdAt', 'CreatedAt', 'createdOn', 'CreatedOn', 'assignedDate', 'AssignedDate']) ?? '',
      expiresAt: this.readStr(src, ['expiresAt', 'ExpiresAt', 'expirationDate', 'ExpirationDate', 'expiry', 'Expiry']) ?? undefined,
      status: this.normalizeStatus(
        statusRaw || (
          this.readStr(src, ['completedAt', 'CompletedAt', 'endTime', 'EndTime', 'submittedAt', 'SubmittedAt']) ? 'Completed' : ''
        ) || (
          this.readBool(src, ['isCompleted', 'IsCompleted', 'completed', 'Completed']) ? 'Completed' : ''
        ) || (
          this.readBool(src, ['isInProgress', 'IsInProgress']) ? 'InProgress' : ''
        )
      )
    };
  }

  private normalizeStatus(raw: string): TestAssignment['status'] {
  const s = raw?.trim().toLowerCase().replace(/[\s_-]+/g, '');

  if (s === 'notstarted' || s === 'pending' || s === '') return 'NotStarted';

  if (s === 'inprogress' || s === 'active' || s === 'started') return 'InProgress';

  if (
    s === 'completed' ||
    s === 'done' ||
    s === 'finished' ||
    s === 'submitted' ||
    s === 'passed' ||
    s === 'success'
  ) return 'Completed';

  if (
    s === 'suspended' ||
    s === 'blocked' ||
    s === 'banned' ||
    s === 'disabled' ||
    s === 'inactive'
  ) return 'Suspended';

  return 'NotStarted'; // safe default
}
  private readStr(source: Record<string, any>, keys: string[]): string | null {
    for (const key of keys) {
      const val = source[key];
      if (typeof val === 'string' && val.trim()) return val;
    }
    return null;
  }

  private readBool(source: Record<string, any>, keys: string[]): boolean | null {
    for (const key of keys) {
      const val = source[key];
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const normalized = val.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
      }
    }
    return null;
  }

  private emptyAssignment(): TestAssignment {
    return {
      id: '', testId: '', userId: '', testTitle: 'Untitled Test',
      userName: '', userEmail: '', assignedAt: '', status: 'NotStarted'
    };
  }

  private normalizeStartSession(raw: any): StartSessionResponse {
    const src = (raw && typeof raw === 'object') ? raw as Record<string, any> : {};
    const testObj = this.readObj(src, ['test', 'Test']);
    const questionsRaw = this.pickNonEmptyArray(
      this.readArray(src, ['questions', 'Questions', 'testQuestions', 'TestQuestions', 'questionDtos', 'QuestionDtos']),
      this.readArray(testObj, ['questions', 'Questions', 'testQuestions', 'TestQuestions', 'questionDtos', 'QuestionDtos'])
    );
    const normalizedQuestions = (questionsRaw ?? []).map((q, index) => this.normalizeQuestion(q, index));

    return {
      sessionId: this.readStr(src, ['sessionId', 'SessionId', 'id', 'Id']) ?? '',
      testId: this.readStr(src, ['testId', 'TestId']) ?? this.readStr(testObj, ['id', 'Id']) ?? '',
      testTitle: this.readStr(src, ['testTitle', 'TestTitle', 'title', 'Title']) ?? this.readStr(testObj, ['title', 'Title', 'name', 'Name']) ?? 'Untitled Test',
      durationMinutes: this.readNum(src, ['durationMinutes', 'DurationMinutes']) ?? 0,
      screenshotIntervalSeconds: this.readNum(src, ['screenshotIntervalSeconds', 'ScreenshotIntervalSeconds']) ?? 30,
      maxViolations: this.readNum(src, ['maxViolations', 'MaxViolations']) ?? 3,
      startTime: this.readStr(src, ['startTime', 'StartTime']) ?? new Date().toISOString(),
      questions: normalizedQuestions
    };
  }

  private normalizeQuestion(raw: any, index: number) {
    const src = (raw && typeof raw === 'object') ? raw as Record<string, any> : {};
    const questionObj = this.readObj(src, ['question', 'Question']);
    const optionsRaw = this.pickNonEmptyArray(
      this.readArray(src, ['options', 'Options', 'choices', 'Choices', 'answerOptions', 'AnswerOptions', 'questionOptions', 'QuestionOptions']),
      this.readArray(questionObj, ['options', 'Options', 'choices', 'Choices', 'answerOptions', 'AnswerOptions', 'questionOptions', 'QuestionOptions'])
    ).slice(0, 4);
   return {
  id: this.readStr(src, ['id', 'Id', 'questionId', 'QuestionId']) ?? this.readStr(questionObj, ['id', 'Id']) ?? `q-${index + 1}`,
  testId: this.readStr(src, ['testId', 'TestId']) ?? this.readStr(questionObj, ['testId', 'TestId']) ?? '',
  questionText: this.readStr(src, ['questionText', 'QuestionText', 'text', 'Text', 'question', 'Question', 'statement', 'Statement', 'description', 'Description']) 
                ?? this.readStr(questionObj, ['questionText', 'QuestionText', 'text', 'Text', 'question', 'Question', 'statement', 'Statement', 'description', 'Description']) 
                ?? '',

  // 🔥 THIS IS THE FIX
      options: optionsRaw.length > 0
        ? optionsRaw.map((opt, oi) => this.normalizeQuestionOption(opt, oi))
        : [
            { id: 'A', optionText: src['optionA'] || '' },
            { id: 'B', optionText: src['optionB'] || '' },
        { id: 'C', optionText: src['optionC'] || '' },
        { id: 'D', optionText: src['optionD'] || '' }
      ],

  marks: this.readNum(src, ['marks', 'Marks']) ?? this.readNum(questionObj, ['marks', 'Marks']) ?? 1,
  order: this.readNum(src, ['order', 'Order']) ?? this.readNum(questionObj, ['order', 'Order']) ?? index + 1
};
  }

  private normalizeQuestionOption(raw: any, index: number) {
    const src = (raw && typeof raw === 'object') ? raw as Record<string, any> : {};
    const optionObj = this.readObj(src, ['option', 'Option']);
    return {
      id: this.readStr(src, ['id', 'Id', 'optionId', 'OptionId']) ?? this.readStr(optionObj, ['id', 'Id']) ?? `o-${index + 1}`,
      optionText: this.readStr(src, ['optionText', 'OptionText', 'text', 'Text', 'value', 'Value', 'label', 'Label', 'answerText', 'AnswerText']) ?? this.readStr(optionObj, ['optionText', 'OptionText', 'text', 'Text', 'value', 'Value', 'label', 'Label', 'answerText', 'AnswerText']) ?? ''
    };
  }

  private normalizeTestResult(raw: any): TestResult {
    if (Array.isArray(raw)) {
      const first = raw.find(item => item && typeof item === 'object');
      return this.normalizeTestResult(first ?? null);
    }

    if (!raw || typeof raw !== 'object') {
      return {
  sessionId: '',
  testTitle: '',
  score: 0,
  totalMarks: 0,
  percentage: 0,
  passed: false,
  timeTaken: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  data: undefined,
};
    }

    const src = raw as Record<string, any>;
    const nested =
      (src['data'] ?? src['Data'] ?? src['result'] ?? src['Result'] ?? src['item'] ?? src['Item']) as any;
    if (nested && nested !== raw) {
      const nestedIsObject = typeof nested === 'object';
      if (nestedIsObject) {
        return this.normalizeTestResult(nested);
      }
    }

    return {
  sessionId: this.readStr(src, ['sessionId', 'SessionId', 'id', 'Id']) ?? '',
  testTitle: this.readStr(src, ['testTitle', 'TestTitle', 'title', 'Title', 'testName', 'TestName', 'examTitle', 'ExamTitle']) ?? '',
  score: this.readNum(src, ['score', 'Score', 'obtainedMarks', 'ObtainedMarks', 'marksObtained', 'MarksObtained', 'earnedMarks', 'EarnedMarks', 'totalScore', 'TotalScore']) ?? 0,
  totalMarks: this.readNum(src, ['totalMarks', 'TotalMarks', 'maxMarks', 'MaxMarks', 'testMarks', 'TestMarks']) ?? 0,
  percentage: this.readNum(src, ['percentage', 'Percentage', 'percent', 'Percent']) ?? 0,
  passed: this.readBool(src, ['passed', 'Passed', 'isPassed', 'IsPassed', 'ispass', 'IsPass', 'isSuccessful', 'IsSuccessful']) ?? false,
  timeTaken: this.readNum(src, ['timeTaken', 'TimeTaken', 'duration', 'Duration', 'timeSpent', 'TimeSpent', 'elapsedMinutes', 'ElapsedMinutes']) ?? 0,
  correctAnswers: this.readNum(src, ['correctAnswers', 'CorrectAnswers', 'rightAnswers', 'RightAnswers', 'correctCount', 'CorrectCount']) ?? 0,
  totalQuestions: this.readNum(src, ['totalQuestions', 'TotalQuestions', 'questionCount', 'QuestionCount', 'questionsCount', 'QuestionsCount']) ?? 0,
  questionResults: this.readArray(src, ['questionResults', 'QuestionResults']).map((q: any) => ({
    questionId: this.readStr(q ?? {}, ['questionId', 'QuestionId']) ?? '',
    questionText: this.readStr(q ?? {}, ['questionText', 'QuestionText']) ?? '',
    selectedOptionId: this.readStr(q ?? {}, ['selectedOptionId', 'SelectedOptionId']) ?? '',
    correctOptionId: this.readStr(q ?? {}, ['correctOptionId', 'CorrectOptionId']) ?? '',
    isCorrect: this.readBool(q ?? {}, ['isCorrect', 'IsCorrect']) ?? false,
    marks: this.readNum(q ?? {}, ['marks', 'Marks']) ?? 0
  })),
  data: undefined,
 
};
  }

  private readNum(source: Record<string, any>, keys: string[]): number | null {
    for (const key of keys) {
      const val = source[key];
      if (typeof val === 'number' && Number.isFinite(val)) return val;
      if (typeof val === 'string' && val.trim() && !Number.isNaN(Number(val))) return Number(val);
    }
    return null;
  }

  private readArray(source: Record<string, any>, keys: string[]): any[] {
    for (const key of keys) {
      const val = source[key];
      if (Array.isArray(val)) return val;
      if (val && typeof val === 'object' && Array.isArray((val as any).$values)) {
        return (val as any).$values;
      }
    }
    return [] as any[];
  }

  private readObj(source: Record<string, any>, keys: string[]): Record<string, any> {
    for (const key of keys) {
      const val = source[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return val as Record<string, any>;
      }
    }
    return {};
  }

  private pickNonEmptyArray(...arrays: any[][]): any[] {
    for (const arr of arrays) {
      if (Array.isArray(arr) && arr.length > 0) return arr;
    }
    return [];
  }

  private extractResults(response: any): TestResult[] {
    const payload = this.unwrapItemResponse<any>(response);
    const items = this.pickNonEmptyArray(
      this.unwrapListResponse(response),
      this.unwrapListResponse(payload),
      Array.isArray(payload) ? payload : [],
      this.readArray((payload && typeof payload === 'object') ? payload as Record<string, any> : {}, ['results', 'Results', 'items', 'Items'])
    );

    return items.map(item => this.normalizeTestResult(item));
  }

 private extractQuestions(response: any): any[] {
  const payload = this.unwrapItemResponse<any>(response);

  // 🔥 ADD THIS LINE
  if (Array.isArray(payload)) return payload;

  const src = (payload && typeof payload === 'object') ? payload as Record<string, any> : {};
  const testObj = this.readObj(src, ['test', 'Test']);

  return this.pickNonEmptyArray(
    this.readArray(src, ['questions', 'Questions', 'testQuestions', 'TestQuestions', 'questionDtos', 'QuestionDtos']),
    this.readArray(testObj, ['questions', 'Questions', 'testQuestions', 'TestQuestions', 'questionDtos', 'QuestionDtos'])
  );
}
}
