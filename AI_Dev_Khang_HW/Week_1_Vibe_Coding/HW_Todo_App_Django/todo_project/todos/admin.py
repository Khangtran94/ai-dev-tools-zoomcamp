from django.contrib import admin
from .models import Todo, Tag, Comment


@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
	list_display = ("title", "completed", "priority", "due_date", "created_at")
	list_filter = ("completed", "priority", "due_date")
	search_fields = ("title", "description")
	raw_id_fields = ("parent",)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
	list_display = ("name",)
	search_fields = ("name",)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
	list_display = ("todo", "author", "created_at")
	search_fields = ("content",)
