/**
 * GitHub Fetcher Test Suite - Phase 3
 * Tests GitHub repository code extraction functionality
 * 
 * Run with: node tests/githubFetcher.test.js
 */

const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test helper functions
function log(message) {
  console.log(message);
}

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

// Test Cases
const testCases = [
  {
    name: 'URL Parsing - Full HTTPS URL',
    type: 'parse',
    input: 'https://github.com/OpenZeppelin/openzeppelin-contracts',
    expected: { owner: 'OpenZeppelin', repo: 'openzeppelin-contracts' }
  },
  {
    name: 'URL Parsing - HTTP URL',
    type: 'parse',
    input: 'http://github.com/Uniswap/v3-core',
    expected: { owner: 'Uniswap', repo: 'v3-core' }
  },
  {
    name: 'URL Parsing - Without Protocol',
    type: 'parse',
    input: 'github.com/compound-finance/compound-protocol',
    expected: { owner: 'compound-finance', repo: 'compound-protocol' }
  },
  {
    name: 'URL Parsing - Short Format',
    type: 'parse',
    input: 'aave/aave-v3-core',
    expected: { owner: 'aave', repo: 'aave-v3-core' }
  },
  {
    name: 'URL Parsing - With Trailing Slash',
    type: 'parse',
    input: 'https://github.com/OpenZeppelin/openzeppelin-contracts/',
    expected: { owner: 'OpenZeppelin', repo: 'openzeppelin-contracts' }
  },
  {
    name: 'URL Parsing - With .git Extension',
    type: 'parse',
    input: 'https://github.com/Uniswap/v2-core.git',
    expected: { owner: 'Uniswap', repo: 'v2-core' }
  },
  {
    name: 'File Filtering - .sol File (Valid)',
    type: 'filter',
    input: { path: 'contracts/Token.sol', type: 'blob', size: 5000 },
    expected: true
  },
  {
    name: 'File Filtering - Test File (Skip)',
    type: 'filter',
    input: { path: 'test/Token.test.sol', type: 'blob', size: 3000 },
    expected: false
  },
  {
    name: 'File Filtering - Mock File (Skip)',
    type: 'filter',
    input: { path: 'contracts/mocks/MockToken.sol', type: 'blob', size: 2000 },
    expected: false
  },
  {
    name: 'File Filtering - Script File (Skip)',
    type: 'filter',
    input: { path: 'scripts/deploy.sol', type: 'blob', size: 1000 },
    expected: false
  },
  {
    name: 'File Filtering - Non-Solidity File (Skip)',
    type: 'filter',
    input: { path: 'contracts/Token.js', type: 'blob', size: 2000 },
    expected: false
  },
  {
    name: 'File Filtering - Directory (Skip)',
    type: 'filter',
    input: { path: 'contracts', type: 'tree' },
    expected: false
  },
  {
    name: 'File Categorization - Contract',
    type: 'categorize',
    input: 'contracts/Token.sol',
    expected: 'contracts'
  },
  {
    name: 'File Categorization - Nested Contract',
    type: 'categorize',
    input: 'contracts/core/Vault.sol',
    expected: 'contracts'
  },
  {
    name: 'File Categorization - Interface',
    type: 'categorize',
    input: 'interfaces/IERC20.sol',
    expected: 'interfaces'
  },
  {
    name: 'File Categorization - Library',
    type: 'categorize',
    input: 'libraries/SafeMath.sol',
    expected: 'libraries'
  },
  {
    name: 'File Categorization - Lib Folder',
    type: 'categorize',
    input: 'lib/utils/Helper.sol',
    expected: 'libraries'
  }
];

// Integration test cases (require GitHub API access)
const integrationTests = [
  {
    name: 'Fetch Small Repository',
    repo: 'Uniswap/v2-core',
    minFiles: 3,
    maxFiles: 15,
    shouldHaveContracts: true
  },
  {
    name: 'Fetch Repository with Nested Folders',
    repo: 'OpenZeppelin/openzeppelin-contracts',
    minFiles: 50,
    shouldHaveContracts: true,
    shouldHaveInterfaces: true,
    shouldHaveLibraries: true
  }
];

// Error test cases
const errorTests = [
  {
    name: 'Invalid Repository (404)',
    repo: 'InvalidOwner/invalid-repo-12345-xyz',
    expectedError: 'not found'
  },
  {
    name: 'Non-Solidity Repository',
    repo: 'microsoft/vscode',
    expectedError: 'No Solidity'
  },
  {
    name: 'Invalid URL Format',
    repo: 'not-a-valid-url-at-all',
    expectedError: 'Invalid'
  }
];

// =============================================================================
// TEST IMPLEMENTATION STUBS
// =============================================================================

/**
 * Parse GitHub URL (user needs to implement in githubFetcher.js)
 */
function parseGithubUrl(repoUrl) {
  let url = repoUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');
  
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /^([^\/]+)\/([^\/]+)$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      };
    }
  }
  
  throw new Error('Invalid GitHub repository URL format');
}

/**
 * Filter Solidity files (user needs to implement)
 */
function shouldIncludeFile(item) {
  if (item.type !== 'blob') return false;
  if (!item.path.endsWith('.sol')) return false;
  
  const lowerPath = item.path.toLowerCase();
  
  if (lowerPath.includes('/test/') || 
      lowerPath.includes('/tests/') ||
      lowerPath.startsWith('test/') ||
      lowerPath.includes('.test.sol')) {
    return false;
  }
  
  if (lowerPath.includes('/mocks/') || 
      lowerPath.includes('/examples/') ||
      lowerPath.includes('/mock/')) {
    return false;
  }
  
  if (lowerPath.includes('/scripts/') || lowerPath.includes('/script/')) {
    return false;
  }
  
  return true;
}

/**
 * Categorize file by path (user needs to implement)
 */
function categorizeFile(path) {
  const lowerPath = path.toLowerCase();
  
  if (lowerPath.includes('/contracts/') || lowerPath.startsWith('contracts/')) {
    return 'contracts';
  } else if (lowerPath.includes('/interfaces/') || lowerPath.startsWith('interfaces/')) {
    return 'interfaces';
  } else if (lowerPath.includes('/libraries/') || 
             lowerPath.includes('/lib/') ||
             lowerPath.startsWith('lib/')) {
    return 'libraries';
  }
  return 'other';
}

// =============================================================================
// TEST RUNNERS
// =============================================================================

/**
 * Run unit tests (no API calls)
 */
async function runUnitTests() {
  log('\n' + '='.repeat(80));
  log('UNIT TESTS - No API calls required');
  log('='.repeat(80) + '\n');

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    process.stdout.write(`\nTest: ${test.name}\n`);
    
    try {
      let result;
      
      if (test.type === 'parse') {
        result = parseGithubUrl(test.input);
        
        if (result.owner === test.expected.owner && result.repo === test.expected.repo) {
          logSuccess(`Parsed correctly: ${result.owner}/${result.repo}`);
          passed++;
        } else {
          logError(`Expected ${test.expected.owner}/${test.expected.repo}, got ${result.owner}/${result.repo}`);
          failed++;
        }
      } else if (test.type === 'filter') {
        result = shouldIncludeFile(test.input);
        
        if (result === test.expected) {
          logSuccess(`Filter result: ${result ? 'Include' : 'Skip'}`);
          passed++;
        } else {
          logError(`Expected ${test.expected}, got ${result}`);
          failed++;
        }
      } else if (test.type === 'categorize') {
        result = categorizeFile(test.input);
        
        if (result === test.expected) {
          logSuccess(`Category: ${result}`);
          passed++;
        } else {
          logError(`Expected ${test.expected}, got ${result}`);
          failed++;
        }
      }
    } catch (error) {
      logError(`Exception: ${error.message}`);
      failed++;
    }
  }

  return { passed, failed };
}

/**
 * Run integration tests (requires GitHub API and implementation)
 */
async function runIntegrationTests() {
  log('\n' + '='.repeat(80));
  log('INTEGRATION TESTS - Requires GitHub API access');
  log('='.repeat(80) + '\n');

  logWarning('Integration tests require:');
  logWarning('1. services/githubFetcher.js implemented');
  logWarning('2. GITHUB_TOKEN in .env file');
  logWarning('3. Network access to GitHub API');
  logInfo('\nSkipping integration tests for now.');
  logInfo('After implementing Phase 3, uncomment the test code below.\n');

  // Uncomment this block after implementing githubFetcher.js
  /*
  const { fetchGithubCode } = require('../services/githubFetcher');
  
  let passed = 0;
  let failed = 0;

  for (const test of integrationTests) {
    log(`\nTest: ${test.name}`);
    log(`Repository: ${test.repo}`);
    
    try {
      const result = await fetchGithubCode(test.repo);
      
      logInfo(`Result:`);
      logInfo(`  - Total files: ${result.metadata.totalFiles}`);
      logInfo(`  - Total lines: ${result.metadata.totalLines}`);
      logInfo(`  - Categories: ${JSON.stringify(result.metadata.categories)}`);
      
      // Validate expectations
      let testPassed = true;
      
      if (test.minFiles && result.metadata.totalFiles < test.minFiles) {
        logError(`Expected at least ${test.minFiles} files, got ${result.metadata.totalFiles}`);
        testPassed = false;
      }
      
      if (test.maxFiles && result.metadata.totalFiles > test.maxFiles) {
        logError(`Expected at most ${test.maxFiles} files, got ${result.metadata.totalFiles}`);
        testPassed = false;
      }
      
      if (test.shouldHaveContracts && result.metadata.categories.contracts === 0) {
        logError('Expected contracts category to have files');
        testPassed = false;
      }
      
      if (test.shouldHaveInterfaces && result.metadata.categories.interfaces === 0) {
        logError('Expected interfaces category to have files');
        testPassed = false;
      }
      
      if (test.shouldHaveLibraries && result.metadata.categories.libraries === 0) {
        logError('Expected libraries category to have files');
        testPassed = false;
      }
      
      if (testPassed) {
        logSuccess('All validations passed');
        passed++;
      } else {
        failed++;
      }
      
    } catch (error) {
      logError(`Exception: ${error.message}`);
      failed++;
    }
  }
  
  return { passed, failed };
  */
  
  return { passed: 0, failed: 0, skipped: integrationTests.length };
}

/**
 * Run error handling tests
 */
async function runErrorTests() {
  log('\n' + '='.repeat(80));
  log('ERROR HANDLING TESTS');
  log('='.repeat(80) + '\n');

  logWarning('Error tests require services/githubFetcher.js implemented');
  logInfo('Skipping error tests for now.\n');

  // Uncomment after implementation
  /*
  const { fetchGithubCode } = require('../services/githubFetcher');
  
  let passed = 0;
  let failed = 0;

  for (const test of errorTests) {
    log(`\nTest: ${test.name}`);
    log(`Repository: ${test.repo}`);
    
    try {
      await fetchGithubCode(test.repo);
      logError('Expected error to be thrown');
      failed++;
    } catch (error) {
      if (error.message.toLowerCase().includes(test.expectedError.toLowerCase())) {
        logSuccess(`Correctly caught error: ${error.message}`);
        passed++;
      } else {
        logError(`Expected error containing "${test.expectedError}", got: ${error.message}`);
        failed++;
      }
    }
  }
  
  return { passed, failed };
  */
  
  return { passed: 0, failed: 0, skipped: errorTests.length };
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.clear();
  
  log('╔' + '═'.repeat(78) + '╗');
  log('║' + ' '.repeat(20) + 'GITHUB FETCHER TEST SUITE' + ' '.repeat(33) + '║');
  log('║' + ' '.repeat(30) + 'PHASE 3' + ' '.repeat(42) + '║');
  log('╚' + '═'.repeat(78) + '╝');

  const startTime = Date.now();

  // Run all test suites
  const unitResults = await runUnitTests();
  const integrationResults = await runIntegrationTests();
  const errorResults = await runErrorTests();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Summary
  log('\n' + '='.repeat(80));
  log('TEST SUMMARY');
  log('='.repeat(80));
  
  const totalPassed = unitResults.passed + integrationResults.passed + errorResults.passed;
  const totalFailed = unitResults.failed + integrationResults.failed + errorResults.failed;
  const totalSkipped = (integrationResults.skipped || 0) + (errorResults.skipped || 0);
  const totalTests = totalPassed + totalFailed + totalSkipped;
  
  log(`\nUnit Tests:        ${unitResults.passed} passed, ${unitResults.failed} failed`);
  log(`Integration Tests: ${integrationResults.passed} passed, ${integrationResults.failed} failed, ${integrationResults.skipped || 0} skipped`);
  log(`Error Tests:       ${errorResults.passed} passed, ${errorResults.failed} failed, ${errorResults.skipped || 0} skipped`);
  log(`\nTotal:             ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped (${totalTests} total)`);
  log(`Duration:          ${duration}s`);
  
  if (totalFailed === 0 && totalSkipped === 0) {
    log(`\n${colors.green}🎉 ALL TESTS PASSED!${colors.reset}`);
    log(`\n${colors.green}✅ Phase 3 Component Testing Complete${colors.reset}`);
    log(`\nNext steps:`);
    log(`  1. Implement services/githubFetcher.js using the guide`);
    log(`  2. Add GITHUB_TOKEN to .env file`);
    log(`  3. Uncomment integration and error tests in this file`);
    log(`  4. Run tests again to verify implementation`);
  } else if (totalFailed === 0 && totalSkipped > 0) {
    log(`\n${colors.yellow}⚠️  UNIT TESTS PASSED, INTEGRATION TESTS SKIPPED${colors.reset}`);
    log(`\nUnit test logic is correct!`);
    log(`\nTo run integration tests:`);
    log(`  1. Implement services/githubFetcher.js`);
    log(`  2. Get GitHub token from https://github.com/settings/tokens`);
    log(`  3. Add to .env: GITHUB_TOKEN=your_token_here`);
    log(`  4. Uncomment integration test code in this file`);
    log(`  5. Run: node tests/githubFetcher.test.js`);
  } else {
    log(`\n${colors.red}❌ SOME TESTS FAILED${colors.reset}`);
    log(`\nPlease review the errors above and fix the implementation.`);
  }
  
  log('\n' + '='.repeat(80) + '\n');
  
  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

// =============================================================================
// RUN TESTS
// =============================================================================

runAllTests().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
