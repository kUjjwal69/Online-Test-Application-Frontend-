import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../../core/services/admin.service';
import { Question, CreateQuestionRequest, CreateOptionRequest } from '../../../shared/models/models';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
      <div>
        <a routerLink="/admin/tests" class="back-link">← Back to Tests</a>
        <h1 style="font-size:26px;font-weight:700;margin-top:8px">Questions</h1>
        <p style="color:var(--color-text-muted);font-size:14px">Test ID: {{ testId }}</p>
      </div>
      <button class="btn-primary" (click)="showAddForm = !showAddForm">
        <mat-icon>{{ showAddForm ? 'close' : 'add' }}</mat-icon>
        {{ showAddForm ? 'Cancel' : 'Add Question' }}
      </button>
    </div>

    <!-- Add Form -->
    <div class="add-form" *ngIf="showAddForm">
      <h3>New Question</h3>
      <form #qForm="ngForm" (ngSubmit)="addQuestion()">
        <div class="form-group">
          <label>Question Text *</label>
          <textarea name="questionText" [(ngModel)]="newQuestion.questionText" required rows="3" placeholder="Enter your question..."></textarea>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label>Marks *</label>
            <input type="number" name="marks" [(ngModel)]="newQuestion.marks" required min="1" />
          </div>
          <div class="form-group">
            <label>Order</label>
            <input type="number" name="order" [(ngModel)]="newQuestion.order" min="1" />
          </div>
        </div>
        <div class="options-section">
          <label>Answer Options (mark the correct one)</label>
          <div class="option-row" *ngFor="let opt of questionOptions; let i = index">
            <input type="radio" name="correctOption" [value]="i" [(ngModel)]="correctOptionIndex" />
            <input type="text" [(ngModel)]="opt.optionText" [name]="'opt_'+i" required placeholder="Option {{ i+1 }}" />
            <button type="button" class="icon-btn danger" (click)="removeOption(i)" *ngIf="questionOptions.length > 2"><mat-icon>close</mat-icon></button>
          </div>
          <button type="button" class="btn-ghost" (click)="addOption()" *ngIf="questionOptions.length < 4">
            <mat-icon>add</mat-icon> Add Option
          </button>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="addingQuestion || qForm.invalid || correctOptionIndex < 0">
            <mat-spinner *ngIf="addingQuestion" diameter="16" strokeWidth="2"></mat-spinner>
            {{ addingQuestion ? 'Adding...' : 'Add Question' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Questions List -->
    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px"><mat-spinner diameter="48"></mat-spinner></div>

    <div class="questions-list" *ngIf="!loading">
      <div class="question-card" *ngFor="let q of questions; let i = index">
        <div class="qc-header">
          <span class="q-num">Q{{ i + 1 }}</span>
          <span class="q-marks">{{ q.marks }} mark{{ q.marks > 1 ? 's' : '' }}</span>
          <div class="q-actions">
            <button class="icon-btn danger" (click)="deleteQuestion(q)"><mat-icon>delete</mat-icon></button>
          </div>
        </div>
        <p class="q-text">{{ q.questionText }}</p>
        <div class="options-grid">
          <div class="option-chip" *ngFor="let opt of q.options" [class.correct]="opt.isCorrect">
            <span class="opt-indicator">{{ opt.isCorrect ? '✓' : '○' }}</span>
            {{ opt.optionText }}
          </div>
        </div>
      </div>
      <div class="empty-state" *ngIf="questions.length === 0">
        <mat-icon>quiz</mat-icon>
        <h3>No questions yet</h3>
        <p>Add questions using the button above</p>
      </div>
    </div>
  `,
  styles: [`
    .back-link { font-size: 13px; color: var(--color-text-muted); }
    .back-link:hover { color: var(--color-primary); }
    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); transition: all var(--transition); }
    .btn-primary:hover { background: #6aa0ff; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-ghost { display: flex; align-items: center; gap: 4px; background: none; border: 1px dashed var(--color-border); color: var(--color-text-muted); padding: 8px 14px; border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; font-family: var(--font-main); transition: all var(--transition); margin-top: 8px; }
    .btn-ghost:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .add-form { background: var(--color-surface); border: 1px solid var(--color-primary); border-radius: var(--radius); padding: 24px; margin-bottom: 28px; }
    .add-form h3 { font-size: 16px; font-weight: 700; margin-bottom: 20px; color: var(--color-primary); }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .form-group label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
    .form-group input, .form-group textarea { padding: 10px 14px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); font-size: 14px; font-family: var(--font-main); outline: none; transition: border-color var(--transition); }
    .form-group input:focus, .form-group textarea:focus { border-color: var(--color-primary); }
    .form-row.cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .options-section { margin-bottom: 16px; }
    .options-section label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); margin-bottom: 10px; }
    .option-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .option-row input[type=text] { flex: 1; padding: 8px 12px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); font-size: 14px; font-family: var(--font-main); outline: none; }
    .option-row input[type=radio] { width: 16px; height: 16px; cursor: pointer; accent-color: var(--color-primary); }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: 4px; display: flex; }
    .icon-btn.danger:hover { color: var(--color-danger); }
    .icon-btn mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
    .form-actions { display: flex; justify-content: flex-end; }
    .questions-list { display: flex; flex-direction: column; gap: 16px; }
    .question-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 24px; }
    .qc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .q-num { background: var(--color-primary-dim); color: var(--color-primary); font-size: 13px; font-weight: 700; font-family: var(--font-mono); padding: 4px 10px; border-radius: 4px; }
    .q-marks { font-size: 12px; color: var(--color-text-muted); background: var(--color-surface-2); padding: 4px 10px; border-radius: 4px; }
    .q-actions { margin-left: auto; }
    .q-text { font-size: 15px; line-height: 1.6; margin-bottom: 16px; }
    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .option-chip { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 14px; }
    .option-chip.correct { background: rgba(61,214,140,0.1); border-color: var(--color-success); color: var(--color-success); }
    .opt-indicator { font-size: 14px; }
  `]
})
export class QuestionsComponent implements OnInit {
  testId = '';
  questions: Question[] = [];
  loading = true;
  showAddForm = false;
  addingQuestion = false;
  correctOptionIndex = -1;
  questionOptions: CreateOptionRequest[] = [
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false }
  ];

  newQuestion: CreateQuestionRequest = {
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: '',
    marks: 1,
    order: 0
  };

  constructor(private route: ActivatedRoute, private adminService: AdminService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.testId = this.route.snapshot.params['id'];
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loading = true;
    this.adminService.getQuestionsByTest(this.testId).subscribe({ next: q => { this.questions = q; this.loading = false; }, error: () => this.loading = false });
  }

  addOption(): void {
    if (this.questionOptions.length >= 4) return;
    this.questionOptions.push({ optionText: '', isCorrect: false });
  }

  removeOption(i: number): void {
    this.questionOptions.splice(i, 1);
    if (this.correctOptionIndex === i) this.correctOptionIndex = -1;
    if (this.correctOptionIndex > i) this.correctOptionIndex--;
  }

  addQuestion(): void {
    if (this.correctOptionIndex < 0) { this.snackBar.open('Please mark the correct answer', 'Close'); return; }
    const normalizedOptions = this.questionOptions
      .slice(0, 4)
      .map((opt: CreateOptionRequest, i: number) => ({
        optionText: opt.optionText.trim(),
        isCorrect: i === this.correctOptionIndex
      }));

    if (normalizedOptions.length < 4 || normalizedOptions.some(opt => !opt.optionText)) {
      this.snackBar.open('Please enter four answer options', 'Close');
      return;
    }

    this.newQuestion.optionA = normalizedOptions[0].optionText;
    this.newQuestion.optionB = normalizedOptions[1].optionText;
    this.newQuestion.optionC = normalizedOptions[2].optionText;
    this.newQuestion.optionD = normalizedOptions[3].optionText;
    this.newQuestion.correctOption = String.fromCharCode(65 + this.correctOptionIndex);
    this.addingQuestion = true;
    this.adminService.createQuestion(this.testId, this.newQuestion).subscribe({
      next: () => {
        this.addingQuestion = false;
        this.snackBar.open('Question added!', 'OK');
        this.showAddForm = false;
        this.correctOptionIndex = -1;
        this.newQuestion = {
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctOption: '',
          marks: 1,
          order: this.questions.length + 1
        };
        this.questionOptions = [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ];
        this.loadQuestions();
      },
      error: (err) => { this.addingQuestion = false; this.snackBar.open(err.error?.message || 'Failed to add question', 'Close'); }
    });
  }

  deleteQuestion(q: Question): void {
    if (!confirm('Delete this question?')) return;
    this.adminService.deleteQuestion(q.id).subscribe({ next: () => { this.snackBar.open('Question deleted', 'OK'); this.loadQuestions(); }, error: () => this.snackBar.open('Failed to delete', 'Close') });
  }
}
