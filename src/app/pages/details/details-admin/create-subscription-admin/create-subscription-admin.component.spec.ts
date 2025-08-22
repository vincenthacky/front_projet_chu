import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSubscriptionAdminComponent } from './create-subscription-admin.component';

describe('CreateSubscriptionAdminComponent', () => {
  let component: CreateSubscriptionAdminComponent;
  let fixture: ComponentFixture<CreateSubscriptionAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSubscriptionAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateSubscriptionAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
