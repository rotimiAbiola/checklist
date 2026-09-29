from app.main import get_allowed_origins


def test_default_allowed_origins_when_env_unset(monkeypatch):
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
    assert get_allowed_origins() == ["http://localhost:5173", "http://127.0.0.1:5173"]


def test_allowed_origins_from_env_var(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://checkpoint.vercel.app, https://foo.example.com")
    assert get_allowed_origins() == [
        "https://checkpoint.vercel.app",
        "https://foo.example.com",
    ]


def test_allowed_origins_ignores_blank_entries(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://a.example.com,, https://b.example.com,")
    assert get_allowed_origins() == ["https://a.example.com", "https://b.example.com"]
