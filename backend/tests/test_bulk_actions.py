import pytest


@pytest.fixture()
def three_todos(client):
    ids = [
        client.post("/api/todos", json={"title": f"Todo {i}"}).json()["id"] for i in range(3)
    ]
    return client, ids


def test_bulk_complete(three_todos):
    client, ids = three_todos
    resp = client.post("/api/todos/bulk", json={"ids": ids[:2], "action": "complete"})
    assert resp.status_code == 200
    assert all(t["completed"] for t in resp.json())

    remaining = client.get("/api/todos", params={"completed": False}).json()
    assert len(remaining) == 1
    assert remaining[0]["id"] == ids[2]


def test_bulk_incomplete(three_todos):
    client, ids = three_todos
    client.post("/api/todos/bulk", json={"ids": ids, "action": "complete"})
    resp = client.post("/api/todos/bulk", json={"ids": ids[:1], "action": "incomplete"})
    assert resp.json()[0]["completed"] is False


def test_bulk_delete_soft_deletes(three_todos):
    client, ids = three_todos
    resp = client.post("/api/todos/bulk", json={"ids": ids[:2], "action": "delete"})
    assert resp.status_code == 200
    assert resp.json() == []

    remaining = client.get("/api/todos").json()
    assert len(remaining) == 1
    assert remaining[0]["id"] == ids[2]


def test_bulk_add_tag(three_todos):
    client, ids = three_todos
    resp = client.post(
        "/api/todos/bulk", json={"ids": ids, "action": "add_tag", "tag": "batch"}
    )
    assert resp.status_code == 200
    assert all("batch" in t["tags"] for t in resp.json())


def test_bulk_add_tag_is_idempotent(three_todos):
    client, ids = three_todos
    client.post("/api/todos/bulk", json={"ids": ids[:1], "action": "add_tag", "tag": "batch"})
    resp = client.post(
        "/api/todos/bulk", json={"ids": ids[:1], "action": "add_tag", "tag": "batch"}
    )
    assert resp.json()[0]["tags"].count("batch") == 1


def test_bulk_remove_tag(three_todos):
    client, ids = three_todos
    client.post("/api/todos/bulk", json={"ids": ids, "action": "add_tag", "tag": "batch"})
    resp = client.post(
        "/api/todos/bulk", json={"ids": ids[:1], "action": "remove_tag", "tag": "batch"}
    )
    assert resp.json()[0]["tags"] == []


def test_bulk_add_tag_requires_tag_value(three_todos):
    client, ids = three_todos
    resp = client.post("/api/todos/bulk", json={"ids": ids, "action": "add_tag"})
    assert resp.status_code == 422


def test_bulk_action_requires_at_least_one_id(client):
    resp = client.post("/api/todos/bulk", json={"ids": [], "action": "complete"})
    assert resp.status_code == 422


def test_bulk_action_skips_unknown_ids(client):
    resp = client.post("/api/todos/bulk", json={"ids": [999], "action": "complete"})
    assert resp.status_code == 200
    assert resp.json() == []
