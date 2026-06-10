from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Page, Post

# --- SÉRIALISEURS POUR LA RECHERCHE GLOBALE ---

class UserSearchSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'type']

    def get_type(self, obj):
        return 'user'


class PageSearchSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    username = serializers.CharField(source='title') # Aligné sur la clé 'username' attendue par le front

    class Meta:
        model = Page
        fields = ['id', 'username', 'type']

    def get_type(self, obj):
        return 'page'


# --- SÉRIALISEUR POUR LE PROFIL DÉTAILLÉ ---

class ProfileDetailSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.CharField(source='user.email')
    is_following = serializers.SerializerMethodField()
    is_blocked = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['username', 'email', 'bio', 'avatar', 'is_following', 'is_blocked']

    def get_is_following(self, obj):
        request_user = self.context.get('request').user
        if request_user.is_anonymous: 
            return False
        # Vérifie si l'utilisateur connecté est dans les abonnés de ce profil
        return obj.followers.filter(user=request_user).exists()

    def get_is_blocked(self, obj):
        request_user = self.context.get('request').user
        if request_user.is_anonymous: 
            return False
        # Vérifie si l'utilisateur connecté a bloqué ce profil
        return request_user.profile.blocking.filter(id=obj.id).exists()