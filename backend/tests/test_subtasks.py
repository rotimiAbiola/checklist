import pytest


@pytest.fixture()
def todo(client):
    return client.post("/api/todos", json={"title": "Plan trip"}).json()


def test_create_subtask(client, todo):
    resp = client.post(f"/api/todos/{todo['id']}/subtasks", json={"title": "Book flights"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Book flights"
    assert body["completed"] is False
    assert body["todo_id"] == todo["id"]


def test_create_subtask_rejects_blank_title(client, todo):
    resp = client.post(f"/api/todos/{todo['id']}/subtasks", json={"title": "  "})
    assert resp.status_code == 422


def test_create_subtask_on_missing_todo_404(client):
    resp = client.post("/api/todos/999/subtasks", json={"title": "x"})
    assert resp.status_code == 404


def test_subtask_appears_nested_in_todo(client, todo):
    client.post(f"/api/todos/{todo['id']}/subtasks", json={"title": "Book flights"})
    client.post(f"/api/todos/{todo['id']}/subtasks", json={"title": "Pack bags"})

    resp = client.get(f"/api/todos/{todo['id']}")
    subtasks = resp.json()["subtasks"]
    assert [s["title"] for s in subtasks] == ["Book flights", "Pack bags"]


def test_toggle_subtask_completed(client, todo):
    subtask = client.post(
        f"/api/todos/{todo['id']}/subtasks", json={"title": "Book flights"}
    ).json()

    resp = client.patch(
        f"/api/todos/{todo['id']}/subtasks/{subtask['id']}", json={"completed": True}
    )
    assert resp.status_code == 200
    assert resp.json()["completed"] is True


def test_update_subtask_not_found(client, todo):
    resp = client.patch(f"/api/todos/{todo['id']}/subtasks/999", json={"completed": True})
    assert resp.status_code == 404


def test_delete_subtask(client, todo):
    subtask = client.post(
        f"/api/todos/{todo['id']}/subtasks", json={"title": "Book flights"}
    ).json()

    resp = client.delete(f"/api/todos/{todo['id']}/subtasks/{subtask['id']}")
    assert resp.status_code == 204

    todo_after = client.get(f"/api/todos/{todo['id']}").json()
    assert todo_after["subtasks"] == []


def test_delete_subtask_not_found(client, todo):
    resp = client.delete(f"/api/todos/{todo['id']}/subtasks/999")
    assert resp.status_code == 404


def test_subtask_scoped_to_correct_todo(client):
    todo_a = client.post("/api/todos", json={"title": "A"}).json()
    todo_b = client.post("/api/todos", json={"title": "B"}).json()
    subtask = client.post(f"/api/todos/{todo_a['id']}/subtasks", json={"title": "x"}).json()

    resp = client.patch(
        f"/api/todos/{todo_b['id']}/subtasks/{subtask['id']}", json={"completed": True}
    )
    assert resp.status_code == 404
