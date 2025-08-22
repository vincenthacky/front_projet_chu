// pages/dashboard/dashboard.routes.ts
import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { DashboardComponent } from './dashboard.component';
import { AuthGuard } from 'src/app/core/guard/auth.guard';


export const DASHBOARD_ROUTES: Routes = [
  { 
    path: '', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard], // Le guard vérifie automatiquement si c'est un admin
    children: [
      { 
        path: '', 
        redirectTo: 'details', 
        pathMatch: 'full' 
      },
      {
        path: 'details',
        loadChildren: () => import('../details/details-admin/details-admin.routes').then(m => m.DETAILS_ADMIN_ROUTES)
      }
    ]
  },
  {
    path: 'user',
    component: UserDashboardComponent,
    canActivate: [AuthGuard], // Le guard vérifie automatiquement si c'est un user
    children: [
      { 
        path: '', 
        redirectTo: 'details', 
        pathMatch: 'full' 
      },
      {
        path: 'details',
        loadChildren: () => import('../details/details-user/details-user.routes').then(m => m.DETAILS_USER_ROUTES)
      }
    ]
  }
];