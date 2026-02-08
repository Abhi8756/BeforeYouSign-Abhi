/**
 * Gemini AI Analyzer Service - Phase 4
 * 
 * Integrates with Google Gemini 2.0 Flash to analyze:
 * - PDF whitepaper text (from Phase 2)
 * - Solidity smart contract code (from Phase 3)
 * 
 * Detects:
 * - Discrepancies between PDF claims and code reality
 * - Security vulnerabilities (reentrancy, overflow, access control)
 * - Code quality issues (centralization, missing validations)
 * - Tokenomics verification
 * 
 * Architecture: ALL ANALYSIS HAPPENS HERE
 * PDF Parser extracts → GitHub Fetcher extracts → Gemini analyzes
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const log = require('../utils/logger');

// =============================================================================
// CONFIGURATION
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash';

// Generation configuration for consistent, focused outputs
const GENERATION_CONFIG = {
  temperature: 0.3,        // Lower = more focused/deterministic analysis
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,   // Allow detailed responses
};

// Maximum code size to send (to stay under token limits)
const MAX_CODE_LENGTH = 500000;  // ~500KB of code
const MAX_PDF_LENGTH = 100000;   // ~100KB of PDF text

// =============================================================================
// GEMINI CLIENT INITIALIZATION
// =============================================================================

let genAI = null;
let model = null;

/**
 * Initialize Gemini AI client
 * @throws {Error} If API key is not configured
 */
function initializeGemini() {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found in environment variables. Please add it to .env file.');
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
    log.info('Gemini AI client initialized', { model: MODEL_NAME });
  }
  
  return model;
}

// =============================================================================
// PROMPT ENGINEERING
// =============================================================================

/**
 * Build the analysis prompt for Gemini
 * This is the most critical function - prompt quality determines analysis quality
 * 
 * @param {Object} pdfData - Extracted PDF data from Phase 2
 * @param {Object} githubData - Extracted GitHub code from Phase 3
 * @returns {string} Formatted prompt for Gemini
 */
function buildAnalysisPrompt(pdfData, githubData) {
  // Truncate if necessary to stay under token limits
  const fullText = pdfData.fullText?.substring(0, MAX_PDF_LENGTH) || '';
  const combinedCode = githubData.combinedCode?.substring(0, MAX_CODE_LENGTH) || '';
  
  // Build section summary
  const sectionSummary = Object.entries(pdfData.sections || {})
    .filter(([key, value]) => value && value.length > 0)
    .map(([key, value]) => `${key.toUpperCase()}: ${value.substring(0, 2000)}...`)
    .join('\n\n');

  const prompt = `
You are an expert smart contract security auditor and blockchain analyst. Your task is to perform a comprehensive security analysis by comparing a cryptocurrency project's whitepaper claims against its actual smart contract code implementation.

=== YOUR MISSION ===
1. Read and understand the whitepaper content (PDF)
2. Analyze the Solidity smart contract code
3. Cross-validate: Find discrepancies between PDF promises and code reality
4. Identify security vulnerabilities in the code
5. Assess code quality and centralization risks
6. Calculate a final risk score

=== WHITEPAPER TEXT (FROM PDF) ===
File: ${pdfData.metadata?.fileName || 'whitepaper.pdf'}
Pages: ${pdfData.metadata?.pages || 'unknown'}

${fullText}

=== KEY WHITEPAPER SECTIONS ===
${sectionSummary || 'No specific sections detected'}

=== SMART CONTRACT CODE ===
Repository: ${githubData.metadata?.repository || 'unknown'}
Total Files: ${githubData.metadata?.totalFiles || 0}
Total Lines: ${githubData.metadata?.totalLines || 0}

${combinedCode}

=== ANALYSIS INSTRUCTIONS ===

**1. CROSS-VALIDATION (PDF vs CODE) - CRITICAL**
Compare these specific claims from the PDF against the code:

- Token allocation percentages (team, public sale, ecosystem, treasury)
  * Look for: teamAllocation, publicSale, ecosystemReserve variables
  * Compare against PDF claims about distribution

- Transaction tax/fee percentages
  * Look for: taxRate, fee, transferFee variables
  * Compare against PDF claims about fees

- Total supply numbers
  * Look for: totalSupply, MAX_SUPPLY, _totalSupply
  * Compare against PDF claims

- Vesting schedules
  * Look for: vesting contracts, timelock mechanisms, cliff periods
  * Compare against PDF claims about vesting

- Burning mechanisms
  * Look for: burn functions, deflationary logic
  * Compare against PDF claims about token burning

- Audit claims
  * Look for: audit comments, verified contract mentions
  * Compare against PDF claims about security audits

For EACH discrepancy found:
- Quote the exact PDF claim
- Quote the exact code reality
- Explain the severity and impact

**2. SECURITY VULNERABILITIES**
Check for these vulnerability types:

- Reentrancy attacks
  * External calls before state changes
  * Missing ReentrancyGuard
  
- Integer overflow/underflow
  * Pre-Solidity 0.8.0 without SafeMath
  * Unchecked arithmetic blocks
  
- Access control issues
  * Missing onlyOwner modifiers
  * Public functions that should be private
  * Missing zero-address checks
  
- Denial of service vectors
  * Unbounded loops
  * Block gas limit issues
  
- Front-running vulnerabilities
  * Price manipulation risks
  * Transaction ordering dependencies
  
- Unchecked external calls
  * Missing success checks on .call()
  * No error handling for external calls
  
- Timestamp dependence
  * block.timestamp for critical logic
  
- Delegate call risks
  * Delegatecall to untrusted contracts

**3. CODE QUALITY ISSUES**
Assess:

- Missing input validation
  * Zero address checks
  * Amount validation
  * Array bounds checking
  
- Centralization risks
  * Single owner can drain funds
  * Owner can pause forever
  * Owner can change critical parameters
  * No timelock on admin functions
  * Proxy upgrade without governance
  
- Missing events
  * Critical state changes without events
  * No event emission for transfers/approvals
  
- Gas optimization
  * Expensive loops
  * Storage vs memory inefficiency
  * Redundant operations

**4. TOKENOMICS VERIFICATION**
Extract from CODE (not PDF):
- Actual team allocation percentage
- Actual transaction tax percentage  
- Actual total supply
- Is vesting logic implemented?
- Is burn mechanism implemented?
- Can owner mint unlimited tokens?
- Is there a max wallet limit?
- Is there anti-bot protection?

=== OUTPUT FORMAT (STRICT JSON ONLY) ===

Return your analysis as a valid JSON object. Do NOT include any text before or after the JSON.

{
  "discrepancies": [
    {
      "type": "allocation_mismatch | tax_mismatch | supply_mismatch | vesting_missing | burn_missing | audit_false",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "pdfClaim": "Exact text from whitepaper",
      "codeReality": "What the code actually does",
      "description": "Clear explanation of the discrepancy",
      "impact": "What this means for investors",
      "codeLocation": "contract/file:line (if identifiable)"
    }
  ],
  
  "vulnerabilities": [
    {
      "type": "reentrancy | overflow | access_control | dos | frontrunning | unchecked_call | timestamp | delegatecall",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "location": "Contract.sol:functionName()",
      "description": "Clear explanation of the vulnerability",
      "exploit": "How an attacker could exploit this",
      "codeSnippet": "Relevant code snippet if available",
      "recommendation": "How to fix this vulnerability"
    }
  ],
  
  "codeQualityIssues": [
    {
      "type": "centralization | missing_validation | missing_events | gas_inefficiency",
      "severity": "HIGH | MEDIUM | LOW",
      "description": "Clear explanation of the issue",
      "location": "Contract.sol:functionName()",
      "recommendation": "How to improve this"
    }
  ],
  
  "tokenomicsVerification": {
    "totalSupply": {
      "pdfClaim": "Value from PDF or 'not specified'",
      "codeReality": "Actual value from code",
      "match": true | false
    },
    "teamAllocation": {
      "pdfClaim": "Value from PDF or 'not specified'",
      "codeReality": "Actual value from code",
      "match": true | false
    },
    "transactionTax": {
      "pdfClaim": "Value from PDF or 'not specified'",
      "codeReality": "Actual value from code",
      "match": true | false
    },
    "vestingImplemented": true | false,
    "vestingDetails": "Description of vesting logic if found",
    "burnMechanismImplemented": true | false,
    "burnDetails": "Description of burn mechanism if found",
    "unlimitedMinting": true | false,
    "mintingDetails": "Description of minting capability",
    "maxWalletLimit": true | false,
    "antiBotProtection": true | false
  },
  
  "riskScore": {
    "overall": 0.0,  // 0-10 scale: 0=definite scam, 10=highly safe
    "breakdown": {
      "pdfCodeAlignment": 0.0,  // How well PDF matches code (0-10)
      "securityScore": 0.0,    // Code security level (0-10)
      "codeQualityScore": 0.0, // Code quality level (0-10)
      "tokenomicsScore": 0.0   // Tokenomics fairness (0-10)
    },
    "classification": "SAFE | SUSPICIOUS | HIGH-RISK",
    "confidence": "HIGH | MEDIUM | LOW"
  },
  
  "summary": "A comprehensive 2-3 sentence summary of the analysis findings, highlighting the most critical issues and overall assessment.",
  
  "redFlags": [
    "List of major red flags that investors should be aware of"
  ],
  
  "positiveAspects": [
    "List of positive aspects if any (good practices, standard patterns, etc.)"
  ]
}

=== SCORING GUIDELINES ===

Risk Score Calculation:
- Start at 10.0 (perfectly safe)
- Subtract points for issues:
  * CRITICAL vulnerability: -3.0 each
  * HIGH severity issue: -1.5 each
  * MEDIUM severity issue: -0.5 each
  * LOW severity issue: -0.25 each
  * Major PDF/code discrepancy: -2.0 each
  * Missing vesting when claimed: -1.5
  * Unlimited minting capability: -1.0
  * High centralization: -1.0

Classification:
- SAFE: 7.0 - 10.0 (minor issues only, can invest with standard caution)
- SUSPICIOUS: 4.0 - 6.9 (significant issues, invest only small amounts)
- HIGH-RISK: 0.0 - 3.9 (major issues, do not recommend investment)

=== IMPORTANT REMINDERS ===
- Be thorough but objective
- Only report issues you can verify in the code
- Provide specific code locations when possible
- Focus on HIGH and CRITICAL severity issues first
- The JSON must be valid and parseable
- Do not include markdown code blocks in your response
- Return ONLY the JSON object, nothing else
`;

  return prompt;
}

/**
 * Build a simplified prompt for quick analysis (GitHub only, no PDF)
 * 
 * @param {Object} githubData - Extracted GitHub code from Phase 3
 * @returns {string} Formatted prompt for Gemini
 */
function buildQuickAnalysisPrompt(githubData) {
  const combinedCode = githubData.combinedCode?.substring(0, MAX_CODE_LENGTH) || '';

  const prompt = `
You are an expert smart contract security auditor. Analyze the following Solidity smart contract code for security vulnerabilities and code quality issues.

=== SMART CONTRACT CODE ===
Repository: ${githubData.metadata?.repository || 'unknown'}
Total Files: ${githubData.metadata?.totalFiles || 0}
Total Lines: ${githubData.metadata?.totalLines || 0}

${combinedCode}

=== ANALYSIS FOCUS ===

1. **Security Vulnerabilities**: reentrancy, overflow, access control, DOS, frontrunning
2. **Code Quality**: centralization risks, missing validations, gas optimization
3. **Tokenomics**: minting capabilities, supply limits, fee structures

=== OUTPUT FORMAT (STRICT JSON ONLY) ===

{
  "vulnerabilities": [
    {
      "type": "string",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "location": "Contract.sol:function()",
      "description": "string",
      "recommendation": "string"
    }
  ],
  "codeQualityIssues": [
    {
      "type": "string",
      "severity": "HIGH | MEDIUM | LOW",
      "description": "string",
      "location": "string",
      "recommendation": "string"
    }
  ],
  "tokenomicsAnalysis": {
    "totalSupply": "string",
    "hasMintFunction": true | false,
    "hasBurnFunction": true | false,
    "transactionFees": "string",
    "ownerPrivileges": ["list of owner capabilities"]
  },
  "riskScore": {
    "overall": 0.0,
    "classification": "SAFE | SUSPICIOUS | HIGH-RISK"
  },
  "summary": "string",
  "redFlags": ["string"],
  "positiveAspects": ["string"]
}

Return ONLY valid JSON, no other text.
`;

  return prompt;
}

// =============================================================================
// GEMINI API COMMUNICATION
// =============================================================================

/**
 * Send analysis request to Gemini and get response
 * 
 * @param {string} prompt - The analysis prompt
 * @returns {Promise<string>} Raw text response from Gemini
 * @throws {Error} If API call fails
 */
async function sendToGemini(prompt) {
  const geminiModel = initializeGemini();
  
  try {
    log.info('Sending analysis request to Gemini AI', {
      model: MODEL_NAME,
      promptLength: prompt.length,
      estimatedTokens: Math.ceil(prompt.length / 4)
    });
    
    const startTime = Date.now();
    
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: GENERATION_CONFIG
    });
    
    const response = result.response;
    const text = response.text();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log.info('Gemini AI response received', {
      responseLength: text.length,
      duration: `${duration}s`
    });
    
    return text;
    
  } catch (error) {
    log.error('Gemini API call failed', { error: error.message });
    
    // Handle specific error types
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API rate limit exceeded. Please try again in 1 minute.');
    }
    
    if (error.message?.includes('401') || error.message?.includes('API key') || error.message?.includes('PERMISSION_DENIED')) {
      throw new Error('Invalid Gemini API key. Please check GEMINI_API_KEY in .env file.');
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('DEADLINE_EXCEEDED')) {
      throw new Error('Gemini analysis timed out. The code may be too large to analyze.');
    }
    
    if (error.message?.includes('SAFETY')) {
      throw new Error('Gemini blocked the request due to safety filters. Please review the content.');
    }
    
    throw new Error(`Gemini AI analysis failed: ${error.message}`);
  }
}

// =============================================================================
// RESPONSE PARSING
// =============================================================================

/**
 * Parse Gemini's text response into a structured JSON object
 * Handles various response formats and edge cases
 * 
 * @param {string} responseText - Raw text from Gemini
 * @returns {Object} Parsed analysis object
 */
function parseGeminiResponse(responseText) {
  try {
    let cleaned = responseText.trim();
    
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    
    // Try to extract JSON if there's text before/after
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    // Parse JSON
    const parsed = JSON.parse(cleaned);
    
    // Validate required fields exist
    const requiredFields = ['riskScore', 'summary'];
    for (const field of requiredFields) {
      if (!(field in parsed)) {
        log.warn(`Missing required field in Gemini response: ${field}`);
      }
    }
    
    // Ensure arrays exist
    parsed.discrepancies = parsed.discrepancies || [];
    parsed.vulnerabilities = parsed.vulnerabilities || [];
    parsed.codeQualityIssues = parsed.codeQualityIssues || [];
    parsed.redFlags = parsed.redFlags || [];
    parsed.positiveAspects = parsed.positiveAspects || [];
    
    // Ensure riskScore has required structure
    if (!parsed.riskScore) {
      parsed.riskScore = {
        overall: 5.0,
        classification: 'SUSPICIOUS',
        confidence: 'LOW'
      };
    }
    
    log.info('Gemini response parsed successfully', {
      discrepancies: parsed.discrepancies.length,
      vulnerabilities: parsed.vulnerabilities.length,
      codeQualityIssues: parsed.codeQualityIssues.length,
      riskScore: parsed.riskScore.overall
    });
    
    return parsed;
    
  } catch (error) {
    log.error('Failed to parse Gemini response as JSON', { 
      error: error.message,
      responsePreview: responseText.substring(0, 500)
    });
    
    // Return a fallback structure with the raw response
    return {
      parseError: true,
      error: `Failed to parse AI response: ${error.message}`,
      rawResponse: responseText,
      discrepancies: [],
      vulnerabilities: [],
      codeQualityIssues: [],
      tokenomicsVerification: {},
      riskScore: {
        overall: 0,
        classification: 'UNKNOWN',
        confidence: 'NONE'
      },
      summary: 'Analysis completed but response parsing failed. Please review raw response.',
      redFlags: ['Response parsing failed - manual review recommended'],
      positiveAspects: []
    };
  }
}

// =============================================================================
// RECOMMENDATION GENERATION
// =============================================================================

/**
 * Generate human-readable recommendation based on analysis
 * 
 * @param {Object} analysis - Parsed Gemini analysis
 * @returns {string} Recommendation text
 */
function generateRecommendation(analysis) {
  const score = analysis.riskScore?.overall ?? 5;
  const criticalVulns = analysis.vulnerabilities?.filter(v => v.severity === 'CRITICAL').length || 0;
  const highVulns = analysis.vulnerabilities?.filter(v => v.severity === 'HIGH').length || 0;
  const highDiscrepancies = analysis.discrepancies?.filter(d => d.severity === 'HIGH' || d.severity === 'CRITICAL').length || 0;
  
  // Critical vulnerabilities = immediate red flag
  if (criticalVulns > 0) {
    return `DO NOT INVEST - ${criticalVulns} critical security vulnerabilit${criticalVulns === 1 ? 'y' : 'ies'} found. High risk of funds loss through contract exploitation.`;
  }
  
  // Multiple high-severity discrepancies = likely scam
  if (highDiscrepancies >= 2) {
    return `DO NOT INVEST - ${highDiscrepancies} major discrepancies found between whitepaper claims and actual code. This project appears to be misrepresenting its tokenomics or features.`;
  }
  
  // Multiple high vulnerabilities
  if (highVulns >= 3) {
    return `HIGH RISK - ${highVulns} high-severity security issues found. The smart contract has significant vulnerabilities that could lead to loss of funds.`;
  }
  
  // Score-based recommendations
  if (score >= 8) {
    return 'SAFE TO INVEST - Code quality is good with minimal issues. Standard investment precautions apply. Consider the project fundamentals beyond just the code.';
  }
  
  if (score >= 6) {
    return 'PROCEED WITH CAUTION - Some issues found but not critical. Invest only amounts you can afford to lose. Monitor the project closely.';
  }
  
  if (score >= 4) {
    return 'HIGH CAUTION - Multiple issues identified. Only invest very small amounts if you understand the risks. This project has concerning elements.';
  }
  
  return 'HIGH RISK - Major issues found including security vulnerabilities or significant discrepancies. Not recommended for investment.';
}

/**
 * Generate a human-readable report from the analysis
 * 
 * @param {Object} analysis - Complete analysis object
 * @returns {string} Formatted report text
 */
function generateReport(analysis) {
  const { aiAnalysis, finalVerdict } = analysis;
  
  let report = '\n';
  report += '╔══════════════════════════════════════════════════════════════════════╗\n';
  report += '║           SMART CONTRACT SECURITY ANALYSIS REPORT                    ║\n';
  report += '╚══════════════════════════════════════════════════════════════════════╝\n\n';
  
  // Risk Assessment Header
  report += '┌─────────────────────────────────────────────────────────────────────┐\n';
  report += '│  RISK ASSESSMENT                                                     │\n';
  report += '├─────────────────────────────────────────────────────────────────────┤\n';
  report += `│  Trust Score:     ${finalVerdict.trustScore}/10                                          │\n`;
  report += `│  Classification:  ${finalVerdict.classification.padEnd(20)}                       │\n`;
  report += '└─────────────────────────────────────────────────────────────────────┘\n\n';
  
  // Critical Vulnerabilities
  const criticalVulns = aiAnalysis.vulnerabilities?.filter(v => v.severity === 'CRITICAL') || [];
  if (criticalVulns.length > 0) {
    report += '⛔ CRITICAL VULNERABILITIES\n';
    report += '─'.repeat(50) + '\n';
    criticalVulns.forEach((vuln, i) => {
      report += `\n${i + 1}. ${vuln.type.toUpperCase()}\n`;
      report += `   Location: ${vuln.location || 'Not specified'}\n`;
      report += `   Description: ${vuln.description}\n`;
      if (vuln.exploit) {
        report += `   Exploit: ${vuln.exploit}\n`;
      }
    });
    report += '\n';
  }
  
  // High Vulnerabilities
  const highVulns = aiAnalysis.vulnerabilities?.filter(v => v.severity === 'HIGH') || [];
  if (highVulns.length > 0) {
    report += '🔴 HIGH SEVERITY VULNERABILITIES\n';
    report += '─'.repeat(50) + '\n';
    highVulns.forEach((vuln, i) => {
      report += `\n${i + 1}. ${vuln.type.toUpperCase()}\n`;
      report += `   Location: ${vuln.location || 'Not specified'}\n`;
      report += `   Description: ${vuln.description}\n`;
    });
    report += '\n';
  }
  
  // Discrepancies
  if (aiAnalysis.discrepancies?.length > 0) {
    report += '⚠️  PDF-CODE DISCREPANCIES\n';
    report += '─'.repeat(50) + '\n';
    aiAnalysis.discrepancies.forEach((disc, i) => {
      report += `\n${i + 1}. ${disc.type?.toUpperCase() || 'DISCREPANCY'} [${disc.severity}]\n`;
      report += `   PDF Claim:    ${disc.pdfClaim}\n`;
      report += `   Code Reality: ${disc.codeReality}\n`;
      report += `   Impact:       ${disc.impact || disc.description}\n`;
    });
    report += '\n';
  }
  
  // Code Quality Issues
  const significantIssues = aiAnalysis.codeQualityIssues?.filter(i => i.severity === 'HIGH' || i.severity === 'MEDIUM') || [];
  if (significantIssues.length > 0) {
    report += '📋 CODE QUALITY ISSUES\n';
    report += '─'.repeat(50) + '\n';
    significantIssues.forEach((issue, i) => {
      report += `\n${i + 1}. ${issue.type?.toUpperCase() || 'ISSUE'} [${issue.severity}]\n`;
      report += `   ${issue.description}\n`;
      if (issue.location) {
        report += `   Location: ${issue.location}\n`;
      }
    });
    report += '\n';
  }
  
  // Red Flags
  if (aiAnalysis.redFlags?.length > 0) {
    report += '🚩 RED FLAGS\n';
    report += '─'.repeat(50) + '\n';
    aiAnalysis.redFlags.forEach((flag, i) => {
      report += `   • ${flag}\n`;
    });
    report += '\n';
  }
  
  // Positive Aspects
  if (aiAnalysis.positiveAspects?.length > 0) {
    report += '✅ POSITIVE ASPECTS\n';
    report += '─'.repeat(50) + '\n';
    aiAnalysis.positiveAspects.forEach((aspect, i) => {
      report += `   • ${aspect}\n`;
    });
    report += '\n';
  }
  
  // Summary
  report += '📝 SUMMARY\n';
  report += '─'.repeat(50) + '\n';
  report += `${aiAnalysis.summary}\n\n`;
  
  // Recommendation
  report += '┌─────────────────────────────────────────────────────────────────────┐\n';
  report += '│  RECOMMENDATION                                                      │\n';
  report += '├─────────────────────────────────────────────────────────────────────┤\n';
  const recommendationLines = finalVerdict.recommendation.match(/.{1,65}/g) || [finalVerdict.recommendation];
  recommendationLines.forEach(line => {
    report += `│  ${line.padEnd(67)}│\n`;
  });
  report += '└─────────────────────────────────────────────────────────────────────┘\n';
  
  return report;
}

// =============================================================================
// MAIN ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Perform full analysis with both PDF and GitHub data
 * This is the main orchestrator for Phase 4
 * 
 * @param {Object} pdfData - Extracted PDF data from Phase 2
 * @param {Object} githubData - Extracted GitHub code from Phase 3
 * @returns {Promise<Object>} Complete analysis result
 */
async function analyzeWithGemini(pdfData, githubData) {
  const startTime = Date.now();
  
  try {
    log.info('=== Starting Gemini AI Analysis (Phase 4) ===');
    log.info('Input data', {
      pdfPages: pdfData.metadata?.pages || 0,
      pdfTextLength: pdfData.fullText?.length || 0,
      codeFiles: githubData.metadata?.totalFiles || 0,
      codeLines: githubData.metadata?.totalLines || 0
    });
    
    // Step 1: Build the analysis prompt
    const prompt = buildAnalysisPrompt(pdfData, githubData);
    log.info('Analysis prompt built', { promptLength: prompt.length });
    
    // Step 2: Send to Gemini
    const responseText = await sendToGemini(prompt);
    
    // Step 3: Parse the response
    const geminiAnalysis = parseGeminiResponse(responseText);
    
    // Step 4: Structure the final output
    const result = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        pdfFile: pdfData.metadata?.fileName || 'unknown',
        pdfPages: pdfData.metadata?.pages || 0,
        githubRepo: githubData.metadata?.repository || 'unknown',
        totalCodeFiles: githubData.metadata?.totalFiles || 0,
        totalCodeLines: githubData.metadata?.totalLines || 0,
        aiModel: MODEL_NAME,
        analysisMode: 'full',
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      },
      
      pdfExtraction: {
        pages: pdfData.metadata?.pages || 0,
        sectionsFound: pdfData.metadata?.sectionsFound || [],
        textLength: pdfData.metadata?.textLength || 0
      },
      
      codeExtraction: {
        repository: githubData.metadata?.repository || 'unknown',
        filesAnalyzed: githubData.metadata?.totalFiles || 0,
        totalLines: githubData.metadata?.totalLines || 0,
        categories: githubData.metadata?.categories || {}
      },
      
      aiAnalysis: {
        discrepancies: geminiAnalysis.discrepancies || [],
        vulnerabilities: geminiAnalysis.vulnerabilities || [],
        codeQualityIssues: geminiAnalysis.codeQualityIssues || [],
        tokenomicsVerification: geminiAnalysis.tokenomicsVerification || {},
        riskScore: geminiAnalysis.riskScore || { overall: 0, classification: 'UNKNOWN' },
        summary: geminiAnalysis.summary || 'Analysis completed.',
        redFlags: geminiAnalysis.redFlags || [],
        positiveAspects: geminiAnalysis.positiveAspects || []
      },
      
      finalVerdict: {
        trustScore: geminiAnalysis.riskScore?.overall ?? 0,
        classification: geminiAnalysis.riskScore?.classification || 'UNKNOWN',
        confidence: geminiAnalysis.riskScore?.confidence || 'MEDIUM',
        recommendation: generateRecommendation(geminiAnalysis)
      }
    };
    
    // Generate report
    result.report = generateReport(result);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log.info('=== Gemini AI Analysis Complete ===');
    log.info('Analysis results', {
      trustScore: result.finalVerdict.trustScore,
      classification: result.finalVerdict.classification,
      discrepancies: result.aiAnalysis.discrepancies.length,
      vulnerabilities: result.aiAnalysis.vulnerabilities.length,
      duration: `${duration}s`
    });
    
    return result;
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.error('=== Gemini AI Analysis Failed ===');
    log.error('Error details', { error: error.message, duration: `${duration}s` });
    throw error;
  }
}

/**
 * Perform quick analysis with GitHub data only (no PDF)
 * 
 * @param {Object} githubData - Extracted GitHub code from Phase 3
 * @returns {Promise<Object>} Analysis result focused on code security
 */
async function analyzeQuick(githubData) {
  const startTime = Date.now();
  
  try {
    log.info('=== Starting Quick Gemini Analysis (Code Only) ===');
    log.info('Input data', {
      codeFiles: githubData.metadata?.totalFiles || 0,
      codeLines: githubData.metadata?.totalLines || 0
    });
    
    // Build quick analysis prompt
    const prompt = buildQuickAnalysisPrompt(githubData);
    
    // Send to Gemini
    const responseText = await sendToGemini(prompt);
    
    // Parse response
    const geminiAnalysis = parseGeminiResponse(responseText);
    
    // Structure output
    const result = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        githubRepo: githubData.metadata?.repository || 'unknown',
        totalCodeFiles: githubData.metadata?.totalFiles || 0,
        totalCodeLines: githubData.metadata?.totalLines || 0,
        aiModel: MODEL_NAME,
        analysisMode: 'quick',
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      },
      
      codeExtraction: {
        repository: githubData.metadata?.repository || 'unknown',
        filesAnalyzed: githubData.metadata?.totalFiles || 0,
        totalLines: githubData.metadata?.totalLines || 0,
        categories: githubData.metadata?.categories || {}
      },
      
      aiAnalysis: {
        vulnerabilities: geminiAnalysis.vulnerabilities || [],
        codeQualityIssues: geminiAnalysis.codeQualityIssues || [],
        tokenomicsAnalysis: geminiAnalysis.tokenomicsAnalysis || {},
        riskScore: geminiAnalysis.riskScore || { overall: 0, classification: 'UNKNOWN' },
        summary: geminiAnalysis.summary || 'Analysis completed.',
        redFlags: geminiAnalysis.redFlags || [],
        positiveAspects: geminiAnalysis.positiveAspects || []
      },
      
      finalVerdict: {
        trustScore: geminiAnalysis.riskScore?.overall ?? 0,
        classification: geminiAnalysis.riskScore?.classification || 'UNKNOWN',
        recommendation: generateRecommendation(geminiAnalysis)
      }
    };
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.info('=== Quick Analysis Complete ===', { duration: `${duration}s` });
    
    return result;
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.error('Quick analysis failed', { error: error.message, duration: `${duration}s` });
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main analysis functions
  analyzeWithGemini,
  analyzeQuick,
  
  // Utility functions (for testing)
  buildAnalysisPrompt,
  buildQuickAnalysisPrompt,
  parseGeminiResponse,
  generateRecommendation,
  generateReport,
  
  // Configuration (for testing)
  initializeGemini
};
