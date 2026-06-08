import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// Correction du chemin d'accès : on remonte de 3 niveaux (services -> app -> src)
import { environment } from '../../environments/environment';import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth/login/`;

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials).pipe(
      tap(res => {
        if (res && res.access) {
          localStorage.setItem('token', res.access);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}