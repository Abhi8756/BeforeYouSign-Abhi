# SMART CONTRACT SECURITY ANALYZER - ARCHITECTURE

**Correct Multi-Phase Architecture - Final Design**

---

## 🏗️ COMPLETE SYSTEM FLOW

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS TWO INPUTS                          │
│                                                                          │
│   1. PDF Whitepaper (whitepaper.pdf)                                   │
│   2. GitHub Repository URL (github.com/project/contracts)               │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           PHASE 2: PDF PARSER                            │
│                          (services/pdfParser.js)                         │
│                                                                          │
│  Input:  whitepaper.pdf                                                 │
│  Process:                                                                │
│    ├─ Extract text using pdf-parse library                             │
│    ├─ Detect sections (overview, tokenomics, team, etc.)              │
│    ├─ Clean text (remove page numbers, artifacts)                      │
│    └─ Structure data                                                    │
│  Output:                                                                 │
│    {                                                                     │
│      fullText: "complete whitepaper text...",                          │
│      sections: {                                                        │
│        overview: "text...",                                            │
│        tokenomics: "text...",                                          │
│        team: "text..."                                                  │
│      },                                                                  │
│      status: "ready_for_gemini_analysis"                               │
│    }                                                                     │
│                                                                          │
│  ❌ NO ANALYSIS HERE                                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      PHASE 3: GITHUB CODE FETCHER                        │
│                        (services/githubFetcher.js)                       │
│                                                                          │
│  Input:  https://github.com/OpenZeppelin/openzeppelin-contracts        │
│  Process:                                                                │
│    ├─ Authenticate with GitHub API                                     │
│    ├─ Fetch repository tree (recursive)                                │
│    ├─ Filter .sol files only                                           │
│    ├─ Skip test/script files                                           │
│    ├─ Download file contents (base64 decode)                           │
│    ├─ Categorize (contracts/interfaces/libraries)                      │
│    └─ Combine all code                                                  │
│  Output:                                                                 │
│    {                                                                     │
│      files: [                                                           │
│        {path: "Token.sol", content: "...", category: "contract"},     │
│        {path: "Vault.sol", content: "...", category: "contract"}      │
│      ],                                                                  │
│      combinedCode: "// All Solidity code combined...",                 │
│      status: "ready_for_gemini_analysis"                               │
│    }                                                                     │
│                                                                          │
│  ❌ NO ANALYSIS HERE                                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      PHASE 4: GEMINI AI ANALYZER                         │
│                       (services/geminiAnalyzer.js)                       │
│                                                                          │
│  Inputs:                                                                 │
│    • PDF text from Phase 2                                             │
│    • Solidity code from Phase 3                                        │
│                                                                          │
│  Process:                                                                │
│    ┌─────────────────────────────────────────────────────────┐        │
│    │ PROMPT ENGINEERING (Critical!)                          │        │
│    │                                                          │        │
│    │ You are an expert smart contract auditor.               │        │
│    │                                                          │        │
│    │ WHITEPAPER TEXT:                                        │        │
│    │ ${pdfData.fullText}                                     │        │
│    │                                                          │        │
│    │ SMART CONTRACT CODE:                                    │        │
│    │ ${githubData.combinedCode}                              │        │
│    │                                                          │        │
│    │ ANALYZE:                                                │        │
│    │ 1. Cross-validate PDF claims vs code reality           │        │
│    │    Example: PDF says "Team: 20%"                       │        │
│    │             Code shows teamAlloc = 45%                 │        │
│    │             → DISCREPANCY DETECTED                      │        │
│    │                                                          │        │
│    │ 2. Find security vulnerabilities                       │        │
│    │    - Reentrancy attacks                                │        │
│    │    - Integer overflow/underflow                        │        │
│    │    - Access control issues                             │        │
│    │    - Front-running risks                               │        │
│    │                                                          │        │
│    │ 3. Check code quality                                  │        │
│    │    - Missing validations                               │        │
│    │    - Centralization risks                              │        │
│    │    - Gas optimization                                   │        │
│    │                                                          │        │
│    │ 4. Calculate risk score (0-10)                         │        │
│    │                                                          │        │
│    │ OUTPUT FORMAT: JSON                                     │        │
│    └─────────────────────────────────────────────────────────┘        │
│                                                                          │
│  Gemini 2.0 Flash Response:                                             │
│    {                                                                     │
│      "discrepancies": [                                                 │
│        {                                                                │
│          "type": "allocation_mismatch",                                │
│          "severity": "HIGH",                                           │
│          "pdfClaim": "Team: 20%",                                      │
│          "codeReality": "Team: 45%",                                   │
│          "impact": "Team can dump and crash price"                     │
│        }                                                                │
│      ],                                                                  │
│      "vulnerabilities": [                                               │
│        {                                                                │
│          "type": "reentrancy",                                         │
│          "severity": "CRITICAL",                                       │
│          "location": "Vault.sol:withdraw()",                           │
│          "description": "Sends ETH before state update"                │
│        }                                                                │
│      ],                                                                  │
│      "riskScore": {                                                     │
│        "overall": 2.5,                                                 │
│        "classification": "HIGH-RISK"                                   │
│      },                                                                  │
│      "summary": "Critical issues found. Not recommended."              │
│    }                                                                     │
│                                                                          │
│  ✅ ALL ANALYSIS HAPPENS HERE                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     PHASE 5: FINAL RISK ASSESSMENT                       │
│                       (services/riskScorer.js)                           │
│                                                                          │
│  Takes Gemini's analysis and:                                           │
│    ├─ Validates consistency                                            │
│    ├─ Applies business rules                                           │
│    ├─ Generates final classification                                   │
│    └─ Creates human-readable report                                    │
│                                                                          │
│  Final Output:                                                           │
│    {                                                                     │
│      trustScore: 2.5,                                                   │
│      classification: "HIGH-RISK",                                       │
│      recommendation: "DO NOT INVEST - Critical vulnerabilities",       │
│      detailedReport: "..."                                             │
│    }                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          RETURN TO USER                                  │
│                                                                          │
│  {                                                                       │
│    "success": true,                                                     │
│    "analysis": {                                                        │
│      "trustScore": 2.5,                                                │
│      "classification": "HIGH-RISK",                                    │
│      "discrepancies": [...],                                           │
│      "vulnerabilities": [...],                                         │
│      "recommendation": "DO NOT INVEST"                                 │
│    }                                                                     │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 KEY ARCHITECTURE PRINCIPLES

### 1. Separation of Concerns
```
Phase 2: Extract PDF data ───┐
                              ├─→ Phase 4: Gemini analyzes everything
Phase 3: Extract GitHub code ─┘
```

**Each phase has ONE job:**
- Phase 2: Get text from PDF
- Phase 3: Get code from GitHub
- Phase 4: Analyze both (AI does the thinking)

### 2. Single Source of Truth
```
❌ OLD (Wrong):
PDF Parser → Analyze tokenomics     ┐
GitHub Fetcher → Analyze code        ├─ Multiple analyzers (inconsistent)
Gemini → Also analyze                ┘

✅ NEW (Correct):
PDF Parser → Extract data            ┐
GitHub Fetcher → Extract code        ├─ Gemini analyzes ONCE (consistent)
Gemini → ONLY analyzer               ┘
```

### 3. AI-First Design
```
Don't replicate AI logic in code:

❌ PDF Parser detects "excessive team allocation"
❌ PDF Parser calculates trust score
❌ PDF Parser flags red flags

✅ PDF Parser extracts "Team: 20%" text
✅ GitHub Fetcher extracts "teamAlloc = 45%" code
✅ Gemini AI compares and says "DISCREPANCY: 20% vs 45%"
```

---

## 🔄 DATA FLOW EXAMPLE

### Real-World Scenario:

**Input:**
- PDF says: "Team allocation: 20% with 2-year vesting"
- Code shows: `uint256 teamAllocation = 45;` (no vesting contract)

**Phase 2 Output:**
```javascript
{
  sections: {
    tokenomics: "Team allocation: 20% with 2-year vesting..."
  }
}
```

**Phase 3 Output:**
```javascript
{
  files: [{
    path: "Token.sol",
    content: "contract Token {\n  uint256 teamAllocation = 45;\n  ...\n}"
  }]
}
```

**Phase 4 (Gemini) Output:**
```javascript
{
  discrepancies: [
    {
      type: "allocation_mismatch",
      severity: "HIGH",
      pdfClaim: "Team allocation: 20%",
      codeReality: "Team gets 45% (line 23 in Token.sol)",
      discrepancyValue: 25,  // 45% - 20% = 25% extra
      impact: "Team controls 225% more tokens than disclosed",
      verdict: "CRITICAL MISREPRESENTATION"
    },
    {
      type: "vesting_missing",
      severity: "HIGH",
      pdfClaim: "2-year vesting period",
      codeReality: "No vesting contract or timelock found",
      impact: "Team can dump all tokens immediately"
    }
  ],
  riskScore: {
    overall: 1.5,
    classification: "HIGH-RISK"
  },
  summary: "Project whitepaper contains false claims. Team allocation is 45% not 20%. No vesting mechanism implemented. HIGH RISK OF RUG PULL."
}
```

---

## 🎯 WHY THIS ARCHITECTURE IS CORRECT

### 1. Maintainability
- Each service is simple and focused
- Easy to test independently
- Easy to replace/upgrade components

### 2. Scalability
- Can add more data sources (Twitter, Discord, etc.)
- All feed into Gemini
- Gemini output format stays consistent

### 3. Accuracy
- Gemini has full context (PDF + code + metadata)
- Makes holistic decisions
- Detects subtle patterns humans/regex miss

### 4. Flexibility
- Change PDF parser without touching Gemini
- Change Gemini prompt without touching extractors
- Add new analysis rules by updating prompt only

---

## 📁 PROJECT STRUCTURE

```
smart-contract-agent/
│
├── services/
│   ├── pdfParser.js           ← Phase 2: Extract PDF text
│   ├── githubFetcher.js       ← Phase 3: Fetch GitHub code
│   ├── geminiAnalyzer.js      ← Phase 4: AI analysis
│   └── riskScorer.js          ← Phase 5: Final scoring
│
├── Phases/
│   ├── Phase-1: Project Setup.md
│   ├── Phase-2: PDF Parser.md
│   ├── Phase-3-Implementation-Guide.md  ← NEW
│   └── Phase-4-Implementation-Guide.md  ← NEW
│
├── tests/
│   ├── pdfParser-simplified.test.js     ← NEW
│   ├── githubFetcher.test.js           ← Phase 3
│   └── geminiAnalyzer.test.js          ← Phase 4
│
├── server.js                  ← API endpoint
├── .env                       ← API keys (GEMINI_API_KEY, GITHUB_TOKEN)
└── README.md
```

---

## ✅ CURRENT STATUS

**Phase 1:** ✅ Complete - Server setup, validation, logging
**Phase 2:** ✅ Complete - PDF extraction and structuring (simplified)
**Phase 3:** 📋 Guide created - Ready to implement
**Phase 4:** 📋 Guide created - Ready to implement
**Phase 5:** ⏸️  Waiting for Phase 4 completion

---

## 🚀 NEXT STEPS

1. **Implement Phase 3** (3-4 hours)
   - Create `services/githubFetcher.js`
   - Follow `Phase-3-Implementation-Guide.md`
   - Test with real GitHub repositories

2. **Implement Phase 4** (4-5 hours)
   - Create `services/geminiAnalyzer.js`
   - Follow `Phase-4-Implementation-Guide.md`
   - Engineer the perfect prompt
   - Test with known safe/scam projects

3. **Implement Phase 5** (2-3 hours)
   - Create final risk scoring logic
   - Generate comprehensive reports
   - Add confidence metrics

---

**Document Version:** 1.0  
**Last Updated:** February 8, 2026  
**Status:** Architecture finalized and documented
