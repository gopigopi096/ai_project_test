import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./invoice-list/invoice-list.component').then(m => m.InvoiceListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent)
  }
];

