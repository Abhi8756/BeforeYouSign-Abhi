from pydantic import BaseModel, validator, Field
from typing import List, Literal

class AnalyzeRequest(BaseModel):
    wallet: str
    contract: str
    tx_type: Literal["approve", "swap", "send"]

    @validator("wallet", "contract")
    def validate_address(cls, v):
        if not v.startswith("0x"):
            raise ValueError("Address must start with 0x")
        if len(v) != 42:
            raise ValueError("Address must be 42 characters long")
        return v

class AnalyzeResponse(BaseModel):
    risk: str
    score: int
    reasons: List[str]
    timestamp: str
