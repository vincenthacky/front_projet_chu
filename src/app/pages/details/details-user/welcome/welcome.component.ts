import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Terrain } from 'src/app/core/models/souscription';
import { SouscriptionService } from 'src/app/core/services/souscription.service';
import { TerrainsService } from 'src/app/core/services/terrains.service';
import { NzEmptyModule } from 'ng-zorro-antd/empty';


@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, NzGridModule, NzCardModule, NzModalModule, NzSpinModule, NzEmptyModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  offers: any[] = [];
  terrainsData: Terrain[] = [];
  loading: boolean = true; // Propriété pour gérer le loading principal
  
  defaultOffers = [
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
        'Terrain de 250m² viabilisé'
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
    }
  ];

  ctaLoading: boolean[] = [];
  ctaConfirmed: boolean[] = [];
  
  constructor(
    private terrainsService: TerrainsService,
    private souscriptionService: SouscriptionService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}
  
  ngOnInit() {
    this.loadTerrains();
  }
  
  loadTerrains() {
    this.loading = true; // Activer le loading
    this.terrainsService.getAllTerrains().subscribe({
      next: (response) => {
        this.loading = false; // Désactiver le loading
        if (response.success) {
          this.terrainsData = response.data;
          this.generateOffers();
        }
      },
      error: (error) => {
        this.loading = false; // Désactiver le loading même en cas d'erreur
        console.error('Erreur lors du chargement des terrains:', error);
        this.offers = this.defaultOffers;
        this.initializeArrays();
      }
    });
  }
  
  generateOffers() {
    this.offers = [];
    
    // Afficher SEULEMENT les terrains disponibles de 250m²
    this.terrainsData
      .filter(terrain => terrain.statut_terrain === 'disponible' && parseFloat(terrain.superficie.toString()) === 250)
      .forEach((terrain) => {
        const type = 'standard';
        this.offers.push(this.createOfferFromTerrain(terrain, type));
      });
    
    // Si pas de terrains dans l'API, utiliser les offres par défaut
    if (this.offers.length === 0) {
      this.offers = [...this.defaultOffers];
    }
    
    this.initializeArrays();
  }
  
  createOfferFromTerrain(terrain: Terrain, type: 'standard'): any {
    const superficie = parseFloat(terrain.superficie.toString());
    const prixUnitaire = parseFloat(terrain.prix_unitaire.toString());
    
    // Le prix_unitaire de l'API semble être le prix total du terrain, pas par m²
    // On utilise directement ce prix comme total
    const total = prixUnitaire;
    const months = 64;
    const monthlyPayment = total / months;
    
    const baseOffer = this.defaultOffers[0];
    
    // Personnaliser selon les données du terrain
    const customOffer = {
      ...baseOffer,
      name: terrain.libelle || baseOffer.name,
      subtitle: terrain.description || baseOffer.subtitle,
      surface: superficie,
      price: Math.round(monthlyPayment),
      total: Math.round(total),
      highlight: `${Math.round(total).toLocaleString('fr-FR')} FCFA`,
      
      // Caractéristiques pour 250m²
      features: [
        `Terrain ${superficie} m²`
      ],
      
      // Bonus pour 250m²  
      bonus: [],
      
      terrainsData: terrain
    };
    
    return customOffer;
  }
  
  initializeArrays() {
    this.ctaLoading = new Array(this.offers.length).fill(false);
    this.ctaConfirmed = new Array(this.offers.length).fill(false);
  }

  onCtaClick(index: number) {
    if (this.ctaLoading[index]) return;
    
    const offer = this.offers[index];
    const terrainData = offer.terrainsData;
    
    if (!terrainData) {
      this.message.error('Données du terrain non disponibles');
      return;
    }

    // Afficher modal de confirmation
    this.modal.confirm({
      nzTitle: 'Confirmer la demande de souscription',
      nzContent: `Êtes-vous sûr de vouloir faire une demande de souscription pour le terrain "${terrainData.libelle}" (${terrainData.superficie}m²) ?`,
      nzOkText: 'Oui, confirmer',
      nzCancelText: 'Annuler',
      nzOnOk: () => {
        this.processSubscriptionRequest(index, terrainData);
      }
    });
  }

  processSubscriptionRequest(index: number, terrainData: Terrain) {
    this.ctaLoading[index] = true;
    
    const demandeData = {
      id_terrain: terrainData.id_terrain!,
      nombre_terrains: 1
    };

    this.souscriptionService.createDemandeSouscription(demandeData).subscribe({
      next: (response) => {
        this.ctaLoading[index] = false;
        if (response.success) {
          this.message.success('Demande de souscription envoyée avec succès !');
          this.ctaConfirmed[index] = true;
          setTimeout(() => {
            this.ctaConfirmed[index] = false;
          }, 3000);
        } else {
          this.message.error(response.message || 'Erreur lors de l\'envoi de la demande');
        }
      },
      error: (error) => {
        this.ctaLoading[index] = false;
        console.error('Erreur lors de la demande de souscription:', error);
        this.message.error('Erreur lors de l\'envoi de la demande. Veuillez réessayer.');
      }
    });
  }

}