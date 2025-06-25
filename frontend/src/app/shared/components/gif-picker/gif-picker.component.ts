import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GifService } from '../../services/gif/gif.service';

@Component({
  selector: 'app-gif-picker',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './gif-picker.component.html',
  styleUrl: './gif-picker.component.scss',
})
export class GifPickerComponent {
  private gifService = inject(GifService);

  @Output() select = new EventEmitter<string>();

  searchTerm = '';
  gifs: string[] = [];

  constructor() {
    this.loadTrending();
  }

  loadTrending() {
    this.gifService.trendingGifs().subscribe((res) => {
      this.gifs = res.results.map((r) => r.media_formats.gif.url);
    });
  }

  search() {
    if (!this.searchTerm.trim()) return this.loadTrending();
    this.gifService.searchGifs(this.searchTerm).subscribe((res) => {
      this.gifs = res.results.map((r) => r.media_formats.gif.url);
    });
  }

  selectGif(url: string) {
    this.select.emit(url);
  }
}
