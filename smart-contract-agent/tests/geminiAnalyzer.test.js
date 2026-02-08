/**
 * Gemini Analyzer Test - Phase 4
 * Tests AI analysis integration with mock data
 * 
 * Test Types:
 * 1. Unit tests for utility functions (parseGeminiResponse, generateRecommendation)
 * 2. Integration tests (requires GEMINI_API_KEY)
 */

require('dotenv').config();
const path = require('path');

// Import functions to test
const {
  parseGeminiResponse,
  generateRecommendation,
  generateReport,
  buildAnalysisPrompt,
  buildQuickAnalysisPrompt,
  analyzeWithGemini,
  analyzeQuick
} = require('../services/geminiAnalyzer');

// =============================================================================
// MOCK DATA
// =============================================================================

// Mock PDF data (simulating Phase 2 output)
const mockPdfData = {
  metadata: {
    fileName: 'test-whitepaper.pdf',
    pages: 12,
    extractedAt: '2026-02-08T12:00:00.000Z',
    textLength: 15000,
    sectionsFound: ['overview', 'tokenomics', 'team', 'technical']
  },
  fullText: `
    PROJECT OVERVIEW
    TokenX is a revolutionary DeFi protocol built on Ethereum.
    Our mission is to democratize access to financial services.
    
    TOKENOMICS
    Total Supply: 1,000,000,000 TKNX
    Distribution:
    - Public Sale: 40%
    - Team: 20% (2 year vesting)
    - Ecosystem: 25%  
    - Treasury: 15%
    
    Transaction Fee: 3% on all transfers
    - 1% to liquidity pool
    - 1% to holders (reflection)
    - 1% burned
    
    TEAM
    John Smith - CEO, 10 years in fintech
    Jane Doe - CTO, former Ethereum developer
    
    TECHNICAL ARCHITECTURE
    Built using Solidity 0.8.x
    Audited by CertiK
    Uses OpenZeppelin contracts
    
    SECURITY
    Smart contract audited by CertiK - No critical issues found
    Bug bounty program active on Immunefi
  `,
  sections: {
    overview: 'PROJECT OVERVIEW\nTokenX is a revolutionary DeFi protocol...',
    tokenomics: 'TOKENOMICS\nTotal Supply: 1,000,000,000 TKNX\nTeam: 20%...',
    team: 'TEAM\nJohn Smith - CEO\nJane Doe - CTO...',
    technical: 'TECHNICAL ARCHITECTURE\nBuilt using Solidity 0.8.x...',
    roadmap: '',
    useCase: '',
    security: 'SECURITY\nAudited by CertiK...',
    legal: '',
    other: ''
  },
  status: 'ready_for_gemini_analysis'
};

// Mock GitHub data (simulating Phase 3 output)
const mockGithubData = {
  metadata: {
    repository: 'test/token-contract',
    owner: 'test',
    repo: 'token-contract',
    fetchedAt: '2026-02-08T12:00:00.000Z',
    totalFiles: 5,
    totalLines: 500,
    totalSize: 25000,
    categories: {
      contracts: 3,
      interfaces: 1,
      libraries: 1,
      other: 0
    },
    skippedFiles: 0,
    failedFiles: 0
  },
  files: [
    {
      path: 'contracts/Token.sol',
      category: 'contract',
      content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenX is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public teamAllocation = 45; // 45% - DISCREPANCY: PDF says 20%
    uint256 public taxRate = 5; // 5% - DISCREPANCY: PDF says 3%
    
    mapping(address => bool) public isExcludedFromFee;
    
    constructor() ERC20("TokenX", "TKNX") {
        _mint(msg.sender, MAX_SUPPLY);
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * taxRate) / 100;
        uint256 netAmount = amount - fee;
        
        super.transfer(to, netAmount);
        super.transfer(owner(), fee);
        
        return true;
    }
    
    // Owner can mint unlimited tokens - vulnerability
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function setTaxRate(uint256 newRate) public onlyOwner {
        taxRate = newRate;
    }
    
    function withdrawAll() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
      `,
      size: 1200,
      lines: 45,
      sha: 'abc123'
    }
  ],
  combinedCode: `
// ==========================================
// File: contracts/Token.sol
// Lines: 45
// Size: 1.17 KB
// ==========================================

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenX is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public teamAllocation = 45; // 45%
    uint256 public taxRate = 5; // 5%
    
    constructor() ERC20("TokenX", "TKNX") {
        _mint(msg.sender, MAX_SUPPLY);
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function setTaxRate(uint256 newRate) public onlyOwner {
        taxRate = newRate;
    }
}
  `,
  status: 'ready_for_gemini_analysis'
};

// Mock Gemini response (simulating AI output)
const mockGeminiResponse = `
{
  "discrepancies": [
    {
      "type": "allocation_mismatch",
      "severity": "HIGH",
      "pdfClaim": "Team: 20%",
      "codeReality": "teamAllocation = 45%",
      "description": "Team allocation in code is 45%, but whitepaper claims 20%",
      "impact": "Team controls 225% more tokens than disclosed",
      "codeLocation": "contracts/Token.sol:11"
    },
    {
      "type": "tax_mismatch",
      "severity": "MEDIUM",
      "pdfClaim": "3% transaction fee",
      "codeReality": "taxRate = 5%",
      "description": "Transaction tax is 5% in code, not 3% as claimed",
      "impact": "Users pay 67% more in fees than expected",
      "codeLocation": "contracts/Token.sol:12"
    }
  ],
  "vulnerabilities": [
    {
      "type": "access_control",
      "severity": "HIGH",
      "location": "Token.sol:mint()",
      "description": "Owner can mint unlimited tokens after deployment",
      "exploit": "Owner can inflate supply and dump tokens",
      "recommendation": "Remove mint function or add max supply check"
    }
  ],
  "codeQualityIssues": [
    {
      "type": "centralization",
      "severity": "HIGH",
      "description": "Owner has excessive control: can mint, change tax, withdraw funds",
      "location": "Token.sol:onlyOwner functions",
      "recommendation": "Implement timelock or multi-sig for admin functions"
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
    "vestingDetails": "No vesting mechanism found despite whitepaper claims",
    "burnMechanismImplemented": false,
    "burnDetails": "No burn function found despite whitepaper claims",
    "unlimitedMinting": true,
    "mintingDetails": "Owner can mint unlimited tokens via mint() function",
    "maxWalletLimit": false,
    "antiBotProtection": false
  },
  "riskScore": {
    "overall": 2.5,
    "breakdown": {
      "pdfCodeAlignment": 2,
      "securityScore": 4,
      "codeQualityScore": 3,
      "tokenomicsScore": 2
    },
    "classification": "HIGH-RISK",
    "confidence": "HIGH"
  },
  "summary": "This project has critical discrepancies between whitepaper and code. Team allocation is 45% not 20% as claimed. Transaction tax is 5% not 3%. Owner can mint unlimited tokens. No vesting or burn mechanism despite claims. HIGH RISK project.",
  "redFlags": [
    "Team allocation 125% higher than disclosed",
    "Unlimited minting capability",
    "No vesting mechanism despite claims",
    "Owner can change fees without limits"
  ],
  "positiveAspects": [
    "Uses OpenZeppelin contracts",
    "Solidity 0.8.x (overflow protection)"
  ]
}
`;

// =============================================================================
// UNIT TESTS
// =============================================================================

console.log('═══════════════════════════════════════════════════════════');
console.log('  PHASE 4: GEMINI ANALYZER TESTS');
console.log('═══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${expected}, got ${actual}`);
  }
}

function assertExists(value, message = '') {
  if (value === undefined || value === null) {
    throw new Error(`${message} Value should exist`);
  }
}

function assertArray(value, message = '') {
  if (!Array.isArray(value)) {
    throw new Error(`${message} Expected array, got ${typeof value}`);
  }
}

// ============================================================================
// TEST: parseGeminiResponse
// ============================================================================

console.log('\n📋 Testing parseGeminiResponse()');
console.log('─'.repeat(50));

test('Parse valid JSON response', () => {
  const result = parseGeminiResponse(mockGeminiResponse);
  assertExists(result.riskScore, 'riskScore');
  assertEqual(result.riskScore.overall, 2.5, 'riskScore.overall');
  assertEqual(result.riskScore.classification, 'HIGH-RISK', 'classification');
});

test('Parse response with markdown code blocks', () => {
  const wrappedResponse = '```json\n' + mockGeminiResponse + '\n```';
  const result = parseGeminiResponse(wrappedResponse);
  assertExists(result.riskScore, 'riskScore');
  assertEqual(result.discrepancies.length, 2, 'discrepancies count');
});

test('Parse response handles arrays correctly', () => {
  const result = parseGeminiResponse(mockGeminiResponse);
  assertArray(result.discrepancies, 'discrepancies');
  assertArray(result.vulnerabilities, 'vulnerabilities');
  assertArray(result.redFlags, 'redFlags');
});

test('Parse invalid JSON returns fallback', () => {
  const result = parseGeminiResponse('This is not valid JSON at all');
  assertEqual(result.parseError, true, 'parseError flag');
  assertExists(result.rawResponse, 'rawResponse');
});

test('Parse empty response returns fallback', () => {
  const result = parseGeminiResponse('');
  assertArray(result.discrepancies, 'discrepancies');
  assertArray(result.vulnerabilities, 'vulnerabilities');
});

// ============================================================================
// TEST: generateRecommendation
// ============================================================================

console.log('\n📋 Testing generateRecommendation()');
console.log('─'.repeat(50));

test('Critical vulnerability returns DO NOT INVEST', () => {
  const analysis = {
    vulnerabilities: [{ severity: 'CRITICAL', type: 'reentrancy' }],
    discrepancies: [],
    riskScore: { overall: 2 }
  };
  const recommendation = generateRecommendation(analysis);
  assertEqual(recommendation.includes('DO NOT INVEST'), true, 'Contains DO NOT INVEST');
  assertEqual(recommendation.includes('critical'), true, 'Mentions critical');
});

test('Multiple high discrepancies returns DO NOT INVEST', () => {
  const analysis = {
    vulnerabilities: [],
    discrepancies: [
      { severity: 'HIGH', type: 'allocation' },
      { severity: 'HIGH', type: 'tax' },
      { severity: 'HIGH', type: 'vesting' }
    ],
    riskScore: { overall: 3 }
  };
  const recommendation = generateRecommendation(analysis);
  assertEqual(recommendation.includes('DO NOT INVEST'), true, 'Contains DO NOT INVEST');
});

test('High score returns SAFE TO INVEST', () => {
  const analysis = {
    vulnerabilities: [],
    discrepancies: [],
    riskScore: { overall: 9 }
  };
  const recommendation = generateRecommendation(analysis);
  assertEqual(recommendation.includes('SAFE TO INVEST'), true, 'Contains SAFE TO INVEST');
});

test('Medium score returns PROCEED WITH CAUTION', () => {
  const analysis = {
    vulnerabilities: [{ severity: 'LOW' }],
    discrepancies: [],
    riskScore: { overall: 6.5 }
  };
  const recommendation = generateRecommendation(analysis);
  assertEqual(recommendation.includes('CAUTION'), true, 'Contains CAUTION');
});

test('Handles missing arrays gracefully', () => {
  const analysis = { riskScore: { overall: 5 } };
  const recommendation = generateRecommendation(analysis);
  assertExists(recommendation, 'recommendation');
});

// ============================================================================
// TEST: buildAnalysisPrompt
// ============================================================================

console.log('\n📋 Testing buildAnalysisPrompt()');
console.log('─'.repeat(50));

test('Build prompt includes PDF content', () => {
  const prompt = buildAnalysisPrompt(mockPdfData, mockGithubData);
  assertEqual(prompt.includes('WHITEPAPER TEXT'), true, 'Contains WHITEPAPER TEXT section');
  assertEqual(prompt.includes('TokenX'), true, 'Contains PDF content');
});

test('Build prompt includes GitHub code', () => {
  const prompt = buildAnalysisPrompt(mockPdfData, mockGithubData);
  assertEqual(prompt.includes('SMART CONTRACT CODE'), true, 'Contains SMART CONTRACT CODE section');
  assertEqual(prompt.includes('pragma solidity'), true, 'Contains Solidity code');
});

test('Build prompt includes JSON output format', () => {
  const prompt = buildAnalysisPrompt(mockPdfData, mockGithubData);
  assertEqual(prompt.includes('discrepancies'), true, 'Contains discrepancies field');
  assertEqual(prompt.includes('vulnerabilities'), true, 'Contains vulnerabilities field');
  assertEqual(prompt.includes('riskScore'), true, 'Contains riskScore field');
});

test('Build prompt includes analysis instructions', () => {
  const prompt = buildAnalysisPrompt(mockPdfData, mockGithubData);
  assertEqual(prompt.includes('CROSS-VALIDATION'), true, 'Contains CROSS-VALIDATION');
  assertEqual(prompt.includes('SECURITY VULNERABILITIES'), true, 'Contains SECURITY');
  assertEqual(prompt.includes('reentrancy'), true, 'Mentions reentrancy');
});

// ============================================================================
// TEST: buildQuickAnalysisPrompt
// ============================================================================

console.log('\n📋 Testing buildQuickAnalysisPrompt()');
console.log('─'.repeat(50));

test('Quick prompt includes code only', () => {
  const prompt = buildQuickAnalysisPrompt(mockGithubData);
  assertEqual(prompt.includes('SMART CONTRACT CODE'), true, 'Contains code section');
  assertEqual(prompt.includes('WHITEPAPER TEXT'), false, 'No whitepaper section');
});

test('Quick prompt has simpler output format', () => {
  const prompt = buildQuickAnalysisPrompt(mockGithubData);
  assertEqual(prompt.includes('vulnerabilities'), true, 'Contains vulnerabilities');
  assertEqual(prompt.includes('tokenomicsAnalysis'), true, 'Contains tokenomicsAnalysis');
});

// ============================================================================
// TEST: generateReport
// ============================================================================

console.log('\n📋 Testing generateReport()');
console.log('─'.repeat(50));

test('Generate report includes header', () => {
  const analysisResult = {
    aiAnalysis: parseGeminiResponse(mockGeminiResponse),
    finalVerdict: {
      trustScore: 2.5,
      classification: 'HIGH-RISK',
      recommendation: 'DO NOT INVEST - Critical issues found'
    }
  };
  const report = generateReport(analysisResult);
  assertEqual(report.includes('SECURITY ANALYSIS REPORT'), true, 'Contains header');
});

test('Generate report includes risk assessment', () => {
  const analysisResult = {
    aiAnalysis: parseGeminiResponse(mockGeminiResponse),
    finalVerdict: {
      trustScore: 2.5,
      classification: 'HIGH-RISK',
      recommendation: 'DO NOT INVEST'
    }
  };
  const report = generateReport(analysisResult);
  assertEqual(report.includes('Trust Score'), true, 'Contains Trust Score');
  assertEqual(report.includes('HIGH-RISK'), true, 'Contains classification');
});

test('Generate report includes vulnerabilities', () => {
  const analysisResult = {
    aiAnalysis: parseGeminiResponse(mockGeminiResponse),
    finalVerdict: {
      trustScore: 2.5,
      classification: 'HIGH-RISK',
      recommendation: 'DO NOT INVEST'
    }
  };
  const report = generateReport(analysisResult);
  assertEqual(report.includes('VULNERABILITIES') || report.includes('SEVERITY'), true, 'Contains vulnerability section');
});

test('Generate report includes recommendation', () => {
  const analysisResult = {
    aiAnalysis: parseGeminiResponse(mockGeminiResponse),
    finalVerdict: {
      trustScore: 2.5,
      classification: 'HIGH-RISK',
      recommendation: 'DO NOT INVEST - Critical issues'
    }
  };
  const report = generateReport(analysisResult);
  assertEqual(report.includes('RECOMMENDATION'), true, 'Contains RECOMMENDATION');
});

// ============================================================================
// INTEGRATION TESTS (requires API key)
// ============================================================================

async function runIntegrationTests() {
  console.log('\n📋 Integration Tests (Gemini API)');
  console.log('─'.repeat(50));
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  SKIPPED: GEMINI_API_KEY not found in environment');
    console.log('   To run integration tests, add GEMINI_API_KEY to .env file');
    return;
  }
  
  console.log('🔑 Gemini API key found, running integration tests...\n');
  
  // Test: analyzeQuick with real Gemini API
  try {
    console.log('   Testing analyzeQuick()...');
    const result = await analyzeQuick(mockGithubData);
    
    if (result && result.finalVerdict && result.aiAnalysis) {
      console.log(`✅ PASS: analyzeQuick() returned valid result`);
      console.log(`   Trust Score: ${result.finalVerdict.trustScore}`);
      console.log(`   Classification: ${result.finalVerdict.classification}`);
      console.log(`   Vulnerabilities: ${result.aiAnalysis.vulnerabilities?.length || 0}`);
      passed++;
    } else {
      console.log(`❌ FAIL: analyzeQuick() returned invalid structure`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: analyzeQuick() threw error: ${error.message}`);
    failed++;
  }
  
  // Test: Full analysis (analyzeWithGemini) - Optional, takes longer
  if (process.env.RUN_FULL_INTEGRATION_TEST === 'true') {
    try {
      console.log('\n   Testing analyzeWithGemini() (full analysis)...');
      const result = await analyzeWithGemini(mockPdfData, mockGithubData);
      
      if (result && result.finalVerdict && result.aiAnalysis && result.report) {
        console.log(`✅ PASS: analyzeWithGemini() returned valid result`);
        console.log(`   Trust Score: ${result.finalVerdict.trustScore}`);
        console.log(`   Classification: ${result.finalVerdict.classification}`);
        console.log(`   Discrepancies: ${result.aiAnalysis.discrepancies?.length || 0}`);
        console.log(`   Vulnerabilities: ${result.aiAnalysis.vulnerabilities?.length || 0}`);
        passed++;
      } else {
        console.log(`❌ FAIL: analyzeWithGemini() returned invalid structure`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAIL: analyzeWithGemini() threw error: ${error.message}`);
      failed++;
    }
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  // Run unit tests (synchronous)
  console.log('\n');
  
  // Run integration tests (async)
  await runIntegrationTests();
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Total:  ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review the output above.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!\n');
    process.exit(0);
  }
}

runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
