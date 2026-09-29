def test_health_check(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_create_todo(client):
    resp = client.post("/api/todos", json={"title": "Buy milk"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Buy milk"
    assert body["completed"] is False
    assert body["priority"] == "medium"
    assert body["tags"] == []
    assert "id" in body


def test_create_todo_with_all_fields(client):
    payload = {
        "title": "Ship feature",
        "description": "Finish the fancy todo app",
        "priority": "high",
        "due_date": "2026-12-31",
        "tags": ["work", "urgent", "Work"],
    }
    resp = client.post("/api/todos", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["priority"] == "high"
    assert body["due_date"] == "2026-12-31"
    # duplicate tag "Work" collapsed case-insensitively
    assert body["tags"] == ["work", "urgent"]


def test_create_todo_rejects_blank_title(client):
    resp = client.post("/api/todos", json={"title": "   "})
    assert resp.status_code == 422


def test_create_todo_rejects_missing_title(client):
    resp = client.post("/api/todos", json={})
    assert resp.status_code == 422


def test_get_todo(client):
    created = client.post("/api/todos", json={"title": "Read a book"}).json()
    resp = client.get(f"/api/todos/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Read a book"


def test_get_todo_not_found(client):
    resp = client.get("/api/todos/999")
    assert resp.status_code == 404


def test_list_todos_empty(client):
    resp = client.get("/api/todos")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_todos_returns_created_items(client):
    client.post("/api/todos", json={"title": "One"})
    client.post("/api/todos", json={"title": "Two"})
    resp = client.get("/api/todos")
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.json()]
    assert titles == ["One", "Two"]


def test_update_todo_partial(client):
    created = client.post("/api/todos", json={"title": "Original"}).json()
    resp = client.patch(f"/api/todos/{created['id']}", json={"completed": True})
    assert resp.status_code == 200
    body = resp.json()
    assert body["completed"] is True
    assert body["title"] == "Original"


def test_update_todo_full(client):
    created = client.post("/api/todos", json={"title": "Original"}).json()
    resp = client.put(
        f"/api/todos/{created['id']}",
        json={"title": "Updated", "priority": "low"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Updated"
    assert body["priority"] == "low"


def test_update_todo_not_found(client):
    resp = client.patch("/api/todos/999", json={"completed": True})
    assert resp.status_code == 404


def test_delete_todo(client):
    created = client.post("/api/todos", json={"title": "Delete me"}).json()
    resp = client.delete(f"/api/todos/{created['id']}")
    assert resp.status_code == 204

    resp = client.get(f"/api/todos/{created['id']}")
    assert resp.status_code == 404


def test_delete_todo_not_found(client):
    resp = client.delete("/api/todos/999")
    assert resp.status_code == 404
