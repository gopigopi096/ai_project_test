import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BillingService } from '../../../core/services/billing.service';
import { Invoice } from '../../../shared/models/billing.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="container" *ngIf="invoice; else loading">
      <div class="page-header-row">
        <div>
          <button mat-icon-button routerLink="/billing">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="inline-header">Invoice {{ invoice.invoiceNumber }}</h1>
        </div>
        <div class="actions">
          <button mat-raised-button (click)="downloadPdf()">
            <mat-icon>download</mat-icon>
            Download PDF
          </button>
          <button mat-raised-button color="primary" (click)="openPaymentDialog()" *ngIf="invoice.balanceAmount > 0">
            <mat-icon>payment</mat-icon>
            Record Payment
          </button>
        </div>
      </div>

      <div class="invoice-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Invoice Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <label>Invoice Number</label>
                <span>{{ invoice.invoiceNumber }}</span>
              </div>
              <div class="info-item">
                <label>Date</label>
                <span>{{ invoice.createdAt | date }}</span>
              </div>
              <div class="info-item">
                <label>Due Date</label>
                <span>{{ invoice.dueDate | date }}</span>
              </div>
              <div class="info-item">
                <label>Status</label>
                <span class="status-chip" [ngClass]="invoice.status.toLowerCase()">{{ invoice.status }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Patient Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <label>Patient Name</label>
                <span>{{ invoice.patientName }}</span>
              </div>
              <div class="info-item">
                <label>Patient ID</label>
                <a [routerLink]="['/patients', invoice.patientId]">{{ invoice.patientId }}</a>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="items-card">
        <mat-card-header>
          <mat-card-title>Invoice Items</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="invoice.items" class="full-width">
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let item">{{ item.description }}</td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let item">{{ item.category | titlecase }}</td>
            </ng-container>

            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Qty</th>
              <td mat-cell *matCellDef="let item">{{ item.quantity }}</td>
            </ng-container>

            <ng-container matColumnDef="unitPrice">
              <th mat-header-cell *matHeaderCellDef>Unit Price</th>
              <td mat-cell *matCellDef="let item">\${{ item.unitPrice | number:'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let item">\${{ item.amount | number:'1.2-2' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="itemColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: itemColumns;"></tr>
          </table>

          <mat-divider></mat-divider>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>\${{ invoice.subtotal | number:'1.2-2' }}</span>
            </div>
            <div class="total-row" *ngIf="invoice.discountAmount > 0">
              <span>Discount</span>
              <span>-\${{ invoice.discountAmount | number:'1.2-2' }}</span>
            </div>
            <div class="total-row">
              <span>Tax</span>
              <span>\${{ invoice.taxAmount | number:'1.2-2' }}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total</span>
              <span>\${{ invoice.totalAmount | number:'1.2-2' }}</span>
            </div>
            <div class="total-row paid">
              <span>Paid</span>
              <span>\${{ invoice.paidAmount | number:'1.2-2' }}</span>
            </div>
            <div class="total-row balance">
              <span>Balance Due</span>
              <span>\${{ invoice.balanceAmount | number:'1.2-2' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
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
    .invoice-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .items-card {
      margin-top: 16px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
    .full-width {
      width: 100%;
    }
    .totals {
      padding: 16px;
      max-width: 300px;
      margin-left: auto;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .grand-total {
      font-weight: 500;
      font-size: 18px;
      border-top: 2px solid #333;
    }
    .balance {
      color: #f44336;
      font-weight: 500;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 60px;
    }
    .status-chip {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
    }
    .status-chip.paid { background-color: #4caf50; color: white; }
    .status-chip.pending { background-color: #ff9800; color: white; }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  invoice: Invoice | null = null;
  itemColumns = ['description', 'category', 'quantity', 'unitPrice', 'amount'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private billingService: BillingService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvoice(+id);
    }
  }

  loadInvoice(id: number): void {
    this.billingService.getInvoice(id).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
      },
      error: () => {
        this.router.navigate(['/billing']);
      }
    });
  }

  downloadPdf(): void {
    if (this.invoice) {
      this.billingService.generateInvoicePdf(this.invoice.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${this.invoice!.invoiceNumber}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      });
    }
  }

  openPaymentDialog(): void {
    // In a real app, this would open a dialog component for payment entry
    console.log('Open payment dialog');
  }
}

