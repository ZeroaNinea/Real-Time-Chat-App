import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCardDialogComponent } from './user-card-dialog.component';

describe('UserCardDialogComponent', () => {
  let component: UserCardDialogComponent;
  let fixture: ComponentFixture<UserCardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserCardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
