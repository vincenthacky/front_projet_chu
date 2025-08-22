import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPaymentAdminComponent } from './new-payment-admin.component';

describe('NewPaymentAdminComponent', () => {
  let component: NewPaymentAdminComponent;
  let fixture: ComponentFixture<NewPaymentAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPaymentAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewPaymentAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
