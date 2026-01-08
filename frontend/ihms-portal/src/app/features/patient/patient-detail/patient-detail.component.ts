import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../shared/models/patient.model';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container" *ngIf="patient; else loading">
      <div class="page-header-row">
        <div>
          <button mat-icon-button routerLink="/patients">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="inline-header">{{ patient.firstName }} {{ patient.lastName }}</h1>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" [routerLink]="['/patients', patient.id, 'edit']">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
          <button mat-raised-button color="accent" [routerLink]="['/appointments/new']" [queryParams]="{patientId: patient.id}">
            <mat-icon>event</mat-icon>
            Book Appointment
          </button>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="Personal Info">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Personal Information</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Full Name</label>
                    <span>{{ patient.firstName }} {{ patient.lastName }}</span>
                  </div>
                  <div class="info-item">
                    <label>Email</label>
                    <span>{{ patient.email }}</span>
                  </div>
                  <div class="info-item">
                    <label>Phone</label>
                    <span>{{ patient.phone }}</span>
                  </div>
                  <div class="info-item">
                    <label>Date of Birth</label>
                    <span>{{ patient.dateOfBirth | date }}</span>
                  </div>
                  <div class="info-item">
                    <label>Gender</label>
                    <span>{{ patient.gender }}</span>
                  </div>
                  <div class="info-item">
                    <label>Blood Type</label>
                    <span>{{ patient.bloodType || 'N/A' }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card *ngIf="patient.address">
              <mat-card-header>
                <mat-card-title>Address</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>{{ patient.address.street }}</p>
                <p>{{ patient.address.city }}, {{ patient.address.state }} {{ patient.address.zipCode }}</p>
                <p>{{ patient.address.country }}</p>
              </mat-card-content>
            </mat-card>

            <mat-card *ngIf="patient.emergencyContact">
              <mat-card-header>
                <mat-card-title>Emergency Contact</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Name</label>
                    <span>{{ patient.emergencyContact.name }}</span>
                  </div>
                  <div class="info-item">
                    <label>Relationship</label>
                    <span>{{ patient.emergencyContact.relationship }}</span>
                  </div>
                  <div class="info-item">
                    <label>Phone</label>
                    <span>{{ patient.emergencyContact.phone }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Medical History">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Allergies</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-list *ngIf="patient.allergies?.length; else noAllergies">
                  <mat-list-item *ngFor="let allergy of patient.allergies">
                    <mat-icon matListItemIcon color="warn">warning</mat-icon>
                    <span matListItemTitle>{{ allergy }}</span>
                  </mat-list-item>
                </mat-list>
                <ng-template #noAllergies>
                  <p>No known allergies</p>
                </ng-template>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header>
                <mat-card-title>Medical Notes</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>{{ patient.medicalNotes || 'No medical notes available' }}</p>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Insurance">
          <div class="tab-content">
            <mat-card *ngIf="patient.insuranceInfo; else noInsurance">
              <mat-card-header>
                <mat-card-title>Insurance Information</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Provider</label>
                    <span>{{ patient.insuranceInfo.provider }}</span>
                  </div>
                  <div class="info-item">
                    <label>Policy Number</label>
                    <span>{{ patient.insuranceInfo.policyNumber }}</span>
                  </div>
                  <div class="info-item" *ngIf="patient.insuranceInfo.groupNumber">
                    <label>Group Number</label>
                    <span>{{ patient.insuranceInfo.groupNumber }}</span>
                  </div>
                  <div class="info-item" *ngIf="patient.insuranceInfo.expiryDate">
                    <label>Expiry Date</label>
                    <span>{{ patient.insuranceInfo.expiryDate | date }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
            <ng-template #noInsurance>
              <mat-card>
                <mat-card-content>
                  <p>No insurance information on file</p>
                </mat-card-content>
              </mat-card>
            </ng-template>
          </div>
        </mat-tab>
      </mat-tab-group>
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
    .tab-content {
      padding: 20px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    .info-item span {
      font-size: 16px;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 60px;
    }
  `]
})
export class PatientDetailComponent implements OnInit {
  patient: Patient | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPatient(+id);
    }
  }

  loadPatient(id: number): void {
    this.patientService.getPatient(id).subscribe({
      next: (patient) => {
        this.patient = patient;
      },
      error: () => {
        this.router.navigate(['/patients']);
      }
    });
  }
}

