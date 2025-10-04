import { Routes } from '@angular/router';
import { UnsavedChangesGuard } from '../../../guards/unsaved-changes.guard';

export const DETAILS_ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'home-admin', pathMatch: 'full' },
  { path: 'home-admin', loadComponent: () => import('./home-admin/home-admin.component').then(m => m.HomeAdminComponent) },
  { path: 'souscription-admin', loadComponent: () => import('./admin-souscription/admin-souscription.component').then(m => m.AdminSouscriptionComponent) },
  { path: 'create-souscription-admin', loadComponent: () => import('./create-subscription-admin/create-subscription-admin.component').then(m => m.CreateSubscriptionAdminComponent) },
  { path: 'all-subscription-requests-admin', loadComponent: () => import('./all-subscription-requests-admin/all-subscription-requests-admin.component').then(m => m.AllSubscriptionRequestsAdminComponent) },
  { path: 'payment-admin', loadComponent: () => import('./payment-admin/payment-admin.component').then(m => m.PaymentAdminComponent) },
  { path: 'new-payment-admin', loadComponent: () => import('./new-payment-admin/new-payment-admin.component').then(m => m.NewPaymentAdminComponent) },
  { path: 'complaints-admin', loadComponent: () => import('./complaints/complaints.component').then(m => m.ComplaintsComponent) },
  {path: 'documents-admin', loadComponent: () => import('./document-admin/document-admin.component').then(m => m.DocumentAdminComponent) },
  { path: 'new-document-admin', loadComponent: () => import('./new-document-admin/new-document-admin.component').then(m => m.NewDocumentAdminComponent) },
  { path:'event-admin', loadComponent: () => import('./event-admin/event-admin.component').then(m => m.EventAdminComponent) },
  { path: 'new-event-admin', loadComponent: () => import('./new-event-admin/new-event-admin.component').then(m => m.NewEventAdminComponent) },
  { path: 'rewards-admin', loadComponent: () => import('./rewards-admin/rewards-admin.component').then(m => m.RewardsAdminComponent) },
  { path: 'users-admin', loadComponent: () => import('./users/users.component').then(m => m.UsersComponent) },
  { path : 'profile-admin', loadComponent: () => import('./profile-admin/profile-admin.component').then(m => m.ProfileAdminComponent) },
  { path : 'new-user-admin', loadComponent: () => import('./new-users/new-users.component').then(m => m.NewUsersComponent), canDeactivate: [UnsavedChangesGuard] },
  {path : 'log-admin', loadComponent: () => import('./log-admin/log-admin.component').then(m => m.LogAdminComponent) },
  {path : 'paiement-details-admin/:id', loadComponent: () => import('./paiement-details-admin/paiement-details-admin.component').then(m => m.PaiementDetailsAdminComponent) },
  {path : 'terrains', loadComponent: () => import('./terrains/terrains.component').then(m => m.TerrainsComponent) }


]; 