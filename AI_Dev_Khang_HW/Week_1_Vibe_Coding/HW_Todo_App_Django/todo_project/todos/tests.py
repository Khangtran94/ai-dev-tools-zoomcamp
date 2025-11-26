from django.contrib.auth.models import User
from django.test import TestCase, Client
from django.urls import reverse

from .models import Todo, Tag, Comment


class TagModelTests(TestCase):
    """Test Tag model."""

    def test_create_tag(self):
        tag = Tag.objects.create(name="urgent")
        self.assertEqual(str(tag), "urgent")

    def test_tag_name_unique(self):
        Tag.objects.create(name="work")
        with self.assertRaises(Exception):
            Tag.objects.create(name="work")


class TodoModelTests(TestCase):
    """Test Todo model."""

    def test_create_todo_defaults(self):
        todo = Todo.objects.create(title="Buy groceries")
        self.assertEqual(str(todo), "Buy groceries")
        self.assertFalse(todo.completed)
        self.assertEqual(todo.priority, Todo.PRIORITY_MEDIUM)

    def test_todo_priority_choices(self):
        low_todo = Todo.objects.create(title="Task", priority=Todo.PRIORITY_LOW)
        high_todo = Todo.objects.create(title="Task", priority=Todo.PRIORITY_HIGH)
        self.assertEqual(low_todo.priority, "low")
        self.assertEqual(high_todo.priority, "high")

    def test_todo_with_tags(self):
        tag1 = Tag.objects.create(name="home")
        tag2 = Tag.objects.create(name="urgent")
        todo = Todo.objects.create(title="Clean house")
        todo.tags.add(tag1, tag2)
        self.assertEqual(todo.tags.count(), 2)
        self.assertIn(tag1, todo.tags.all())

    def test_todo_subtask_parent_relationship(self):
        parent = Todo.objects.create(title="Project")
        subtask = Todo.objects.create(title="Task 1", parent=parent)
        self.assertEqual(subtask.parent, parent)
        self.assertIn(subtask, parent.subtasks.all())

    def test_todo_cascade_delete_subtasks(self):
        parent = Todo.objects.create(title="Parent")
        subtask = Todo.objects.create(title="Subtask", parent=parent)
        parent.delete()
        self.assertFalse(Todo.objects.filter(pk=subtask.pk).exists())


class CommentModelTests(TestCase):
    """Test Comment model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.todo = Todo.objects.create(title="Test todo")

    def test_create_comment(self):
        comment = Comment.objects.create(
            todo=self.todo, author=self.user, content="This is a comment"
        )
        self.assertEqual(comment.content, "This is a comment")
        self.assertEqual(comment.author, self.user)
        self.assertEqual(comment.todo, self.todo)

    def test_comment_cascade_delete(self):
        comment = Comment.objects.create(
            todo=self.todo, author=self.user, content="Test"
        )
        todo_pk = self.todo.pk
        self.todo.delete()
        self.assertFalse(Comment.objects.filter(pk=comment.pk).exists())


class TodoViewTests(TestCase):
    """Test Todo views."""

    def setUp(self):
        self.client = Client()
        self.tag = Tag.objects.create(name="home")
        self.todo1 = Todo.objects.create(
            title="Task 1", priority=Todo.PRIORITY_HIGH, description="High priority"
        )
        self.todo2 = Todo.objects.create(
            title="Task 2", priority=Todo.PRIORITY_LOW, description="Low priority"
        )
        self.todo1.tags.add(self.tag)

    def test_list_view_status_200(self):
        response = self.client.get(reverse("todos:list"))
        self.assertEqual(response.status_code, 200)

    def test_list_view_contains_todos(self):
        response = self.client.get(reverse("todos:list"))
        self.assertContains(response, "Task 1")
        self.assertContains(response, "Task 2")

    def test_detail_view_status_200(self):
        response = self.client.get(reverse("todos:detail", args=[self.todo1.pk]))
        self.assertEqual(response.status_code, 200)

    def test_detail_view_content(self):
        response = self.client.get(reverse("todos:detail", args=[self.todo1.pk]))
        self.assertContains(response, "Task 1")
        self.assertContains(response, "High priority")

    def test_detail_view_404(self):
        response = self.client.get(reverse("todos:detail", args=[9999]))
        self.assertEqual(response.status_code, 404)

    def test_create_view_get(self):
        response = self.client.get(reverse("todos:create"))
        self.assertEqual(response.status_code, 200)

    def test_create_view_post(self):
        data = {
            "title": "New Task",
            "description": "Test description",
            "priority": Todo.PRIORITY_HIGH,
        }
        response = self.client.post(reverse("todos:create"), data, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Todo.objects.filter(title="New Task").exists())
        new_todo = Todo.objects.get(title="New Task")
        self.assertEqual(new_todo.priority, Todo.PRIORITY_HIGH)

    def test_create_view_post_redirects(self):
        data = {"title": "Redirect Test", "priority": Todo.PRIORITY_MEDIUM}
        response = self.client.post(reverse("todos:create"), data)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.endswith(reverse("todos:list")))

    def test_update_view_get(self):
        response = self.client.get(reverse("todos:edit", args=[self.todo1.pk]))
        self.assertEqual(response.status_code, 200)

    def test_update_view_post(self):
        data = {
            "title": "Updated Task",
            "description": "Updated description",
            "priority": Todo.PRIORITY_LOW,
            "completed": True,
        }
        response = self.client.post(
            reverse("todos:edit", args=[self.todo1.pk]), data, follow=True
        )
        self.assertEqual(response.status_code, 200)
        self.todo1.refresh_from_db()
        self.assertEqual(self.todo1.title, "Updated Task")
        self.assertTrue(self.todo1.completed)

    def test_delete_view_get(self):
        response = self.client.get(reverse("todos:delete", args=[self.todo1.pk]))
        self.assertEqual(response.status_code, 200)

    def test_delete_view_post(self):
        todo_pk = self.todo1.pk
        response = self.client.post(
            reverse("todos:delete", args=[todo_pk]), follow=True
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Todo.objects.filter(pk=todo_pk).exists())

    def test_home_view(self):
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 200)