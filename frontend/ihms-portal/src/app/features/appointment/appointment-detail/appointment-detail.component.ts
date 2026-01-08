import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../shared/models/appointment.model';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container" *ngIf="appointment; else loading">
      <div class="page-header-row">
        <div>
          <button mat-icon-button routerLink="/appointments">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="inline-header">Appointment Details</h1>
        </div>
        <div class="actions" *ngIf="appointment.status === 'PENDING' || appointment.status === 'CONFIRMED'">
          <button mat-raised-button color="primary" [routerLink]="['/appointments', appointment.id, 'edit']">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
          <button mat-raised-button color="accent" (click)="confirmAppointment()" *ngIf="appointment.status === 'PENDING'">
            <mat-icon>check</mat-icon>
            Confirm
          </button>
          <button mat-raised-button (click)="completeAppointment()" *ngIf="appointment.status === 'CONFIRMED'">
            <mat-icon>done_all</mat-icon>
            Complete
          </button>
          <button mat-raised-button color="warn" (click)="cancelAppointment()">
            <mat-icon>cancel</mat-icon>
            Cancel
          </button>
        </div>
      </div>

      <div class="detail-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Appointment Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <label>Date</label>
                <span>{{ appointment.appointmentDate | date:'fullDate' }}</span>
              </div>
              <div class="info-item">
                <label>Time</label>
                <span>{{ appointment.appointmentTime }}</span>
              </div>
              <div class="info-item">
                <label>Duration</label>
                <span>{{ appointment.duration }} minutes</span>
              </div>
              <div class="info-item">
                <label>Type</label>
                <span>{{ appointment.type | titlecase }}</span>
              </div>
              <div class="info-item">
                <label>Status</label>
                <span class="status-chip" [ngClass]="appointment.status.toLowerCase()">
                  {{ appointment.status }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Patient Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <label>Patient Name</label>
                <span>{{ appointment.patientName }}</span>
              </div>
              <div class="info-item">
                <label>Patient ID</label>
                <a [routerLink]="['/patients', appointment.patientId]">{{ appointment.patientId }}</a>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Doctor Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <label>Doctor Name</label>
                <span>{{ appointment.doctorName }}</span>
              </div>
              <div class="info-item">
                <label>Department</label>
                <span>{{ appointment.departmentName }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="full-width-card">
          <mat-card-header>
            <mat-card-title>Reason & Notes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-item">
              <label>Reason for Visit</label>
              <p>{{ appointment.reason }}</p>
            </div>
            <div class="info-item" *ngIf="appointment.notes">
              <label>Notes</label>
              <p>{{ appointment.notes }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .inline-header {
      display: inline;
      margin-left: 8px;
    }
    .actions {
      display: flex;
      gap: 12px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 16px;
    }
    .full-width-card {
      grid-column: 1 / -1;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-item label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 60px;
    }
    .status-chip {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
    }
  `]
})
export class AppointmentDetailComponent implements OnInit {
  appointment: Appointment | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAppointment(+id);
    }
  }

  loadAppointment(id: number): void {
    this.appointmentService.getAppointment(id).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
      },
      error: () => {
        this.router.navigate(['/appointments']);
      }
    });
  }

  confirmAppointment(): void {
    if (this.appointment) {
      this.appointmentService.confirmAppointment(this.appointment.id).subscribe({
        next: (updated) => {
          this.appointment = updated;
          this.snackBar.open('Appointment confirmed', 'Close', { duration: 3000 });
        }
      });
    }
  }

  completeAppointment(): void {
    if (this.appointment) {
      this.appointmentService.completeAppointment(this.appointment.id).subscribe({
        next: (updated) => {
          this.appointment = updated;
          this.snackBar.open('Appointment completed', 'Close', { duration: 3000 });
        }
      });
    }
  }

  cancelAppointment(): void {
    if (this.appointment && confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(this.appointment.id).subscribe({
        next: (updated) => {
          this.appointment = updated;
          this.snackBar.open('Appointment cancelled', 'Close', { duration: 3000 });
        }
      });
    }
  }
}

