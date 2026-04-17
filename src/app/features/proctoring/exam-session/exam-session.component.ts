import {
  Component, OnInit, OnDestroy, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { CandidateService } from '../../../core/services/candidate.service';
import { ProctoringService } from '../../../core/services/proctoring.service';
import { StartSessionResponse, Question } from '../../../shared/models/models';

interface AnswerMap {
  [questionId: string]: string;
}

@Component({
  selector: 'app-exam-session',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <!-- SUSPENDED OVERLAY -->
    <div class="suspended-overlay" *ngIf="isSuspended">
      <div class="suspended-box">
        <div class="sus-icon">🚫</div>
        <h2>Session Suspended</h2>
        <p>{{ suspendReason }}</p>
        <button class="btn-home" (click)="goHome()">Return to Dashboard</button>
      </div>
    </div>

    <!-- SUBMIT CONFIRM OVERLAY -->
    <div class="confirm-overlay" *ngIf="showSubmitConfirm">
      <div class="confirm-box">
        <div class="conf-icon">📋</div>
        <h2>Submit Exam?</h2>
        <p>You have answered <strong>{{ answeredCount }}/{{ session!.questions.length }}</strong> questions.</p>
        <p *ngIf="unansweredCount > 0" class="warn-text">⚠ {{ unansweredCount }} question(s) unanswered.</p>
        <div class="conf-actions">
          <button class="btn-cancel" (click)="showSubmitConfirm = false">Continue Exam</button>
          <button class="btn-submit-final" (click)="submitExam()" [disabled]="submitting">
            <mat-spinner *ngIf="submitting" diameter="16" strokeWidth="2"></mat-spinner>
            {{ submitting ? 'Submitting...' : 'Submit Now' }}
          </button>
        </div>
      </div>
    </div>

    <!-- LOADING -->
    <div class="loading-overlay" *ngIf="!session">
      <mat-spinner diameter="56"></mat-spinner>
      <p>Loading exam...</p>
    </div>

    <!-- EXAM UI -->
    <div class="exam-shell" *ngIf="session && !isSuspended">

      <!-- Top Bar -->
      <header class="exam-header">
        <div class="header-left">
          <span class="brand-icon">⬡</span>
          <div class="exam-title-block">
            <span class="exam-title">{{ session.testTitle }}</span>
            <span class="exam-sub">Proctored Examination</span>
          </div>
        </div>
        <div class="header-center">
          <div class="timer-block" [class.warning]="timeRemaining <= 300" [class.critical]="timeRemaining <= 60">
            <mat-icon>timer</mat-icon>
            <span class="timer-display">{{ formattedTime }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="violation-badge" *ngIf="violationCount > 0">
            <mat-icon>warning</mat-icon>
            <span>{{ violationCount }} violation{{ violationCount > 1 ? 's' : '' }}</span>
          </div>
          <div class="progress-info">{{ answeredCount }}/{{ session.questions.length }} answered</div>
          <button class="submit-btn-top" (click)="showSubmitConfirm = true">Submit Exam</button>
        </div>
      </header>

      <!-- Body -->
      <div class="exam-body">
        <!-- Question Nav Sidebar -->
        <aside class="question-nav">
          <div class="qnav-header">Questions</div>
          <div class="qnav-grid">
            <button
              *ngFor="let q of session.questions; let i = index"
              class="qnav-btn"
              [class.active]="currentIndex === i"
              [class.answered]="answers[q.id]"
              (click)="goToQuestion(i)">
              {{ i + 1 }}
            </button>
          </div>
          <div class="qnav-legend">
            <div class="legend-item"><span class="dot answered"></span> Answered</div>
            <div class="legend-item"><span class="dot active"></span> Current</div>
            <div class="legend-item"><span class="dot"></span> Unanswered</div>
          </div>
          <button class="fullscreen-btn" (click)="enterFullscreen()">
            <mat-icon>fullscreen</mat-icon>
            Full Screen
          </button>
        </aside>

        <!-- Question Area -->
        <main class="question-area">
          <div class="question-card" *ngIf="currentQuestion">
            <div class="qcard-header">
              <span class="q-num">Question {{ currentIndex + 1 }} of {{ session.questions.length }}</span>
              <span class="q-marks">{{ currentQuestion.marks }} mark{{ currentQuestion.marks > 1 ? 's' : '' }}</span>
            </div>

            <p class="q-text">{{ currentQuestion.questionText }}</p>

            <div class="options-list">
              <button
              *ngFor="let opt of currentQuestion.options; let oi = index"
              class="option-btn"
              [class.selected]="answers[currentQuestion.id] === opt.id"
                (click)="selectAnswer(currentQuestion.id, opt.id, session.sessionId, oi)">
                <span class="opt-letter">{{ optionLetters[oi] }}</span>
                <span class="opt-text">{{ opt.optionText }}</span>
                <mat-icon class="opt-check" *ngIf="answers[currentQuestion.id] === opt.id">check_circle</mat-icon>
              </button>
            </div>

            <div class="q-nav-btns">
              <button class="nav-btn prev" (click)="prevQuestion()" [disabled]="currentIndex === 0">
                <mat-icon>arrow_back</mat-icon> Previous
              </button>
              <button class="nav-btn next"
                *ngIf="currentIndex < session.questions.length - 1"
                (click)="nextQuestion()">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
              <button class="nav-btn submit-last"
                *ngIf="currentIndex === session.questions.length - 1"
                (click)="showSubmitConfirm = true">
                <mat-icon>done_all</mat-icon> Review & Submit
              </button>
            </div>
          </div>

          <div class="question-card empty-question-card" *ngIf="!currentQuestion">
            <div class="qcard-header">
              <span class="q-num">No questions available</span>
            </div>
            <p class="q-text">
              This session currently has no visible questions. Please go back and start the test again.
            </p>
            <div class="q-nav-btns">
              <button class="nav-btn prev" (click)="goHome()">
                <mat-icon>arrow_back</mat-icon> Back to Dashboard
              </button>
            </div>
          </div>
        </main>

        <!-- Violation Log Panel -->
        <aside class="violation-panel" [class.closed]="!logPanelOpen">
          <button class="vp-toggle" (click)="toggleLogPanel()" [attr.aria-label]="logPanelOpen ? 'Collapse activity log' : 'Expand activity log'">
            <mat-icon>{{ logPanelOpen ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
          <div class="vp-content" *ngIf="logPanelOpen">
            <div class="vp-header"><mat-icon>warning</mat-icon> Activity Log</div>
            <div class="vp-empty" *ngIf="recentViolations.length === 0">No activity yet.</div>
            <div class="vp-item" *ngFor="let v of recentViolations">
              <span class="vp-dot"></span>
              <div>
                <div class="vp-type">{{ v.type }}</div>
                <div class="vp-desc">{{ v.desc }}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* Overlays */
    .suspended-overlay, .confirm-overlay, .loading-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(10,13,20,0.95);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(8px);
    }
    .loading-overlay { flex-direction: column; gap: 20px; color: var(--color-text-muted); }
    .suspended-box, .confirm-box {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius); padding: 48px 40px; text-align: center;
      max-width: 440px; width: 90%;
    }
    .sus-icon, .conf-icon { font-size: 56px; margin-bottom: 20px; }
    .suspended-box h2, .confirm-box h2 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    .suspended-box p, .confirm-box p { color: var(--color-text-muted); margin-bottom: 8px; line-height: 1.6; }
    .warn-text { color: var(--color-warning) !important; font-weight: 600; }
    .btn-home {
      margin-top: 24px; padding: 12px 28px; background: var(--color-primary);
      color: #fff; border: none; border-radius: var(--radius-sm);
      font-size: 15px; font-weight: 600; cursor: pointer; font-family: var(--font-main);
    }
    .conf-actions { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
    .btn-cancel { padding: 12px 24px; background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-muted); font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); }
    .btn-submit-final { display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: var(--color-success); border: none; border-radius: var(--radius-sm); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); }
    .btn-submit-final:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Shell */
    .exam-shell { display: flex; flex-direction: column; height: 100vh; background: var(--color-bg); overflow: hidden; }

    /* Header */
    .exam-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; height: 64px;
      background: var(--color-surface); border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .brand-icon { font-size: 24px; filter: drop-shadow(0 0 8px rgba(79,142,247,0.5)); }
    .exam-title-block { display: flex; flex-direction: column; }
    .exam-title { font-size: 15px; font-weight: 700; }
    .exam-sub { font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .header-center { display: flex; align-items: center; }
    .timer-block {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 20px; border-radius: var(--radius-sm);
      background: var(--color-surface-2); border: 1px solid var(--color-border);
      font-family: var(--font-mono); font-size: 22px; font-weight: 700;
      transition: all 0.5s;
    }
    .timer-block mat-icon { font-size: 20px !important; width: 20px; height: 20px; color: var(--color-text-muted); }
    .timer-block.warning { background: rgba(247,193,79,0.1); border-color: rgba(247,193,79,0.4); color: var(--color-warning); }
    .timer-block.critical { background: rgba(247,95,79,0.15); border-color: rgba(247,95,79,0.5); color: var(--color-danger); animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
    .timer-display { letter-spacing: 2px; }

    .header-right { display: flex; align-items: center; gap: 14px; }
    .violation-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px; background: rgba(247,95,79,0.1);
      border: 1px solid rgba(247,95,79,0.3);
      border-radius: 20px; color: var(--color-danger); font-size: 13px; font-weight: 600;
    }
    .violation-badge mat-icon { font-size: 16px !important; width: 16px; height: 16px; }
    .progress-info { font-size: 13px; color: var(--color-text-muted); font-family: var(--font-mono); }
    .submit-btn-top {
      padding: 9px 20px; background: var(--color-success); color: #fff; border: none;
      border-radius: var(--radius-sm); font-size: 14px; font-weight: 700; cursor: pointer;
      font-family: var(--font-main); transition: all var(--transition);
    }
    .submit-btn-top:hover { background: #52e09a; }

    /* Body */
    .exam-body { display: flex; flex: 1; overflow: hidden; }

    /* Question Nav */
    .question-nav {
      width: 200px; flex-shrink: 0; border-right: 1px solid var(--color-border);
      background: var(--color-surface); padding: 20px 16px; overflow-y: auto;
    }
    .qnav-header { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); margin-bottom: 14px; }
    .qnav-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 20px; }
    .qnav-btn {
      aspect-ratio: 1; background: var(--color-surface-2); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text-muted); font-size: 13px;
      font-weight: 600; cursor: pointer; font-family: var(--font-mono);
      transition: all var(--transition); display: flex; align-items: center; justify-content: center;
    }
    .qnav-btn.answered { background: rgba(61,214,140,0.15); border-color: rgba(61,214,140,0.4); color: var(--color-success); }
    .qnav-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
    .qnav-legend { display: flex; flex-direction: column; gap: 8px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--color-text-muted); }
    .dot { width: 10px; height: 10px; border-radius: 2px; background: var(--color-border); flex-shrink: 0; }
    .dot.answered { background: rgba(61,214,140,0.4); }
    .dot.active { background: var(--color-primary); }
    .fullscreen-btn {
      width: 100%;
      margin-top: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 9px 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface-2);
      color: var(--color-text-muted);
      font-family: var(--font-main);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      cursor: pointer;
      transition: all var(--transition);
    }
    .fullscreen-btn:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: var(--color-primary-dim);
    }
    .fullscreen-btn mat-icon { font-size: 16px !important; width: 16px; height: 16px; }

    /* Question Area */
    .question-area { flex: 1; overflow-y: auto; padding: 32px; display: flex; justify-content: center; }

    .question-card {
      width: 100%; max-width: 740px;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius); padding: 36px;
    }
    .qcard-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border);
    }
    .q-num { font-size: 13px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .q-marks { font-size: 13px; font-family: var(--font-mono); background: var(--color-primary-dim); color: var(--color-primary); padding: 4px 12px; border-radius: 4px; }

    .q-text { font-size: 17px; line-height: 1.7; margin-bottom: 28px; font-weight: 500; }

    .options-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
    .option-btn {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 20px; background: var(--color-surface-2);
      border: 2px solid var(--color-border); border-radius: var(--radius-sm);
      text-align: left; cursor: pointer; width: 100%; transition: all var(--transition);
    }
    .option-btn:hover { border-color: rgba(79,142,247,0.5); background: rgba(79,142,247,0.05); }
    .option-btn.selected { border-color: var(--color-primary); background: var(--color-primary-dim); }
    .opt-letter {
      width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--color-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; font-family: var(--font-mono); flex-shrink: 0;
      transition: all var(--transition);
    }
    .option-btn.selected .opt-letter { border-color: var(--color-primary); background: var(--color-primary); color: #fff; }
    .opt-text { flex: 1; font-size: 15px; font-family: var(--font-main); color: var(--color-text); }
    .opt-check { margin-left: auto; color: var(--color-primary); font-size: 20px !important; width: 20px; height: 20px; }

    .q-nav-btns { display: flex; gap: 12px; justify-content: space-between; }
    .nav-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 11px 22px; border-radius: var(--radius-sm);
      font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main);
      transition: all var(--transition); border: 1px solid var(--color-border);
    }
    .nav-btn mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
    .nav-btn.prev { background: none; color: var(--color-text-muted); }
    .nav-btn.prev:hover:not(:disabled) { border-color: var(--color-text-muted); color: var(--color-text); }
    .nav-btn.prev:disabled { opacity: 0.4; cursor: not-allowed; }
    .nav-btn.next { background: var(--color-primary); border-color: var(--color-primary); color: #fff; margin-left: auto; }
    .nav-btn.next:hover { background: #6aa0ff; }
    .nav-btn.submit-last { background: var(--color-success); border-color: var(--color-success); color: #fff; margin-left: auto; }

    /* Violation Panel */
    .violation-panel {
      width: 260px; flex-shrink: 0; border-left: 1px solid var(--color-border);
      background: var(--color-surface); overflow: hidden; position: relative;
      transition: width 0.22s ease;
    }
    .violation-panel.closed { width: 34px; }
    .vp-toggle {
      position: absolute; top: 14px; left: 4px;
      width: 24px; height: 24px; border: 1px solid var(--color-border);
      border-radius: 50%; background: var(--color-surface-2); color: var(--color-text-muted);
      display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2;
    }
    .vp-toggle:hover { color: var(--color-text); border-color: var(--color-primary); }
    .vp-toggle mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
    .vp-content { height: 100%; overflow-y: auto; padding: 20px 16px 20px 34px; }
    .vp-header { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--color-danger); margin-bottom: 14px; }
    .vp-header mat-icon { font-size: 16px !important; width: 16px; height: 16px; }
    .vp-empty { font-size: 12px; color: var(--color-text-muted); padding: 8px 0 12px; }
    .vp-item { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--color-border); }
    .vp-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-danger); flex-shrink: 0; margin-top: 5px; }
    .vp-type { font-size: 12px; font-weight: 700; color: var(--color-danger); text-transform: uppercase; letter-spacing: 0.3px; }
    .vp-desc { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
  `]
})
export class ExamSessionComponent implements OnInit, OnDestroy {
  session: StartSessionResponse | null = null;
  answers: AnswerMap = {};
  currentIndex = 0;
  timeRemaining = 0;
  violationCount = 0;
  isSuspended = false;
  suspendReason = '';
  showSubmitConfirm = false;
  submitting = false;
  recentViolations: { type: string; desc: string }[] = [];
  logPanelOpen = false;
  optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  private readonly violationDebounceMs = 1200;
  private lastViolationGroup = '';
  private lastViolationAt = 0;
  private isFirstViolationIgnored = false;

  private timerInterval?: ReturnType<typeof setInterval>;
  private subs: Subscription[] = [];

  get currentQuestion(): Question | null {
    return this.session?.questions[this.currentIndex] ?? null;
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  get unansweredCount(): number {
    return (this.session?.questions.length ?? 0) - this.answeredCount;
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeRemaining / 60);
    const s = this.timeRemaining % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  constructor(
    private router: Router,
    private candidateService: CandidateService,
    private proctoringService: ProctoringService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { session: StartSessionResponse } | undefined;
    this.session = state?.session ?? history.state?.session ?? null;

    if (!this.session) {
      this.router.navigate(['/candidate/tests']);
      return;
    }

    // Always start with a clean local violation view for a new exam page load.
    this.violationCount = 0;
    this.recentViolations = [];
    this.lastViolationGroup = '';
    this.lastViolationAt = 0;

    this.timeRemaining = this.session.durationMinutes * 60;
    if (!this.session.questions?.length) {
      this.candidateService.getSessionQuestions(this.session.sessionId, this.session.testId).subscribe({
        next: questions => {
          this.session = this.session ? { ...this.session, questions } : this.session;
          if (!questions.length) {
            this.snackBar.open('No questions found for this test session.', 'Close', { duration: 4000 });
          }
        },
        error: () => {
          this.snackBar.open('Failed to load questions for this session.', 'Close', { duration: 4000 });
        }
      });
    }
    this.startTimer();
    this.startProctoring();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    if (this.session) {
      this.proctoringService.removeViolationListeners(this.session.sessionId);
    }
    this.proctoringService.cleanup();
    this.subs.forEach(s => s.unsubscribe());
  }

  // ─── Timer ─────────────────────────────────────────────────────────
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.snackBar.open('Time is up! Auto-submitting...', '', { duration: 3000 });
        this.submitExam(true);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  // ─── Proctoring ────────────────────────────────────────────────────
  private startProctoring(): void {
    
    const sessionId = this.session!.sessionId;

    // Enter fullscreen
    this.proctoringService.enterFullscreen();

    // Setup violation listeners
    this.proctoringService.setupViolationListeners(sessionId);

    // Auto screenshots
    this.proctoringService.startAutoScreenshot(sessionId, this.session!.screenshotIntervalSeconds);

    // Start screen + webcam recording
    this.proctoringService.startScreenRecording(sessionId);
    this.proctoringService.startWebcamRecording(sessionId);

    // Listen for violations
    const violSub = this.proctoringService.violationDetected$.subscribe(v => {
       console.log("Violation detected:", v.type); // 👈 ADD THIS
      if (!this.shouldCountViolation(v.type)) return;
      this.violationCount++;
      this.recentViolations.unshift({ type: v.type, desc: v.description });
      if (this.recentViolations.length > 10) this.recentViolations.pop();
      this.snackBar.open(`⚠ Violation detected: ${v.type}`, 'Dismiss', { duration: 3000, panelClass: 'warn-snack' });
      this.enforceViolationExit();
    });

    // Listen for suspension
    const suspSub = this.proctoringService.sessionSuspended$.subscribe(reason => {
      this.stopTimer();
      this.proctoringService.cleanup();
      this.isSuspended = true;
      this.suspendReason = reason;
      this.forceExitAfterSuspension();
    });

    this.subs.push(violSub, suspSub);
  }

  // ─── Answer Handling ────────────────────────────────────────────────
  selectAnswer(questionId: string, optionId: string, sessionId: string, optionIndex: number): void {
    this.answers[questionId] = optionId;
    const selectedOptionId = this.optionLetters[optionIndex] ?? 'A';
    // Submit answer to backend
    this.candidateService.submitAnswer(sessionId, { questionId, selectedOptionId }).subscribe({ error: () => {} });
    
  }

  // ─── Navigation ─────────────────────────────────────────────────────
  goToQuestion(index: number): void { this.currentIndex = index; }
  nextQuestion(): void { if (this.currentIndex < this.session!.questions.length - 1) this.currentIndex++; }
  prevQuestion(): void { if (this.currentIndex > 0) this.currentIndex--; }
  toggleLogPanel(): void { this.logPanelOpen = !this.logPanelOpen; }
  enterFullscreen(): void { this.proctoringService.enterFullscreen(); }

  // ─── Submit ──────────────────────────────────────────────────────────
  submitExam(autoSubmit = false): void {
    if (!autoSubmit) this.showSubmitConfirm = false;
    this.submitting = true;
    this.stopTimer();
    this.proctoringService.cleanup();

    this.candidateService.submitTest(this.session!.sessionId, { questionId: '', selectedOptionId: '' }).subscribe({
      next: (result) => {
        this.submitting = false;
        this.proctoringService.exitFullscreen();
        const resultWithSessionId = { ...result, sessionId: result.sessionId || this.session!.sessionId };
        localStorage.setItem('lastCandidateResultSessionId', resultWithSessionId.sessionId);
        this.router.navigate(['/exam/result'], { state: { result: resultWithSessionId } });
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Submission failed. Please try again.', 'Close');
      }
    });
  }

  goHome(): void {
    this.proctoringService.exitFullscreen();
    this.router.navigate(['/candidate/dashboard']);
  }

  private enforceViolationExit(): void {
    const limit = this.session?.maxViolations || 3;
    if (this.violationCount < limit || this.isSuspended) return;

    this.stopTimer();
    this.proctoringService.cleanup();
    this.isSuspended = true;
    this.suspendReason = `Maximum violations reached (${this.violationCount}/${limit}). Test has been exited.`;
    this.forceExitAfterSuspension();
  }

  private shouldCountViolation(type: string): boolean {

  // 🔥 Ignore first automatic violation on page load
  if (!this.isFirstViolationIgnored) {
    this.isFirstViolationIgnored = true;
    return false;
  }

  const now = Date.now();
  const group = this.violationGroup(type);

  if (group === this.lastViolationGroup && now - this.lastViolationAt < this.violationDebounceMs) {
    return false;
  }

  this.lastViolationGroup = group;
  this.lastViolationAt = now;
  return true;
}

  private violationGroup(type: string): string {
    if (type === 'TabSwitch' || type === 'WindowBlur' || type === 'FullscreenExit') return 'focus-change';
    return type;
  }

  private forceExitAfterSuspension(): void {
    this.snackBar.open('Test exited due to policy violation.', 'Close', { duration: 2500 });
    window.setTimeout(() => {
      this.proctoringService.exitFullscreen();
      this.router.navigate(['/candidate/dashboard']);
    }, 1200);
  }

  // Context menu blocking disabled for testing/inspect usage.
}
