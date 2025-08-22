import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSubscriptionRequestsAdminComponent } from './all-subscription-requests-admin.component';

describe('AllSubscriptionRequestsAdminComponent', () => {
  let component: AllSubscriptionRequestsAdminComponent;
  let fixture: ComponentFixture<AllSubscriptionRequestsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSubscriptionRequestsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllSubscriptionRequestsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
