import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  // L'URL pointera vers ton API Django (/api/posts/)
  private apiUrl = `${environment.apiUrl}/posts/`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les posts (Fil d'actualité)
  getPosts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Créer une nouvelle publication (Validation et envoi)
  createPost(postData: { content: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, postData);
  }
}