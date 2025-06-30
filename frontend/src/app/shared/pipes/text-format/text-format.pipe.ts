import { afterNextRender, inject, Pipe, PipeTransform } from '@angular/core';
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
    console.log(Renderer.prototype);
    Renderer.prototype.paragraph = function ({ tokens }) {
      let text = this.parser.parseInline(tokens);

      text = text
        .replace(
          /\[color=(#[0-9a-fA-F]{3,6}|red|green|blue)\](.*?)\[\/color\]/g,
          (_, color, content) => {
            const isNamed = ['red', 'green', 'blue'].includes(color);
            const isHex = /^#[0-9a-fA-F]{3,6}$/.test(color);

            if (isNamed || isHex) {
              return `<span style="color: ${color}">${content}</span>`;
            }

            return content;
          }
        )
        .replace(/--(.*?)--/g, '<u>$1</u>')
        .replace(/\|\|(.*?)\|\|/g, '<span class="spoiler">$1</span>');

      return `${text}`;
    };

    Renderer.prototype.code = function ({ text, lang }) {
      let highlighted = text;
      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(text, { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(text).value;
      }
      return `
       <pre class="code-block-wrapper">
          <code class="hljs ${lang}">${highlighted}</code>
          <button class="copy-button" data-code="${text}">copy</button>
        </pre>
      `;
    };

    Renderer.prototype.codespan = function ({ text }) {
      return `<code class="code-span">${text}</code>`;
    };

    Renderer.prototype.image = function ({ href }) {
      return `
        <div class="marked-gif-image-wrapper">
          <img src="${href}" class="image-gif">
          <div class="marked-star-wrapper">
            <button
              data-gif-url="${href}"
              class="marked-star-button"
            >
              <span class="material-symbols-outlined">star</span>
            </button>
            <div class="marked-particle-container" #particleContainer></div>
          </div>
        </div>
      `;
    };

    Renderer.prototype.link = function ({ href, title, text }) {
      console.log('Link:', href, text, title);
      if (text === 'video') {
        return `
          <div class="message-video-wrapper">
            <video class="message-video" controls>
              <source src="${href}" type="video/${href.split('.').pop()}">
              Your browser does not support the video tag.
            </video>
          </div>
        `;
      }
      if (href.includes('youtube.com/watch') || href.includes('youtu.be')) {
        const videoId = href.includes('youtu.be')
          ? href.split('/').pop()
          : new URL(href).searchParams.get('v');

        return `
          <iframe
            class="message-youtube"
            src="https://www.youtube.com/embed/${videoId}"
            frameborder="0"
            allowfullscreen
          ></iframe>
        `;
      }

      return `<a href="${href}" title="${title || ''}">${text}</a>`;
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
      breaks: true,
      gfm: true,
    });

    const cleanHtml = DOMPurify.default.sanitize(await rawHtml);

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
