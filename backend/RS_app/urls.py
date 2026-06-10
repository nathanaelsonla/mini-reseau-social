from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GlobalSearchView, ProfileActionView, PageViewSet

router = DefaultRouter()
router.register(r'pages', PageViewSet, basename='page')

urlpatterns = [
    path('search/', GlobalSearchView.as_view(), name='global-search'),
    path('profiles/<str:username>/action/', ProfileActionView.as_view(), name='profile-actions'),
    path('', include(router.urls)),
]