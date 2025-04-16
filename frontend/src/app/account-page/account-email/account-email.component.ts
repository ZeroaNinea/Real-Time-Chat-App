import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../auth/auth.service';
import { AuthFormFieldComponent } from '../../auth/shared/auth-form-field/auth-form-field.component';
import { User } from '../../auth/shared/user.model';

@Component({
  selector: 'app-account-email',
  imports: [AuthFormFieldComponent, MatButtonModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './account-email.component.html',
  styleUrl: './account-email.component.scss',
})
export class AccountEmailComponent implements OnChanges {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required]],
  });

  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  @Input() user!: User | null;
  @Output() userChange = new EventEmitter<User>();

  get emailControl() {
    return this.form.get('email') as FormControl;
  }

  ngOnChanges() {
    if (this.user?.email) {
      this.emailControl.setValue(this.user.email);
    }
  }

  updateEmail() {
    console.log('Update button clicked!');
    if (this.emailControl.invalid) return;

    this.authService.updateEmail(this.emailControl.value!).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.userChange.emit(updatedUser);
        this.snackBar.open('Email updated!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Failed to update email',
          'Close',
          { duration: 3000 }
        );
      },
    });
  }
}
