import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'patients',
    loadChildren: () => import('./features/patient/patient.routes').then(m => m.PATIENT_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'appointments',
    loadChildren: () => import('./features/appointment/appointment.routes').then(m => m.APPOINTMENT_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'billing',
    loadChildren: () => import('./features/billing/billing.routes').then(m => m.BILLING_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'pharmacy',
    loadChildren: () => import('./features/pharmacy/pharmacy.routes').then(m => m.PHARMACY_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

