import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalService, ModalConfig } from '../../../core/services/modal.service';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" class="modal-overlay" (click)="onOverlayClick()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-content" [ngClass]="'modal-' + currentModal?.type">
          <div class="modal-header">
            <img *ngIf="currentModal?.imageSrc" 
                 [src]="currentModal?.imageSrc" 
                 [alt]="currentModal?.title"
                 class="modal-icon">
            <h3 class="modal-title">{{ currentModal?.title }}</h3>
          </div>
          
          <div class="modal-body">
            <p class="modal-message">{{ currentModal?.message }}</p>
          </div>
          
          <div class="modal-footer">
            <div class="progress-bar" *ngIf="currentModal?.duration">
              <div class="progress-fill" [style.animation-duration.ms]="currentModal?.duration"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
    }

    .modal-container {
      max-width: 500px;
      width: 90%;
      max-height: 90%;
      animation: slideIn 0.3s ease-out;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      position: relative;
    }

    .modal-error {
      border-top: 4px solid #dc3545;
    }

    .modal-warning {
      border-top: 4px solid #ffc107;
    }

    .modal-info {
      border-top: 4px solid #17a2b8;
    }

    .modal-success {
      border-top: 4px solid #28a745;
    }

    .modal-header {
      padding: 30px 30px 20px;
      text-align: center;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }

    .modal-icon {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      object-fit: contain;
    }

    .modal-title {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #dc3545;
    }

    .modal-body {
      padding: 20px 30px 30px;
      text-align: center;
    }

    .modal-message {
      margin: 0;
      font-size: 16px;
      line-height: 1.6;
      color: #6c757d;
    }

    .modal-footer {
      padding: 0;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background-color: #e9ecef;
      position: relative;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #dc3545 0%, #c82333 100%);
      width: 100%;
      transform: translateX(-100%);
      animation: progressAnimation linear forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-50px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes progressAnimation {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    .modal-overlay.closing {
      animation: fadeOut 0.3s ease-out forwards;
    }
  `]
})
export class NotificationModalComponent implements OnInit, OnDestroy {
  isVisible = false;
  currentModal: ModalConfig | null = null;
  private subscription: Subscription = new Subscription();
  private autoCloseTimer?: number;

  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.modalService.modal$.subscribe(modal => {
        if (modal) {
          this.showModal(modal);
        } else {
          this.hideModal();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
  }

  private showModal(modal: ModalConfig): void {
    this.currentModal = modal;
    this.isVisible = true;

    if (modal.duration && modal.duration > 0) {
      this.autoCloseTimer = window.setTimeout(() => {
        this.hideModal();
      }, modal.duration);
    }
  }

  private hideModal(): void {
    this.isVisible = false;
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = undefined;
    }
  }

  onOverlayClick(): void {
    this.hideModal();
    this.modalService.hideModal();
  }
}