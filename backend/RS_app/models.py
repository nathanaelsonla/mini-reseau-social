from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    """
    Extension du modèle User par défaut de Django.
    Permet de stocker la bio, l'avatar et de gérer les relations asymétriques.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=160, blank=True, default="Nouveau sur MiniSocial !")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Abonnements : Relation "Many-to-Many" non symétrique vers soi-même via une table intermédiaire
    following = models.ManyToManyField(
        'self', 
        through='FollowRelationship', 
        through_fields=('follower', 'following'),
        symmetrical=False,
        related_name='followers'
    )
    
    # Blocages : Même logique, permet d'isoler un utilisateur de son espace
    blocking = models.ManyToManyField(
        'self',
        through='BlockRelationship',
        through_fields=('blocker', 'blocked'),
        symmetrical=False,
        related_name='blocked_by'
    )

    def __str__(self):
        return f"Profil de {self.user.username}"


# --- TABLES DE LIAISON (RELATIONS INTERMÉDIAIRES) ---

class FollowRelationship(models.Model):
    """Table pivot pour enregistrer qui suit qui"""
    follower = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='following_relations')
    following = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='follower_relations')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following') # Évite les doublons d'abonnement


class BlockRelationship(models.Model):
    """Table pivot pour enregistrer qui bloque qui"""
    blocker = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='blocking_relations')
    blocked = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='blocked_by_relations')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')


# --- ENTITÉ PAGES ET PUBLICATIONS ---

class Page(models.Model):
    """
    Une page communautaire (ex: Page_Basket). 
    Un user peut la suivre/rejoindre, mais la page ne peut pas suivre un user.
    """
    title = models.CharField(max_length=100, unique=True)
    description = models.TextField(max_length=500, blank=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_pages')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Liste des membres qui ont rejoint la page
    members = models.ManyToManyField(User, related_name='joined_pages', blank=True)

    def __str__(self):
        return f"Page: {self.title}"


class Post(models.Model):
    """
    Modèle pour les publications.
    Si le champ 'page' est nul, c'est un post global (fil public).
    Si le champ 'page' est rempli, il appartient à une page (visibilité restreinte).
    """
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Clé étrangère optionnelle vers une Page
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='posts', blank=True, null=True)

    def __str__(self):
        prefix = f"[{self.page.title}]" if self.page else "[Global]"
        return f"{prefix} Post de {self.author.username} ({self.created_at.strftime('%Y-%m-%d')})"


# --- SIGNALS DJANGO ---
# Ces fonctions s'activent automatiquement pour créer ou sauvegarder un profil 
# dès qu'un utilisateur est créé via l'authentification standard.

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()