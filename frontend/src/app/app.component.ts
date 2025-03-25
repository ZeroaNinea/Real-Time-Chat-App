import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatComponent],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';

  ngOnInit(): void {
    console.log('AppComponent initialized.');
  }
}
