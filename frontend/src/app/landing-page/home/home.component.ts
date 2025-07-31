import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LangingHeaderComponent } from '../langing-header/langing-header.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, LangingHeaderComponent],
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
