import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
  hasUnsavedChanges?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesGuard implements CanDeactivate<CanComponentDeactivate> {
  
  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | Promise<boolean> | boolean {
    // Si le composant implémente la méthode canDeactivate, l'utiliser
    if (component.canDeactivate) {
      return component.canDeactivate();
    }
    
    // Sinon, vérifier s'il y a des changements non sauvegardés
    if (component.hasUnsavedChanges) {
      return window.confirm('Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter cette page ?');
    }
    
    return true;
  }
}