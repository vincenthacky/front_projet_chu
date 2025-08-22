import { Component } from '@angular/core';
import { HearderComponent } from '../../../layouts/hearder/hearder.component';
import { FooterComponent } from '../../../layouts/footer/footer.component';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [HearderComponent, FooterComponent,RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {} 