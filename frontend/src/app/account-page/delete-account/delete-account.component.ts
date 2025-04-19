import { Component, EventEmitter, inject, Input, Output } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { User } from '../../auth/shared/user.model';
import { AuthService } from '../../auth/auth.service';
import { AuthFormFieldComponent } from '../../auth/shared/auth-form-field/auth-form-field.component';

@Component({
  selector: 'app-delete-account',
  imports: [AuthFormFieldComponent, ReactiveFormsModule],
  standalone: true,
  templateUrl: './delete-account.component.html',
  styleUrl: './delete-account.component.scss',
})
export class DeleteAccountComponent {
  @Input() user!: User | null;
  @Output() userChange = new EventEmitter<User>();

  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  private fb = inject(FormBuilder);

  form = this.fb.group({
    password: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
    ],
    confirmPassword: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
    ],
  });
}
