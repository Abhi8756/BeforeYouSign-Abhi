from datetime import datetime
from typing import List

RISK_LEVELS = {
    "SAFE": (0, 30),
    "SUSPICIOUS": (31, 70),
    "HIGH_RISK": (71, 100),
}

def calculate_risk(wallet: str, contract: str, tx_type: str) -> dict:
    score = 0
    reasons = []

    # Transaction Type Rules
    if tx_type == "approve":
        score += 40
        reasons.append("High-risk transaction type: approve")
    elif tx_type == "swap":
        score += 25
        reasons.append("Medium-risk transaction type: swap")
    elif tx_type == "send":
        score += 15
        reasons.append("Standard transaction type: send")

    # Contract Heuristics
    contract_lower = contract.lower()
    if "dead" in contract_lower or "bad" in contract_lower:
        score += 30
        reasons.append("Suspicious keywords found in contract address")

    # Wallet Heuristics
    if wallet.lower().startswith("0x000"):
        score += 20
        reasons.append("Wallet pattern matches known bot/suspicious prefix")

    # Cap score at 100
    score = min(score, 100)

    # Determine Risk Label
    label = "SAFE"
    for risk_label, (low, high) in RISK_LEVELS.items():
        if low <= score <= high:
            label = risk_label
            break

    return {
        "risk": label,
        "score": score,
        "reasons": reasons,
        "timestamp": datetime.utcnow().isoformat()
    }
