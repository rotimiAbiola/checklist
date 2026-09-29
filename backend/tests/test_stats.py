from datetime import date, timedelta


def test_stats_empty(client):
    resp = client.get("/api/todos/stats")
    assert resp.status_code == 200
    assert resp.json() == {
        "total": 0,
        "completed": 0,
        "pending": 0,
        "overdue": 0,
        "by_priority": {"low": 0, "medium": 0, "high": 0},
    }


def test_stats_counts(client):
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    client.post("/api/todos", json={"title": "A", "priority": "high"})
    b = client.post("/api/todos", json={"title": "B", "priority": "low"}).json()
    client.patch(f"/api/todos/{b['id']}", json={"completed": True})
    client.post(
        "/api/todos",
        json={"title": "Overdue", "priority": "medium", "due_date": yesterday},
    )

    resp = client.get("/api/todos/stats")
    body = resp.json()
    assert body["total"] == 3
    assert body["completed"] == 1
    assert body["pending"] == 2
    assert body["overdue"] == 1
    assert body["by_priority"] == {"low": 1, "medium": 1, "high": 1}


def test_completed_overdue_item_not_counted_as_overdue(client):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    created = client.post(
        "/api/todos", json={"title": "Late but done", "due_date": yesterday}
    ).json()
    client.patch(f"/api/todos/{created['id']}", json={"completed": True})

    resp = client.get("/api/todos/stats")
    assert resp.json()["overdue"] == 0
