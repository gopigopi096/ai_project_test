import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { Medication } from '../../../shared/models/pharmacy.model';

@Component({
  selector: 'app-medication-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <div class="page-header-row">
        <h1>Medications</h1>
        <div class="nav-buttons">
          <button mat-button routerLink="/pharmacy/prescriptions">Prescriptions</button>
          <button mat-button routerLink="/pharmacy/inventory">Inventory</button>
          <button mat-raised-button color="primary">
            <mat-icon>add</mat-icon>
            Add Medication
          </button>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="search-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search medications</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="search()" placeholder="Name or generic name">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
            <button mat-raised-button (click)="search()">Search</button>
          </div>

          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <table mat-table [dataSource]="dataSource" *ngIf="!isLoading" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let med">{{ med.name }}</td>
            </ng-container>

            <ng-container matColumnDef="genericName">
              <th mat-header-cell *matHeaderCellDef>Generic Name</th>
              <td mat-cell *matCellDef="let med">{{ med.genericName }}</td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let med">{{ med.category | titlecase }}</td>
            </ng-container>

            <ng-container matColumnDef="dosageForm">
              <th mat-header-cell *matHeaderCellDef>Form</th>
              <td mat-cell *matCellDef="let med">{{ med.dosageForm | titlecase }}</td>
            </ng-container>

            <ng-container matColumnDef="strength">
              <th mat-header-cell *matHeaderCellDef>Strength</th>
              <td mat-cell *matCellDef="let med">{{ med.strength }}</td>
            </ng-container>

            <ng-container matColumnDef="unitPrice">
              <th mat-header-cell *matHeaderCellDef>Price</th>
              <td mat-cell *matCellDef="let med">\${{ med.unitPrice | number:'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="prescription">
              <th mat-header-cell *matHeaderCellDef>Rx Required</th>
              <td mat-cell *matCellDef="let med">
                <mat-icon *ngIf="med.requiresPrescription" color="warn">check</mat-icon>
                <mat-icon *ngIf="!med.requiresPrescription" color="primary">remove</mat-icon>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let med">
                <button mat-icon-button>
                  <mat-icon>edit</mat-icon>
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
    .search-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
    }
    .search-field {
      flex: 1;
      max-width: 400px;
    }
    .full-width {
      width: 100%;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
  `]
})
export class MedicationListComponent implements OnInit {
  displayedColumns = ['name', 'genericName', 'category', 'dosageForm', 'strength', 'unitPrice', 'prescription', 'actions'];
  dataSource = new MatTableDataSource<Medication>();
  isLoading = false;
  searchQuery = '';
  pageSize = 10;
  totalElements = 0;

  constructor(private pharmacyService: PharmacyService) {}

  ngOnInit(): void {
    this.loadMedications();
  }

  loadMedications(page: number = 0): void {
    this.isLoading = true;
    this.pharmacyService.getMedications(page, this.pageSize).subscribe({
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

  search(): void {
    if (!this.searchQuery.trim()) {
      this.loadMedications();
      return;
    }
    this.isLoading = true;
    this.pharmacyService.searchMedications(this.searchQuery).subscribe({
      next: (medications) => {
        this.dataSource.data = medications;
        this.totalElements = medications.length;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.loadMedications(event.pageIndex);
  }
}

