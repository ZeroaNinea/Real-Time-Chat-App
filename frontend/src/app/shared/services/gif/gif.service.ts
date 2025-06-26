import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GifService {
  environment = environment;

  private readonly apiKey = environment.tenorApiKey;
  private readonly baseUrl = 'https://tenor.googleapis.com/v2';

  private http: HttpClient = inject(HttpClient);

  constructor() {}

  searchGifs(query: string, limit = 20) {
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&key=${
      this.apiKey
    }&client_key=my_test_app&limit=${limit}`;
    return this.http.get<{ results: any[] }>(url);
  }

  trendingGifs(limit = 20) {
    const url = `${this.baseUrl}/featured?key=${this.apiKey}&client_key=my_test_app&limit=${limit}`;
    return this.http.get<{ results: any[] }>(url);
  }
}
