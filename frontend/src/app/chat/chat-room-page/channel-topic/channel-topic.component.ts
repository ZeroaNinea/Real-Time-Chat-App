import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-channel-topic',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  standalone: true,
  templateUrl: './channel-topic.component.html',
  styleUrl: './channel-topic.component.scss',
})
export class ChannelTopicComponent {
  @Input() topic: string | undefined;
  @Input() canEdit = false;
  @Output() topicChange = new EventEmitter<string>();

  editing = false;
  draft = '';

  startEdit() {
    this.draft = this.topic ?? '';
    this.editing = true;
  }

  save() {
    this.editing = false;
    this.topicChange.emit(this.draft);
  }

  cancel() {
    this.editing = false;
  }
}
