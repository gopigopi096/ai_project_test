import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { InventoryItem } from '../../../shared/models/pharmacy.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="container">
      <div class="page-header-row">
        <h1>Inventory Management</h1>
        <div class="nav-buttons">
          <button mat-button routerLink="/pharmacy/medications">Medications</button>
          <button mat-button routerLink="/pharmacy/prescriptions">Prescriptions</button>
          <button mat-raised-button color="primary">
            <mat-icon>add</mat-icon>
            Add Stock
          </button>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <mat-card class="alert-card" *ngIf="lowStockItems.length > 0">
        <mat-card-header>
          <mat-icon color="warn">warning</mat-icon>
          <mat-card-title>Low Stock Alerts</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="alert-chips">
            <span class="alert-chip" *ngFor="let item of lowStockItems">
              {{ item.medicationName }} ({{ item.quantity }} left)
            </span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <table mat-table [dataSource]="dataSource" *ngIf="!isLoading" class="full-width">
            <ng-container matColumnDef="medication">
              <th mat-header-cell *matHeaderCellDef>Medication</th>
              <td mat-cell *matCellDef="let item">{{ item.medicationName }}</td>
            </ng-container>

            <ng-container matColumnDef="batchNumber">
              <th mat-header-cell *matHeaderCellDef>Batch #</th>
              <td mat-cell *matCellDef="let item">{{ item.batchNumber }}</td>
            </ng-container>

            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Quantity</th>
              <td mat-cell *matCellDef="let item">
                <span [class.low-stock]="item.quantity <= item.reorderLevel">
                  {{ item.quantity }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="reorderLevel">
              <th mat-header-cell *matHeaderCellDef>Reorder Level</th>
              <td mat-cell *matCellDef="let item">{{ item.reorderLevel }}</td>
            </ng-container>

            <ng-container matColumnDef="expiryDate">
              <th mat-header-cell *matHeaderCellDef>Expiry Date</th>
              <td mat-cell *matCellDef="let item">
                <span [class.expiring-soon]="isExpiringSoon(item.expiryDate)">
                  {{ item.expiryDate | date }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="location">
              <th mat-header-cell *matHeaderCellDef>Location</th>
              <td mat-cell *matCellDef="let item">{{ item.location }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let item">
                <span class="status-chip" [ngClass]="getStockStatus(item)">
                  {{ getStockStatusLabel(item) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let item">
                <button mat-icon-button (click)="adjustStock(item)">
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
    .alert-card {
      margin-bottom: 16px;
      border-left: 4px solid #ff9800;
    }
    .alert-card mat-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .alert-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .alert-chip {
      background-color: #fff3e0;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
    }
    .full-width {
      width: 100%;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .low-stock {
      color: #f44336;
      font-weight: 500;
    }
    .expiring-soon {
      color: #ff9800;
    }
    .status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-chip.in-stock { background-color: #4caf50; color: white; }
    .status-chip.low-stock { background-color: #ff9800; color: white; }
    .status-chip.out-of-stock { background-color: #f44336; color: white; }
  `]
})
export class InventoryComponent implements OnInit {
  displayedColumns = ['medication', 'batchNumber', 'quantity', 'reorderLevel', 'expiryDate', 'location', 'status', 'actions'];
  dataSource = new MatTableDataSource<InventoryItem>();
  lowStockItems: InventoryItem[] = [];
  isLoading = false;
  pageSize = 10;
  totalElements = 0;

  constructor(private pharmacyService: PharmacyService) {}

  ngOnInit(): void {
    this.loadInventory();
    this.loadLowStockAlerts();
  }

  loadInventory(page: number = 0): void {
    this.isLoading = true;
    this.pharmacyService.getInventory(page, this.pageSize).subscribe({
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

  loadLowStockAlerts(): void {
    this.pharmacyService.getLowStockItems().subscribe({
      next: (items) => {
        this.lowStockItems = items;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.loadInventory(event.pageIndex);
  }

  isExpiringSoon(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow;
  }

  getStockStatus(item: InventoryItem): string {
    if (item.quantity === 0) return 'out-of-stock';
    if (item.quantity <= item.reorderLevel) return 'low-stock';
    return 'in-stock';
  }

  getStockStatusLabel(item: InventoryItem): string {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.quantity <= item.reorderLevel) return 'Low Stock';
    return 'In Stock';
  }

  adjustStock(item: InventoryItem): void {
    console.log('Adjust stock for:', item);
  }
}

