import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  private baseUrl = runtimeConfig.apiUrl ?? environment.apiUrl;
  private http = inject(HttpClient);

  get<T>(url: string, options?: { headers?: Record<string, string> }) {
    return this.http.get<T>(`${this.baseUrl}${url}`, options);
  }

  post<T>(url: string, body: unknown, options?: { headers?: Record<string, string> }) {
    return this.http.post<T>(`${this.baseUrl}${url}`, body, options);
  }

  patch<T>(url: string, body: unknown, options?: { headers?: Record<string, string> }) {
    return this.http.patch<T>(`${this.baseUrl}${url}`, body, options);
  }

  delete<T>(url: string, options?: { headers?: Record<string, string> }) {
    return this.http.delete<T>(`${this.baseUrl}${url}`, options);
  }
}
