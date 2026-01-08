import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule
  ],
  template: `
    <div class="container">
      <h1 class="page-header">Dashboard</h1>
      
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon patients">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.totalPatients }}</h3>
              <p>Total Patients</p>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon appointments">
              <mat-icon>event</mat-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.todayAppointments }}</h3>
              <p>Today's Appointments</p>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon billing">
              <mat-icon>attach_money</mat-icon>
            </div>
            <div class="stat-info">
              <h3>\${{ stats.monthlyRevenue | number }}</h3>
              <p>Monthly Revenue</p>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon pharmacy">
              <mat-icon>local_pharmacy</mat-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.pendingPrescriptions }}</h3>
              <p>Pending Prescriptions</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <button mat-raised-button color="primary" routerLink="/patients/new">
            <mat-icon>person_add</mat-icon>
            New Patient
          </button>
          <button mat-raised-button color="accent" routerLink="/appointments/new">
            <mat-icon>event_available</mat-icon>
            New Appointment
          </button>
          <button mat-raised-button routerLink="/billing/new">
            <mat-icon>receipt</mat-icon>
            Create Invoice
          </button>
          <button mat-raised-button routerLink="/pharmacy/prescriptions/new">
            <mat-icon>medication</mat-icon>
            New Prescription
          </button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-section">
        <div class="recent-appointments">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Today's Appointments</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="recentAppointments" class="full-width">
                <ng-container matColumnDef="time">
                  <th mat-header-cell *matHeaderCellDef>Time</th>
                  <td mat-cell *matCellDef="let apt">{{ apt.appointmentTime }}</td>
                </ng-container>
                <ng-container matColumnDef="patient">
                  <th mat-header-cell *matHeaderCellDef>Patient</th>
                  <td mat-cell *matCellDef="let apt">{{ apt.patientName }}</td>
                </ng-container>
                <ng-container matColumnDef="doctor">
                  <th mat-header-cell *matHeaderCellDef>Doctor</th>
                  <td mat-cell *matCellDef="let apt">{{ apt.doctorName }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let apt">
                    <span class="status-chip" [ngClass]="apt.status.toLowerCase()">
                      {{ apt.status }}
                    </span>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="appointmentColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: appointmentColumns;"></tr>
              </table>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button routerLink="/appointments">View All</button>
            </mat-card-actions>
          </mat-card>
        </div>

        <div class="low-stock-alerts">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Low Stock Alerts</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="alert-list">
                <div class="alert-item" *ngFor="let item of lowStockItems">
                  <mat-icon color="warn">warning</mat-icon>
                  <span>{{ item.medicationName }} - {{ item.quantity }} remaining</span>
                </div>
                <div *ngIf="lowStockItems.length === 0" class="no-alerts">
                  No low stock alerts
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button routerLink="/pharmacy/inventory">View Inventory</button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }
    .stat-icon.patients { background-color: #4CAF50; }
    .stat-icon.appointments { background-color: #2196F3; }
    .stat-icon.billing { background-color: #FF9800; }
    .stat-icon.pharmacy { background-color: #9C27B0; }
    .stat-info h3 {
      font-size: 28px;
      margin: 0;
      font-weight: 500;
    }
    .stat-info p {
      margin: 0;
      color: #666;
    }
    .quick-actions {
      margin-bottom: 24px;
    }
    .actions-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .actions-grid button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .recent-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
    }
    .full-width {
      width: 100%;
    }
    .alert-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .alert-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background-color: #fff3e0;
      border-radius: 4px;
    }
    .no-alerts {
      color: #666;
      font-style: italic;
    }
    @media (max-width: 768px) {
      .recent-section {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats = {
    totalPatients: 1250,
    todayAppointments: 24,
    monthlyRevenue: 45600,
    pendingPrescriptions: 12
  };

  appointmentColumns = ['time', 'patient', 'doctor', 'status'];

  recentAppointments = [
    { appointmentTime: '09:00', patientName: 'John Doe', doctorName: 'Dr. Smith', status: 'CONFIRMED' },
    { appointmentTime: '09:30', patientName: 'Jane Smith', doctorName: 'Dr. Johnson', status: 'PENDING' },
    { appointmentTime: '10:00', patientName: 'Bob Wilson', doctorName: 'Dr. Smith', status: 'CONFIRMED' },
    { appointmentTime: '10:30', patientName: 'Alice Brown', doctorName: 'Dr. Davis', status: 'COMPLETED' }
  ];

  lowStockItems = [
    { medicationName: 'Amoxicillin 500mg', quantity: 15 },
    { medicationName: 'Ibuprofen 400mg', quantity: 20 }
  ];

  ngOnInit(): void {
    // TODO: Load real data from services
  }
}

