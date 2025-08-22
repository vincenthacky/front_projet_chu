import { ActualitesComponent } from './actualites/actualites.component';
import { Routes } from '@angular/router';
import { ItemsComponent } from './items.component';
import { HomeComponent } from './home/home.component';
import { ProjetComponent } from './projet/projet.component';

export const ITEMS_ROUTES: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'actualites', component: ActualitesComponent },
  { path: 'home', component: HomeComponent },
  { path: 'projet', component: ProjetComponent }
]; 