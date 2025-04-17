import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsernameBioComponent } from './username-bio.component';

describe('UsernameBioComponent', () => {
  let component: UsernameBioComponent;
  let fixture: ComponentFixture<UsernameBioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsernameBioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsernameBioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
