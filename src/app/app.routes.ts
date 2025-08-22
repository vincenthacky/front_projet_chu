import { Routes } from '@angular/router';

import { HearderComponent } from './layouts/hearder/hearder.component';
import { FooterComponent } from './layouts/footer/footer.component';
import { AuthGuard } from './core/guard/auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    pathMatch: 'full', 
    redirectTo: '/authentification/login' 
  },
  { 
    path: 'dashboard', 
    loadChildren: () => import('./pages/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
    canActivate: [AuthGuard] // Le guard gère authentification + rôles
  },
  { 
    path: 'hearder', 
    component: HearderComponent 
  },
  { 
    path: 'footer', 
    component: FooterComponent 
  },
  { 
    path: 'authentification', 
    loadChildren: () => import('./pages/authentification/authentification.routes').then(m => m.AUTHENTIFICATION_ROUTES) 
  },
  { 
    path: 'items', 
    loadChildren: () => import('./pages/items/items.routes').then(m => m.ITEMS_ROUTES),
    canActivate: [AuthGuard] 
  },
  {
    path: '**',
    redirectTo: '/authentification/login'
  }
];