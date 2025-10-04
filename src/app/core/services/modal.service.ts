import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalConfig {
  title: string;
  message: string;
  imageSrc?: string;
  duration?: number;
  type?: 'error' | 'warning' | 'info' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new Subject<ModalConfig | null>();
  public modal$ = this.modalSubject.asObservable();

  showModal(config: ModalConfig): void {
    this.modalSubject.next(config);
  }

  hideModal(): void {
    this.modalSubject.next(null);
  }

  showAccountSuspendedModal(): void {
    this.showModal({
      title: 'Compte Suspendu',
      message: 'Votre compte a été suspendu ou est inactif. Veuillez contacter l\'administrateur.',
      imageSrc: 'Do-not-enter-sign-bro.png',
      duration: 4000,
      type: 'error'
    });
  }

  showConnectionErrorModal(): void {
    this.showModal({
      title: 'Connexion au serveur impossible',
      message: 'Impossible de se connecter au serveur de données. Veuillez vérifier votre connexion réseau et réessayer.',
      imageSrc: 'Do-not-enter-sign-bro.png',
      duration: 4000,
      type: 'error'
    });
  }
}