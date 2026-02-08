# SMART CONTRACT SECURITY ANALYSIS AGENT - PROJECT OVERVIEW

## 🎯 PROBLEM STATEMENT

Blockchain networks face growing threats from:
- Scam tokens with malicious code
- Phishing wallet interactions
- Malicious smart contract calls
- Rug pulls and honeypot schemes

**Current Gap:** Users lack an automated way to assess risk before signing transactions or investing in new tokens. By the time fraud is detected, funds are already compromised.

---

## 💡 OUR SOLUTION

A two-tier security system:

### Tier 1: Transaction Risk Classifier
- ML model analyzes wallet activity, token metadata, and transaction patterns
- Predicts risk levels: "SAFE" / "SUSPICIOUS" / "HIGH-RISK"
- Real-time warnings before transaction signing

### Tier 2: AI-Powered Smart Contract Auditor (THIS PROJECT)
**When a smart contract is involved:**
1. Accepts PDF whitepaper/documentation
2. Accepts GitHub repository link containing contract code
3. AI Agent analyzes both sources for vulnerabilities and inconsistencies
4. Detects security loopholes, backdoors, and rug pull patterns
5. Generates comprehensive risk report

**Key Innovation:** Cross-validation between what the project claims (PDF) and what the code actually does (GitHub)

---

## 🏗️ MY COMPONENT: AI AGENT FOR SMART CONTRACT ANALYSIS

### What I'm Building
An intelligent backend API service that:
- Extracts and parses PDF whitepaper content
- Fetches smart contract code from GitHub repositories
- Performs deep security analysis using AI
- Identifies vulnerabilities, backdoors, and malicious patterns
- Cross-validates claims vs. actual code implementation
- Returns structured risk assessment report

### Input Requirements
1. **PDF File** (Whitepaper/Documentation)
   - Project overview and promises
   - Tokenomics details
   - Team information
   - Technical architecture claims

2. **GitHub Repository URL**
   - Must contain `/contracts` folder with Solidity files
   - Standard structure:
     ```
     project-name/
     ├── contracts/          ← Main smart contracts (.sol)
     ├── interfaces/         ← Interface definitions
     ├── libraries/          ← Helper libraries
     ├── scripts/            ← Deployment scripts
     ├── test/              ← Test files
     ├── hardhat.config.js  ← Config files
     └── README.md
     ```

### Output Delivered
JSON response containing:
- Overall risk level: SAFE / SUSPICIOUS / HIGH-RISK
- Numerical risk score (0-100)
- List of vulnerabilities with severity levels
- Line-by-line code issues
- PDF vs Code discrepancy analysis
- Exploitation scenarios
- Remediation recommendations

---

## 🛠️ TECH STACK

### Core Technologies
- **Runtime:** Node.js
- **Framework:** Express.js
- **AI Model:** Google Gemini 2.5 Flash
- **Testing:** Postman

### Dependencies
```json
{
  "express": "^4.18.2",           // Web server framework
  "multer": "^1.4.5",             // File upload handling
  "cors": "^2.8.5",               // Cross-origin requests
  "axios": "^1.6.0",              // HTTP client for GitHub API
  "pdf-parse": "^1.1.1",          // PDF text extraction
  "@google/generative-ai": "^0.1.3",  // Gemini AI SDK
  "dotenv": "^16.3.1"             // Environment variables
}
```

### External APIs
- **GitHub REST API** - Fetch repository contents
- **Google Gemini API** - AI-powered code analysis

---

## 🔄 PROCESSING PIPELINE

### Step 1: PDF Processing
```
Upload PDF → pdf-parse library → Extract text
→ Identify sections (Tokenomics, Team, Technical)
→ Parse key claims and promises
→ Extract token distribution data
→ Store structured data
```

**Key Extractions:**
- Team transparency indicators
- Token allocation percentages
- Vesting/lock-up period claims
- Audit mentions
- Technical promises

### Step 2: GitHub Code Extraction
```
GitHub URL → Parse owner/repo → GitHub API call
→ Get repository tree (recursive)
→ Filter .sol files in /contracts folder
→ Download each file (base64 decode)
→ Organize by type (contracts/interfaces/libraries)
→ Build dependency map
```

**GitHub API Endpoints Used:**
```
GET /repos/{owner}/{repo}/git/trees/main?recursive=1
GET /repos/{owner}/{repo}/contents/{path}
```

### Step 3: AI-Powered Security Analysis

**3a. Static Code Analysis**
- Parse Solidity syntax
- Extract: functions, modifiers, state variables, events
- Map access control patterns
- Identify external calls and interactions

**3b. Vulnerability Detection Patterns**
```javascript
Checks for:
✓ Reentrancy vulnerabilities (external calls before state updates)
✓ Integer overflow/underflow (Solidity < 0.8)
✓ Access control issues (missing onlyOwner, public sensitive functions)
✓ Unchecked external calls (.call, .send, .delegatecall)
✓ Centralization risks (single admin, no multisig)
✓ Rug pull indicators (unlimited mint, pause functions)
✓ Honeypot patterns (hidden transfer blocks, blacklist mechanisms)
✓ Timestamp dependence (block.timestamp manipulation)
✓ Gas limit issues (unbounded loops)
✓ Delegatecall to untrusted contracts
```

**3c. Gemini AI Deep Analysis**
```
Prompt Structure:
───────────────
System Context: "You are an expert smart contract security auditor"

Input:
- Full contract code with line numbers
- Dependency files
- PDF whitepaper claims

Analysis Request:
"Analyze for vulnerabilities. For each issue found, provide:
 - Vulnerability type
 - Exact line number
 - Severity (Critical/High/Medium/Low)
 - Explanation of the flaw
 - Potential exploitation scenario
 - Recommended fix"

Output: Structured JSON with findings
```

### Step 4: Cross-Validation
```
PDF Claims ←→ Code Reality

Example Checks:
─────────────
PDF: "3% transaction tax"
Code: function transfer() → Check actual tax calculation

PDF: "Ownership will be renounced"
Code: Search for renounceOwnership() call

PDF: "Maximum supply capped at 1M"
Code: Check _maxSupply variable and mint restrictions

PDF: "Liquidity locked for 2 years"
Code: Verify timelock contract integration
```

**Discrepancy Detection:**
```javascript
if (pdfClaim !== codeReality) {
  riskLevel = "HIGH-RISK";
  flaggedIssues.push({
    type: "CLAIM_MISMATCH",
    severity: "CRITICAL",
    description: "Whitepaper claims don't match code implementation"
  });
}
```

### Step 5: Risk Scoring Algorithm
```
Base Score: 100 points

Deductions:
───────────
Critical vulnerability:  -40 points
High severity issue:     -20 points
Medium severity issue:   -10 points
Low severity issue:      -5 points
PDF/Code mismatch:       -30 points
No audit mentioned:      -10 points
Anonymous team:          -15 points
Excessive centralization: -20 points

Final Classification:
────────────────────
80-100 points → SAFE ✅
50-79 points  → SUSPICIOUS ⚠️
0-49 points   → HIGH-RISK 🚨
```

---

## 🌐 API ENDPOINTS

### 1. Full Analysis (PDF + GitHub)
```http
POST /api/analyze

Headers:
Content-Type: multipart/form-data

Body:
- pdf: [file] (required)
- githubRepo: string (required)

Example:
githubRepo = "https://github.com/owner/token-contract"
```

### 2. Quick Analysis (GitHub Only)
```http
POST /api/analyze/quick

Headers:
Content-Type: application/json

Body:
{
  "githubRepo": "https://github.com/owner/token-contract"
}
```

### 3. Health Check
```http
GET /health

Response:
{
  "status": "OK",
  "message": "Smart Contract Analyzer API is running"
}
```

---

## 📊 RESPONSE FORMAT

```json
{
  "success": true,
  "analysis": {
    "riskLevel": "SUSPICIOUS",
    "riskScore": 65,
    "summary": "Contract has centralization risks and access control issues",
    
    "vulnerabilities": [
      {
        "id": "VULN-001",
        "type": "Access Control",
        "severity": "HIGH",
        "file": "Token.sol",
        "line": 45,
        "code": "function mint(uint256 amount) public {",
        "description": "Minting function lacks access control - anyone can mint tokens",
        "exploitation": "Attacker can call mint() to create unlimited tokens, causing hyperinflation",
        "recommendation": "Add onlyOwner modifier: function mint(uint256 amount) public onlyOwner"
      },
      {
        "id": "VULN-002",
        "type": "Reentrancy",
        "severity": "CRITICAL",
        "file": "Vault.sol",
        "line": 78,
        "code": "msg.sender.call{value: amount}(\"\");",
        "description": "External call made before state update - reentrancy vulnerability",
        "exploitation": "Attacker can recursively call withdraw() to drain contract",
        "recommendation": "Update state before external call or use ReentrancyGuard"
      }
    ],
    
    "pdfAnalysis": {
      "teamTransparency": 7,
      "tokenomicsFairness": 5,
      "technicalFeasibility": 8,
      "auditMentioned": false,
      "redFlags": [
        "Team allocation is 45% of total supply",
        "No vesting period mentioned",
        "No third-party audit referenced"
      ]
    },
    
    "codeAnalysis": {
      "filesAnalyzed": 5,
      "contractsFound": ["Token.sol", "Vault.sol", "Governance.sol"],
      "totalLines": 847,
      "solidityVersion": "^0.8.0",
      "externalDependencies": ["@openzeppelin/contracts"],
      "complexityScore": 6.5,
      "vulnerabilityCount": {
        "critical": 1,
        "high": 2,
        "medium": 3,
        "low": 1
      }
    },
    
    "crossValidation": {
      "claimsVerified": 5,
      "claimsMismatched": 2,
      "discrepancies": [
        {
          "claim": "Maximum supply is capped at 1,000,000 tokens",
          "reality": "No maximum supply cap found in code - unlimited minting possible",
          "severity": "CRITICAL"
        }
      ]
    },
    
    "recommendations": [
      "Implement comprehensive access control with role-based permissions",
      "Add reentrancy guards to all withdrawal functions",
      "Set and enforce maximum token supply cap",
      "Get third-party security audit before mainnet deployment",
      "Implement timelock for critical admin functions"
    ],
    
    "timestamp": "2024-02-08T10:30:00Z",
    "processingTime": "45.2s"
  }
}
```

---

## 🔐 ENVIRONMENT VARIABLES

Create `.env` file:
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_personal_access_token  # Optional, for higher rate limits

# Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads

# Analysis Configuration
MAX_CONTRACT_SIZE=50000  # Max lines per contract
ANALYSIS_TIMEOUT=120000  # 2 minutes in milliseconds
```

---

## 📁 PROJECT STRUCTURE

```
smart-contract-analyzer/
│
├── server.js                 # Main Express server
├── .env                      # Environment variables
├── package.json              # Dependencies
│
├── services/
│   ├── analyzer.js           # Main orchestration logic
│   ├── pdfParser.js          # PDF extraction service
│   ├── githubFetcher.js      # GitHub API interactions
│   ├── geminiAnalyzer.js     # AI analysis with Gemini
│   ├── vulnerabilityDetector.js  # Pattern matching for common issues
│   └── riskScorer.js         # Risk calculation algorithm
│
├── utils/
│   ├── validators.js         # Input validation
│   ├── errorHandler.js       # Centralized error handling
│   └── logger.js             # Logging utility
│
├── uploads/                  # Temporary PDF storage
├── cache/                    # Optional: Cache GitHub responses
│
├── tests/
│   ├── api.test.js           # API endpoint tests
│   └── analyzer.test.js      # Analysis logic tests
│
└── docs/
    ├── API.md                # API documentation
    └── VULNERABILITIES.md    # List of detectable vulnerabilities
```

---

## 🚀 HOW TO RUN

### Installation
```bash
# Clone repository
git clone <repo-url>
cd smart-contract-analyzer

# Install dependencies
npm install

# Create uploads directory
mkdir uploads

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Test with Postman
```bash
1. Open Postman
2. Create new POST request to http://localhost:3000/api/analyze
3. Set Body type to form-data
4. Add fields:
   - pdf: [Select PDF file]
   - githubRepo: https://github.com/example/contract
5. Send request
6. Receive analysis JSON response
```

---

## 🎯 USE CASES

1. **Individual Investors**
   - Check new token contracts before buying
   - Verify project legitimacy before investment

2. **DeFi Protocols**
   - Automated security screening for listed tokens
   - Pre-integration risk assessment

3. **Wallets (MetaMask, Trust Wallet)**
   - Real-time contract analysis before transaction signing
   - Warning system for high-risk interactions

4. **Audit Firms**
   - Automated first-pass vulnerability detection
   - Supplement to manual audit process

5. **Blockchain Explorers**
   - Display security scores for verified contracts
   - Community-driven security ratings

---

## 🔮 FUTURE ENHANCEMENTS

- [ ] Support for multiple blockchain networks (BSC, Polygon, Avalanche)
- [ ] Historical vulnerability database
- [ ] Machine learning model for pattern recognition
- [ ] Browser extension for instant analysis
- [ ] Integration with blockchain explorers (Etherscan API)
- [ ] Automated report generation (PDF format)
- [ ] Webhook notifications for high-risk detections
- [ ] Multi-language support (Python, Go contracts)

---

## 📚 KEY TECHNICAL CONCEPTS

### Vulnerability Categories We Detect

1. **Reentrancy**: Recursive call exploits
2. **Access Control**: Missing permission checks
3. **Integer Issues**: Overflow/underflow
4. **External Calls**: Unchecked return values
5. **Centralization**: Single point of failure
6. **Rug Pull Patterns**: Hidden backdoors
7. **Front-Running**: Transaction ordering exploits
8. **Gas Optimization**: Inefficient code patterns
9. **Logic Errors**: Business logic flaws
10. **Timestamp Dependence**: Block properties manipulation

### Analysis Techniques

- **Static Analysis**: Code structure examination
- **Pattern Matching**: Known vulnerability signatures
- **AI Semantic Analysis**: Context-aware understanding
- **Cross-Reference Validation**: Multi-source verification
- **Behavioral Prediction**: Exploit scenario modeling

---

## 📞 PROJECT DELIVERABLES

✅ RESTful API with 3 endpoints
✅ PDF parsing and content extraction
✅ GitHub repository code fetching
✅ AI-powered vulnerability detection
✅ Cross-validation logic
✅ Risk scoring algorithm
✅ JSON response formatting
✅ Error handling and logging
✅ Postman collection for testing
✅ Comprehensive documentation

---

## 🎓 LEARNING OUTCOMES

Through this project, I'm gaining expertise in:
- Node.js backend development
- RESTful API design
- AI/ML integration (Gemini)
- Blockchain security concepts
- Solidity smart contract analysis
- GitHub API interactions
- PDF processing techniques
- Vulnerability detection algorithms
- Cross-validation methodologies
- Risk assessment frameworks

---

## 📄 LICENSE & USAGE

This AI agent is part of a larger blockchain security platform aimed at protecting users from scams and malicious contracts. The system provides automated, real-time risk assessment to prevent financial losses before they occur.

---

END OF PROJECT PROMPT