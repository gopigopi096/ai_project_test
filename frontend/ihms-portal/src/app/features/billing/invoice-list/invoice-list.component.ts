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
import { BillingService } from '../../../core/services/billing.service';
import { Invoice } from '../../../shared/models/billing.model';

@Component({
  selector: 'app-invoice-list',
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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <div class="page-header-row">
        <h1>Billing & Invoices</h1>
        <button mat-raised-button color="primary" routerLink="/billing/new">
          <mat-icon>receipt</mat-icon>
          Create Invoice
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <table mat-table [dataSource]="dataSource" *ngIf="!isLoading" class="full-width">
            <ng-container matColumnDef="invoiceNumber">
              <th mat-header-cell *matHeaderCellDef>Invoice #</th>
              <td mat-cell *matCellDef="let invoice">{{ invoice.invoiceNumber }}</td>
            </ng-container>

            <ng-container matColumnDef="patient">
              <th mat-header-cell *matHeaderCellDef>Patient</th>
              <td mat-cell *matCellDef="let invoice">{{ invoice.patientName }}</td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let invoice">{{ invoice.createdAt | date }}</td>
            </ng-container>

            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let invoice">\${{ invoice.totalAmount | number:'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="paid">
              <th mat-header-cell *matHeaderCellDef>Paid</th>
              <td mat-cell *matCellDef="let invoice">\${{ invoice.paidAmount | number:'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="balance">
              <th mat-header-cell *matHeaderCellDef>Balance</th>
              <td mat-cell *matCellDef="let invoice">\${{ invoice.balanceAmount | number:'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let invoice">
                <span class="status-chip" [ngClass]="invoice.status.toLowerCase()">
                  {{ invoice.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let invoice">
                <button mat-icon-button [routerLink]="['/billing', invoice.id]">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button (click)="downloadPdf(invoice.id)">
                  <mat-icon>download</mat-icon>
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
    .status-chip.paid { background-color: #4caf50; color: white; }
    .status-chip.pending { background-color: #ff9800; color: white; }
    .status-chip.partial { background-color: #2196f3; color: white; }
    .status-chip.overdue { background-color: #f44336; color: white; }
    .status-chip.cancelled { background-color: #9e9e9e; color: white; }
  `]
})
export class InvoiceListComponent implements OnInit {
  displayedColumns = ['invoiceNumber', 'patient', 'date', 'total', 'paid', 'balance', 'status', 'actions'];
  dataSource = new MatTableDataSource<Invoice>();
  isLoading = false;
  pageSize = 10;
  totalElements = 0;

  constructor(private billingService: BillingService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(page: number = 0): void {
    this.isLoading = true;
    this.billingService.getInvoices(page, this.pageSize).subscribe({
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
    this.loadInvoices(event.pageIndex);
  }

  downloadPdf(id: number): void {
    this.billingService.generateInvoicePdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }
}

