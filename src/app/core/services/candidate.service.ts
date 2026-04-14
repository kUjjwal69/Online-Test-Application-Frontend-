import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  TestAssignment, StartSessionRequest, StartSessionResponse,
  SubmitAnswerRequest, SubmitTestRequest, TestResult, ApiResponse, PagedResponse
} from '../../shared/models/models';
import { API_ENDPOINTS } from '../config/api-endpoints';

@Injectable({ providedIn: 'root' })
export class CandidateService {
  private readonly candidateApiUrl = API_ENDPOINTS.candidate;

  constructor(private http: HttpClient) {}

  getMyAssignments(): Observable<TestAssignment[]> {
    return this.http
      .get<ApiResponse<TestAssignment[] | PagedResponse<TestAssignment>> | TestAssignment[] | PagedResponse<TestAssignment>>(`${this.candidateApiUrl}/tests`)
      .pipe(map(response => this.unwrapListResponse<unknown>(response).map(item => this.normalizeAssignment(item))));
  }

  startSession(request: StartSessionRequest): Observable<StartSessionResponse> {
    return this.http.post<StartSessionResponse>(`${this.candidateApiUrl}/test/${request.testId}/start`, {});
  }

  submitAnswer(request: SubmitAnswerRequest): Observable<void> {
    return this.http.post<void>(`${this.candidateApiUrl}/sessions/answer`, request);
  }

  submitTest(request: SubmitTestRequest): Observable<TestResult> {
    return this.http.post<TestResult>(`${this.candidateApiUrl}/sessions/submit`, request);
  }

  getSessionStatus(sessionId: string): Observable<{ status: string; isSuspended: boolean; suspendReason?: string }> {
    return this.http.get<any>(`${this.candidateApiUrl}/sessions/${sessionId}/status`);
  }

  getSessionResult(sessionId: string): Observable<TestResult> {
    return this.http.get<TestResult>(`${this.candidateApiUrl}/sessions/${sessionId}/result`);
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
    if (Array.isArray(pagedResponse.items)) return pagedResponse.items as T[];

    return [];
  }

  private normalizeAssignment(raw: unknown): TestAssignment {
    const row = (raw ?? {}) as Record<string, unknown>;
    const assignmentId = this.readString(row, ['id', 'assignmentId']) ?? '';
    const testId = this.readString(row, ['testId', 'id']) ?? '';

    return {
      id: assignmentId || testId,
      testId: testId || assignmentId,
      userId: this.readString(row, ['userId']) ?? '',
      testTitle: this.readString(row, ['testTitle', 'title', 'name']) ?? 'Untitled Test',
      userName: this.readString(row, ['userName', 'candidateName']) ?? '',
      userEmail: this.readString(row, ['userEmail', 'candidateEmail', 'email']) ?? '',
      assignedAt: this.readString(row, ['assignedAt', 'createdAt', 'assignedOn']) ?? '',
      expiresAt: this.readString(row, ['expiresAt', 'expiryAt']) ?? undefined,
      status: this.normalizeStatus(this.readString(row, ['status']) ?? '')
    };
  }

  private normalizeStatus(rawStatus: string): TestAssignment['status'] {
    const status = rawStatus.trim().toLowerCase().replace(/\s+/g, '');

    if (status === 'notstarted' || status === 'pending' || status === '') return 'NotStarted';
    if (status === 'inprogress' || status === 'active') return 'InProgress';
    if (status === 'completed' || status === 'done') return 'Completed';
    if (status === 'suspended' || status === 'blocked') return 'Suspended';

    return 'NotStarted';
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    return null;
  }
}
