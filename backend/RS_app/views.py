from rest_framework import views, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import Profile, Page, FollowRelationship, BlockRelationship
from .serializers import UserSearchSerializer, PageSearchSerializer, ProfileDetailSerializer

class GlobalSearchView(views.APIView):
    """
    Endpoint de recherche unifiée (Barre de recherche supérieure).
    Cherche dans les utilisateurs et dans les pages tout en filtrant les blocages.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        current_profile = request.user.profile
        
        # Récupération des IDs pour filtrer les utilisateurs bloqués ou bloqueurs
        blocked_users_ids = current_profile.blocking.values_list('user_id', flat=True)
        blocked_by_users_ids = current_profile.blocked_by.values_list('user_id', flat=True)
        excluded_ids = set(blocked_users_ids) | set(blocked_by_users_ids)

        # 1. Recherche parmi les utilisateurs (en excluant les blocages)
        users = User.objects.filter(username__icontains=query).exclude(id__in=excluded_ids)[:5]
        
        # 2. Recherche parmi les pages communautaires
        pages = Page.objects.filter(title__icontains=query)[:5]

        # Sérialisation des deux listes
        user_data = UserSearchSerializer(users, many=True).data
        page_data = PageSearchSerializer(pages, many=True).data

        # Fusion des résultats pour Angular
        return Response(user_data + page_data, status=status.HTTP_200_OK)


class ProfileActionView(views.APIView):
    """
    Gère la récupération des détails d'un profil et les actions 
    associées (follow, unfollow, block, unblock).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        try:
            target_user = User.objects.get(username=username)
            profile = target_user.profile
        except User.DoesNotExist:
            return Response({"error": "Profil introuvable"}, status=status.HTTP_404_NOT_FOUND)

        # Si le profil ciblé a bloqué l'utilisateur connecté, on lui cache l'existence du profil
        if profile.blocking.filter(user=request.user).exists():
            return Response({"error": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProfileDetailSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def post(self, request, username):
        action = request.data.get('action')
        try:
            target_user = User.objects.get(username=username)
            target_profile = target_user.profile
            current_profile = request.user.profile
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable"}, status=status.HTTP_404_NOT_FOUND)

        # Sécurité : impossible de s'auto-gérer
        if target_user == request.user:
            return Response({"error": "Action impossible sur votre propre profil"}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'follow':
            FollowRelationship.objects.get_or_create(follower=current_profile, following=target_profile)
            return Response({"status": "Abonnement réussi"})
            
        elif action == 'unfollow':
            FollowRelationship.objects.filter(follower=current_profile, following=target_profile).delete()
            return Response({"status": "Abonnement supprimé"})
            
        elif action == 'block':
            # Bloquer détruit instantanément les liens de suivi dans les deux sens
            FollowRelationship.objects.filter(follower=current_profile, following=target_profile).delete()
            FollowRelationship.objects.filter(follower=target_profile, following=current_profile).delete()
            BlockRelationship.objects.get_or_create(blocker=current_profile, blocked=target_profile)
            return Response({"status": "Utilisateur bloqué"})
            
        elif action == 'unblock':
            BlockRelationship.objects.filter(blocker=current_profile, blocked=target_profile).delete()
            return Response({"status": "Utilisateur débloqué"})

        return Response({"error": "Action invalide"}, status=status.HTTP_400_BAD_REQUEST)


class PageViewSet(viewsets.ModelViewSet):
    """
    Gestion des pages communautaires.
    Permet la création et l'ajout automatique du créateur comme premier membre.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PageSearchSerializer # Réutilisé temporairement pour simplifier
    queryset = Page.objects.all()

    def create(self, request, *args, **kwargs):
        title = request.data.get('title')
        description = request.data.get('description', '')
        
        if Page.objects.filter(title=title).exists():
            return Response({"error": "Ce nom de page existe déjà"}, status=status.HTTP_400_BAD_REQUEST)
        
        page = Page.objects.create(title=title, description=description, creator=request.user)
        page.members.add(request.user) # Devient membre d'office
        
        return Response({"id": page.id, "title": page.title, "status": "Page créée avec succès"}, status=status.HTTP_201_CREATED)