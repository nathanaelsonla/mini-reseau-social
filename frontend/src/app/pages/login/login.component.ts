import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  authForm!: FormGroup;
  isRegisterMode: boolean = false; // Permet de basculer entre Connexion et Inscription
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    if (this.isRegisterMode) {
      // Formulaire d'inscription complet
      this.authForm = this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        bio: ['📢 Nouveau sur MiniSocial !', [Validators.maxLength(160)]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    } else {
      // Formulaire de connexion simple
      this.authForm = this.fb.group({
        username: ['', [Validators.required]],
        password: ['', [Validators.required]]
      });
    }
    this.errorMessage = '';
  }

  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.initForm(); // Réinitialise les règles de validation du formulaire
  }

  onSubmit(): void {
    if (this.authForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    const formData = this.authForm.value;

    if (this.isRegisterMode) {
      // 📝 MODE INSCRIPTION : Enregistrement local simulé (avant interconnexion Django)
      localStorage.setItem('registered_user', JSON.stringify({
        username: formData.username,
        email: formData.email,
        bio: formData.bio,
        visibility: 'public'
      }));
      
      alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
      this.isRegisterMode = false;
      this.initForm();
      this.loading = false;
    } else {
      // 🔑 MODE CONNEXION
      const savedUserRaw = localStorage.getItem('registered_user');
      
      // Simulation locale pour la maquette si aucun compte n'a encore été créé sur la machine
      const activeUser = savedUserRaw ? JSON.parse(savedUserRaw) : { username: 'Nathanael', password: 'password123' };

      if (formData.username === activeUser.username) {
        // Succès de l'authentification maquette
        localStorage.setItem('token', 'fake_jwt_token_success');
        // Si l'utilisateur s'est inscrit à la volée, on s'assure que ses données de session sont actives
        if (!savedUserRaw) {
          localStorage.setItem('registered_user', JSON.stringify({
            username: 'Nathanael',
            email: 'nathanael@example.com',
            bio: 'Passionné de tech et meneur sur le terrain de basket. 🏀 💻',
            visibility: 'public'
          }));
        }
        this.router.navigate(['/feed']);
      } else {
        this.errorMessage = "Identifiants inconnus. Créez un compte si ce n'est pas déjà fait !";
      }
      this.loading = false;
    }
  }
}