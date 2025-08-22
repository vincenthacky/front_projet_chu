import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewDocumentAdminComponent } from './new-document-admin.component';

describe('NewDocumentAdminComponent', () => {
  let component: NewDocumentAdminComponent;
  let fixture: ComponentFixture<NewDocumentAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewDocumentAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewDocumentAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
