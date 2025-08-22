import { PayementDetailsComponent } from './payement-details/payement-details.component';
import { Routes } from '@angular/router';
import { DetailsUserComponent } from './details-user.component';

export const DETAILS_USER_ROUTES: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'welcome', loadComponent: () => import('./welcome/welcome.component').then(m => m.WelcomeComponent) },
  { path: 'subscription', loadComponent: () => import('./subscription/subscription.component').then(m => m.SubscriptionComponent) },
  { path: 'paiements', loadComponent: () => import('./paiement/paiement.component').then(m => m.PaiementComponent) },
  { path: 'reclamations', loadComponent: () => import('./reclamation/reclamation.component').then(m => m.ReclamationComponent) },
  { path: 'documents', loadComponent: () => import('./document/document.component').then(m => m.DocumentComponent) },
  { path: 'evenements', loadComponent: () => import('./evenements/evenements.component').then(m => m.EvenementsComponent) },
  { path: 'recompenses', loadComponent: () => import('./recompenses/recompenses.component').then(m => m.RecompensesComponent) },
  { path: 'payement-details', loadComponent: () => import('./payement-details/payement-details.component').then(m => m.PayementDetailsComponent) },
  { path: 'parametre', loadComponent: () => import('./parameter/parameter.component').then(m => m.ParameterComponent) },
  
  
  {
    path: 'payement-details/:id',
    loadComponent: () => import('./payement-details/payement-details.component').then(m => m.PayementDetailsComponent)
  }
]; 