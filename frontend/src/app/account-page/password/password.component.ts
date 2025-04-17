import { Component, EventEmitter, inject, Input, Output } from '@angular/core';

import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import { AuthFormFieldComponent } from '../../auth/shared/auth-form-field/auth-form-field.component';
import { AuthService } from '../../auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../auth/shared/user.model';

@Component({
  selector: 'app-password',
  imports: [
    AuthFormFieldComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
  ],
  standalone: true,
  templateUrl: './password.component.html',
  styleUrl: './password.component.scss',
})
export class PasswordComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    currentPassword: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
    ],
    newPassword: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
    ],
    confirmPassword: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
    ],
  });

  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  @Input() user!: User | null;
  @Output() userChange = new EventEmitter<User>();

  get currentPasswordControl() {
    return this.form.get('currentPassword') as FormControl;
  }

  get newPasswordControl() {
    return this.form.get('newPassword') as FormControl;
  }

  get confirmPasswordControl() {
    return this.form.get('confirmPassword') as FormControl;
  }
}
