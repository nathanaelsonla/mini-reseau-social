import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {
  postForm!: FormGroup;
  commentForm!: FormGroup;
  posts: any[] = [];
  loading: boolean = false;
  submitLoading: boolean = false;
  isSidebarCollapsed: boolean = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  // Onboarding
  showOnboarding: boolean = true; 
  availableTopics: string[] = ['🏀 Sport', '💃 Danse', '📚 Apprentissage', '🎮 Gaming', '🍳 Cuisine', '🎵 Musique', '💻 Tech'];
  selectedTopics: string[] = [];

  // Données de recherche et Pages
  searchQuery: string = '';
  searchResults: any[] = [];
  showCreatePageModal: boolean = false;
  newPageTitle: string = '';

  currentUser = { username: 'Nathanael' };

  // Base de données simulée pour la recherche globale (Membres & Pages)
  mockDatabase = [
    { name: 'Alex_Coach', type: 'user' },
    { name: 'Sara_Dance', type: 'user' },
    { name: 'Meilleure_Amie', type: 'user' },
    { name: 'Page_Basket', type: 'page' },
    { name: 'Tech_Inspiration', type: 'page' }
  ];

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.postForm = this.fb.group({ content: ['', [Validators.required]] });
    this.commentForm = this.fb.group({ commentContent: ['', [Validators.required]] });
    this.loadAllPosts();
  }

  loadAllPosts(): void {
    this.loading = true;
    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // Algorithme de recherche en temps réel
  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }
    // Filtre les blocages (simulé) et trouve les correspondances
    this.searchResults = this.mockDatabase.filter(item => 
      item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  goToResult(result: any): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.router.navigate(['/profile', result.name]);
  }

  onCreatePage(): void {
    if (this.newPageTitle.trim()) {
      const pageName = this.newPageTitle.trim().replace(/\s+/g, '_');
      this.mockDatabase.push({ name: pageName, type: 'page' });
      alert(`La page communautaire "${pageName}" a été créée avec succès !`);
      this.newPageTitle = '';
      this.showCreatePageModal = false;
      this.router.navigate(['/profile', pageName]);
    }
  }

  toggleTopic(topic: string): void {
    if (this.selectedTopics.includes(topic)) {
      this.selectedTopics = this.selectedTopics.filter(t => t !== topic);
    } else {
      this.selectedTopics.push(topic);
    }
  }

  saveInterests(): void {
    localStorage.setItem('user_interests', JSON.stringify(this.selectedTopics));
    this.showOnboarding = false;
  }

  toggleSidebar(): void { this.isSidebarCollapsed = !this.isSidebarCollapsed; }
  toggleLike(post: any): void { post.isLiked = !post.isLiked; post.likesCount += post.isLiked ? 1 : -1; }
  toggleCommentsSection(post: any): void { post.showComments = !post.showComments; }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => { this.imagePreview = reader.result as string; };
      reader.readAsDataURL(file);
    }
  }
  removeSelectedImage(): void { this.selectedFile = null; this.imagePreview = null; }

  onPublish(): void {
    if (this.postForm.valid) {
      this.posts.unshift({
        content: this.postForm.value.content,
        image: this.imagePreview,
        author: { username: this.currentUser.username },
        likesCount: 0,
        isLiked: false,
        comments: []
      });
      this.postForm.reset();
      this.removeSelectedImage();
    }
  }

  onLogout(): void { this.authService.logout(); this.router.navigate(['/login']); }
}