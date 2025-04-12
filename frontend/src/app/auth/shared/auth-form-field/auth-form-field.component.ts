import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-auth-form-field',
  imports: [],
  standalone: true,
  templateUrl: './auth-form-field.component.html',
  styleUrl: './auth-form-field.component.scss',
})
export class AuthFormFieldComponent {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() control!: FormControl;
  @Input() type: string = 'text';
}
