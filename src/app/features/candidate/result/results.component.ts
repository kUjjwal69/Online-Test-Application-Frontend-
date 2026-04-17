import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CandidateService } from '../../../core/services/candidate.service';
import { GetMyResult, TestResult } from '../../../shared/models/models';

@Component({

  selector: 'app-results',
  standalone: true,

  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-header" style="margin-bottom:28px">
      <h1>My Results</h1>
      <p>Review your completed exam scores</p>
    </div>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px">
      <mat-spinner diameter="48"></mat-spinner>
    </div>

    <div class="results-list" *ngIf="!loading">
      <div class="result-card" *ngFor="let r of results" [class.passed]="r.isPassed" [class.failed]="!r.isPassed">
        <div class="rc-left">
          <div class="rc-badge" [class.pass]="r.isPassed" [class.fail]="!r.isPassed">
            {{ r.isPassed ? 'PASS' : 'FAIL' }}
          </div>
          <div class="rc-info">
            <h3>{{ r.testTitle }}</h3>
            <div class="rc-meta">
              <span>{{ r.correctAnswers }}/{{ r.totalQuestions }} correct</span>
              
              <span>{{ getFormattedTime(r) }}</span>
            </div>
          </div>
        </div>
        <div class="rc-score">
          <div class="score-ring" [style.--pct]="r.percentage">
            <svg viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-border)" stroke-width="4"/>
              <circle cx="22" cy="22" r="18" fill="none"
                [attr.stroke]="r.isPassed ? '#3dd68c' : '#f75f4f'"
                stroke-width="4"
                stroke-dasharray="113"
                [attr.stroke-dashoffset]="113 - (113 * displayPercentage(r) / 100)"
                stroke-linecap="round"
                transform="rotate(-90 22 22)"/>
            </svg>
            <span class="score-pct">{{ displayPercentage(r).toFixed(0) }}%</span>
          </div>
          <div class="score-label">{{ displayScore(r) }}/{{ displayTotalMarks(r) }}</div>
        </div>
      </div>

      <div class="empty-state" *ngIf="results.length === 0">
        <mat-icon>leaderboard</mat-icon>
        <h3>No results yet</h3>
        <p>Complete a test to see your results here</p>
      </div>
    </div>
  `,
  styles: [`
    .page-header h1 { font-size: 26px; font-weight: 700; }
    .page-header p { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }

    .results-list { display: flex; flex-direction: column; gap: 12px; }

    .result-card {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius); padding: 20px 24px;
      transition: all var(--transition);
    }
    .result-card.passed { border-left: 4px solid var(--color-success); }
    .result-card.failed { border-left: 4px solid var(--color-danger); }

    .rc-left { display: flex; align-items: center; gap: 16px; }
    .rc-badge {
      padding: 6px 12px; border-radius: var(--radius-sm);
      font-size: 12px; font-weight: 800; letter-spacing: 1px;
      font-family: var(--font-mono);
    }
    .rc-badge.pass { background: rgba(61,214,140,0.15); color: var(--color-success); }
    .rc-badge.fail { background: rgba(247,95,79,0.15); color: var(--color-danger); }

    .rc-info h3 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .rc-meta { display: flex; gap: 16px; font-size: 13px; color: var(--color-text-muted); }

    .rc-score { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .score-ring { position: relative; width: 60px; height: 60px; }
    .score-ring svg { width: 100%; height: 100%; }
    .score-pct {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; font-family: var(--font-mono);
    }
    .score-label { font-size: 12px; color: var(--color-text-muted); font-family: var(--font-mono); }
  `]
})

export class ResultsComponent implements OnInit, OnDestroy {
  results: GetMyResult[] = [];
  loading = true;
  private readonly lastResultSessionIdKey = 'lastCandidateResultSessionId';
  private routeSub?: Subscription;

  constructor(private candidateService: CandidateService, private route: ActivatedRoute) {}

  getFormattedTime(r: GetMyResult): string {
  if (!r.startTime || !r.endTime) return '-';

  const diffMs = new Date(r.endTime).getTime() - new Date(r.startTime).getTime();
  const totalSeconds = Math.floor(diffMs / 1000);

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}m ${secs}s`;
}
  ngOnInit(): void {
    this.routeSub = this.route.queryParamMap.subscribe(() => this.fetchResult());
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private fetchResult(): void {
    this.loading = true;

    const sessionId = this.getValidSessionId(
      this.route.snapshot.paramMap.get('sessionId') ||
      this.route.snapshot.queryParamMap.get('sessionId') ||
      localStorage.getItem(this.lastResultSessionIdKey)
    );

    if (!sessionId) {
      this.results = [];
      this.loading = false;
      return;
    }

    this.candidateService.getMyResults(sessionId).subscribe({
      next: res => {
        const data = (res as any)?.data ?? (res as any)?.Data ?? res;
        this.results = data ? [this.normalizeResult(data as GetMyResult, sessionId)] : [];
        this.loading = false;
      },
      error: () => {
        this.results = [];
        this.loading = false;
      }
    });
  }

  displayScore(result: GetMyResult | TestResult): number {
    return this.coerceNumber(result, ['score', 'Score', 'obtainedMarks', 'ObtainedMarks', 'marksObtained', 'MarksObtained', 'earnedMarks', 'EarnedMarks', 'totalScore', 'TotalScore']);
  }

  displayTotalMarks(result: GetMyResult | TestResult): number {
    return this.coerceNumber(result, ['totalMarks', 'TotalMarks', 'maxMarks', 'MaxMarks', 'testMarks', 'TestMarks']);
  }

  displayPercentage(result: GetMyResult | TestResult): number {
    return this.coerceNumber(result, ['percentage', 'Percentage', 'percent', 'Percent']);
  }

  private coerceNumber(result: GetMyResult | TestResult, keys: string[]): number {
    const source = result as Record<string, any>;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
    }
    return 0;
  }

  private getValidSessionId(sessionId: string | null): string | null {
    if (!sessionId) return null;

    const trimmed = sessionId.trim();
    const normalized = trimmed.toLowerCase();

    return trimmed && normalized !== 'null' && normalized !== 'undefined' ? trimmed : null;
  }

  private normalizeResult(result: GetMyResult, fallbackSessionId: string): GetMyResult {
    return {
      ...result,
      sessionId: this.getValidSessionId(result.sessionId) || fallbackSessionId,
      isPassed: this.coerceBoolean(result as Record<string, any>, ['isPassed', 'IsPassed', 'passed', 'Passed'])
    };
  }

  private coerceBoolean(source: Record<string, any>, keys: string[]): boolean {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
      }
    }
    return false;
  }
}
