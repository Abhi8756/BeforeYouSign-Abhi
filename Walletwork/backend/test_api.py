from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_analyze_risk_high():
    # Test high risk scenario (approve + bad contract + 0x000 wallet)
    payload = {
        "wallet": "0x0001234567890123456789012345678901234567",
        "contract": "0xdeadbeef12345678901234567890123456789012",
        "tx_type": "approve"
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Score calculation:
    # approve: +40
    # contract "dead": +30
    # wallet "0x000": +20
    # Total: 90 -> HIGH_RISK
    assert data["score"] == 90
    assert data["risk"] == "HIGH_RISK"
    assert "reasons" in data
    assert len(data["reasons"]) == 3

def test_analyze_risk_safe():
    # Test safe scenario (send only)
    payload = {
        "wallet": "0x1234567890123456789012345678901234567890",
        "contract": "0x1234567890123456789012345678901234567890",
        "tx_type": "send"
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Score calculation:
    # send: +15
    # Total: 15 -> SAFE
    assert data["score"] == 15
    assert data["risk"] == "SAFE"

if __name__ == "__main__":
    try:
        test_health()
        test_analyze_risk_high()
        test_analyze_risk_safe()
        print("All tests passed!")
    except AssertionError as e:
        print(f"Test failed: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
