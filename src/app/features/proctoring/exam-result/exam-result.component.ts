import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TestResult } from '../../../shared/models/models';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="result-page">
      <div class="result-card" *ngIf="result">

        <!-- Header -->
        <div class="rc-header" [class.pass]="result.passed" [class.fail]="!result.passed">
          <div class="rc-icon">{{ result.passed ? '🏆' : '📝' }}</div>
          <h1>{{ result.passed ? 'Congratulations!' : 'Better Luck Next Time' }}</h1>
          <p>{{ result.testTitle }}</p>
        </div>

        <!-- Score Ring -->
        <div class="score-section">
          <div class="score-ring-lg">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border)" stroke-width="8"/>
              <circle cx="60" cy="60" r="50" fill="none"
                [attr.stroke]="result.passed ? '#3dd68c' : '#f75f4f'"
                stroke-width="8"
                stroke-dasharray="314"
                [attr.stroke-dashoffset]="314 - (314 * result.percentage / 100)"
                stroke-linecap="round"
                transform="rotate(-90 60 60)"
                style="transition: stroke-dashoffset 1.5s ease"/>
            </svg>
            <div class="ring-content">
              <div class="ring-pct">{{ result.percentage.toFixed(1) }}%</div>
              <div class="ring-label">{{ result.passed ? 'PASSED' : 'FAILED' }}</div>
            </div>
          </div>

          <div class="score-details">
            <div class="detail-item">
              <mat-icon>grade</mat-icon>
              <div>
                <div class="di-value">{{ result.score }} / {{ result.totalMarks }}</div>
                <div class="di-label">Total Score</div>
              </div>
            </div>
            <div class="detail-item">
              <mat-icon>check_circle</mat-icon>
              <div>
                <div class="di-value">{{ result.correctAnswers }} / {{ result.totalQuestions }}</div>
                <div class="di-label">Correct Answers</div>
              </div>
            </div>
            <div class="detail-item">
              <mat-icon>timer</mat-icon>
              <div>
                <div class="di-value">{{ result.timeTaken }} min</div>
                <div class="di-label">Time Taken</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Question Review -->
        <div class="review-section" *ngIf="result.questionResults && result.questionResults.length > 0">
          <h3>Answer Review</h3>
          <div class="review-list">
            <div class="review-item" *ngFor="let qr of result.questionResults; let i = index"
              [class.correct]="qr.isCorrect" [class.wrong]="!qr.isCorrect">
              <div class="ri-header">
                <span class="ri-num">Q{{ i + 1 }}</span>
                <span class="ri-status">
                  <mat-icon *ngIf="qr.isCorrect" style="color:var(--color-success)">check_circle</mat-icon>
                  <mat-icon *ngIf="!qr.isCorrect" style="color:var(--color-danger)">cancel</mat-icon>
                  {{ qr.isCorrect ? '+' + qr.marks : '0' }} marks
                </span>
              </div>
              <p class="ri-question">{{ qr.questionText }}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="rc-actions">
          <a routerLink="/candidate/dashboard" class="btn-home">
            <mat-icon>home</mat-icon> Go to Dashboard
          </a>
          <a [routerLink]="['/candidate/results', result.sessionId]" class="btn-results">
            <mat-icon>leaderboard</mat-icon> View All Results
          </a>
        </div>
      </div>

      <div *ngIf="!result" class="no-result">
        <p>No result data found.</p>
        <a routerLink="/candidate/dashboard">Return to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .result-page {
      min-height: 100vh; background: var(--color-bg);
      display: flex; align-items: flex-start; justify-content: center;
      padding: 40px 20px;
    }
    .result-card {
      width: 100%; max-width: 700px;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius); overflow: hidden;
    }
    .rc-header {
      padding: 40px 36px; text-align: center;
      border-bottom: 1px solid var(--color-border);
    }
    .rc-header.pass { background: linear-gradient(135deg, rgba(61,214,140,0.1), transparent); }
    .rc-header.fail { background: linear-gradient(135deg, rgba(247,95,79,0.08), transparent); }
    .rc-icon { font-size: 56px; margin-bottom: 16px; }
    .rc-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
    .rc-header p { color: var(--color-text-muted); font-size: 15px; }

    .score-section {
      display: flex; align-items: center; gap: 40px;
      padding: 36px; border-bottom: 1px solid var(--color-border);
    }
    .score-ring-lg {
      position: relative; width: 140px; height: 140px; flex-shrink: 0;
    }
    .score-ring-lg svg { width: 100%; height: 100%; }
    .ring-content {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .ring-pct { font-size: 24px; font-weight: 800; font-family: var(--font-mono); }
    .ring-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--color-text-muted); }

    .score-details { display: flex; flex-direction: column; gap: 16px; flex: 1; }
    .detail-item { display: flex; align-items: center; gap: 12px; }
    .detail-item mat-icon { font-size: 22px !important; width: 22px; height: 22px; color: var(--color-primary); }
    .di-value { font-size: 18px; font-weight: 700; font-family: var(--font-mono); }
    .di-label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .review-section { padding: 28px 36px; border-bottom: 1px solid var(--color-border); }
    .review-section h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .review-list { display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; }
    .review-item {
      padding: 12px 16px; border-radius: var(--radius-sm); border-left: 3px solid transparent;
    }
    .review-item.correct { background: rgba(61,214,140,0.06); border-left-color: var(--color-success); }
    .review-item.wrong { background: rgba(247,95,79,0.06); border-left-color: var(--color-danger); }
    .ri-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .ri-num { font-size: 12px; font-weight: 700; font-family: var(--font-mono); color: var(--color-text-muted); }
    .ri-status { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; }
    .ri-status mat-icon { font-size: 16px !important; width: 16px; height: 16px; }
    .ri-question { font-size: 14px; color: var(--color-text-muted); line-height: 1.5; }

    .rc-actions {
      display: flex; gap: 12px; padding: 24px 36px; justify-content: center;
    }
    .btn-home, .btn-results {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 24px; border-radius: var(--radius-sm);
      font-size: 14px; font-weight: 600; transition: all var(--transition); text-decoration: none;
    }
    .btn-home { background: var(--color-primary); color: #fff; }
    .btn-home:hover { background: #6aa0ff; text-decoration: none; }
    .btn-results { background: none; border: 1px solid var(--color-border); color: var(--color-text-muted); }
    .btn-results:hover { border-color: var(--color-text-muted); color: var(--color-text); text-decoration: none; }
    .btn-home mat-icon, .btn-results mat-icon { font-size: 18px !important; width: 18px; height: 18px; }

    .no-result { padding: 60px; text-align: center; color: var(--color-text-muted); }
  `]
})
export class ExamResultComponent implements OnInit {
  result: TestResult | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { result: TestResult } | undefined;
    this.result = state?.result ?? history.state?.result ?? null;
  }
}
