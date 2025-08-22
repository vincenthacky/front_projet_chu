import { Component } from '@angular/core';
import { HearderComponent } from '../../../layouts/hearder/hearder.component';
import { FooterComponent } from '../../../layouts/footer/footer.component';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-actualites',
  standalone: true,
  imports: [HearderComponent, FooterComponent, NzGridModule, NzCardModule],
  templateUrl: './actualites.component.html',
  styleUrls: ['./actualites.component.css']
})
export class ActualitesComponent {} 