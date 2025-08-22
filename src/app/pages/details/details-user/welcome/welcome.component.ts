import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, NzGridModule, NzCardModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent {
  offers = [
    {
      type: 'standard',
      badge: 'Offre Accessible',
      name: 'Terrain Standard',
      subtitle: 'Parfait pour démarrer votre projet immobilier',
      surface: 250,
      price: 64400,
      total: 4121600,
      period: 'par mois',
      months: 64,
      paymentStart: 'mai 2024',
      paymentEnd: 'août 2029',
      features: [
        'Terrain de 250m² viabilisé',
        // 'Titre foncier sécurisé',
        // 'Accès aux réseaux (eau, électricité)',
        'Zone résidentielle calme',
        'Proche des commodités'
      ],
      bonus: [
        'Remise de 5% pour paiement anticipé',
        'Accompagnement juridique gratuit',
        'Plans de construction offerts'
      ],
      terms: [
        'Première mensualité en mai 2024.',
        'Possibilité de souscrire à plusieurs terrains.',
        'Contrat sécurisé avec garantie de livraison.'
      ],
      cta: 'Souscrire Maintenant',
      icon: 'fa-hand-holding-heart',
      highlight: '4 121 600 FCFA',
      paymentLabel: 'Plan de paiement flexible',
      bonusLabel: 'Avantages',
      bonusTitle: 'Bonus fidélité inclus',
      bonusIcon: 'fa-gift',
      premium: false
    },
    {
      type: 'premium',
      badge: 'Offre Premium',
      name: 'Terrain Premium',
      subtitle: 'L\'investissement de référence pour les projets ambitieux',
      surface: 500,
      price: 161000,
      total: 10304000,
      period: 'par mois',
      months: 64,
      paymentStart: 'mai 2024',
      paymentEnd: 'août 2029',
      features: [
        'Terrain de 500m² premium viabilisé',
        // 'Titre foncier sécurisé avec garantie',
        // 'Réseaux haute qualité inclus',
        'Emplacement privilégié',
        'Sécurité 24h/24',
        // 'Espaces verts aménagés'
      ],
      bonus: [
        'Remise de 10% pour paiement anticipé',
        'Accompagnement architecte gratuit',
        'Étude de sol offerte',
        'Priorité sur les meilleurs emplacements'
      ],
      terms: [
        'Service client prioritaire, suivi personnalisé de votre investissement,',
        'et accès aux événements exclusifs propriétaires.'
      ],
      cta: 'Souscrire Premium',
      icon: 'fa-crown',
      highlight: '10 304 000 FCFA',
      paymentLabel: 'Plan de paiement avantageux',
      bonusLabel: 'Exclusif',
      bonusTitle: 'Avantages exclusifs premium',
      bonusIcon: 'fa-diamond',
      premium: true
    }
  ];

  ctaLoading: boolean[] = [false, false];
  ctaConfirmed: boolean[] = [false, false];

  onCtaClick(index: number) {
    if (this.ctaLoading[index]) return;
    this.ctaLoading[index] = true;
    setTimeout(() => {
      this.ctaLoading[index] = false;
      this.ctaConfirmed[index] = true;
      setTimeout(() => {
        this.ctaConfirmed[index] = false;
      }, 2000);
    }, 1500);
  }

} 