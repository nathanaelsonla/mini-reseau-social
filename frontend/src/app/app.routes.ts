import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { FeedComponent } from './pages/feed/feed.component';
import { authGuard } from './guards/auth.guard';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'feed', component: FeedComponent, /*canActivate: [authGuard] */}, // Route privée (Critère 4)
  
  { path: 'profile/:username', component: ProfileComponent,/*canActivate: [authGuard] */}, // Route dynamique
  { path: 'profile', redirectTo: 'profile/Nathanael', pathMatch: 'full' },
  { path: '', redirectTo: '/feed', pathMatch: 'full' },
  { path: '**', redirectTo: '/feed' }
];