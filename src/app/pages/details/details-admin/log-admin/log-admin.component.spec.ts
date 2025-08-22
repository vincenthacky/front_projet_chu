import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogAdminComponent } from './log-admin.component';

describe('LogAdminComponent', () => {
  let component: LogAdminComponent;
  let fixture: ComponentFixture<LogAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
