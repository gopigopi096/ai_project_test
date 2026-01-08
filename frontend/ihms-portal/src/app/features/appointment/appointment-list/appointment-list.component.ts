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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../shared/models/appointment.model';

@Component({
  selector: 'app-appointment-list',
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
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  template: `
    <div class="container">
      <div class="page-header-row">
        <h1>Appointments</h1>
        <button mat-raised-button color="primary" routerLink="/appointments/new">
          <mat-icon>event_available</mat-icon>
          New Appointment
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="filter-bar">
            <mat-form-field appearance="outline">
              <mat-label>Filter by Status</mat-label>
              <mat-select [(ngModel)]="statusFilter" (selectionChange)="filterByStatus()">
                <mat-option value="">All</mat-option>
                <mat-option value="PENDING">Pending</mat-option>
                <mat-option value="CONFIRMED">Confirmed</mat-option>
                <mat-option value="COMPLETED">Completed</mat-option>
                <mat-option value="CANCELLED">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <table mat-table [dataSource]="dataSource" *ngIf="!isLoading" class="full-width">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date & Time</th>
              <td mat-cell *matCellDef="let apt">
                {{ apt.appointmentDate | date }} {{ apt.appointmentTime }}
              </td>
            </ng-container>

            <ng-container matColumnDef="patient">
              <th mat-header-cell *matHeaderCellDef>Patient</th>
              <td mat-cell *matCellDef="let apt">{{ apt.patientName }}</td>
            </ng-container>

            <ng-container matColumnDef="doctor">
              <th mat-header-cell *matHeaderCellDef>Doctor</th>
              <td mat-cell *matCellDef="let apt">{{ apt.doctorName }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let apt">{{ apt.type | titlecase }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let apt">
                <span class="status-chip" [ngClass]="apt.status.toLowerCase()">
                  {{ apt.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let apt">
                <button mat-icon-button [routerLink]="['/appointments', apt.id]">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/appointments', apt.id, 'edit']" 
                        *ngIf="apt.status === 'PENDING' || apt.status === 'CONFIRMED'">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="cancelAppointment(apt)"
                        *ngIf="apt.status === 'PENDING' || apt.status === 'CONFIRMED'">
                  <mat-icon>cancel</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator 
            [length]="totalElements"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 25]"
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
    .filter-bar {
      margin-bottom: 16px;
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
  `]
})
export class AppointmentListComponent implements OnInit {
  displayedColumns = ['date', 'patient', 'doctor', 'type', 'status', 'actions'];
  dataSource = new MatTableDataSource<Appointment>();
  isLoading = false;
  statusFilter = '';
  pageSize = 10;
  totalElements = 0;

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(page: number = 0): void {
    this.isLoading = true;
    this.appointmentService.getAppointments(page, this.pageSize).subscribe({
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

  filterByStatus(): void {
    // In real app, this would call the API with status filter
    this.loadAppointments();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.loadAppointments(event.pageIndex);
  }

  cancelAppointment(appointment: Appointment): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(appointment.id).subscribe({
        next: () => {
          this.loadAppointments();
        }
      });
    }
  }
}

