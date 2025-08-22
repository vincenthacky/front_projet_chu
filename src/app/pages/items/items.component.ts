import { Component } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { ProjetComponent } from './projet/projet.component';
import { ActualitesComponent } from './actualites/actualites.component';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [HomeComponent, ProjetComponent, ActualitesComponent],
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent {} 