import { TestBed } from '@angular/core/testing';
import { HearderComponent } from './hearder.component';

describe('HearderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HearderComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HearderComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
}); 