import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AppointmentType } from '../../../shared/models/appointment.model';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <div class="page-header-row">
        <div>
          <button mat-icon-button routerLink="/appointments">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="inline-header">{{ isEditMode ? 'Edit Appointment' : 'New Appointment' }}</h1>
        </div>
      </div>

      <mat-card class="form-container">
        <mat-card-content>
          <form [formGroup]="appointmentForm" (ngSubmit)="onSubmit()">
            <h3>Patient & Doctor</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Patient</mat-label>
                <mat-select formControlName="patientId">
                  <mat-option *ngFor="let patient of patients" [value]="patient.id">
                    {{ patient.name }}
                  </mat-option>
                </mat-select>
                <mat-error>Patient is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Department</mat-label>
                <mat-select formControlName="departmentId" (selectionChange)="onDepartmentChange()">
                  <mat-option *ngFor="let dept of departments" [value]="dept.id">
                    {{ dept.name }}
                  </mat-option>
                </mat-select>
                <mat-error>Department is required</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Doctor</mat-label>
              <mat-select formControlName="doctorId">
                <mat-option *ngFor="let doctor of filteredDoctors" [value]="doctor.id">
                  {{ doctor.name }} - {{ doctor.specialization }}
                </mat-option>
              </mat-select>
              <mat-error>Doctor is required</mat-error>
            </mat-form-field>

            <h3>Date & Time</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Appointment Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="appointmentDate" [min]="minDate">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error>Date is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Time</mat-label>
                <mat-select formControlName="appointmentTime">
                  <mat-option *ngFor="let slot of timeSlots" [value]="slot">
                    {{ slot }}
                  </mat-option>
                </mat-select>
                <mat-error>Time is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Appointment Type</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="CONSULTATION">Consultation</mat-option>
                  <mat-option value="FOLLOW_UP">Follow Up</mat-option>
                  <mat-option value="ROUTINE_CHECKUP">Routine Checkup</mat-option>
                  <mat-option value="SPECIALIST">Specialist</mat-option>
                  <mat-option value="EMERGENCY">Emergency</mat-option>
                </mat-select>
                <mat-error>Type is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Duration (minutes)</mat-label>
                <mat-select formControlName="duration">
                  <mat-option [value]="15">15 min</mat-option>
                  <mat-option [value]="30">30 min</mat-option>
                  <mat-option [value]="45">45 min</mat-option>
                  <mat-option [value]="60">60 min</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <h3>Details</h3>
            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Reason for Visit</mat-label>
              <textarea matInput formControlName="reason" rows="3"></textarea>
              <mat-error>Reason is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Additional Notes</mat-label>
              <textarea matInput formControlName="notes" rows="3"></textarea>
            </mat-form-field>

            <div class="actions-row">
              <button mat-button type="button" routerLink="/appointments">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="isLoading || appointmentForm.invalid">
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                <span *ngIf="!isLoading">{{ isEditMode ? 'Update' : 'Book' }} Appointment</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header-row {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }
    .inline-header {
      display: inline;
      margin-left: 8px;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .form-row mat-form-field {
      flex: 1;
    }
    h3 {
      margin-top: 24px;
      margin-bottom: 16px;
      color: #666;
    }
    h3:first-of-type {
      margin-top: 0;
    }
  `]
})
export class AppointmentFormComponent implements OnInit {
  appointmentForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  appointmentId: number | null = null;
  minDate = new Date();

  // Mock data - in real app, these would come from services
  patients = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Wilson' }
  ];

  departments = [
    { id: 1, name: 'General Medicine' },
    { id: 2, name: 'Cardiology' },
    { id: 3, name: 'Orthopedics' },
    { id: 4, name: 'Pediatrics' }
  ];

  doctors = [
    { id: 1, name: 'Dr. Smith', departmentId: 1, specialization: 'General Physician' },
    { id: 2, name: 'Dr. Johnson', departmentId: 2, specialization: 'Cardiologist' },
    { id: 3, name: 'Dr. Davis', departmentId: 3, specialization: 'Orthopedic Surgeon' },
    { id: 4, name: 'Dr. Williams', departmentId: 4, specialization: 'Pediatrician' }
  ];

  filteredDoctors: any[] = [];

  timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {
    this.appointmentForm = this.fb.group({
      patientId: ['', Validators.required],
      departmentId: ['', Validators.required],
      doctorId: ['', Validators.required],
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      type: ['CONSULTATION', Validators.required],
      duration: [30],
      reason: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Check for pre-selected patient from query params
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (patientId) {
      this.appointmentForm.patchValue({ patientId: +patientId });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.appointmentId = +id;
      this.loadAppointment(this.appointmentId);
    }
  }

  loadAppointment(id: number): void {
    this.appointmentService.getAppointment(id).subscribe({
      next: (appointment) => {
        this.appointmentForm.patchValue({
          patientId: appointment.patientId,
          departmentId: appointment.departmentId,
          doctorId: appointment.doctorId,
          appointmentDate: new Date(appointment.appointmentDate),
          appointmentTime: appointment.appointmentTime,
          type: appointment.type,
          duration: appointment.duration,
          reason: appointment.reason,
          notes: appointment.notes
        });
        this.onDepartmentChange();
      },
      error: () => {
        this.router.navigate(['/appointments']);
      }
    });
  }

  onDepartmentChange(): void {
    const departmentId = this.appointmentForm.get('departmentId')?.value;
    this.filteredDoctors = this.doctors.filter(d => d.departmentId === departmentId);
    if (!this.isEditMode) {
      this.appointmentForm.patchValue({ doctorId: '' });
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formValue = this.appointmentForm.value;
    const appointmentRequest = {
      ...formValue,
      appointmentDate: formValue.appointmentDate.toISOString().split('T')[0]
    };

    const request = this.isEditMode
      ? this.appointmentService.updateAppointment(this.appointmentId!, appointmentRequest)
      : this.appointmentService.createAppointment(appointmentRequest);

    request.subscribe({
      next: () => {
        this.snackBar.open(`Appointment ${this.isEditMode ? 'updated' : 'booked'} successfully`, 'Close', { duration: 3000 });
        this.router.navigate(['/appointments']);
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('An error occurred. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }
}

