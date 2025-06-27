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

    // const method = this.searchTerm.trim() ? 'searchGifs' : 'trendingGifs';
    // this.gifService[method](this.searchTerm, 20, this.next).subscribe((res) => {
    //   this.gifs.push(...res.results.map((r) => r.media_formats.gif.url));
    //   this.next = res.next;
    // });
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
