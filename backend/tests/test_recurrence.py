def test_completing_non_recurring_todo_does_not_spawn_next(client):
    created = client.post(
        "/api/todos", json={"title": "One-off", "due_date": "2026-01-01"}
    ).json()
    client.patch(f"/api/todos/{created['id']}", json={"completed": True})

    resp = client.get("/api/todos")
    assert len(resp.json()) == 1


def test_completing_daily_recurring_todo_spawns_next_day(client):
    created = client.post(
        "/api/todos",
        json={"title": "Standup", "due_date": "2026-01-01", "recurrence": "daily"},
    ).json()
    client.patch(f"/api/todos/{created['id']}", json={"completed": True})

    resp = client.get("/api/todos").json()
    assert len(resp) == 2
    original = next(t for t in resp if t["id"] == created["id"])
    spawned = next(t for t in resp if t["id"] != created["id"])
    assert original["completed"] is True
    assert spawned["completed"] is False
    assert spawned["due_date"] == "2026-01-02"
    assert spawned["recurrence"] == "daily"
    assert spawned["title"] == "Standup"


def test_completing_weekly_recurring_todo_spawns_next_week(client):
    created = client.post(
        "/api/todos",
        json={"title": "Review", "due_date": "2026-01-01", "recurrence": "weekly"},
    ).json()
    client.patch(f"/api/todos/{created['id']}", json={"completed": True})

    resp = client.get("/api/todos").json()
    spawned = next(t for t in resp if t["id"] != created["id"])
    assert spawned["due_date"] == "2026-01-08"


def test_completing_monthly_recurring_todo_handles_month_end(client):
    created = client.post(
        "/api/todos",
        json={"title": "Rent", "due_date": "2026-01-31", "recurrence": "monthly"},
    ).json()
    client.patch(f"/api/todos/{created['id']}", json={"completed": True})

    resp = client.get("/api/todos").json()
    spawned = next(t for t in resp if t["id"] != created["id"])
    # February has 28 days in 2026 (not a leap year)
    assert spawned["due_date"] == "2026-02-28"


def test_recurring_todo_without_due_date_does_not_spawn(client):
    created = client.post(
        "/api/todos", json={"title": "No date", "recurrence": "daily"}
    ).json()
    client.patch(f"/api/todos/{created['id']}", json={"completed": True})

    resp = client.get("/api/todos").json()
    assert len(resp) == 1


def test_toggling_already_completed_recurring_todo_does_not_respawn(client):
    created = client.post(
        "/api/todos",
        json={"title": "Standup", "due_date": "2026-01-01", "recurrence": "daily"},
    ).json()
    client.patch(f"/api/todos/{created['id']}", json={"completed": True})
    # patch again with completed True (no-op transition)
    client.patch(f"/api/todos/{created['id']}", json={"completed": True})

    resp = client.get("/api/todos").json()
    assert len(resp) == 2
