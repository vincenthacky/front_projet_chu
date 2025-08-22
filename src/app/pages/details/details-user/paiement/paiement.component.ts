// paiement.component.ts - Version améliorée avec fonctionnalités supplémentaires

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

interface Paiement {
  numero_mensualite: number;
  montant_versement_prevu: number;
  date_limite_versement: string;
  date_paiement_effectif: string | null;
  montant_paye: number;
  mode_paiement: string;
  reference_paiement: string;
  statut_versement: 'paye_a_temps' | 'paye_en_retard' | 'en_attente' | 'non_paye';
  penalite_appliquee: number;
  commentaire_paiement: string;
}

@Component({
  selector: 'app-paiement',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzTagModule],
  templateUrl: './paiement.component.html',
  styleUrls: ['./paiement.component.css']
})
export class PaiementComponent {
  paiements: Paiement[] = [
    {
      numero_mensualite: 1,
      montant_versement_prevu: 250000,
      date_limite_versement: '2024-01-15',
      date_paiement_effectif: '2024-01-15',
      montant_paye: 250000,
      mode_paiement: 'Virement',
      reference_paiement: 'REF12345',
      statut_versement: 'paye_a_temps',
      penalite_appliquee: 0,
      commentaire_paiement: 'RAS'
    },
    {
      numero_mensualite: 2,
      montant_versement_prevu: 250000,
      date_limite_versement: '2024-02-15',
      date_paiement_effectif: '2024-02-18',
      montant_paye: 250000,
      mode_paiement: 'Espèces',
      reference_paiement: 'REF12346',
      statut_versement: 'paye_en_retard',
      penalite_appliquee: 5000,
      commentaire_paiement: 'Retard de 3 jours'
    },
    {
      numero_mensualite: 3,
      montant_versement_prevu: 250000,
      date_limite_versement: '2024-03-15',
      date_paiement_effectif: null,
      montant_paye: 0,
      mode_paiement: '',
      reference_paiement: '',
      statut_versement: 'en_attente',
      penalite_appliquee: 0,
      commentaire_paiement: ''
    },
    {
      numero_mensualite: 4,
      montant_versement_prevu: 250000,
      date_limite_versement: '2024-04-15',
      date_paiement_effectif: null,
      montant_paye: 0,
      mode_paiement: '',
      reference_paiement: '',
      statut_versement: 'en_attente',
      penalite_appliquee: 0,
      commentaire_paiement: ''
    }
  ];

  // Méthodes pour les statistiques
  getPayedCount(): number {
    return this.paiements.filter(p => p.statut_versement === 'paye_a_temps').length;
  }

  getLateCount(): number {
    return this.paiements.filter(p => p.statut_versement === 'paye_en_retard').length;
  }

  getPendingCount(): number {
    return this.paiements.filter(p => p.statut_versement === 'en_attente').length;
  }

  getUnpaidCount(): number {
    return this.paiements.filter(p => p.statut_versement === 'non_paye').length;
  }

  getTotalAmount(): number {
    return this.paiements.reduce((total, p) => total + p.montant_paye, 0);
  }

  getTotalPenalties(): number {
    return this.paiements.reduce((total, p) => total + p.penalite_appliquee, 0);
  }

  // Méthodes pour les couleurs et icônes des statuts
  getStatutColor(statut: string): string {
    switch (statut) {
      case 'paye_a_temps': return 'green';
      case 'paye_en_retard': return 'orange';
      case 'en_attente': return 'blue';
      case 'non_paye': return 'red';
      default: return 'default';
    }
  }

  getStatutIcon(statut: string): string {
    switch (statut) {
      case 'paye_a_temps': return 'fa-check-circle';
      case 'paye_en_retard': return 'fa-exclamation-triangle';
      case 'en_attente': return 'fa-clock';
      case 'non_paye': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'paye_a_temps': return 'À temps';
      case 'paye_en_retard': return 'En retard';
      case 'en_attente': return 'En attente';
      case 'non_paye': return 'Non payé';
      default: return 'Inconnu';
    }
  }

  getRowClass(statut: string): string {
    switch (statut) {
      case 'paye_a_temps': return 'row-success';
      case 'paye_en_retard': return 'row-warning';
      case 'en_attente': return 'row-pending';
      case 'non_paye': return 'row-danger';
      default: return '';
    }
  }

  // Getters pour les status tags
  get isAllOnTime(): boolean {
    const paidPayments = this.paiements.filter(p => p.montant_paye > 0);
    return paidPayments.length > 0 && paidPayments.every(p => p.statut_versement === 'paye_a_temps');
  }

  get hasLate(): boolean {
    return this.paiements.some(p => p.statut_versement === 'paye_en_retard');
  }

  get hasUnpaid(): boolean {
    return this.paiements.some(p => p.statut_versement === 'non_paye');
  }

  // TrackBy function pour les performances
  trackByPaiement(index: number, paiement: Paiement): number {
    return paiement.numero_mensualite;
  }

  // Méthodes utilitaires pour les calculs
  getCompletionRate(): number {
    const paidCount = this.paiements.filter(p => p.montant_paye > 0).length;
    return Math.round((paidCount / this.paiements.length) * 100);
  }

  getAveragePaymentDelay(): number {
    const latePayments = this.paiements.filter(p => p.statut_versement === 'paye_en_retard');
    if (latePayments.length === 0) return 0;
    
    // Calcul approximatif basé sur les commentaires (en jours)
    let totalDelayDays = 0;
    latePayments.forEach(payment => {
      const match = payment.commentaire_paiement.match(/(\d+)\s*jour/);
      if (match) {
        totalDelayDays += parseInt(match[1]);
      }
    });
    
    return Math.round(totalDelayDays / latePayments.length);
  }

  getRemainingAmount(): number {
    return this.paiements.reduce((total, p) => {
      return total + (p.montant_versement_prevu - p.montant_paye);
    }, 0);
  }

  getNextPaymentDue(): Paiement | null {
    const pendingPayments = this.paiements
      .filter(p => p.statut_versement === 'en_attente')
      .sort((a, b) => new Date(a.date_limite_versement).getTime() - new Date(b.date_limite_versement).getTime());
    
    return pendingPayments.length > 0 ? pendingPayments[0] : null;
  }

  // Méthode pour exporter les données (si nécessaire)
  exportToCsv(): void {
    const headers = ['Mensualité', 'Montant prévu', 'Date limite', 'Date paiement', 'Montant payé', 'Mode', 'Référence', 'Statut', 'Pénalité', 'Commentaire'];
    const csvData = this.paiements.map(p => [
      p.numero_mensualite,
      p.montant_versement_prevu,
      p.date_limite_versement,
      p.date_paiement_effectif || '',
      p.montant_paye,
      p.mode_paiement,
      p.reference_paiement,
      this.getStatutLabel(p.statut_versement),
      p.penalite_appliquee,
      p.commentaire_paiement
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'echeancier-paiements.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}