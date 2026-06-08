import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {
  postForm!: FormGroup;
  posts: any[] = [];
  loading: boolean = false;      // Indicateur de chargement (Critère 8)
  submitLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Règle métier client : 1 caractère minimum, obligatoire (Critère 6 & 7)
    this.postForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]]
    });

    this.loadAllPosts();
  }

  // Chargement initial du flux de messages
  loadAllPosts(): void {
    this.loading = true;
    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = "Impossible de charger le fil d'actualité.";
        this.loading = false;
      }
    });
  }

  // Soumission d'un nouveau post
  onPublish(): void {
    if (this.postForm.valid) {
      this.submitLoading = true;
      this.errorMessage = '';

      this.postService.createPost(this.postForm.value).subscribe({
        next: (newPost) => {
          this.posts.unshift(newPost); // Ajoute instantanément en haut du fil d'actualité
          this.postForm.reset();
          this.submitLoading = false;
        },
        error: (err) => {
          this.submitLoading = false;
          // Capture et affiche les erreurs de validation de Django (Critère 6)
          this.errorMessage = err.error?.content || "Une erreur est survenue lors de la publication.";
        }
      });
    }
  }

  // Déconnexion
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}