import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RewardsAdminComponent } from './rewards-admin.component';

describe('RewardsAdminComponent', () => {
  let component: RewardsAdminComponent;
  let fixture: ComponentFixture<RewardsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RewardsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RewardsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
