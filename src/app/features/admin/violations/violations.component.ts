import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../../core/services/admin.service';
import { Violation } from '../../../shared/models/models';

@Component({
  selector: 'app-violations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-header" style="margin-bottom:28px">
      <h1>Violations Log</h1>
      <p>All proctoring violations across all sessions</p>
    </div>

    <div class="filter-bar">
      <div class="search-wrap"><mat-icon>search</mat-icon><input type="text" placeholder="Search..." [(ngModel)]="searchQuery" /></div>
      <div class="type-filters">
        <button *ngFor="let t of types" class="filter-btn" [class.active]="selectedType === t" (click)="selectedType = t">{{ t }}</button>
      </div>
    </div>

    <div class="summary-chips">
      <div class="chip" *ngFor="let stat of typeSummary">
        <span class="chip-count">{{ stat.count }}</span>
        <span class="chip-label">{{ stat.type }}</span>
      </div>
    </div>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px"><mat-spinner diameter="48"></mat-spinner></div>

    <div class="violations-table" *ngIf="!loading">
      <div class="t-head">
        <span>Candidate</span>
        <span>Type</span>
        <span>Description</span>
        <span>Time</span>
        <span>Session</span>
      </div>
      <div class="t-row" *ngFor="let v of filteredViolations">
        <div class="u-cell">
          <div class="avatar">{{ v.userName.charAt(0) }}</div>
          {{ v.userName }}
        </div>
        <span class="v-type-badge" [ngClass]="'vt-' + v.violationType.toLowerCase()">{{ v.violationType }}</span>
        <span class="v-desc">{{ v.description }}</span>
        <span class="v-time">{{ v.occurredAt | date:'short' }}</span>
        <a [routerLink]="['/admin/sessions', v.sessionId]" class="session-link">View Session</a>
      </div>
      <div class="empty-state" *ngIf="filteredViolations.length === 0">
        <mat-icon>check_shield</mat-icon>
        <h3>No violations found</h3>
      </div>
    </div>
  `,
  styles: [`
    .page-header h1 { font-size: 26px; font-weight: 700; }
    .page-header p { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
    .filter-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .search-wrap { display: flex; align-items: center; gap: 10px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 10px 14px; flex: 1; }
    .search-wrap mat-icon { color: var(--color-text-muted); }
    .search-wrap input { flex: 1; background: none; border: none; outline: none; color: var(--color-text); font-size: 14px; font-family: var(--font-main); }
    .type-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-btn { padding: 6px 14px; background: none; border: 1px solid var(--color-border); border-radius: 20px; color: var(--color-text-muted); font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--font-main); transition: all var(--transition); }
    .filter-btn.active { background: var(--color-primary-dim); border-color: var(--color-primary); color: var(--color-primary); }
    .summary-chips { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .chip { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
    .chip-count { font-size: 18px; font-weight: 700; font-family: var(--font-mono); color: var(--color-danger); }
    .chip-label { font-size: 12px; color: var(--color-text-muted); }
    .violations-table { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
    .t-head { display: grid; grid-template-columns: 2fr 1.5fr 2fr 1.5fr 1fr; gap: 12px; padding: 14px 20px; background: var(--color-surface-2); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
    .t-row { display: grid; grid-template-columns: 2fr 1.5fr 2fr 1.5fr 1fr; gap: 12px; padding: 14px 20px; align-items: center; border-top: 1px solid var(--color-border); transition: background var(--transition); font-size: 13px; }
    .t-row:hover { background: var(--color-surface-2); }
    .u-cell { display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--color-primary-dim); color: var(--color-primary); font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .v-type-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 10px; border-radius: 4px; background: rgba(247,95,79,0.1); color: var(--color-danger); }
    .v-desc { font-size: 12px; color: var(--color-text-muted); }
    .v-time { font-size: 11px; color: var(--color-text-muted); font-family: var(--font-mono); }
    .session-link { font-size: 12px; color: var(--color-primary); font-weight: 600; }
  `]
})
export class ViolationsComponent implements OnInit {
  violations: Violation[] = []; loading = true; searchQuery = ''; selectedType = 'All';
  types = ['All', 'TabSwitch', 'WindowBlur', 'FullscreenExit', 'ContextMenu', 'KeyboardShortcut'];
  get typeSummary() { return this.types.filter(t => t !== 'All').map(t => ({ type: t, count: this.violations.filter(v => v.violationType === t).length })).filter(s => s.count > 0); }
  get filteredViolations(): Violation[] {
    return this.violations.filter(v => {
      const s = this.searchQuery.toLowerCase();
      return (v.userName.toLowerCase().includes(s) || v.violationType.toLowerCase().includes(s)) && (this.selectedType === 'All' || v.violationType === this.selectedType);
    });
  }
  constructor(private adminService: AdminService) {}
  ngOnInit(): void { this.adminService.getAllViolations().subscribe({ next: v => { this.violations = v; this.loading = false; }, error: () => this.loading = false }); }
}
