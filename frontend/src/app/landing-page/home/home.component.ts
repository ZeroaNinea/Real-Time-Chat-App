import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LandingHeaderComponent } from '../landing-header/landing-header.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  imports: [RouterLink, LandingHeaderComponent, MatButtonModule],
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
