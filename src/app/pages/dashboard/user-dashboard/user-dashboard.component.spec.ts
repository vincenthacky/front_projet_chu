import { TestBed } from '@angular/core/testing';
import { UserDashboardComponent } from './user-dashboard.component';

describe('UserDashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDashboardComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(UserDashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
}); 