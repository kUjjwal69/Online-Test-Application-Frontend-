import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

interface ProfileDetails {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  bio: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <h1>My Profile</h1>
      <p>Update your personal details and keep your account information current.</p>
    </div>

    <div class="profile-card">
      <div class="section-title">Basic Information</div>
      <div class="grid">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" [(ngModel)]="profile.fullName" placeholder="Enter your full name" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="profile.email" placeholder="Enter your email" />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="text" [(ngModel)]="profile.phone" placeholder="Enter phone number" />
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select [(ngModel)]="profile.gender">
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" [(ngModel)]="profile.dateOfBirth" />
        </div>
      </div>

      <div class="section-title">Additional Details</div>
      <div class="form-group">
        <label>Address</label>
        <input type="text" [(ngModel)]="profile.address" placeholder="Enter your address" />
      </div>
      <div class="form-group">
        <label>Bio</label>
        <textarea rows="4" [(ngModel)]="profile.bio" placeholder="Tell something about yourself"></textarea>
      </div>

      <div class="actions">
        <button class="btn-secondary" (click)="reset()">Reset</button>
        <button class="btn-primary" (click)="save()">Save</button>
      </div>
    </div>
  `,
  styles: [`
    .page-header { max-width: 900px; margin: 0 auto 20px auto; width: 100%; }
    .profile-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 24px; max-width: 900px; margin: 0 auto; width: 100%; }
    .section-title { font-size: 14px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 14px; margin-top: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    .form-group label { font-size: 12px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 11px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface-2);
      color: var(--color-text);
      font-family: var(--font-main);
      outline: none;
    }
    .form-group textarea { resize: vertical; min-height: 92px; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--color-primary); }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
    .btn-secondary { border: 1px solid var(--color-border); background: none; color: var(--color-text-muted); border-radius: var(--radius-sm); padding: 10px 16px; cursor: pointer; font-family: var(--font-main); font-weight: 600; }
    .btn-primary { border: 1px solid var(--color-primary); border-radius: var(--radius-sm); padding: 10px 16px; cursor: pointer; font-family: var(--font-main); font-weight: 600; line-height: 1.2; min-width: 116px; }
    @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly PROFILE_KEY = 'exam_profile_details';
  profile: ProfileDetails = this.getDefaultProfile();

  constructor(private auth: AuthService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    const savedProfile = localStorage.getItem(this.PROFILE_KEY);
    if (!savedProfile) return;

    try {
      const parsed = JSON.parse(savedProfile) as ProfileDetails;
      this.profile = { ...this.getDefaultProfile(), ...parsed };
    } catch {
      this.profile = this.getDefaultProfile();
    }
  }

  save(): void {
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(this.profile));
    this.snackBar.open('Profile saved successfully', 'OK');
  }

  reset(): void {
    this.profile = this.getDefaultProfile();
  }

  private getDefaultProfile(): ProfileDetails {
    const currentUser = this.auth.getCurrentUser();
    return {
      fullName: currentUser?.fullName || '',
      email: currentUser?.username || '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      address: '',
      bio: ''
    };
  }
}
