import { Routes } from '@angular/router';

export const PHARMACY_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'medications',
    pathMatch: 'full'
  },
  {
    path: 'medications',
    loadComponent: () => import('./medication-list/medication-list.component').then(m => m.MedicationListComponent)
  },
  {
    path: 'prescriptions',
    loadComponent: () => import('./prescription-list/prescription-list.component').then(m => m.PrescriptionListComponent)
  },
  {
    path: 'inventory',
    loadComponent: () => import('./inventory/inventory.component').then(m => m.InventoryComponent)
  }
];

