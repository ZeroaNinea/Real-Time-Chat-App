import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LandingHeaderComponent } from '../landing-header/landing-header.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, LandingHeaderComponent],
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
