import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { HearderComponent } from '../../../layouts/hearder/hearder.component';
import { FooterComponent } from '../../../layouts/footer/footer.component';

@Component({
  selector: 'app-details-admin',
  standalone: true,
  imports: [
    CommonModule,
    NzLayoutModule,
    NzCardModule,
    NzGridModule,
    NzButtonModule,
    NzIconModule,
    HearderComponent,
    FooterComponent,
    
  ],
  templateUrl: './details-admin.component.html',
  styleUrls: ['./details-admin.component.css']
})
export class DetailsAdminComponent {
  adminDetails = {
    title: 'Détails Administrateur - Cité des Agents',
    description: 'Interface d\'administration pour la gestion du projet immobilier',
    stats: [
      { icon: '👥', title: 'Total Agents', value: '1,250', color: '#1890ff' },
      { icon: '🏠', title: 'Terrains Vendus', value: '850', color: '#52c41a' },
      { icon: '💰', title: 'Revenus Totaux', value: '2.5M FCFA', color: '#faad14' },
      { icon: '⏳', title: 'En Attente', value: '400', color: '#ff4d4f' }
    ]
  };
} 