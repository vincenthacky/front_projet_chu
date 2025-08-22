import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewEventAdminComponent } from './new-event-admin.component';

describe('NewEventAdminComponent', () => {
  let component: NewEventAdminComponent;
  let fixture: ComponentFixture<NewEventAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewEventAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewEventAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
