import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GifService {
  environment = environment;

  private readonly apiKey = environment.tenorApiKey;
  private readonly baseUrl = 'https://tenor.googleapis.com/v2';

  private http: HttpClient = inject(HttpClient);

  constructor() {}

  searchGifs(query: string, limit = 20, pos = '') {
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&key=${
      this.apiKey
    }&client_key=my_test_app&limit=${limit}${pos ? `&pos=${pos}` : ''}`;
    return this.http.get<{ results: any[]; next: string }>(url).pipe(
      catchError((error) => {
        console.error('Error fetching GIFs:', error);
        return of({ results: [], next: '' });
      })
    );
  }

  trendingGifs(limit = 20, pos = '') {
    const url = `${this.baseUrl}/search?q=excited&key=${
      this.apiKey
    }&client_key=my_test_app&limit=${limit}${pos ? `&pos=${pos}` : ''}`;
    return this.http.get<{ results: any[]; next: string }>(url).pipe(
      catchError((error) => {
        console.error('Error fetching GIFs:', error);
        return of({ results: [], next: '' });
      })
    );
  }
}
