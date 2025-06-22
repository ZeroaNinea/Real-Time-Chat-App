import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import * as DOMPurify from 'dompurify';

@Pipe({
  name: 'textFormat',
  standalone: true,
})
export class TextFormatPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(markdown: string): SafeHtml {
    const rawHtml = marked(markdown, { breaks: true });
    const cleanHtml = DOMPurify.default.sanitize(<string | Node>rawHtml);

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
