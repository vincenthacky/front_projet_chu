import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payement-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payement-details.component.html',
  styleUrls: ['./payement-details.component.css']
})
export class PayementDetailsComponent implements OnInit {
  subscriptionId: string | null = null;
  subscription: any = null;
  loading = true;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.subscriptionId = this.route.snapshot.paramMap.get('id');
    // Simuler un chargement et récupérer la souscription (remplacer par un vrai service en prod)
    setTimeout(() => {
      this.subscription = this.getMockSubscription(this.subscriptionId);
      this.loading = false;
    }, 1000);
  }

  getMockSubscription(id: string | null) {
    // Simule une base de données locale
    const subscriptions = [
      {
        id: 'SUB001',
        terrain: 'Terrain 250m²',
        prixTotal: 2500000,
        montantPaye: 1250000,
        resteAPayer: 1250000,
        payments: [
          { date: '15/03/2024', amount: 250000 },
          { date: '15/02/2024', amount: 250000 },
          { date: '15/01/2024', amount: 250000 },
          { date: '15/12/2023', amount: 250000 },
          { date: '15/11/2023', amount: 250000 }
        ]
      },
      // Ajoute d'autres souscriptions ici si besoin
    ];
    return subscriptions.find(sub => sub.id === id) || null;
  }

  getProgress(sub: any): number {
    if (!sub || !sub.prixTotal) return 0;
    return Math.round((sub.montantPaye / sub.prixTotal) * 100);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR').format(num);
  }

  getMontantPayeColor(): string {
    return '#059669'; // vert
  }

  getResteAPayerColor(): string {
    return '#eab308'; // jaune
  }

  trackByPayment(index: number, payment: any): string {
    return `${payment.date}-${payment.amount}`;
  }

  goBack() {
    window.history.back();
  }
}
