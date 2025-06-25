import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GifService {
  private readonly apiKey = ' AIzaSyCeUgqzaZhxMmo_mgpkeXbXgFAfm8zoAX4 ';
  private readonly baseUrl = 'https://tenor.googleapis.com/v2';

  private http: HttpClient = inject(HttpClient);

  constructor() {}
}
