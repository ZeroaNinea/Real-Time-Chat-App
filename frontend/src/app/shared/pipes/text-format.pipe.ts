import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textFormat',
})
export class TextFormatPipe implements PipeTransform {
  transform(text: string): string {
    if (!text) return '';

    // Escape markers.
    text = text
      .replace(/\\\*/g, '__ESC_STAR__')
      .replace(/\\\_/g, '__ESC_UNDERSCORE__')
      .replace(/\\\~/g, '__ESC_TILDE__');

    // Format.
    text = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold.
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic.
      .replace(/\_\_(.*?)\_\_/g, '<u>$1</u>') // Underline.
      .replace(/\~\~(.*?)\~\~/g, '<s>$1</s>'); // Strikethrough.

    // Restore escaped markers.
    return text
      .replace(/__ESC_STAR__/g, '*')
      .replace(/__ESC_UNDERSCORE__/g, '_')
      .replace(/__ESC_TILDE__/g, '~');
  }
}
