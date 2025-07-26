import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-account-navigation',
  imports: [RouterModule, MatButtonModule, MatIconModule],
  standalone: true,
  templateUrl: './account-navigation.component.html',
  styleUrl: './account-navigation.component.scss',
})
export class AccountNavigationComponent {}
