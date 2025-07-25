import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-hamburger-menu',
  imports: [MatButtonModule, MatMenuModule, MatIconModule],
  standalone: true,
  templateUrl: './hamburger-menu.component.html',
  styleUrl: './hamburger-menu.component.scss',
})
export class HamburgerMenuComponent {}
