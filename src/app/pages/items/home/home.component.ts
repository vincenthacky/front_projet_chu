import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HearderComponent } from '../../../layouts/hearder/hearder.component';
import { FooterComponent } from '../../../layouts/footer/footer.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HearderComponent, FooterComponent, NzButtonModule, NzGridModule, NzCardModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor(private router: Router) {}

  showPage(page: string) {
    if (page === 'connexion') {
      this.router.navigate(['/authentification/login']);
    } else {
      console.log('Navigation vers la page :', page);
    }
  }
} 