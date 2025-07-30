import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '../chat/main-page/header/header.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, HeaderComponent],
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
