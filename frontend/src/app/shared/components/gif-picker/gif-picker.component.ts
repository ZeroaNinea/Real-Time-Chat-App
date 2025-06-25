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
}
