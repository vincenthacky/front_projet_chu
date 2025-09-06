// create-subscription-admin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';

interface TerrainOption {
  id: string;
  name: string;
  surface: number;
  prixUnitaire: number;
  localisation: string;
  disponible: boolean;
}

interface ClientOption {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  profession: string;
}

@Component({
  selector: 'app-create-subscription-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzDividerModule,
    NzIconModule,
    NzLayoutModule,
    NzGridModule,
    NzSwitchModule,
    NzTagModule
  ],
  templateUrl: './create-subscription-admin.component.html',
  styleUrls: ['./create-subscription-admin.component.scss']
})
export class CreateSubscriptionAdminComponent  {
 
}