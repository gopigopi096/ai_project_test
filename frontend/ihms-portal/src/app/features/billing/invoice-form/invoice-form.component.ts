import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BillingService } from '../../../core/services/billing.service';

@Component({
  selector: 'app-invoice-form',
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
          <button mat-icon-button routerLink="/billing">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="inline-header">Create Invoice</h1>
        </div>
      </div>

      <mat-card class="form-container">
        <mat-card-content>
          <form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()">
            <h3>Patient Information</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Patient</mat-label>
                <mat-select formControlName="patientId">
                  <mat-option *ngFor="let patient of patients" [value]="patient.id">
                    {{ patient.name }}
                  </mat-option>
                </mat-select>
                <mat-error>Patient is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Due Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="dueDate" [min]="minDate">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error>Due date is required</mat-error>
              </mat-form-field>
            </div>

            <h3>Invoice Items</h3>
            <div formArrayName="items">
              <div *ngFor="let item of items.controls; let i = index" [formGroupName]="i" class="item-row">
                <mat-form-field appearance="outline" class="description-field">
                  <mat-label>Description</mat-label>
                  <input matInput formControlName="description">
                </mat-form-field>

                <mat-form-field appearance="outline" class="category-field">
                  <mat-label>Category</mat-label>
                  <mat-select formControlName="category">
                    <mat-option value="CONSULTATION">Consultation</mat-option>
                    <mat-option value="PROCEDURE">Procedure</mat-option>
                    <mat-option value="MEDICATION">Medication</mat-option>
                    <mat-option value="LAB_TEST">Lab Test</mat-option>
                    <mat-option value="ROOM_CHARGE">Room Charge</mat-option>
                    <mat-option value="OTHER">Other</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="qty-field">
                  <mat-label>Qty</mat-label>
                  <input matInput type="number" formControlName="quantity" (input)="calculateItemAmount(i)">
                </mat-form-field>

                <mat-form-field appearance="outline" class="price-field">
                  <mat-label>Unit Price</mat-label>
                  <input matInput type="number" formControlName="unitPrice" (input)="calculateItemAmount(i)">
                </mat-form-field>

                <mat-form-field appearance="outline" class="amount-field">
                  <mat-label>Amount</mat-label>
                  <input matInput formControlName="amount" readonly>
                </mat-form-field>

                <button mat-icon-button color="warn" type="button" (click)="removeItem(i)" *ngIf="items.length > 1">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>

            <button mat-stroked-button type="button" (click)="addItem()">
              <mat-icon>add</mat-icon>
              Add Item
            </button>

            <h3>Summary</h3>
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>\${{ calculateSubtotal() | number:'1.2-2' }}</span>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Discount</mat-label>
                <input matInput type="number" formControlName="discountAmount">
              </mat-form-field>
            </div>
            <div class="summary-row grand-total">
              <span>Total:</span>
              <span>\${{ calculateTotal() | number:'1.2-2' }}</span>
            </div>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="3"></textarea>
            </mat-form-field>

            <div class="actions-row">
              <button mat-button type="button" routerLink="/billing">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="isLoading || invoiceForm.invalid">
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                <span *ngIf="!isLoading">Create Invoice</span>
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
    .item-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }
    .description-field { flex: 3; }
    .category-field { flex: 2; }
    .qty-field { flex: 1; }
    .price-field { flex: 1; }
    .amount-field { flex: 1; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      max-width: 300px;
      margin-left: auto;
    }
    .grand-total {
      font-weight: 500;
      font-size: 18px;
      border-top: 2px solid #333;
      margin-bottom: 24px;
    }
  `]
})
export class InvoiceFormComponent implements OnInit {
  invoiceForm: FormGroup;
  isLoading = false;
  minDate = new Date();

  patients = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Wilson' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private billingService: BillingService,
    private snackBar: MatSnackBar
  ) {
    this.invoiceForm = this.fb.group({
      patientId: ['', Validators.required],
      dueDate: ['', Validators.required],
      discountAmount: [0],
      notes: [''],
      items: this.fb.array([this.createItem()])
    });
  }

  ngOnInit(): void {}

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      category: ['CONSULTATION', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      amount: [{ value: 0, disabled: true }]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  calculateItemAmount(index: number): void {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    const amount = quantity * unitPrice;
    item.patchValue({ amount });
  }

  calculateSubtotal(): number {
    return this.items.controls.reduce((sum, item) => {
      const qty = item.get('quantity')?.value || 0;
      const price = item.get('unitPrice')?.value || 0;
      return sum + (qty * price);
    }, 0);
  }

  calculateTotal(): number {
    const subtotal = this.calculateSubtotal();
    const discount = this.invoiceForm.get('discountAmount')?.value || 0;
    return subtotal - discount;
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formValue = this.invoiceForm.getRawValue();
    const invoiceRequest = {
      ...formValue,
      dueDate: formValue.dueDate.toISOString().split('T')[0],
      items: formValue.items.map((item: any) => ({
        ...item,
        amount: item.quantity * item.unitPrice
      }))
    };

    this.billingService.createInvoice(invoiceRequest).subscribe({
      next: () => {
        this.snackBar.open('Invoice created successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/billing']);
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('An error occurred. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }
}

