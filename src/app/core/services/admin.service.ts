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

  constructor(private http: HttpClient) {}

  // ─── Tests ──────────────────────────────────────────────────────────
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

  createQuestion(request: CreateQuestionRequest): Observable<Question> {
    return this.http
      .post<ApiResponse<Question> | Question>(`${this.adminApiUrl}/tests/${request.testId}/Questions`, request)
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
      .get<ApiResponse<TestAssignment[] | PagedResponse<TestAssignment>> | TestAssignment[] | PagedResponse<TestAssignment>>(`${this.adminApiUrl}/tests`)
      .pipe(map(response => this.unwrapListResponse<TestAssignment>(response)));
  }

  assignTest(request: AssignTestRequest): Observable<TestAssignment[]> {
    const { testId, userId, userIds, ...rest } = request;
    const resolvedUserId = userId || userIds[0] || '';
    const payload = {
      ...rest,
      userId: resolvedUserId,
      userIds: resolvedUserId ? [resolvedUserId] : userIds
    };

    return this.http
      .post<ApiResponse<TestAssignment[] | PagedResponse<TestAssignment>> | TestAssignment[] | PagedResponse<TestAssignment>>(`${this.adminApiUrl}/tests/${testId}/assign`, payload)
      .pipe(map(response => this.unwrapListResponse<TestAssignment>(response)));
  }

  deleteAssignment(testId: string): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/tests/${testId}`);
  }

  // ─── Sessions ─────────────────────────────────────────────────────────
  getAllSessions(): Observable<TestSession[]> {
    return this.http
      .get<ApiResponse<TestSession[] | PagedResponse<TestSession>> | TestSession[] | PagedResponse<TestSession>>(`${this.adminApiUrl}/sessions`)
      .pipe(map(response => this.unwrapListResponse<TestSession>(response)));
  }

  getSessionById(id: string): Observable<TestSession> {
    return this.http
      .get<ApiResponse<TestSession> | TestSession>(`${this.adminApiUrl}/sessions/${id}`)
      .pipe(map(response => this.unwrapItemResponse<TestSession>(response)));
  }

  suspendSession(request: SuspendSessionRequest): Observable<void> {
    return this.http.post<void>(`${this.adminApiUrl}/sessions/suspend`, request);
  }

  // ─── Violations ───────────────────────────────────────────────────────
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
      .get<ApiResponse<Screenshot[] | PagedResponse<Screenshot>> | Screenshot[] | PagedResponse<Screenshot>>(`${this.adminApiUrl}/screenshots/${sessionId}`)
      .pipe(map(response => this.unwrapListResponse<Screenshot>(response)));
  }

  private unwrapListResponse<T>(response: ApiResponse<T[] | PagedResponse<T>> | T[] | PagedResponse<T>): T[] {
    if (Array.isArray(response)) return response;

    if (!response || typeof response !== 'object') return [];

    const wrappedResponse = response as unknown as Record<string, unknown>;
    const data = wrappedResponse['data'];

    if (Array.isArray(data)) return data as T[];

    if (data && typeof data === 'object') {
      const pagedData = data as { items?: unknown };
      if (Array.isArray(pagedData.items)) return pagedData.items as T[];
    }

    const pagedResponse = wrappedResponse as { items?: unknown };
    if (Array.isArray(pagedResponse.items)) {
      return pagedResponse.items as T[];
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
      id: this.readString(user, ['id', 'userId']) ?? '',
      fullName: this.readString(user, ['fullName', 'name', 'username', 'email']) ?? '',
      email: this.readString(user, ['email', 'username']) ?? '',
      role: this.readString(user, ['role']) ?? '',
      isActive: this.readBoolean(user, ['isActive', 'active']) ?? true,
      createdAt: this.readString(user, ['createdAt', 'createdOn']) ?? ''
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
}
