import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { Prescription } from '../../../shared/models/pharmacy.model';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <div class="page-header-row">
        <h1>Prescriptions</h1>
        <div class="nav-buttons">
          <button mat-button routerLink="/pharmacy/medications">Medications</button>
          <button mat-button routerLink="/pharmacy/inventory">Inventory</button>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <table mat-table [dataSource]="dataSource" *ngIf="!isLoading" class="full-width">
            <ng-container matColumnDef="prescriptionNumber">
              <th mat-header-cell *matHeaderCellDef>Prescription #</th>
              <td mat-cell *matCellDef="let rx">{{ rx.prescriptionNumber }}</td>
            </ng-container>

            <ng-container matColumnDef="patient">
              <th mat-header-cell *matHeaderCellDef>Patient</th>
              <td mat-cell *matCellDef="let rx">{{ rx.patientName }}</td>
            </ng-container>

            <ng-container matColumnDef="doctor">
              <th mat-header-cell *matHeaderCellDef>Prescribed By</th>
              <td mat-cell *matCellDef="let rx">{{ rx.doctorName }}</td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let rx">{{ rx.prescribedDate | date }}</td>
            </ng-container>

            <ng-container matColumnDef="items">
              <th mat-header-cell *matHeaderCellDef>Items</th>
              <td mat-cell *matCellDef="let rx">{{ rx.items?.length || 0 }} medication(s)</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let rx">
                <span class="status-chip" [ngClass]="rx.status.toLowerCase()">
                  {{ rx.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let rx">
                <button mat-icon-button (click)="viewDetails(rx)">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-raised-button color="primary" size="small" 
                        *ngIf="rx.status === 'PENDING'"
                        (click)="dispensePrescription(rx)">
                  Dispense
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator 
            [length]="totalElements"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .nav-buttons {
      display: flex;
      gap: 8px;
    }
    .full-width {
      width: 100%;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-chip.pending { background-color: #ff9800; color: white; }
    .status-chip.dispensed { background-color: #4caf50; color: white; }
    .status-chip.cancelled { background-color: #9e9e9e; color: white; }
  `]
})
export class PrescriptionListComponent implements OnInit {
  displayedColumns = ['prescriptionNumber', 'patient', 'doctor', 'date', 'items', 'status', 'actions'];
  dataSource = new MatTableDataSource<Prescription>();
  isLoading = false;
  pageSize = 10;
  totalElements = 0;

  constructor(
    private pharmacyService: PharmacyService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPrescriptions();
  }

  loadPrescriptions(page: number = 0): void {
    this.isLoading = true;
    this.pharmacyService.getPrescriptions(page, this.pageSize).subscribe({
      next: (response) => {
        this.dataSource.data = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.loadPrescriptions(event.pageIndex);
  }

  viewDetails(prescription: Prescription): void {
    console.log('View prescription:', prescription);
  }

  dispensePrescription(prescription: Prescription): void {
    if (confirm('Are you sure you want to dispense this prescription?')) {
      this.pharmacyService.dispensePrescription(prescription.id).subscribe({
        next: () => {
          this.snackBar.open('Prescription dispensed successfully', 'Close', { duration: 3000 });
          this.loadPrescriptions();
        },
        error: () => {
          this.snackBar.open('Error dispensing prescription', 'Close', { duration: 3000 });
        }
      });
    }
  }
}

