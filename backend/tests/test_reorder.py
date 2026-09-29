def test_reorder_updates_positions(client):
    a = client.post("/api/todos", json={"title": "A"}).json()
    b = client.post("/api/todos", json={"title": "B"}).json()
    c = client.post("/api/todos", json={"title": "C"}).json()

    resp = client.post("/api/todos/reorder", json={"ordered_ids": [c["id"], a["id"], b["id"]]})
    assert resp.status_code == 200
    assert [t["title"] for t in resp.json()] == ["C", "A", "B"]

    resp = client.get("/api/todos")
    assert [t["title"] for t in resp.json()] == ["C", "A", "B"]


def test_reorder_ignores_unknown_ids(client):
    a = client.post("/api/todos", json={"title": "A"}).json()
    b = client.post("/api/todos", json={"title": "B"}).json()

    resp = client.post("/api/todos/reorder", json={"ordered_ids": [b["id"], 999, a["id"]]})
    assert resp.status_code == 200
    assert [t["title"] for t in resp.json()] == ["B", "A"]


def test_reorder_requires_at_least_one_id(client):
    resp = client.post("/api/todos/reorder", json={"ordered_ids": []})
    assert resp.status_code == 422
