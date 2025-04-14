import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthFormFieldComponent } from '../shared/auth-form-field/auth-form-field.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthFormFieldComponent,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.email, Validators.maxLength(50)]],
    password: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
    ],
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
          console.log('Registration successful');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error(err);
        },
      });
  }
}
