import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-authentification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './authentification.component.html',
  styleUrls: ['./authentification.component.css']
})
export class AuthentificationComponent {
  showSignIn = true;

  afficherConnexion() {
    this.showSignIn = true;
  }

  afficherInscription() {
    this.showSignIn = false;
  }
} 