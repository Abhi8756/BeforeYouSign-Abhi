# PHASE 3: GITHUB REPOSITORY FETCHER
**Duration:** 4-5 hours  
**Difficulty:** Medium-Hard ⭐⭐⭐⭐☆  
**Goal:** Fetch smart contract code from GitHub repositories using the GitHub API

---

## 🎯 WHAT YOU'RE BUILDING

A service that:
- Takes a GitHub URL (e.g., https://github.com/owner/repo)
- Uses GitHub REST API to access the repository
- Downloads all Solidity (.sol) files from the /contracts folder
- Organizes files by type (contracts, interfaces, libraries)
- Builds a dependency map showing which contracts import which
- Prepares code for AI analysis

**Real-world analogy:** Like a librarian who finds all the books you need, organizes them by topic, and shows you which books reference other books.

---

## 📋 PHASE OBJECTIVES

### 1. Understanding GitHub API (30 min - Reading/Learning)

**Why use the API instead of git clone:**
- No need to install git
- Faster for selective file downloading
- Works in any environment (servers, cloud functions)
- Better rate limits than scraping
- Official, stable interface

**GitHub API Basics:**

**Authentication:**
- **Without token:** 60 requests/hour
- **With personal access token:** 5,000 requests/hour
- Always use token for real applications

**Key endpoints you'll use:**
1. `/repos/{owner}/{repo}/branches/{branch}` - Get branch info
2. `/repos/{owner}/{repo}/git/trees/{sha}?recursive=1` - Get all files
3. `/repos/{owner}/{repo}/contents/{path}` - Download specific file

**Rate limiting:**
- Each API call counts toward limit
- Check headers: `X-RateLimit-Remaining`
- If limit reached, wait until `X-RateLimit-Reset` time
- Cache results when possible

---

### 2. Get GitHub Personal Access Token (10 min)

**Steps:**
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate new token (classic)
3. Give it a descriptive name: "Smart Contract Analyzer"
4. Set expiration (90 days or custom)
5. Select scopes:
   - ✓ `repo` (full control - if you need private repos)
   - ✓ `public_repo` (access public repos - minimum needed)
6. Generate and COPY the token immediately
7. Add to your .env file: `GITHUB_TOKEN=ghp_...`

**Security warning:** Never commit this token to git. It's like a password.

---

### 3. URL Parsing (15 min)

**What you need to build:**
A function that extracts owner and repo name from GitHub URL.

**Input variations to handle:**
```
https://github.com/owner/repo
https://github.com/owner/repo/
https://github.com/owner/repo/tree/main
https://www.github.com/owner/repo
http://github.com/owner/repo (redirect to https)
```

**Extract:**
- Owner: "owner"
- Repo: "repo"

**Validation needed:**
- Must be github.com domain
- Must have owner/repo format
- Owner and repo can only contain: letters, numbers, hyphens, underscores
- No spaces allowed

**Error cases:**
- Invalid URL format
- Missing owner or repo
- Not a GitHub URL (e.g., gitlab.com)

---

### 4. Fetch Repository Tree (45 min)

**What is a repository tree:**
Complete list of all files and folders in the repo, represented as a hierarchical structure.

**Process:**

**Step 1: Get the latest commit SHA**
- Call: `/repos/{owner}/{repo}/branches/main`
- Extract: `commit.sha` from response
- This SHA identifies the exact state of the code

**Step 2: Get the tree**
- Call: `/repos/{owner}/{repo}/git/trees/{sha}?recursive=1`
- `recursive=1` = include all subdirectories
- Returns array of all files with metadata

**Each tree item contains:**
```
{
  path: "contracts/Token.sol",
  type: "blob",  // blob = file, tree = folder
  sha: "abc123...",  // unique identifier
  size: 5432,  // bytes
  url: "..." // API URL to download
}
```

**Branch fallback:**
If 'main' branch doesn't exist, try 'master'. Some older repos use 'master' as default.

**Error handling:**
- Repository doesn't exist (404)
- Repository is private and token lacks permission (403)
- Rate limit exceeded (403 with specific message)
- Network timeout
- Invalid token

---

### 5. Filter Solidity Files (30 min)

**What you need to build:**
Filter the tree to find only .sol files, organized by their purpose.

**Folder structure conventions:**
```
project/
├── contracts/       ← Main smart contracts (your primary focus)
├── interfaces/      ← Interface definitions (like headers in C)
├── libraries/       ← Helper libraries (like utilities)
├── test/            ← Test files (ignore these)
├── scripts/         ← Deployment scripts (ignore these)
```

**Filtering logic:**

**Category 1: Main Contracts**
- Files in `/contracts` folder
- These are the core smart contracts
- Highest priority for analysis

**Category 2: Interfaces**
- Files in `/interfaces` folder
- Define function signatures without implementation
- Needed to understand contract interactions

**Category 3: Libraries**
- Files in `/libraries` or `/lib` folder
- Reusable code utilities
- Need to check for vulnerabilities too

**Category 4: Other Solidity files**
- .sol files not in above folders
- Might be test contracts or examples
- Lower priority

**File extension check:**
- Must end with `.sol`
- Case-insensitive: `.sol`, `.SOL`, `.Sol` all valid

**What to ignore:**
- Test files (`*.test.sol`, files in `/test`)
- Mock contracts (`Mock*.sol`)
- Migration scripts
- JavaScript files
- README files

**Result data structure:**
```
{
  contracts: [
    { path: "contracts/Token.sol", size: 5000, sha: "..." },
    { path: "contracts/Vault.sol", size: 3000, sha: "..." }
  ],
  interfaces: [
    { path: "interfaces/IERC20.sol", size: 500, sha: "..." }
  ],
  libraries: [
    { path: "libraries/SafeMath.sol", size: 800, sha: "..." }
  ],
  other: []
}
```

---

### 6. Download File Contents (60 min)

**The challenge:**
GitHub API returns file content as base64-encoded string. You need to decode it.

**Process for each file:**

**Step 1: Make API request**
- Call: `/repos/{owner}/{repo}/contents/{file_path}`
- Include auth token in headers

**Step 2: Parse response**
Response contains:
```
{
  name: "Token.sol",
  path: "contracts/Token.sol",
  content: "Y29udHJhY3QgVG9rZW4ge..." (base64),
  encoding: "base64",
  size: 5000
}
```

**Step 3: Decode content**
- Base64 decode the `content` field
- Convert to UTF-8 string
- Result: actual Solidity source code

**Rate limiting strategy:**
- Don't download all files at once
- Add small delay between requests (100-200ms)
- Show progress (downloading X of Y files)
- Implement retry logic for failures

**Optimization - Limit file count:**
For MVP, limit to 50 files max:
- Prevents timeouts
- Stays within rate limits
- Most repos have <50 contract files anyway

**Error handling per file:**
- File too large (>1MB Solidity file is suspicious anyway)
- Decode fails (corrupted data)
- Network timeout
- Continue with other files even if one fails

**Result data structure:**
```
{
  name: "Token.sol",
  path: "contracts/Token.sol",
  content: "pragma solidity ^0.8.0; contract Token { ... }",
  size: 5000
}
```

---

### 7. Dependency Mapping (45 min)

**Why this matters:**
Understanding which contracts depend on which helps:
- Identify external dependencies (OpenZeppelin, Chainlink)
- Detect circular dependencies (bad practice)
- Prioritize which contracts to analyze first
- Understand contract architecture

**Process:**

**Step 1: Extract import statements**
Parse each contract's code for import lines:
```
import "./OtherContract.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeMath } from "./libraries/SafeMath.sol";
```

**Regex pattern needed:**
Match variations:
- `import "path";`
- `import 'path';`
- `import { Thing } from "path";`
- `import * as Thing from "path";`

**Step 2: Categorize imports**

**Local imports** (same repo):
```
"./Token.sol"
"../interfaces/IERC20.sol"
"./libraries/SafeMath.sol"
```

**External dependencies:**
```
"@openzeppelin/contracts/..." → OpenZeppelin (trusted)
"@chainlink/contracts/..." → Chainlink (trusted)
"@uniswap/..." → Uniswap (trusted)
"hardhat/console.sol" → Hardhat debug (remove in production!)
```

**Step 3: Build dependency graph**
```
{
  "Token.sol": {
    imports: ["./Ownable.sol", "@openzeppelin/contracts/token/ERC20/ERC20.sol"],
    importCount: 2,
    externalDeps: ["@openzeppelin/contracts"]
  },
  "Vault.sol": {
    imports: ["./Token.sol", "./SafeMath.sol"],
    importCount: 2,
    externalDeps: []
  }
}
```

**Step 4: Identify risks**
- Importing unknown/unaudited external contracts
- Too many dependencies (complex = more risk)
- Circular dependencies (A imports B imports A)
- Hardhat console in production code (debug code left in)

---

### 8. Analyze Code Patterns (30 min)

**Before sending to AI, do quick pattern analysis:**

**Solidity version extraction:**
```
pragma solidity ^0.8.0;  → Version 0.8.0
pragma solidity >=0.7.0 <0.9.0;  → Range
```

**Why this matters:**
- Versions <0.8.0 need SafeMath (overflow protection)
- Versions >=0.8.0 have built-in overflow checks
- Very old versions (<0.6.0) have known vulnerabilities

**Contract name extraction:**
```
contract Token { ... }  → Contract name: "Token"
contract ERC20Token is ERC20 { ... }  → Name: "ERC20Token", Inherits: "ERC20"
```

**Line counting:**
- Count lines of code per file
- Identify which contracts are most complex
- Contracts with >1000 lines need extra scrutiny

**Function signature extraction:**
```
function transfer(address to, uint256 amount) public returns (bool)
function withdraw() external onlyOwner
function _mint(address account, uint256 amount) internal
```

**Categorize functions:**
- Public/External = can be called by anyone (check access control!)
- Internal/Private = only within contract (safer)
- View/Pure = read-only (safe)
- Payable = accepts ETH (high risk)

---

### 9. Cache Implementation (Optional - 20 min)

**Why caching:**
- Same repo might be analyzed multiple times
- GitHub API has rate limits
- Faster responses for repeat queries

**What to cache:**
- Repository tree structure
- Downloaded file contents
- Dependency maps

**Cache strategy:**
- Save to `/cache/{owner}_{repo}_{sha}.json`
- Use commit SHA in filename (changes when code changes)
- Set expiration: 1 hour or 1 day
- Clear cache periodically

**When to skip cache:**
- User explicitly requests fresh analysis
- Cached data is older than expiration
- Commit SHA changed (new code pushed)

---

### 10. Integration with Server (30 min)

**Update `/api/analyze` endpoint:**

After PDF analysis (Phase 2):
1. Parse GitHub URL
2. Fetch repository tree
3. Filter Solidity files
4. Download file contents
5. Build dependency map
6. Return to user

**Update `/api/analyze/quick` endpoint:**
For GitHub-only analysis (no PDF):
1. Accept only GitHub URL parameter
2. Perform all GitHub fetching steps
3. Skip PDF analysis
4. Return code analysis only

**Response format:**
```
{
  success: true,
  pdfAnalysis: { ... },  // from Phase 2
  githubAnalysis: {
    owner: "owner-name",
    repo: "repo-name",
    branch: "main",
    totalFiles: 45,
    solidityFiles: {
      contracts: 8,
      interfaces: 3,
      libraries: 2
    },
    files: [
      {
        name: "Token.sol",
        path: "contracts/Token.sol",
        size: 5000,
        lines: 200,
        content: "pragma solidity..."
      }
    ],
    dependencies: {
      external: ["@openzeppelin/contracts"],
      local: ["./Ownable.sol"]
    },
    solidityVersions: ["^0.8.0"],
    analysisReady: true
  }
}
```

---

## 🧪 TESTING PHASE 3

### Test 1: URL Parsing

**Test cases:**
```
✓ "https://github.com/OpenZeppelin/openzeppelin-contracts"
✓ "https://github.com/Uniswap/v3-core/"
✓ "https://www.github.com/owner/repo"
✗ "https://gitlab.com/owner/repo" (not GitHub)
✗ "https://github.com/only-owner" (missing repo)
✗ "not-a-url" (invalid format)
```

### Test 2: Repository Tree Fetching

**Test with real repositories:**
- OpenZeppelin contracts (large, well-structured)
- Uniswap (complex dependencies)
- Your own test repository

**Verify:**
- Tree fetched without errors
- File count matches actual repo
- Both main and master branches tried

### Test 3: Solidity File Filtering

**Create test repo with structure:**
```
contracts/Token.sol  ← Should be found
contracts/Vault.sol  ← Should be found
interfaces/IERC20.sol  ← Should be found
test/Token.test.js  ← Should be ignored
scripts/deploy.js  ← Should be ignored
```

**Verify:**
- Only .sol files included
- Correctly categorized (contracts vs interfaces)
- Test files excluded

### Test 4: File Download

**Test with small repo (5-10 files):**
- All files downloaded successfully
- Content is valid Solidity code
- Base64 decoding worked correctly
- File sizes match

### Test 5: Dependency Extraction

**Test contracts with imports:**
```solidity
import "./Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
```

**Verify:**
- Both imports detected
- Categorized correctly (local vs external)
- Dependency map accurate

### Test 6: Rate Limit Handling

**Test with large repo (100+ files):**
- Stops at file limit (50 files)
- Shows progress during download
- Handles rate limit gracefully
- No crashes

### Test 7: Error Cases

**Test error scenarios:**
- Non-existent repo → 404 error with clear message
- Private repo without access → Permission error
- Invalid token → Authentication error
- Network timeout → Retry or clear error

### Test 8: End-to-End API Test

**Postman test:**
```
POST /api/analyze
- PDF file
- githubRepo: "https://github.com/OpenZeppelin/openzeppelin-contracts"

Expected response:
- pdfAnalysis: {...}
- githubAnalysis: {files: [...], dependencies: {...}}
- success: true
```

---

## ✅ COMPLETION CHECKLIST

**Core Functions:**
- [ ] GitHub URL parser with validation
- [ ] GitHub API authentication configured
- [ ] Repository tree fetcher
- [ ] Solidity file filter
- [ ] File content downloader with base64 decode
- [ ] Import statement extractor
- [ ] Dependency map builder
- [ ] Solidity version extractor
- [ ] Code pattern analyzer

**Integration:**
- [ ] GitHub fetcher integrated into `/api/analyze`
- [ ] `/api/analyze/quick` endpoint working
- [ ] Proper error handling for all GitHub API calls
- [ ] Rate limiting handled
- [ ] Progress logging during download

**Testing:**
- [ ] URL parsing tested with various formats
- [ ] Tree fetching tested with real repos
- [ ] File filtering correctly categorizes files
- [ ] Downloads work and decode properly
- [ ] Dependency mapping accurate
- [ ] API endpoints return complete data
- [ ] Error cases handled gracefully

---

## 📊 WHAT YOU'LL HAVE AFTER PHASE 3

**New Capabilities:**
✅ Parse any GitHub repository URL
✅ Fetch complete file structure via API
✅ Download all Solidity contract files
✅ Organize files by purpose
✅ Build dependency map
✅ Extract Solidity versions
✅ Identify external dependencies
✅ Return structured code data

**Combined with Phase 2:**
✅ Accept PDF + GitHub URL
✅ Extract whitepaper claims
✅ Fetch actual contract code
✅ Ready for AI analysis

**Still Pending:**
❌ AI-powered vulnerability detection (Phase 4)
❌ Cross-validation (PDF claims vs code reality) (Phase 5)
❌ Final risk scoring (Phase 5)

---

## 💡 COMMON ISSUES & SOLUTIONS

**Issue:** Rate limit exceeded after 60 requests
**Solution:** Add GitHub personal access token to .env

**Issue:** Files come back as gibberish
**Solution:** Content is base64 encoded - must decode before using

**Issue:** Can't find contracts folder
**Solution:** Check for capital C: "Contracts" vs "contracts", or search recursively

**Issue:** Import statements not detected
**Solution:** Regex might be too strict - add more pattern variations

**Issue:** Repository not found (404)
**Solution:** Check if repo is private, try both main and master branches

**Issue:** Downloads taking too long
**Solution:** Implement file limit (50 files max), add timeout

---

**Estimated Time:** 4-5 hours  
**Difficulty:** ⭐⭐⭐⭐☆  
**Next Phase:** Phase 4 - Gemini AI Analysis
