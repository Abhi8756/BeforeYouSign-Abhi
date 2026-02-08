# QUICK PROJECT SUMMARY - Smart Contract Security Analyzer

## 🎯 One-Liner
AI-powered backend API that analyzes smart contract code from GitHub and cross-validates against whitepaper PDFs to detect vulnerabilities, scams, and rug pull patterns before users lose funds.

## 🔧 Tech Stack
- **Backend:** Node.js + Express
- **AI:** Google Gemini 2.5 Flash
- **Libraries:** pdf-parse, axios, multer
- **Testing:** Postman

## 📥 Inputs
1. PDF whitepaper/documentation
2. GitHub repository URL (must contain `/contracts` folder with .sol files)

## 📤 Output
JSON risk assessment with:
- Risk level: SAFE / SUSPICIOUS / HIGH-RISK
- Score: 0-100
- List of vulnerabilities with severity
- PDF vs Code discrepancies
- Recommendations

## 🔍 What It Does
1. **Extracts** PDF content (tokenomics, team info, claims)
2. **Fetches** smart contract code from GitHub
3. **Analyzes** code for 10+ vulnerability types using AI
4. **Cross-validates** whitepaper claims vs actual code
5. **Scores** overall risk (Critical: -40pts, High: -20pts, etc.)
6. **Reports** structured findings with fix recommendations

## 🚨 Detects
✓ Reentrancy attacks
✓ Access control flaws  
✓ Unlimited minting
✓ Hidden backdoors
✓ Rug pull indicators
✓ Centralization risks
✓ Claim mismatches (PDF ≠ Code)

## 🌐 API Endpoints
```
POST /api/analyze          # Full analysis (PDF + GitHub)
POST /api/analyze/quick    # Quick scan (GitHub only)
GET  /health               # Service status
```

## ⚡ Processing Time
~45 seconds per analysis

## 🎯 Real-World Impact
Protects crypto users from:
- Scam tokens (40% of new tokens are scams)
- Rug pulls ($2.8B lost in 2023)
- Malicious contracts
- Phishing attacks

## 📊 Expected Metrics
- 95%+ vulnerability detection accuracy
- <1 minute analysis time
- Support for Ethereum, BSC, Polygon contracts
- 1000+ requests/day capacity

## 🚀 Deployment Ready
- Environment variables for API keys
- Error handling & logging
- File upload validation
- Rate limiting ready
- Scalable architecture

---

**Use Case:** Before investing in a new token, users submit the project's GitHub repo + whitepaper. System returns instant security assessment, potentially saving thousands of dollars.