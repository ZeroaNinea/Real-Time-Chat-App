import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked, Renderer } from 'marked';
import * as DOMPurify from 'dompurify';
import hljs from 'highlight.js';

@Pipe({
  name: 'textFormat',
  standalone: true,
})
export class TextFormatPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  async transform(markdown: string): Promise<SafeHtml> {
    Renderer.prototype.paragraph = function ({ tokens }) {
      let text = this.parser.parseInline(tokens);

      text = text
        .replace(/\[color=(.*?)\](.*?)\[\/color\]/g, (_, color, content) => {
          const allowed = ['red', 'green', 'blue'];
          if (allowed.includes(color)) {
            return `<span style="color:${color}">${content}</span>`;
          }
          return content;
        })
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/\|\|(.*?)\|\|/g, '<span class="spoiler">$1</span>');

      return `${text}`;
    };

    console.log(Renderer.prototype);
    const rawHtml = marked(markdown, {
      breaks: false,
    });
    const cleanHtml = DOMPurify.default.sanitize(await rawHtml);

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
