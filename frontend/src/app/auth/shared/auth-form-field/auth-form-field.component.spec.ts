import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthFormFieldComponent } from './auth-form-field.component';

describe('AuthFormFieldComponent', () => {
  let component: AuthFormFieldComponent;
  let fixture: ComponentFixture<AuthFormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthFormFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthFormFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
