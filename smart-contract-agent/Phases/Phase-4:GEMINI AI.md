# PHASE 4: GEMINI AI ANALYSIS
**Duration:** 4-5 hours  
**Difficulty:** Hard ⭐⭐⭐⭐⭐  
**Goal:** Use Google Gemini AI to perform deep security analysis of smart contracts

---

## 🎯 WHAT YOU'RE BUILDING

An AI-powered vulnerability scanner that:
- Takes Solidity contract code as input
- Uses Gemini AI to understand the code semantically
- Detects 15+ types of security vulnerabilities
- Explains each vulnerability in plain English
- Provides exploitation scenarios
- Suggests fixes with line numbers
- Calculates confidence scores

**Real-world analogy:** Like hiring an expert security auditor who reads every line of code and explains potential issues in detail.

---

## 📋 PHASE OBJECTIVES

### 1. Get Gemini API Key (10 min)

**Steps:**
1. Go to: https://makersuite.google.com/app/apikey
2. Create new API key (or use existing)
3. Copy the key (starts with `AIza...`)
4. Add to .env: `GEMINI_API_KEY=AIzaSy...`

**Model to use:**
- `gemini-2.0-flash-exp` or `gemini-1.5-flash` 
- Flash model is faster and cheaper
- Pro model is more accurate but slower/expensive

**Pricing (as of 2024):**
- Flash: $0.075 per 1M input tokens
- Your typical analysis: ~50,000 tokens
- Cost per analysis: ~$0.004 (less than half a cent!)

---

### 2. Understanding Gemini SDK (30 min - Learning)

**Install:**
```
npm install @google/generative-ai
```

**Basic flow:**
1. Import the SDK
2. Initialize with API key
3. Get model instance
4. Send prompt with context
5. Receive and parse response

**Important SDK concepts:**

**GenerationConfig:**
- `temperature`: 0-1 (lower = more focused, higher = more creative)
  - Use 0.1-0.3 for code analysis (want precision, not creativity)
- `maxOutputTokens`: Maximum response length
  - Set to 8000-16000 for detailed analysis
- `topP` and `topK`: Control randomness
  - Keep defaults for code analysis

**Safety Settings:**
- Can adjust what content is blocked
- For code analysis, set to permissive (analyzing malicious code isn't harmful)

**Streaming vs Non-streaming:**
- Streaming: Get response in chunks as AI generates
- Non-streaming: Wait for complete response
- Use non-streaming for MVP (simpler)

---

### 3. Prompt Engineering for Vulnerability Detection (90 min)

**This is the MOST IMPORTANT part of Phase 4.**

**Prompt structure:**

**Part 1: System Role**
Define who the AI is:
```
You are an expert Solidity smart contract security auditor with 10 years of experience.
You specialize in finding vulnerabilities in DeFi protocols, token contracts, and NFT projects.
You are thorough, precise, and always provide actionable recommendations.
```

**Part 2: Task Definition**
Explain what you want:
```
Analyze the following Solidity smart contract for security vulnerabilities.
For each vulnerability found, provide:
1. Vulnerability type
2. Exact line number(s)
3. Severity level (Critical/High/Medium/Low)
4. Clear explanation of the issue
5. Potential exploitation scenario
6. Recommended fix
```

**Part 3: Vulnerability Types to Check**
List specific vulnerabilities:

**1. Reentrancy Attacks**
- External calls before state updates
- Check patterns: `call`, `transfer`, `send` followed by state changes

**2. Integer Overflow/Underflow**
- For Solidity <0.8.0 without SafeMath
- Arithmetic operations without checks

**3. Access Control Issues**
- Missing modifiers (`onlyOwner`, `onlyAdmin`)
- Public functions that should be private/internal
- Unprotected initialization functions

**4. Unchecked External Calls**
- `.call()`, `.send()`, `.delegatecall()` without return value check
- Can fail silently

**5. Timestamp Dependence**
- Using `block.timestamp` for critical logic
- Miners can manipulate within ~15 seconds

**6. Gas Limit Issues**
- Unbounded loops that might exceed gas limit
- Arrays that grow without limit

**7. Delegatecall to Untrusted Contract**
- `delegatecall` executes code in caller's context
- Extremely dangerous if target is untrusted

**8. Tx.origin Authentication**
- Using `tx.origin` instead of `msg.sender`
- Vulnerable to phishing attacks

**9. Uninitialized Storage Pointers**
- Solidity <0.5.0 issue
- Can overwrite important state variables

**10. Front-Running Vulnerabilities**
- Transaction ordering dependence
- MEV (Miner Extractable Value) opportunities

**11. Denial of Service**
- Functions that can be blocked by attacker
- Revert loops, gas exhaustion

**12. Centralization Risks**
- Single admin with too much power
- No timelock on critical functions
- Ability to pause, freeze, or confiscate funds

**13. Logic Errors**
- Off-by-one errors
- Incorrect conditional logic
- Math errors in formulas

**14. Rug Pull Indicators**
- Hidden mint functions
- Backdoors for owner
- Ability to change critical parameters
- Withdrawal restrictions

**15. Outdated Patterns**
- Using deprecated functions
- Old Solidity versions with known bugs
- Not using modern best practices

**Part 4: Output Format**
Specify exact JSON structure:
```
Return your analysis as a valid JSON object with this structure:
{
  "vulnerabilities": [
    {
      "id": "VULN-001",
      "type": "Reentrancy",
      "severity": "Critical",
      "file": "Token.sol",
      "line": 45,
      "codeSnippet": "msg.sender.call{value: amount}(\"\");",
      "description": "...",
      "exploitation": "...",
      "recommendation": "...",
      "confidence": 0.95
    }
  ],
  "summary": {
    "totalVulnerabilities": 5,
    "criticalCount": 1,
    "highCount": 2,
    "mediumCount": 2,
    "lowCount": 0,
    "overallRisk": "High"
  }
}
```

**Part 5: Context (Actual Code)**
Include the contract code with line numbers:
```
File: contracts/Token.sol
─────────────────────────
1:  pragma solidity ^0.8.0;
2:  
3:  contract Token {
4:      mapping(address => uint256) public balances;
5:      
6:      function withdraw(uint256 amount) public {
7:          require(balances[msg.sender] >= amount);
8:          msg.sender.call{value: amount}("");
9:          balances[msg.sender] -= amount;
10:     }
11: }
```

**Best practices for prompts:**
- Be specific about what you want
- Provide examples of good output
- Use clear formatting (makes parsing easier)
- Include domain knowledge (what's normal vs suspicious)
- Request confidence scores (helps filter false positives)

---

### 4. Handling Multiple Files (30 min)

**Challenge:**
Most projects have multiple contract files. You can't send all 50 files in one prompt (token limit).

**Strategy 1: Analyze Per File**
- Send each contract separately to Gemini
- Combine results afterward
- Pro: Simple, no token limit issues
- Con: Misses cross-contract vulnerabilities

**Strategy 2: Analyze Critical Files in Detail**
- Prioritize main contracts over interfaces/libraries
- Send top 10 most important contracts
- Pro: Deeper analysis of critical code
- Con: Might miss issues in libraries

**Strategy 3: Smart Chunking**
- Group related contracts (e.g., Token + TokenSale)
- Analyze groups together
- Pro: Catches cross-contract issues
- Con: More complex logic

**Recommended:** Start with Strategy 1 (per-file), optimize later.

---

### 5. Response Parsing (45 min)

**Challenge:**
Gemini returns markdown text, not always perfect JSON.

**Response cleaning steps:**

**Step 1: Extract JSON**
AI might wrap JSON in markdown:
```
Here's the analysis:
```json
{ "vulnerabilities": [...] }
```
```

Need to:
- Remove markdown code fences (```json and ```)
- Trim whitespace
- Handle preamble text

**Step 2: Parse JSON**
Use try-catch for robust parsing:
- If parse fails, try cleaning
- If still fails, extract key info with regex
- Always have fallback structure

**Step 3: Validate Structure**
Check that response has:
- `vulnerabilities` array
- Each vulnerability has required fields
- Severity is one of: Critical/High/Medium/Low
- Line numbers are integers

**Step 4: Enrich Data**
Add metadata:
- Timestamp of analysis
- Model used
- Confidence scores
- File information

**Fallback for unparseable responses:**
If JSON parsing completely fails:
- Extract text descriptions with regex
- Create generic vulnerability objects
- Mark as "manual review needed"
- Don't crash the entire analysis

---

### 6. Confidence Scoring (20 min)

**Why needed:**
AI can have false positives. Confidence helps prioritize.

**Factors affecting confidence:**

**High confidence (0.8-1.0):**
- Clear vulnerability pattern matched
- Well-known exploit type
- Specific line identified
- Code context supports finding

**Medium confidence (0.5-0.7):**
- Suspicious pattern but might be safe
- Depends on other parts of code
- Could be false positive

**Low confidence (0.2-0.4):**
- Speculative finding
- Not enough context
- Style suggestion rather than vulnerability

**Use confidence scores to:**
- Sort vulnerabilities (show high confidence first)
- Set alert thresholds (only alert on >0.7 confidence)
- Guide manual review priorities

---

### 7. Analysis Caching (30 min)

**Why cache:**
- Gemini API costs money (small but adds up)
- Analysis takes 30-60 seconds
- Same repo might be checked multiple times

**What to cache:**
- Contract code (by file hash)
- Gemini analysis response
- Parsed vulnerabilities

**Cache key:**
Use SHA-256 hash of contract content:
```
hash("pragma solidity ^0.8.0; contract Token {...}")
= "abc123def456..."
```

**Cache structure:**
```
cache/gemini/abc123def456.json
{
  "contract": "Token.sol",
  "analyzed": "2024-02-08T10:30:00Z",
  "codeHash": "abc123def456",
  "analysis": { ... }
}
```

**Cache invalidation:**
- When contract code changes (different hash)
- After 7 days (AI models improve over time)
- When prompt template changes significantly

---

### 8. Error Handling (30 min)

**Common Gemini API errors:**

**1. API Key Invalid**
- Error: 400 or 401
- Solution: Check GEMINI_API_KEY in .env
- User message: "API configuration error"

**2. Rate Limit Exceeded**
- Error: 429
- Solution: Implement retry with exponential backoff
- Wait 1s, 2s, 4s, 8s before retrying

**3. Token Limit Exceeded**
- Error: 400 with "context_length_exceeded"
- Solution: Break into smaller chunks or summarize

**4. Model Not Available**
- Error: 404
- Solution: Fall back to different model version

**5. Timeout**
- No response within 60 seconds
- Solution: Cancel and retry, or return partial results

**6. Invalid Response Format**
- AI returns non-JSON
- Solution: Use fallback parsing, extract key info

**Error response to user:**
```
{
  "success": false,
  "error": "AI analysis failed",
  "pdfAnalysis": { ... },  // Still return this
  "githubAnalysis": { ... },  // And this
  "aiAnalysis": {
    "status": "error",
    "message": "AI service temporarily unavailable",
    "fallbackUsed": true
  }
}
```

---

### 9. Integration with Server (45 min)

**Update `/api/analyze` endpoint workflow:**

Current flow (after Phase 3):
1. Analyze PDF
2. Fetch GitHub code

Add:
3. **Analyze each contract with Gemini**
4. **Combine all vulnerability findings**
5. **Calculate overall security score**
6. **Return comprehensive report**

**Response format:**
```
{
  "success": true,
  "pdfAnalysis": { ... },
  "githubAnalysis": { ... },
  "aiAnalysis": {
    "analyzedFiles": 8,
    "totalVulnerabilities": 12,
    "vulnerabilities": [
      {
        "id": "VULN-001",
        "type": "Reentrancy",
        "severity": "Critical",
        "file": "Token.sol",
        "line": 45,
        "description": "...",
        "exploitation": "...",
        "recommendation": "...",
        "confidence": 0.95
      },
      ...
    ],
    "summary": {
      "critical": 2,
      "high": 4,
      "medium": 5,
      "low": 1
    },
    "securityScore": 4.5  // out of 10
  }
}
```

---

### 10. Security Score Calculation (20 min)

**Combine all findings into a single 0-10 score:**

**Start with 10 points**

**Deduct for vulnerabilities:**
- Critical: -3 points each
- High: -2 points each
- Medium: -1 point each
- Low: -0.5 points each

**Weight by confidence:**
```
actualDeduction = baseDeduction * confidence
```

Example:
- High severity (2 points) with 0.6 confidence = 1.2 points deducted

**Clamp to 0-10 range**

**Interpretation:**
- 9-10: Very Safe (minor issues only)
- 7-8: Safe (some concerns)
- 5-6: Moderate Risk (significant issues)
- 3-4: High Risk (critical issues)
- 0-2: Extremely Dangerous (do not use)

---

## 🧪 TESTING PHASE 4

### Test 1: Gemini Connection

**Simple test:**
Send a basic prompt: "What is Solidity?"

**Expected:**
- Connection successful
- Response received
- No API errors

### Test 2: Vulnerability Detection - Known Issues

**Create test contract with intentional vulnerabilities:**

```solidity
contract VulnerableTest {
    mapping(address => uint) balances;
    
    // REENTRANCY
    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount);
        msg.sender.call{value: amount}("");  // External call before state update
        balances[msg.sender] -= amount;
    }
    
    // UNCHECKED RETURN
    function transfer(address to, uint amount) public {
        to.call{value: amount}("");  // Not checking return value
    }
    
    // ACCESS CONTROL
    function adminWithdraw() public {  // No onlyOwner modifier!
        payable(owner).transfer(address(this).balance);
    }
}
```

**Expected AI to detect:**
- Reentrancy in withdraw()
- Unchecked external call in transfer()
- Missing access control in adminWithdraw()

### Test 3: False Positive Check

**Safe contract:**
```solidity
contract SafeContract {
    mapping(address => uint) balances;
    bool locked;
    
    modifier noReentrant() {
        require(!locked);
        locked = true;
        _;
        locked = false;
    }
    
    function withdraw(uint amount) public noReentrant {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;  // State update BEFORE external call
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
    }
}
```

**Expected:**
- No critical vulnerabilities
- Maybe suggestions for improvements
- High security score

### Test 4: Multiple Files

**Test with small repo (3-5 files):**
- Each file analyzed separately
- Results combined correctly
- No duplicates in final report

### Test 5: Error Handling

**Test scenarios:**
- Invalid API key → Clear error message
- Very large contract (>10k lines) → Handles gracefully
- Network timeout → Returns partial results
- Invalid Solidity syntax → AI mentions syntax error

### Test 6: End-to-End

**Full API test:**
```
POST /api/analyze
- PDF whitepaper
- GitHub repo with contracts

Expected:
- PDF analysis
- GitHub file fetching
- AI vulnerability analysis
- Combined security score
- Total time: < 2 minutes
```

---

## ✅ COMPLETION CHECKLIST

**Setup:**
- [ ] Gemini API key obtained and added to .env
- [ ] @google/generative-ai package installed
- [ ] SDK initialized correctly

**Core Functions:**
- [ ] Prompt template for vulnerability detection
- [ ] Contract code formatter (with line numbers)
- [ ] Gemini API caller with error handling
- [ ] Response parser (JSON extraction and validation)
- [ ] Multi-file analysis orchestrator
- [ ] Confidence scoring logic
- [ ] Security score calculator

**Integration:**
- [ ] AI analysis integrated into `/api/analyze`
- [ ] Results combined with PDF and GitHub analysis
- [ ] Caching implemented
- [ ] Error handling for all API failures
- [ ] Timeout protection

**Testing:**
- [ ] API connection tested
- [ ] Vulnerability detection tested with known issues
- [ ] False positive rate acceptable
- [ ] Multiple files handled correctly
- [ ] Error cases handled gracefully
- [ ] End-to-end API test passing

---

## 📊 WHAT YOU'LL HAVE AFTER PHASE 4

**New Capabilities:**
✅ AI-powered code analysis
✅ 15+ vulnerability types detected
✅ Line-by-line issue identification
✅ Exploitation scenario generation
✅ Fix recommendations
✅ Confidence-weighted scoring
✅ Security score (0-10)

**Full Pipeline Now Works:**
✅ PDF whitepaper analysis
✅ GitHub code fetching
✅ AI vulnerability detection
✅ Comprehensive security report

**Still Pending:**
❌ Cross-validation (PDF vs code) (Phase 5)
❌ Final risk classification (Phase 5)
❌ Comprehensive testing (Phase 6)

---

## 💡 COMMON ISSUES & SOLUTIONS

**Issue:** Gemini returns markdown instead of JSON
**Solution:** Extract JSON from markdown code blocks with regex

**Issue:** AI misses obvious vulnerabilities
**Solution:** Make prompt more specific, add examples of what to look for

**Issue:** Too many false positives
**Solution:** Increase specificity in prompt, use confidence filtering

**Issue:** API timeout on large files
**Solution:** Split into chunks, analyze separately

**Issue:** Expensive API costs
**Solution:** Implement caching, limit file count, use Flash model

**Issue:** Inconsistent JSON structure
**Solution:** Strict validation, fallback parsing, clear format specification

---

**Estimated Time:** 4-5 hours  
**Difficulty:** ⭐⭐⭐⭐⭐  
**Next Phase:** Phase 5 - Cross-Validation & Final Scoring
