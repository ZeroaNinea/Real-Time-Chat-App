import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatError } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-auth-form-field',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatError,
    MatIconModule,
    MatButtonModule,
  ],
  standalone: true,
  templateUrl: './auth-form-field.component.html',
  styleUrls: ['./auth-form-field.component.scss'],
})
export class AuthFormFieldComponent {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() control!: FormControl;
  @Input() type: string = 'text';

  hide = true;
  get inputType() {
    return this.type === 'password'
      ? this.hide
        ? 'password'
        : 'text'
      : this.type;
  }

  togglePasswordVisibility() {
    this.hide = !this.hide;
  }
}
