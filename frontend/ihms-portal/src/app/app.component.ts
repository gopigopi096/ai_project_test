import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" mode="side" [opened]="authService.isAuthenticated()">
        <mat-toolbar color="primary">
          <span>IHMS Menu</span>
        </mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/patients" routerLinkActive="active">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Patients</span>
          </a>
          <a mat-list-item routerLink="/appointments" routerLinkActive="active">
            <mat-icon matListItemIcon>event</mat-icon>
            <span matListItemTitle>Appointments</span>
          </a>
          <a mat-list-item routerLink="/billing" routerLinkActive="active">
            <mat-icon matListItemIcon>receipt</mat-icon>
            <span matListItemTitle>Billing</span>
          </a>
          <a mat-list-item routerLink="/pharmacy" routerLinkActive="active">
            <mat-icon matListItemIcon>local_pharmacy</mat-icon>
            <span matListItemTitle>Pharmacy</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <button mat-icon-button (click)="drawer.toggle()" *ngIf="authService.isAuthenticated()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="brand">IHMS</span>
          <span class="spacer"></span>
          <ng-container *ngIf="authService.isAuthenticated(); else loginButton">
            <button mat-button [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
              {{ authService.getCurrentUser()?.username }}
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>Profile</span>
              </button>
              <button mat-menu-item (click)="logout()">
                <mat-icon>exit_to_app</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          </ng-container>
          <ng-template #loginButton>
            <button mat-button routerLink="/auth/login">Login</button>
          </ng-template>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    .sidenav {
      width: 250px;
    }
    .brand {
      font-weight: 500;
      margin-left: 8px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .main-content {
      padding: 20px;
    }
    .active {
      background-color: rgba(0, 0, 0, 0.1);
    }
  `]
})
export class AppComponent {
  title = 'IHMS Portal';

  constructor(public authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}

