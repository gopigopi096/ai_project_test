import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../shared/models/patient.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
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
        <h1>Patients</h1>
        <button mat-raised-button color="primary" routerLink="/patients/new">
          <mat-icon>person_add</mat-icon>
          Add Patient
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="search-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search patients</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="search()" placeholder="Name, email, or phone">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
            <button mat-raised-button (click)="search()">Search</button>
            <button mat-button (click)="clearSearch()">Clear</button>
          </div>

          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <table mat-table [dataSource]="dataSource" matSort *ngIf="!isLoading" class="full-width">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
              <td mat-cell *matCellDef="let patient">{{ patient.id }}</td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let patient">{{ patient.firstName }} {{ patient.lastName }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
              <td mat-cell *matCellDef="let patient">{{ patient.email }}</td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Phone</th>
              <td mat-cell *matCellDef="let patient">{{ patient.phone }}</td>
            </ng-container>

            <ng-container matColumnDef="dateOfBirth">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Date of Birth</th>
              <td mat-cell *matCellDef="let patient">{{ patient.dateOfBirth | date }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let patient">
                <button mat-icon-button [routerLink]="['/patients', patient.id]" matTooltip="View">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/patients', patient.id, 'edit']" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deletePatient(patient)" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator 
            [length]="totalElements"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 25, 50]"
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
export class PatientListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['id', 'name', 'email', 'phone', 'dateOfBirth', 'actions'];
  dataSource = new MatTableDataSource<Patient>();
  isLoading = false;
  searchQuery = '';
  pageSize = 10;
  totalElements = 0;

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(page: number = 0): void {
    this.isLoading = true;
    this.patientService.getPatients(page, this.pageSize).subscribe({
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
      this.loadPatients();
      return;
    }
    this.isLoading = true;
    this.patientService.searchPatients({ firstName: this.searchQuery, page: 0, size: this.pageSize }).subscribe({
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

  clearSearch(): void {
    this.searchQuery = '';
    this.loadPatients();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.loadPatients(event.pageIndex);
  }

  deletePatient(patient: Patient): void {
    if (confirm(`Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`)) {
      this.patientService.deletePatient(patient.id).subscribe({
        next: () => {
          this.loadPatients();
        }
      });
    }
  }
}

