import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-langing-header',
  imports: [MatToolbarModule, MatButtonModule, RouterModule],
  standalone: true,
  templateUrl: './langing-header.component.html',
  styleUrl: './langing-header.component.scss',
})
export class LangingHeaderComponent {}
