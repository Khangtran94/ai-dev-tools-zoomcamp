from django.urls import reverse_lazy
from django.views import generic
from django.views.generic import TemplateView

from .models import Todo


class HomeView(TemplateView):
	template_name = "home.html"


class TodoListView(generic.ListView):
	model = Todo
	context_object_name = "todos"
	template_name = "todos/list.html"
	paginate_by = 20


class TodoDetailView(generic.DetailView):
	model = Todo
	context_object_name = "todo"
	template_name = "todos/detail.html"


class TodoCreateView(generic.CreateView):
	model = Todo
	fields = ["title", "description", "priority", "due_date", "tags", "parent"]
	template_name = "todos/form.html"
	success_url = reverse_lazy("todos:list")


class TodoUpdateView(generic.UpdateView):
	model = Todo
	fields = ["title", "description", "completed", "priority", "due_date", "tags", "parent"]
	template_name = "todos/form.html"
	success_url = reverse_lazy("todos:list")


class TodoDeleteView(generic.DeleteView):
	model = Todo
	template_name = "todos/confirm_delete.html"
	success_url = reverse_lazy("todos:list")

