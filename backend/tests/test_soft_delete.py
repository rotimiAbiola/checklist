def test_deleted_todo_is_excluded_from_list(client):
    created = client.post("/api/todos", json={"title": "Temp"}).json()
    client.delete(f"/api/todos/{created['id']}")

    resp = client.get("/api/todos")
    assert resp.json() == []


def test_deleted_todo_is_excluded_from_stats(client):
    created = client.post("/api/todos", json={"title": "Temp"}).json()
    client.delete(f"/api/todos/{created['id']}")

    resp = client.get("/api/todos/stats")
    assert resp.json()["total"] == 0


def test_deleted_todo_get_returns_404(client):
    created = client.post("/api/todos", json={"title": "Temp"}).json()
    client.delete(f"/api/todos/{created['id']}")

    resp = client.get(f"/api/todos/{created['id']}")
    assert resp.status_code == 404


def test_restore_brings_todo_back(client):
    created = client.post("/api/todos", json={"title": "Bring back"}).json()
    client.delete(f"/api/todos/{created['id']}")

    resp = client.post(f"/api/todos/{created['id']}/restore")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Bring back"

    resp = client.get(f"/api/todos/{created['id']}")
    assert resp.status_code == 200


def test_restore_nonexistent_todo_404(client):
    resp = client.post("/api/todos/999/restore")
    assert resp.status_code == 404


def test_restore_non_deleted_todo_400(client):
    created = client.post("/api/todos", json={"title": "Not deleted"}).json()
    resp = client.post(f"/api/todos/{created['id']}/restore")
    assert resp.status_code == 400
