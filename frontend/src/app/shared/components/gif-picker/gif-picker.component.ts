import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';

import { GifService } from '../../services/gif/gif.service';
import { ChatService } from '../../../chat/shared/services/chat-service/chat.service';
import { FavoriteToggleDirective } from '../../directives/favorite-toggle.directive';

@Component({
  selector: 'app-gif-picker',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    FavoriteToggleDirective,
  ],
  standalone: true,
  templateUrl: './gif-picker.component.html',
  styleUrl: './gif-picker.component.scss',
})
export class GifPickerComponent {
  private gifService = inject(GifService);
  private chatService = inject(ChatService);

  favoriteGifs: string[] = [];

  @Output() select = new EventEmitter<string>();

  searchTerm = '';
  gifs: string[] = [];
  next: string = '';
  isLoading = false;

  constructor() {
    this.loadTrending();

    this.chatService.favorites$.subscribe((favs) => {
      this.favoriteGifs = favs;
      console.log('favoriteGifs', this.favoriteGifs);
    });
  }

  loadTrending() {
    this.gifService.trendingGifs(20).subscribe((res) => {
      this.gifs = res.results.map((r) => r.media_formats.gif.url);
      this.next = res.next;
    });
  }

  search() {
    if (!this.searchTerm.trim()) return this.loadTrending();
    this.gifService.searchGifs(this.searchTerm, 20).subscribe((res) => {
      this.gifs = res.results.map((r) => r.media_formats.gif.url);
      this.next = res.next;
    });
  }

  loadMore() {
    if (!this.next) return;

    this.isLoading = true;

    if (this.searchTerm) {
      this.gifService
        .searchGifs(this.searchTerm, 20, this.next)
        .subscribe((res) => {
          this.gifs = [];
          this.gifs.push(...res.results.map((r) => r.media_formats.gif.url));
          this.next = res.next;
        });
    } else {
      this.gifService.trendingGifs(20, this.next).subscribe((res) => {
        this.gifs = [];
        this.gifs.push(...res.results.map((r) => r.media_formats.gif.url));
        this.next = res.next;
      });
    }

    setTimeout(() => (this.isLoading = false), 1000);
  }

  selectGif(url: string) {
    this.select.emit(url);
  }

  // toggleFavorite(gifUrl: string, event: MouseEvent) {
  //   const button = (event.currentTarget as HTMLElement).parentElement!;
  //   const container = button.querySelector('.particle-container');

  //   if (!container) return;

  //   this.animateParticles(container);

  //   if (this.favoriteGifs.includes(gifUrl)) {
  //     this.chatService.removeFavorite(gifUrl).subscribe(() => {
  //       console.log('Favorite removed:', gifUrl);
  //     });
  //   } else {
  //     this.chatService.addFavorite(gifUrl).subscribe(() => {
  //       console.log('Favorite added:', gifUrl);
  //     });
  //   }
  // }

  // animateParticles(container: Element) {
  //   for (let i = 0; i < 12; i++) {
  //     const particle = document.createElement('div');
  //     particle.className = 'particle';
  //     requestAnimationFrame(() => {
  //       particle.style.setProperty('height', `6px`);
  //       particle.style.setProperty('width', `6px`);
  //       particle.style.setProperty('--x', `${Math.random() * 2 - 1}`);
  //       particle.style.setProperty('--y', `${Math.random() * 2 - 1}`);
  //     });
  //     container.appendChild(particle);

  //     setTimeout(() => {
  //       container.removeChild(particle);
  //     }, 600);
  //   }
  // }

  areThereFavorites() {
    return this.favoriteGifs.length > 0;
  }
}
