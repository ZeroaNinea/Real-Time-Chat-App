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
      const lowerHref = href.toLowerCase();

      // HTML5 videos (mp4, webm, etc.)
      if (/\.(mp4|webm|ogg)$/i.test(lowerHref)) {
        return `
          <div class="message-video-wrapper">
            <video class="message-video" controls>
              <source src="${href}" type="video/${href.split('.').pop()}">
              Your browser does not support the video tag.
            </video>
          </div>
        `;
      }

      // YouTube
      if (href.includes('youtube.com/watch') || href.includes('youtu.be')) {
        const videoId = href.includes('youtu.be')
          ? href.split('/').pop()
          : new URL(href).searchParams.get('v');
        if (videoId) {
          return `
            <iframe
              class="message-youtube"
              src="https://www.youtube.com/embed/${videoId}"
              title="${title || 'YouTube video'}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          `;
        }
      }

      // Vimeo
      if (href.includes('vimeo.com/')) {
        const match = href.match(/vimeo\.com\/(\d+)/);
        const videoId = match ? match[1] : null;
        if (videoId) {
          return `
            <iframe
              class="message-vimeo"
              src="https://player.vimeo.com/video/${videoId}"
              title="${title || 'Vimeo video'}"
              frameborder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowfullscreen
            ></iframe>
          `;
        }
      }

      // Streamable
      if (href.includes('streamable.com/')) {
        const match = href.match(/streamable\.com\/(\w+)/);
        const videoId = match ? match[1] : null;
        if (videoId) {
          return `
            <iframe
              class="message-streamable"
              src="https://streamable.com/e/${videoId}"
              title="${title || 'Streamable video'}"
              frameborder="0"
              allow="autoplay"
              allowfullscreen
            ></iframe>
          `;
        }
      }

      // Facebook
      if (href.includes('facebook.com/') && href.includes('/videos/')) {
        const encoded = encodeURIComponent(href);
        return `
          <iframe
            class="message-facebook"
            src="https://www.facebook.com/plugins/video.php?href=${encoded}"
            title="${title || 'Facebook video'}"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen
          ></iframe>
        `;
      }

      // Twitch
      if (href.includes('clips.twitch.tv/')) {
        const match = href.match(/clips\.twitch\.tv\/(\w+)/);
        const clipId = match ? match[1] : null;
        if (clipId) {
          return `
            <iframe
              class="message-twitch"
              src="https://clips.twitch.tv/embed?clip=${clipId}&parent=${
            location.hostname
          }"
              title="${title || 'Twitch clip'}"
              frameborder="0"
              allowfullscreen
            ></iframe>
          `;
        }
      }

      // TikTok
      if (href.includes('tiktok.com/')) {
        const match = href.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
        const videoId = match ? match[1] : null;
        if (videoId) {
          return `
            <div class="responsive-tiktok-wrapper">
              <iframe
                src="https://www.tiktok.com/embed/${videoId}"
                title="${title || 'TikTok video'}"
                frameborder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          `;
        }
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

    const cleanHtml = DOMPurify.default.sanitize(await rawHtml, {
      ADD_TAGS: ['iframe', 'video', 'source'],
      ADD_ATTR: [
        'allow',
        'allowfullscreen',
        'frameborder',
        'scrolling',
        'src',
        'height',
        'width',
        'controls',
        'type',
        'accelerometer',
        'autoplay',
        'clipboard-write',
        'encrypted-media',
        'gyroscope',
        'picture-in-picture',
      ],
    });

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
