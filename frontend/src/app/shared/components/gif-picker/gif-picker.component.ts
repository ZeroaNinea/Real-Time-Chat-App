import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GifService } from '../../services/gif/gif.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-gif-picker',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  standalone: true,
  templateUrl: './gif-picker.component.html',
  styleUrl: './gif-picker.component.scss',
})
export class GifPickerComponent {
  private gifService = inject(GifService);

  @Output() select = new EventEmitter<string>();

  searchTerm = '';
  gifs: string[] = [];
  next: string = '';

  constructor() {
    this.loadTrending();
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

    if (this.searchTerm) {
      this.gifService
        .searchGifs(this.searchTerm, 20, this.next)
        .subscribe((res) => {
          this.gifs.push(...res.results.map((r) => r.media_formats.gif.url));
          this.next = res.next;
        });
    } else {
      this.gifService.trendingGifs(20, this.next).subscribe((res) => {
        this.gifs.push(...res.results.map((r) => r.media_formats.gif.url));
        this.next = res.next;
      });
    }
  }

  selectGif(url: string) {
    this.select.emit(url);
  }
}
