import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import {
  Test, CreateTestRequest, Question, CreateQuestionRequest,
  TestAssignment, AssignTestRequest, TestSession, User,
  Violation, Screenshot, SuspendSessionRequest, PagedResponse, ApiResponse
} from '../../shared/models/models';
import { API_ENDPOINTS } from '../config/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly adminApiUrl = API_ENDPOINTS.admin;
  private readonly apiOrigin = new URL(API_ENDPOINTS.admin).origin;

  constructor(private http: HttpClient) {}

  // ─── Tests ─────────────────────────────────────────────────────────
  getAllTests(): Observable<Test[]> {
    return this.http
      .get<ApiResponse<Test[] | PagedResponse<Test>> | Test[] | PagedResponse<Test>>(`${this.adminApiUrl}/tests`)
      .pipe(map(response => this.unwrapListResponse<Test>(response)));
  }

  getTestById(id: string): Observable<Test> {
    return this.http
      .get<ApiResponse<Test> | Test>(`${this.adminApiUrl}/tests/${id}`)
      .pipe(map(response => this.unwrapItemResponse<Test>(response)));
  }

  createTest(request: CreateTestRequest): Observable<Test> {
    return this.http
      .post<ApiResponse<Test> | Test>(`${this.adminApiUrl}/tests`, request)
      .pipe(map(response => this.unwrapItemResponse<Test>(response)));
  }

  updateTest(id: string, request: CreateTestRequest): Observable<Test> {
    return this.http
      .put<ApiResponse<Test> | Test>(`${this.adminApiUrl}/tests/${id}`, request)
      .pipe(map(response => this.unwrapItemResponse<Test>(response)));
  }

  deleteTest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/tests/${id}`);
  }

  // ─── Questions ───────────────────────────────────────────────────────
  getQuestionsByTest(testId: string): Observable<Question[]> {
    return this.http
      .get<ApiResponse<Question[] | PagedResponse<Question>> | Question[] | PagedResponse<Question>>(`${this.adminApiUrl}/tests/${testId}/questions`)
      .pipe(map(response => this.unwrapListResponse<Question>(response)));
  }

  createQuestion(testId: string, request: CreateQuestionRequest): Observable<Question> {
    return this.http
      .post<ApiResponse<Question> | Question>(`${this.adminApiUrl}/tests/${testId}/questions`, request)
      .pipe(map(response => this.unwrapItemResponse<Question>(response)));
  }

  updateQuestion(id: string, request: CreateQuestionRequest): Observable<Question> {
    return this.http
      .put<ApiResponse<Question> | Question>(`${this.adminApiUrl}/questions/${id}`, request)
      .pipe(map(response => this.unwrapItemResponse<Question>(response)));
  }

  deleteQuestion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/questions/${id}`);
  }

  // ─── Users ───────────────────────────────────────────────────────────
  getAllUsers(): Observable<User[]> {
    return this.http
      .get<ApiResponse<unknown[]>>(`${this.adminApiUrl}/get-all-users`)
      .pipe(map(response => (response.data ?? []).map(user => this.normalizeUser(user))));
  }

  // ─── Assignments ──────────────────────────────────────────────────────
  getAllAssignments(): Observable<TestAssignment[]> {
    return this.http
      .get<ApiResponse<TestAssignment[] | PagedResponse<TestAssignment>> | TestAssignment[] | PagedResponse<TestAssignment>>(`${API_ENDPOINTS.shared}/admin/sessions/{sessionId}`, {})
      .pipe(
        map(response => this.unwrapListResponse<unknown>(response)),
        map(assignments => assignments.map(assignment => this.normalizeAssignment(assignment)))
      );
  }

  getUserAssignments(userId: string): Observable<TestAssignment[]> {
    return this.http
      .get<ApiResponse<TestAssignment[] | PagedResponse<TestAssignment>> | TestAssignment[] | PagedResponse<TestAssignment>>(`${this.adminApiUrl}/users/${userId}/assignments`)
      .pipe(
        map(response => this.unwrapListResponse<unknown>(response)),
        map(assignments => assignments.map(assignment => this.normalizeAssignment(assignment)))
      );
  }

  assignTest(request: AssignTestRequest): Observable<TestAssignment[]> {
    const { testId, userId, userIds, expiresAt } = request;
    const resolvedUserId = userId || userIds[0] || '';
    const resolvedUserIds = resolvedUserId ? [resolvedUserId] : userIds;
    const payload: Record<string, unknown> = {
      // Send both singular/array and common casing variants for backend DTO compatibility.
      userId: resolvedUserId,
      userIds: resolvedUserIds,
      UserId: resolvedUserId,
      UserIds: resolvedUserIds
    };

    if (expiresAt) {
      // Keep both keys for backend compatibility across DTO naming conventions.
      payload['expiresAt'] = expiresAt;
      payload['expirationDate'] = expiresAt;
    }

    return this.http
      .post<ApiResponse<TestAssignment[] | PagedResponse<TestAssignment>> | TestAssignment[] | PagedResponse<TestAssignment>>(`${this.adminApiUrl}/tests/${testId}/assign`, payload)
      .pipe(map(response => this.unwrapListResponse<TestAssignment>(response)));
  }

  deleteAssignment(testId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/tests/${testId}/Unassign?UserId=${encodeURIComponent(userId)}`);
  }

  // ─── Sessions ─────────────────────────────────────────────────────────
  blockUser(userId: string): Observable<void> {
    return this.http.patch<void>(`${this.adminApiUrl}/users/${userId}/block`, {});
  }

  getAllSessions(): Observable<TestSession[]> {
    return this.http
      .get<ApiResponse<TestSession[] | PagedResponse<TestSession>> | TestSession[] | PagedResponse<TestSession>>(`${this.adminApiUrl}/sessions`)
      .pipe(
        map(response => this.unwrapListResponse<unknown>(response)),
        map(items => items.map(item => this.normalizeSession(item)))
      );
  }

  getSessionById(sessionId: string): Observable<TestSession> {
    return this.http
      .get<ApiResponse<TestSession> | TestSession>(`${this.adminApiUrl}/sessions/${sessionId}`)
      .pipe(
        map(response => this.unwrapItemResponse<unknown>(response)),
        map(session => this.normalizeSession(session))
      );
  }

  suspendSession(request: SuspendSessionRequest): Observable<void> {
    return this.http.post<void>(`${this.adminApiUrl}/sessions/${request.sessionId}/suspend`, request);
  }

  // ─── Violations ───────────────────────────────────────────────────────
  allowRetest(sessionId: string): Observable<void> {
    return this.http.patch<void>(`${this.adminApiUrl}/sessions/${sessionId}/retest`, {});
  }

  getAllViolations(sessionId?: string): Observable<Violation[]> {
    if (sessionId) {
      return this.http
        .get<ApiResponse<Violation[] | PagedResponse<Violation>> | Violation[] | PagedResponse<Violation>>(`${this.adminApiUrl}/sessions/${sessionId}/violations`)
        .pipe(map(response => this.unwrapListResponse<Violation>(response)));
    }

    return this.getAllSessions().pipe(
      switchMap(sessions => {
        if (sessions.length === 0) return of([]);

        return forkJoin(
          sessions.map(session =>
            this.getAllViolations(session.id).pipe(
              map(violations =>
                violations.map(violation => ({
                  ...violation,
                  sessionId: violation.sessionId || session.id,
                  userName: violation.userName || session.userName
                }))
              )
            )
          )
        );
      }),
      map(violationsBySession => violationsBySession.flat()),
      map(violations =>
        violations.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      )
    );
  }

  // ─── Screenshots ──────────────────────────────────────────────────────
  getScreenshots(sessionId: string): Observable<Screenshot[]> {
    return this.http
      .get<ApiResponse<Screenshot[] | PagedResponse<Screenshot>> | Screenshot[] | PagedResponse<Screenshot>>(`${this.adminApiUrl}/sessions/${sessionId}/screenshots`)
      .pipe(
        map(response => this.unwrapListResponse<unknown>(response)),
        map(items => items.map(item => this.normalizeScreenshot(item)))
      );
  }

  private unwrapListResponse<T>(response: ApiResponse<T[] | PagedResponse<T>> | T[] | PagedResponse<T>): T[] {
    if (Array.isArray(response)) return response;

    if (!response || typeof response !== 'object') return [];

    const wrappedResponse = response as unknown as Record<string, unknown>;
    const data = wrappedResponse['data'] ?? wrappedResponse['Data'];

    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)['$values'])) {
      return (data as Record<string, unknown>)['$values'] as T[];
    }

    if (data && typeof data === 'object') {
      const pagedData = data as { items?: unknown; Items?: unknown };
      if (Array.isArray(pagedData.items)) return pagedData.items as T[];
      if (Array.isArray(pagedData.Items)) return pagedData.Items as T[];
    }

    if (Array.isArray(wrappedResponse['$values'])) {
      return wrappedResponse['$values'] as T[];
    }

    const pagedResponse = wrappedResponse as { items?: unknown; Items?: unknown };
    if (Array.isArray(pagedResponse.items)) {
      return pagedResponse.items as T[];
    }
    if (Array.isArray(pagedResponse.Items)) {
      return pagedResponse.Items as T[];
    }

    return [];
  }

  private unwrapItemResponse<T>(response: ApiResponse<T> | T): T {
    if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
      return ((response as ApiResponse<T>).data ?? {}) as T;
    }

    return response as T;
  }

  private normalizeUser(rawUser: unknown): User {
    const user = (rawUser ?? {}) as Record<string, unknown>;

    return {
      id: this.readStringLoose(user, ['id', 'userId']) ?? '',
      fullName: this.readStringLoose(user, ['fullName', 'name', 'username', 'email']) ?? '',
      email: this.readStringLoose(user, ['email', 'username']) ?? '',
      role: this.readStringLoose(user, ['role']) ?? '',
      isActive: this.readBooleanLoose(user, ['isActive', 'active']) ?? true,
      createdAt: this.readStringLoose(user, ['createdAt', 'createdOn']) ?? ''
    };
  }

  private normalizeAssignment(rawAssignment: unknown): TestAssignment {
    const assignment = (rawAssignment ?? {}) as Record<string, unknown>;
    const user = (assignment['user'] ?? {}) as Record<string, unknown>;
    const test = (assignment['test'] ?? {}) as Record<string, unknown>;

    return {
      id: this.readStringLoose(assignment, ['id', 'assignmentId']) ?? '',
      testId: this.readStringLoose(assignment, ['testId', 'examId']) ?? this.readStringLoose(test, ['id']) ?? '',
      userId: this.readStringLoose(assignment, ['userId', 'candidateId', 'assignedUserId']) ?? this.readStringLoose(user, ['id', 'userId']) ?? '',
      testTitle: this.readStringLoose(assignment, ['testTitle', 'title', 'examTitle']) ?? this.readStringLoose(test, ['title', 'name']) ?? '',
      userName: this.readStringLoose(assignment, ['userName', 'candidateName', 'fullName', 'name']) ?? this.readStringLoose(user, ['fullName', 'name', 'username', 'email']) ?? '',
      userEmail: this.readStringLoose(assignment, ['userEmail', 'candidateEmail', 'email']) ?? this.readStringLoose(user, ['email', 'username']) ?? '',
      assignedAt: this.readStringLoose(assignment, ['assignedAt', 'createdAt', 'createdOn']) ?? '',
      expiresAt: this.readStringLoose(assignment, ['expiresAt', 'expirationDate']) ?? undefined,
      status: this.normalizeAssignmentStatus(this.readStringLoose(assignment, ['status']) ?? '')
    };
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value;
    }

    return null;
  }

  private readBoolean(source: Record<string, unknown>, keys: string[]): boolean | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'boolean') return value;
    }

    return null;
  }

  private readBooleanLoose(source: Record<string, unknown>, keys: string[]): boolean | null {
    const exactMatch = this.readBoolean(source, keys);
    if (exactMatch !== null) return exactMatch;

    const normalizedSource = new Map<string, unknown>(
      Object.keys(source).map(key => [key.toLowerCase(), source[key]])
    );

    for (const key of keys) {
      const value = normalizedSource.get(key.toLowerCase());
      if (typeof value === 'boolean') return value;
    }

    return null;
  }

  private readStringLoose(source: Record<string, unknown>, keys: string[]): string | null {
    const exactMatch = this.readString(source, keys);
    if (exactMatch) return exactMatch;

    const normalizedSource = new Map<string, unknown>(
      Object.keys(source).map(key => [key.toLowerCase(), source[key]])
    );

    for (const key of keys) {
      const value = normalizedSource.get(key.toLowerCase());
      if (typeof value === 'string' && value.trim()) return value;
    }

    return null;
  }

  private normalizeAssignmentStatus(rawStatus: string): TestAssignment['status'] {
    const status = rawStatus.trim().toLowerCase().replace(/\s+/g, '');

    if (status === 'notstarted' || status === 'pending' || status === '') return 'NotStarted';
    if (status === 'inprogress' || status === 'active') return 'InProgress';
    if (status === 'completed' || status === 'done') return 'Completed';
    if (status === 'suspended' || status === 'blocked') return 'Suspended';

    return 'NotStarted';
  }

  private normalizeSession(rawSession: unknown): TestSession {
    const session = (rawSession ?? {}) as Record<string, unknown>;
    const user =
      (session['user'] ??
       session['User'] ??
       session['candidate'] ??
       session['Candidate'] ??
       session['assignedUser'] ??
       session['AssignedUser'] ??
       session['userDto'] ??
       session['UserDto'] ??
       {}) as Record<string, unknown>;
    const test = (session['test'] ?? session['Test'] ?? {}) as Record<string, unknown>;
    const statusRaw = this.readStringLoose(session, ['status', 'sessionStatus']) ?? '';
   const isSuspended =
  this.readBooleanLoose(session, ['isSuspended']) ??
  (statusRaw.toLowerCase().includes('suspend'));
    const userId =
      this.readStringLoose(session, ['userId', 'candidateId', 'candidateUserId', 'assignedUserId']) ??
      this.readStringLoose(user, ['id', 'userId']) ??
      '';
    const userName =
      this.readStringLoose(session, ['userName', 'UserName', 'user_name', 'candidateName', 'CandidateName', 'candidate_name', 'fullName', 'FullName', 'full_name', 'name', 'Name']) ??
      this.readStringLoose(user, ['userName', 'UserName', 'user_name', 'candidateName', 'CandidateName', 'candidate_name', 'fullName', 'FullName', 'full_name', 'name', 'Name', 'username', 'Username', 'user_name', 'email', 'Email']) ??
      this.joinNameParts(
        this.readStringLoose(user, ['firstName', 'FirstName', 'first_name', 'givenName', 'GivenName']),
        this.readStringLoose(user, ['lastName', 'LastName', 'last_name', 'surname', 'Surname'])
      ) ??
      this.findStringDeep(session, [
        'userName', 'UserName', 'candidateName', 'CandidateName', 'fullName', 'FullName',
        'user_name', 'candidate_name', 'full_name',
        'name', 'Name', 'username', 'Username', 'email', 'Email',
        'firstName', 'FirstName', 'first_name', 'lastName', 'LastName', 'last_name'
      ]) ??
      this.readStringLoose(test, ['userName', 'UserName', 'candidateName', 'CandidateName', 'fullName', 'FullName', 'name', 'Name', 'email', 'Email']) ??
      (userId ? `User ${userId.slice(0, 8)}` : 'Unknown User');

    return {
      id: this.readStringLoose(session, ['id', 'sessionId']) ?? '',
      testId: this.readStringLoose(session, ['testId', 'examId']) ?? this.readStringLoose(test, ['id']) ?? '',
      userId,
      testTitle: this.readStringLoose(session, ['testTitle', 'title', 'examTitle']) ?? this.readStringLoose(test, ['title', 'name']) ?? 'Untitled Test',
      userName,
      startTime: this.readStringLoose(session, ['startTime', 'startedAt', 'createdAt']) ?? '',
      endTime: this.readStringLoose(session, ['endTime', 'completedAt']) ?? undefined,
      status: isSuspended ? 'Suspended' : this.normalizeSessionStatus(statusRaw),
      score: this.readNumberLoose(session, ['score']) ?? undefined,
      percentage: this.readNumberLoose(session, ['percentage']) ?? undefined,
      violationCount: this.readNumberLoose(session, ['violationCount', 'violations']) ?? 0,
      isSuspended: isSuspended || this.normalizeSessionStatus(statusRaw) === 'Suspended',
      suspendReason: this.readStringLoose(session, ['suspendReason', 'reason']) ?? undefined,
      timeRemainingSeconds: this.readNumberLoose(session, ['timeRemainingSeconds', 'remainingTimeSeconds']) ?? undefined
    };
  }

  private normalizeScreenshot(rawScreenshot: unknown): Screenshot {
    const screenshot = (rawScreenshot ?? {}) as Record<string, unknown>;
    const filePath = this.readStringLoose(screenshot, ['filePath', 'FilePath', 'path', 'Path']) ?? '';
    const imageUrl = this.readStringLoose(screenshot, ['imageUrl', 'ImageUrl']) ?? this.resolveScreenshotUrl(filePath);

    return {
      id: this.readStringLoose(screenshot, ['id', 'screenshotId']) ?? '',
      sessionId: this.readStringLoose(screenshot, ['sessionId', 'SessionId']) ?? '',
      userId: this.readStringLoose(screenshot, ['userId', 'UserId']) ?? '',
      userName: this.readStringLoose(screenshot, ['userName', 'UserName']) ?? '',
      imageUrl,
      filePath: filePath || undefined,
      imageBase64: this.readStringLoose(screenshot, ['imageBase64', 'ImageBase64']) ?? undefined,
      capturedAt: this.readStringLoose(screenshot, ['capturedAt', 'CapturedAt']) ?? ''
    };
  }

  private resolveScreenshotUrl(filePath: string): string {
    if (!filePath) return '';
    if (/^https?:\/\//i.test(filePath) || filePath.startsWith('data:')) return filePath;
    return `${this.apiOrigin}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  }

  private normalizeSessionStatus(rawStatus: string): TestSession['status'] {
    const status = rawStatus.trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (status === 'active' || status === 'inprogress' || status === 'running' || status === '') return 'Active';
    if (status === 'completed' || status === 'done' || status === 'finished') return 'Completed';
    if (status === 'suspended' || status === 'blocked') return 'Suspended';
    if (status === 'abandoned' || status === 'terminated') return 'Abandoned';
    return 'Active';
  }

  private readNumberLoose(source: Record<string, unknown>, keys: string[]): number | null {
    const normalizedSource = new Map<string, unknown>(
      Object.keys(source).map(key => [key.toLowerCase(), source[key]])
    );
    for (const key of keys) {
      const value = normalizedSource.get(key.toLowerCase());
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
    }
    return null;
  }

  private findStringDeep(source: unknown, keys: string[]): string | null {
    if (!source || typeof source !== 'object') return null;

    const targetKeys = new Set(keys.map(key => key.toLowerCase()));
    const queue: Array<{ value: unknown; depth: number }> = [{ value: source, depth: 0 }];
    const visited = new WeakSet<object>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || current.depth > 3) continue;

      const value = current.value;
      if (!value || typeof value !== 'object') continue;

      if (visited.has(value as object)) continue;
      visited.add(value as object);

      if (Array.isArray(value)) {
        for (const item of value) {
          queue.push({ value: item, depth: current.depth + 1 });
        }
        continue;
      }

      const record = value as Record<string, unknown>;
      for (const key of Object.keys(record)) {
        const entry = record[key];
        if (typeof entry === 'string' && entry.trim() && targetKeys.has(key.toLowerCase())) {
          return entry;
        }

        if (entry && typeof entry === 'object') {
          queue.push({ value: entry, depth: current.depth + 1 });
        }
      }
    }

    return null;
  }

  private joinNameParts(firstName: string | null, lastName: string | null): string | null {
    const parts = [firstName, lastName].filter(part => typeof part === 'string' && part.trim()) as string[];
    if (parts.length === 0) return null;
    return parts.join(' ').trim();
  }
}
