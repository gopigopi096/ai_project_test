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
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-patient-form',
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
          <button mat-icon-button routerLink="/patients">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="inline-header">{{ isEditMode ? 'Edit Patient' : 'New Patient' }}</h1>
        </div>
      </div>

      <mat-card class="form-container">
        <mat-card-content>
          <form [formGroup]="patientForm" (ngSubmit)="onSubmit()">
            <h3>Personal Information</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName">
                <mat-error>First name is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName">
                <mat-error>Last name is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email">
                <mat-error>Valid email is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone">
                <mat-error>Phone is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Date of Birth</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="dateOfBirth">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error>Date of birth is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Gender</mat-label>
                <mat-select formControlName="gender">
                  <mat-option value="MALE">Male</mat-option>
                  <mat-option value="FEMALE">Female</mat-option>
                  <mat-option value="OTHER">Other</mat-option>
                </mat-select>
                <mat-error>Gender is required</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Blood Type</mat-label>
              <mat-select formControlName="bloodType">
                <mat-option value="">Unknown</mat-option>
                <mat-option value="A+">A+</mat-option>
                <mat-option value="A-">A-</mat-option>
                <mat-option value="B+">B+</mat-option>
                <mat-option value="B-">B-</mat-option>
                <mat-option value="AB+">AB+</mat-option>
                <mat-option value="AB-">AB-</mat-option>
                <mat-option value="O+">O+</mat-option>
                <mat-option value="O-">O-</mat-option>
              </mat-select>
            </mat-form-field>

            <h3>Address</h3>
            <div formGroupName="address">
              <mat-form-field appearance="outline" class="form-field-full">
                <mat-label>Street</mat-label>
                <input matInput formControlName="street">
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>City</mat-label>
                  <input matInput formControlName="city">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>State</mat-label>
                  <input matInput formControlName="state">
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Zip Code</mat-label>
                  <input matInput formControlName="zipCode">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Country</mat-label>
                  <input matInput formControlName="country">
                </mat-form-field>
              </div>
            </div>

            <h3>Emergency Contact</h3>
            <div formGroupName="emergencyContact">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Contact Name</mat-label>
                  <input matInput formControlName="name">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Relationship</mat-label>
                  <input matInput formControlName="relationship">
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="form-field-full">
                <mat-label>Contact Phone</mat-label>
                <input matInput formControlName="phone">
              </mat-form-field>
            </div>

            <h3>Medical Information</h3>
            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Allergies (comma-separated)</mat-label>
              <input matInput formControlName="allergiesText" placeholder="e.g., Penicillin, Peanuts">
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Medical Notes</mat-label>
              <textarea matInput formControlName="medicalNotes" rows="4"></textarea>
            </mat-form-field>

            <div class="actions-row">
              <button mat-button type="button" routerLink="/patients">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="isLoading || patientForm.invalid">
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                <span *ngIf="!isLoading">{{ isEditMode ? 'Update' : 'Create' }} Patient</span>
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
export class PatientFormComponent implements OnInit {
  patientForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  patientId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private snackBar: MatSnackBar
  ) {
    this.patientForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      bloodType: [''],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: ['']
      }),
      emergencyContact: this.fb.group({
        name: [''],
        relationship: [''],
        phone: ['']
      }),
      allergiesText: [''],
      medicalNotes: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.patientId = +id;
      this.loadPatient(this.patientId);
    }
  }

  loadPatient(id: number): void {
    this.patientService.getPatient(id).subscribe({
      next: (patient) => {
        this.patientForm.patchValue({
          ...patient,
          allergiesText: patient.allergies?.join(', ') || ''
        });
      },
      error: () => {
        this.router.navigate(['/patients']);
      }
    });
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formValue = this.patientForm.value;
    const patient = {
      ...formValue,
      allergies: formValue.allergiesText ? formValue.allergiesText.split(',').map((a: string) => a.trim()) : []
    };
    delete patient.allergiesText;

    const request = this.isEditMode
      ? this.patientService.updatePatient(this.patientId!, patient)
      : this.patientService.createPatient(patient);

    request.subscribe({
      next: () => {
        this.snackBar.open(`Patient ${this.isEditMode ? 'updated' : 'created'} successfully`, 'Close', { duration: 3000 });
        this.router.navigate(['/patients']);
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('An error occurred. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }
}

