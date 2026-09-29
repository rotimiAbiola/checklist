import pytest


@pytest.fixture()
def seeded(client):
    client.post(
        "/api/todos",
        json={"title": "Write report", "priority": "high", "tags": ["work"]},
    )
    client.post(
        "/api/todos",
        json={"title": "Buy groceries", "priority": "low", "tags": ["home"]},
    )
    done = client.post(
        "/api/todos",
        json={"title": "Water plants", "priority": "medium", "tags": ["home"]},
    ).json()
    client.patch(f"/api/todos/{done['id']}", json={"completed": True})
    return client


def test_filter_by_completed(seeded):
    resp = seeded.get("/api/todos", params={"completed": True})
    assert [t["title"] for t in resp.json()] == ["Water plants"]

    resp = seeded.get("/api/todos", params={"completed": False})
    titles = {t["title"] for t in resp.json()}
    assert titles == {"Write report", "Buy groceries"}


def test_filter_by_priority(seeded):
    resp = seeded.get("/api/todos", params={"priority": "high"})
    assert [t["title"] for t in resp.json()] == ["Write report"]


def test_filter_by_tag(seeded):
    resp = seeded.get("/api/todos", params={"tag": "home"})
    titles = {t["title"] for t in resp.json()}
    assert titles == {"Buy groceries", "Water plants"}


def test_search_matches_title(seeded):
    resp = seeded.get("/api/todos", params={"search": "report"})
    assert [t["title"] for t in resp.json()] == ["Write report"]


def test_search_case_insensitive(seeded):
    resp = seeded.get("/api/todos", params={"search": "GROCERIES"})
    assert [t["title"] for t in resp.json()] == ["Buy groceries"]


def test_sort_by_title_desc(seeded):
    resp = seeded.get("/api/todos", params={"sort_by": "title", "order": "desc"})
    titles = [t["title"] for t in resp.json()]
    assert titles == sorted(titles, reverse=True)


def test_combined_filters(seeded):
    resp = seeded.get(
        "/api/todos", params={"completed": False, "tag": "home"}
    )
    assert [t["title"] for t in resp.json()] == ["Buy groceries"]
