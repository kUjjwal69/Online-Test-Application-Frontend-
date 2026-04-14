import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CandidateService } from '../../../core/services/candidate.service';
import { TestResult } from '../../../shared/models/models';

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
      <div class="result-card" *ngFor="let r of results" [class.passed]="r.passed" [class.failed]="!r.passed">
        <div class="rc-left">
          <div class="rc-badge" [class.pass]="r.passed" [class.fail]="!r.passed">
            {{ r.passed ? 'PASS' : 'FAIL' }}
          </div>
          <div class="rc-info">
            <h3>{{ r.testTitle }}</h3>
            <div class="rc-meta">
              <span>{{ r.correctAnswers }}/{{ r.totalQuestions }} correct</span>
              <span>{{ r.timeTaken }} min taken</span>
            </div>
          </div>
        </div>
        <div class="rc-score">
          <div class="score-ring" [style.--pct]="r.percentage">
            <svg viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-border)" stroke-width="4"/>
              <circle cx="22" cy="22" r="18" fill="none"
                [attr.stroke]="r.passed ? '#3dd68c' : '#f75f4f'"
                stroke-width="4"
                stroke-dasharray="113"
                [attr.stroke-dashoffset]="113 - (113 * r.percentage / 100)"
                stroke-linecap="round"
                transform="rotate(-90 22 22)"/>
            </svg>
            <span class="score-pct">{{ r.percentage.toFixed(0) }}%</span>
          </div>
          <div class="score-label">{{ r.score }}/{{ r.totalMarks }}</div>
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
export class ResultsComponent implements OnInit {
  results: TestResult[] = [];
  loading = true;

  constructor(private candidateService: CandidateService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId') || this.route.snapshot.queryParamMap.get('sessionId');
    if (!sessionId) {
      this.loading = false;
      return;
    }

    this.candidateService.getSessionResult(sessionId).subscribe({
      next: result => { this.results = [result]; this.loading = false; },
      error: () => this.loading = false
    });
  }
}
