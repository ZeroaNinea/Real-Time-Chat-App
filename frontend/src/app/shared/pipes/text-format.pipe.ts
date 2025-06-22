import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked, Renderer, MarkedOptions } from 'marked';
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
        .replace(/--(.*?)--/g, '<u>$1</u>')
        .replace(/\|\|(.*?)\|\|/g, '<span class="spoiler">$1</span>');

      return `${text}`;
    };

    const escapeFormatting = (text: string) =>
      text
        .replace(/\\\*/g, '&#42;')
        .replace(/\\\_/g, '&#95;')
        .replace(/\\\~/g, '&#126;')
        .replace(/\\\|/g, '&#124;')
        .replace(/\\\[/g, '&#91;')
        .replace(/\\\]/g, '&#93;')
        .replace(/\\\-/g, '&#45;');

    const rawHtml = marked(escapeFormatting(markdown), {
      breaks: false,
    });

    const cleanHtml = DOMPurify.default.sanitize(await rawHtml);

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
