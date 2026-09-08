import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["app"] == "Signal Clone Backend API"


def test_auth_users():
    res = client.get("/api/auth/users")
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 5
    assert any(u["display_name"] == "Pratham" for u in users)
    assert any(u["display_name"] == "Sarah Connor" for u in users)


def test_get_conversations():
    # Authenticate as user_me
    res = client.get("/api/conversations", headers={"X-User-Id": "user_me"})
    assert res.status_code == 200
    convs = res.json()
    assert len(convs) >= 3
    print("Found conversations:", [c["name"] for c in convs])


def test_send_and_react_message():
    # Send message to conv_sarah
    res = client.post(
        "/api/conversations/conv_sarah/messages",
        headers={"X-User-Id": "user_me"},
        json={"content": "Automated backend test message!", "type": "text"}
    )
    assert res.status_code == 200
    msg = res.json()
    assert msg["content"] == "Automated backend test message!"
    msg_id = msg["id"]

    # Toggle reaction
    react_res = client.post(
        f"/api/messages/{msg_id}/reactions",
        headers={"X-User-Id": "user_me"},
        json={"emoji": "🔥"}
    )
    assert react_res.status_code == 200
    reactions = react_res.json()
    assert any(r["emoji"] == "🔥" for r in reactions)


def test_mark_as_read():
    res = client.post(
        "/api/conversations/conv_sarah/read",
        headers={"X-User-Id": "user_sarah"}
    )
    assert res.status_code == 200


if __name__ == "__main__":
    test_root()
    test_auth_users()
    test_get_conversations()
    test_send_and_react_message()
    test_mark_as_read()
    print("All backend API tests passed successfully!")

