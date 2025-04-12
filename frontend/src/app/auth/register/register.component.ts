import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthFormFieldComponent } from '../shared/auth-form-field/auth-form-field.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, AuthFormFieldComponent],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  form = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {}

  submit() {
    if (this.form.invalid) return;
    this.authService
      .register({
        username: this.form.value.username || '',
        email: this.form.value.email || '',
        password: this.form.value.password || '',
      })
      .subscribe({
        next: () => {
          // Navigate to chat or show success.
        },
        error: (err) => {
          console.error(err);
        },
      });
  }
}
