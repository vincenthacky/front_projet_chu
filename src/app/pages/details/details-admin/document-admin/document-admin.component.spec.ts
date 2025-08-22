import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentAdminComponent } from './document-admin.component';

describe('DocumentAdminComponent', () => {
  let component: DocumentAdminComponent;
  let fixture: ComponentFixture<DocumentAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
