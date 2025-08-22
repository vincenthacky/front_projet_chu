import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSouscriptionComponent } from './admin-souscription.component';

describe('AdminSouscriptionComponent', () => {
  let component: AdminSouscriptionComponent;
  let fixture: ComponentFixture<AdminSouscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSouscriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSouscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
