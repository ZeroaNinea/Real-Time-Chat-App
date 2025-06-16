import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-channel-topic',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  standalone: true,
  templateUrl: './channel-topic.component.html',
  styleUrl: './channel-topic.component.scss',
})
export class ChannelTopicComponent {
  @Input() topic: string | undefined;
  @Input() canEdit = false;
  @Input() channelId: string | null = null;
  @Input() chatTopic: string | undefined;

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
