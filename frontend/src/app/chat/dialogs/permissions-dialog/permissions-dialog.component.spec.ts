import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionsDialogComponent } from './permissions-dialog.component';

describe('PermissionsDialogComponent', () => {
  let component: PermissionsDialogComponent;
  let fixture: ComponentFixture<PermissionsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
