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

  async transform(markdown: string): Promise<SafeHtml> {
    const rawHtml = marked(markdown, {
      breaks: false,
    });
    const cleanHtml = DOMPurify.default.sanitize(await rawHtml);

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
