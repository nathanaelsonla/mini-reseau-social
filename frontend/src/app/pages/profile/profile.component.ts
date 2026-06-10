import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isSidebarCollapsed: boolean = false;
  activeTab: 'following' = 'following';

  loggedInUser = 'Nathanael';
  isOwnProfile: boolean = true;
  isPage: boolean = false;      // Détermine si le compte visité est une page
  isFollowing: boolean = false; // État de l'abonnement
  isBlocked: boolean = false;   // État du blocage

  profileUser = { username: '', bio: '' };

  // Listes dynamiques globales partagées localement
  myFollowing: any[] = [
    { username: 'Alex_Coach', type: 'user' },
    { username: 'Page_Basket', type: 'page' }
  ];
  myBlockedList: string[] = [];

  constructor(private fb: FormBuilder, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const targetUsername = params['username'] || this.loggedInUser;
      this.isOwnProfile = (targetUsername === this.loggedInUser);
      
      // Si le nom contient "Page_", c'est une entité Page
      this.isPage = targetUsername.toLowerCase().includes('page');

      // Vérification des relations locales
      this.isFollowing = this.myFollowing.some(f => f.username === targetUsername);
      this.isBlocked = this.myBlockedList.includes(targetUsername);

      if (this.isOwnProfile) {
        this.profileUser = {
          username: this.loggedInUser,
          bio: 'Passionné de tech et meneur sur le terrain de basket. 🏀 💻'
        };
      } else {
        this.profileUser = {
          username: targetUsername,
          bio: this.isPage 
            ? `Bienvenue sur la communauté ${targetUsername}. Rejoignez-nous pour interagir !`
            : `Compte officiel de @${targetUsername}.`
        };
      }

      this.initForm();
    });
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      bio: [{ value: this.profileUser.bio, disabled: !this.isOwnProfile }, [Validators.maxLength(160)]]
    });
  }

  toggleSidebar(): void { this.isSidebarCollapsed = !this.isSidebarCollapsed; }
  switchTab(tab: 'following'): void { this.activeTab = tab; }

  // Actions d'abonnements depuis un profil tiers
  onFollow(): void {
    this.isFollowing = true;
    this.myFollowing.push({ username: this.profileUser.username, type: this.isPage ? 'page' : 'user' });
  }

  onUnfollow(): void {
    this.isFollowing = false;
    this.myFollowing = this.myFollowing.filter(f => f.username !== this.profileUser.username);
  }

  onBlock(): void {
    this.isBlocked = true;
    this.onUnfollow();
    this.myBlockedList.push(this.profileUser.username);
  }

  onUnblock(): void {
    this.isBlocked = false;
    this.myBlockedList = this.myBlockedList.filter(u => u !== this.profileUser.username);
  }

  // Actions de nettoyage depuis l'espace "Mes Amis / Mes abonnements" de notre propre profil
  actionOnFriend(action: 'unfollow' | 'block', friend: any): void {
    if (action === 'unfollow') {
      this.myFollowing = this.myFollowing.filter(f => f.username !== friend.username);
    } else if (action === 'block') {
      this.myFollowing = this.myFollowing.filter(f => f.username !== friend.username);
      this.myBlockedList.push(friend.username);
      alert(`Vous avez bloqué ${friend.username}. Il ne peut plus interagir avec vous.`);
    }
  }

  updateProfile(): void {
    if (this.profileForm.valid && this.isOwnProfile) {
      alert('Profil mis à jour avec succès !');
    }
  }
}