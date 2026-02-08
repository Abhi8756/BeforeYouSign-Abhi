# PHASE 4: GEMINI AI INTEGRATION
**Duration:** 4-5 hours  
**Difficulty:** Hard ⭐⭐⭐⭐☆  
**Goal:** Integrate Gemini 2.0 Flash to analyze PDF + code and detect vulnerabilities

---

## 🎯 WHAT YOU'RE BUILDING

An AI-powered analysis engine that:
- Takes PDF whitepaper text (from Phase 2)
- Takes Solidity smart contract code (from Phase 3)
- Sends structured prompt to Gemini 2.0 Flash
- Receives AI analysis identifying:
  - **Discrepancies** (PDF promises vs code reality)
  - **Security vulnerabilities** (reentrancy, overflow, etc.)
  - **Code quality issues** (missing validations, centralization)
  - **Risk assessment** (final trust score)

**Real-world analogy:** Like hiring an expert security auditor who reads the whitepaper promises, then examines the actual code to find lies, bugs, and vulnerabilities.

---

## 📋 PHASE OBJECTIVES

### 1. Understand Gemini 2.0 Flash Capabilities

**Why Gemini 2.0 Flash:**
- **Lightning fast:** 2-3 second responses (vs GPT-4's 10-15 seconds)
- **Long context:** 1 million tokens (can analyze entire codebases)
- **Cost effective:** $0.30 per 1M input tokens
- **Code understanding:** Trained on code, excellent for Solidity
- **Structured output:** Can return JSON reliably

**What Gemini will analyze:**

1. **Cross-Validation (PDF vs Code):**
   - PDF: "Team allocation: 20%"  
   - Code: `teamAllocation = 45%`  
   - **AI Detection:** "Discrepancy - team gets 45% not 20%"

2. **Security Vulnerabilities:**
   - Reentrancy attacks
   - Integer overflow/underflow
   - Access control issues
   - Denial of service vectors
   - Front-running vulnerabilities

3. **Code Quality:**
   - Missing input validation
   - Centralization risks (single owner control)
   - Upgradability concerns
   - Gas optimization issues

4. **Tokenomics Verification:**
   - PDF: "3% transaction tax"  
   - Code: `uint256 taxRate = 5%`  
   - **AI Detection:** "Tax rate is 5%, not 3% as claimed"

---

### 2. Gemini API Setup (15 min)

**Get API Key:**

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Get API Key"
3. Create new key or use existing
4. Copy key (starts with `AIza...`)

**Store in `.env`:**

```bash
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Install SDK:**

```bash
npm install @google/generative-ai
```

**Initialize in code:**

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
```

---

### 3. Prompt Engineering - The Critical Part (90 min)

**This is the most important section.** The prompt determines the quality of Gemini's analysis.

**Prompt Structure:**

```javascript
const prompt = `
You are an expert smart contract security auditor analyzing a cryptocurrency project.

=== YOUR TASK ===
1. Read the whitepaper text (PDF content)
2. Read the Solidity smart contract code
3. Cross-validate: Compare PDF promises vs code reality
4. Identify security vulnerabilities
5. Detect code quality issues
6. Calculate final risk score

=== WHITEPAPER TEXT (FROM PDF) ===
${pdfData.fullText}

=== WHITEPAPER SECTIONS ===
Overview: ${pdfData.sections.overview}
Tokenomics: ${pdfData.sections.tokenomics}
Team: ${pdfData.sections.team}
Technical: ${pdfData.sections.technical}

=== SMART CONTRACT CODE ===
${githubData.combinedCode}

=== ANALYSIS INSTRUCTIONS ===

**1. CROSS-VALIDATION (PDF vs CODE):**
Compare these claims:
- Token allocation percentages (team, public, ecosystem)
- Transaction tax/fee percentages
- Total supply numbers
- Vesting schedules mentioned
- Burning mechanisms mentioned
- Security audits claimed

For each claim, check:
- Does the code match what PDF says?
- If not, what's the ACTUAL value in code?
- How severe is this discrepancy?

**2. SECURITY VULNERABILITIES:**
Check for:
- Reentrancy attacks (external calls before state changes)
- Integer overflow/underflow (especially pre-0.8.0 Solidity)
- Access control issues (missing onlyOwner, public functions that should be private)
- Denial of service vectors
- Front-running vulnerabilities
- Unchecked external calls
- Timestamp dependence
- Delegate call to untrusted contracts

**3. CODE QUALITY ISSUES:**
Check for:
- Missing input validation (zero addresses, zero amounts)
- Centralization risks (single owner can drain funds, pause forever)
- Upgradability concerns (proxy patterns, admin keys)
- Missing events for critical operations
- Gas optimization opportunities
- Code complexity and maintainability

**4. TOKENOMICS VERIFICATION:**
Extract from CODE (not PDF):
- Actual team allocation percentage
- Actual transaction tax percentage
- Actual total supply
- Vesting logic present? (timelock contracts)
- Burn mechanism implemented?
- Mint function present? (unlimited supply risk)

=== OUTPUT FORMAT (STRICT JSON) ===

Return your analysis as JSON:

{
  "discrepancies": [
    {
      "type": "allocation_mismatch",
      "severity": "HIGH",
      "pdfClaim": "Team: 20%",
      "codeReality": "Team: 45%",
      "description": "Team allocation is 45% in code, but whitepaper claims 20%",
      "impact": "Team can dump tokens and crash price"
    }
  ],
  
  "vulnerabilities": [
    {
      "type": "reentrancy",
      "severity": "CRITICAL",
      "location": "contracts/Vault.sol:withdraw()",
      "description": "Withdraw function sends ETH before updating balance",
      "exploit": "Attacker can recursively call withdraw() and drain contract",
      "codeSnippet": "payable(msg.sender).call{value: amount}(\\"\\"); balance[msg.sender] -= amount;"
    }
  ],
  
  "codeQualityIssues": [
    {
      "type": "centralization",
      "severity": "MEDIUM",
      "description": "Owner can pause contract forever with no timelock",
      "location": "contracts/Token.sol:pause()",
      "recommendation": "Implement timelock mechanism or DAO governance"
    }
  ],
  
  "tokenomicsVerification": {
    "totalSupply": {
      "pdfClaim": "1,000,000,000",
      "codeReality": "1,000,000,000",
      "match": true
    },
    "teamAllocation": {
      "pdfClaim": "20%",
      "codeReality": "45%",
      "match": false
    },
    "transactionTax": {
      "pdfClaim": "3%",
      "codeReality": "5%",
      "match": false
    },
    "vestingImplemented": false,
    "burnMechanismImplemented": false,
    "unlimitedMinting": true
  },
  
  "riskScore": {
    "overall": 2.5,
    "breakdown": {
      "pdfCodeAlignment": 3,
      "securityScore": 1,
      "codeQualityScore": 4,
      "tokenomicsScore": 2
    },
    "classification": "HIGH-RISK"
  },
  
  "summary": "This project has critical security vulnerabilities and major discrepancies between whitepaper and code. Team allocation is 45% not 20% as claimed. Reentrancy vulnerability in withdraw function allows contract draining. Not recommended."
}

=== IMPORTANT ===
- Be thorough but concise
- Focus on HIGH and CRITICAL severity issues
- Provide code snippets for vulnerabilities
- Calculate risk score: 0-10 (0=scam, 10=safe)
- Classification: SAFE (8-10), SUSPICIOUS (4-7), HIGH-RISK (0-3)
`;
```

---

### 4. Send Request to Gemini (30 min)

**Implementation:**

```javascript
async function analyzeWithGemini(pdfData, githubData) {
  try {
    log.info('Sending data to Gemini AI for analysis');
    
    // Build the prompt
    const prompt = buildPrompt(pdfData, githubData);
    
    // Configure generation
    const generationConfig = {
      temperature: 0.3,  // Lower = more focused/deterministic
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,  // Allow detailed response
    };
    
    // Send to Gemini
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig
    });
    
    const response = result.response;
    const text = response.text();
    
    log.info('Gemini analysis received', { 
      responseLength: text.length 
    });
    
    return text;
    
  } catch (error) {
    log.error('Gemini analysis failed', { error: error.message });
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}
```

**Error handling:**

```javascript
// Handle rate limits
if (error.message.includes('429') || error.message.includes('quota')) {
  throw new Error('Gemini API rate limit exceeded. Please try again in 1 minute.');
}

// Handle invalid API key
if (error.message.includes('401') || error.message.includes('API key')) {
  throw new Error('Invalid Gemini API key. Please check GEMINI_API_KEY in .env file.');
}

// Handle timeout
if (error.message.includes('timeout')) {
  throw new Error('Gemini analysis timed out. Code may be too large.');
}
```

---

### 5. Parse Gemini Response (45 min)

**Gemini returns text, we need JSON:**

```javascript
function parseGeminiResponse(responseText) {
  try {
    // Remove markdown code blocks if present
    let cleaned = responseText.trim();
    
    // Remove ```json and ``` if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    // Parse JSON
    const parsed = JSON.parse(cleaned);
    
    // Validate structure
    if (!parsed.discrepancies || !parsed.vulnerabilities) {
      throw new Error('Invalid response structure from Gemini');
    }
    
    return parsed;
    
  } catch (error) {
    log.error('Failed to parse Gemini response', { error: error.message });
    
    // Fallback: Return raw text if JSON parsing fails
    return {
      success: false,
      error: 'Failed to parse AI response as JSON',
      rawResponse: responseText,
      discrepancies: [],
      vulnerabilities: [],
      riskScore: { overall: 0, classification: 'UNKNOWN' }
    };
  }
}
```

---

### 6. Structure Final Output (30 min)

**Combine all analysis results:**

```javascript
async function performFullAnalysis(pdfPath, githubUrl) {
  // Phase 2: PDF extraction
  const pdfData = await analyzePdf(pdfPath);
  
  // Phase 3: GitHub code extraction
  const githubData = await fetchGithubCode(githubUrl);
  
  // Phase 4: Gemini AI analysis
  const geminiResponse = await analyzeWithGemini(pdfData, githubData);
  const geminiAnalysis = parseGeminiResponse(geminiResponse);
  
  // Combine everything
  const finalResult = {
    metadata: {
      analyzedAt: new Date().toISOString(),
      pdfFile: pdfData.metadata.fileName,
      githubRepo: githubData.metadata.repository,
      totalCodeFiles: githubData.metadata.totalFiles,
      aiModel: 'gemini-2.0-flash'
    },
    
    pdfExtraction: {
      pages: pdfData.metadata.pages,
      sectionsFound: pdfData.metadata.sectionsFound,
      textLength: pdfData.metadata.textLength
    },
    
    codeExtraction: {
      repository: githubData.metadata.repository,
      filesAnalyzed: githubData.metadata.totalFiles,
      totalLines: githubData.metadata.totalLines
    },
    
    aiAnalysis: {
      discrepancies: geminiAnalysis.discrepancies,
      vulnerabilities: geminiAnalysis.vulnerabilities,
      codeQualityIssues: geminiAnalysis.codeQualityIssues,
      tokenomicsVerification: geminiAnalysis.tokenomicsVerification,
      riskScore: geminiAnalysis.riskScore,
      summary: geminiAnalysis.summary
    },
    
    finalVerdict: {
      trustScore: geminiAnalysis.riskScore.overall,
      classification: geminiAnalysis.riskScore.classification,
      recommendation: generateRecommendation(geminiAnalysis)
    }
  };
  
  return finalResult;
}
```

---

### 7. Generate Human-Readable Report (30 min)

**Create formatted summary:**

```javascript
function generateReport(analysis) {
  const { aiAnalysis, finalVerdict } = analysis;
  
  let report = '\\n=== SMART CONTRACT SECURITY ANALYSIS REPORT ===\\n\\n';
  
  // Overall verdict
  report += `RISK LEVEL: ${finalVerdict.classification}\\n`;
  report += `TRUST SCORE: ${finalVerdict.trustScore}/10\\n\\n`;
  
  // Critical findings
  const critical = aiAnalysis.vulnerabilities.filter(v => v.severity === 'CRITICAL');
  if (critical.length > 0) {
    report += `⚠️  CRITICAL VULNERABILITIES FOUND: ${critical.length}\\n`;
    critical.forEach(vuln => {
      report += `  - ${vuln.type}: ${vuln.description}\\n`;
      report += `    Location: ${vuln.location}\\n`;
    });
    report += '\\n';
  }
  
  // Discrepancies
  if (aiAnalysis.discrepancies.length > 0) {
    report += `⚠️  PDF-CODE DISCREPANCIES: ${aiAnalysis.discrepancies.length}\\n`;
    aiAnalysis.discrepancies.forEach(disc => {
      report += `  - ${disc.type}: ${disc.description}\\n`;
      report += `    PDF: ${disc.pdfClaim}\\n`;
      report += `    Code: ${disc.codeReality}\\n`;
    });
    report += '\\n';
  }
  
  // Summary
  report += `SUMMARY:\\n${aiAnalysis.summary}\\n\\n`;
  
  // Recommendation
  report += `RECOMMENDATION: ${finalVerdict.recommendation}\\n`;
  
  return report;
}

function generateRecommendation(analysis) {
  const score = analysis.riskScore.overall;
  const criticalVulns = analysis.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
  const highDiscrepancies = analysis.discrepancies.filter(d => d.severity === 'HIGH').length;
  
  if (criticalVulns > 0) {
    return 'DO NOT INVEST - Critical security vulnerabilities found. High risk of funds loss.';
  }
  
  if (highDiscrepancies > 2) {
    return 'DO NOT INVEST - Multiple major discrepancies between whitepaper and code. Likely scam.';
  }
  
  if (score >= 7) {
    return 'SAFE TO INVEST - Code quality is good, minimal issues found. Standard precautions apply.';
  }
  
  if (score >= 4) {
    return 'PROCEED WITH CAUTION - Some issues found. Invest only small amounts you can afford to lose.';
  }
  
  return 'HIGH RISK - Major issues found. Not recommended for investment.';
}
```

---

### 8. API Integration (20 min)

**Final `/api/analyze` endpoint:**

```javascript
app.post('/api/analyze', upload.single('whitepaper'), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const githubUrl = req.body.githubUrl;
    
    log.info('Starting full analysis', { pdfPath, githubUrl });
    
    // Perform complete analysis (Phase 2 + 3 + 4)
    const analysis = await performFullAnalysis(pdfPath, githubUrl);
    
    // Generate report
    const report = generateReport(analysis);
    
    // Clean up uploaded file
    setTimeout(() => {
      fs.unlinkSync(pdfPath);
    }, 2000);
    
    res.json({
      success: true,
      analysis: analysis,
      report: report
    });
    
  } catch (error) {
    log.error('Analysis failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## 🧪 TESTING PHASE 4

### Test 1: Known Safe Project

**Test with OpenZeppelin:**
```javascript
const result = await performFullAnalysis(
  'openzeppelin-whitepaper.pdf',
  'https://github.com/OpenZeppelin/openzeppelin-contracts'
);

// Expected:
// - High trust score (8-10)
// - No critical vulnerabilities
// - Minimal discrepancies
// - Classification: SAFE
```

### Test 2: Project with Discrepancy

**Create test PDF:**
- PDF says: "Team: 20%"
- Code has: 45% team allocation

**Expected AI output:**
```json
{
  "discrepancies": [{
    "type": "allocation_mismatch",
    "severity": "HIGH",
    "pdfClaim": "Team: 20%",
    "codeReality": "Team: 45%"
  }],
  "riskScore": { "overall": 3, "classification": "HIGH-RISK" }
}
```

### Test 3: Vulnerable Contract

**Test with intentionally vulnerable code:**
```solidity
// Reentrancy vulnerability
function withdraw() public {
    uint amount = balances[msg.sender];
    (bool success,) = msg.sender.call{value: amount}("");  // ❌ Sends before updating state
    balances[msg.sender] = 0;  // ❌ State change AFTER external call
}
```

**Expected: Gemini detects reentrancy vulnerability**

---

## ✅ COMPLETION CHECKLIST

**Core Functions:**
- [ ] Gemini API configured (key in .env)
- [ ] Prompt template created and tested
- [ ] analyzeWithGemini() function working
- [ ] Response parsing working (JSON extraction)
- [ ] Error handling for API failures
- [ ] Rate limit handling implemented

**Integration:**
- [ ] performFullAnalysis() combines all phases
- [ ] Final output structure defined
- [ ] Human-readable report generation
- [ ] API endpoint returns complete analysis

**Testing:**
- [ ] Tested with safe project (high score)
- [ ] Tested discrepancy detection
- [ ] Tested vulnerability detection
- [ ] Verified JSON parsing reliability

---

## 📊 EXPECTED FINAL OUTPUT

```javascript
{
  metadata: { analyzedAt: "2026-02-08T12:00:00Z", aiModel: "gemini-2.0-flash" },
  aiAnalysis: {
    discrepancies: [...],
    vulnerabilities: [...],
    riskScore: { overall: 3.5, classification: "HIGH-RISK" }
  },
  finalVerdict: {
    trustScore: 3.5,
    classification: "HIGH-RISK",
    recommendation: "DO NOT INVEST - Major discrepancies found"
  }
}
```

---

## 🚨 CRITICAL SUCCESS FACTORS

1. **Prompt Quality:** 80% of success depends on prompt engineering
2. **Context Limits:** Stay under 1M tokens (trim large codebases)
3. **JSON Reliability:** Always validate and have fallback parsing
4. **Error Handling:** Gemini can fail - handle gracefully
5. **Response Time:** Average 3-5 seconds per analysis

---

**Next Phase:** Phase 5 - Final cross-validation and risk scoring
