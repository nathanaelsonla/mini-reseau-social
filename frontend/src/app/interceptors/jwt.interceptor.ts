import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Récupération du token JWT stocké dans le localStorage après la connexion
  const token = localStorage.getItem('token');
  
  // Si le token existe, on clone la requête pour lui ajouter le header Authorization
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned); // On envoie la requête modifiée
  }
  
  // Si pas de token (ex: page de login), on laisse passer la requête normale
  return next(req);
};