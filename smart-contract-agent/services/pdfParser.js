
/**
 * PDF Parser Service - Phase 2
 * Extracts and structures whitepaper content from PDF files
 * 
 * PURPOSE: Prepare PDF text for Gemini AI analysis
 * - Extract all text from PDF
 * - Detect and organize sections
 * - Structure data for AI consumption
 * 
 * NO ANALYSIS HERE - All analysis happens in Phase 4 with Gemini
 */

const fs = require('fs');
const pdfParse = require('pdf-parse');
const log = require('../utils/logger');

// =============================================================================
// 1. PDF TEXT EXTRACTION
// =============================================================================

/**
 * Extract text content from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} Extracted text and metadata
 */
async function extractTextFromPdf(filePath) {
  try {
    log.debug('Extracting text from PDF', { filePath });

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }

    // Read PDF file as buffer
    const dataBuffer = fs.readFileSync(filePath);

    // Parse PDF with pdf-parse library
    const pdfData = await pdfParse(dataBuffer);

    log.info('PDF text extraction successful', {
      pages: pdfData.numpages,
      textLength: pdfData.text.length
    });

    return {
      text: pdfData.text,
      numPages: pdfData.numpages,
      info: pdfData.info,
      metadata: pdfData.metadata
    };
  } catch (error) {
    log.error('PDF extraction failed', { error: error.message });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// =============================================================================
// 2. SECTION DETECTION AND PARSING
// =============================================================================

/**
 * Detect and extract different sections from whitepaper text
 * Sections help Gemini understand the structure and context
 * 
 * @param {string} text - Full text content from PDF
 * @returns {Object} Organized sections with extracted content
 */
function detectSections(text) {
  const sections = {
    overview: '',
    tokenomics: '',
    team: '',
    technical: '',
    roadmap: '',
    useCase: '',
    security: '',
    legal: '',
    other: ''
  };

  // Section keyword patterns (case-insensitive)
  const sectionPatterns = {
    overview: /(?:^|\n)(?:overview|introduction|abstract|executive summary|about)/i,
    tokenomics: /(?:^|\n)(?:tokenomics|token distribution|token economy|token allocation|economics)/i,
    team: /(?:^|\n)(?:team|about us|founders|core team|our team|leadership)/i,
    technical: /(?:^|\n)(?:technical|technology|architecture|implementation|technical details)/i,
    roadmap: /(?:^|\n)(?:roadmap|timeline|milestones|development plan)/i,
    useCase: /(?:^|\n)(?:use case|utility|application|features|use cases)/i,
    security: /(?:^|\n)(?:audit|security|audited by|security audit)/i,
    legal: /(?:^|\n)(?:legal|disclaimer|regulatory|compliance|legal notice)/i
  };

  // Find all section headers with their positions
  const sectionPositions = [];
  
  for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
    const match = pattern.exec(text);
    if (match) {
      sectionPositions.push({
        name: sectionName,
        position: match.index,
        header: match[0].trim()
      });
    }
  }

  // Sort sections by position in document
  sectionPositions.sort((a, b) => a.position - b.position);

  // Extract text between section headers
  for (let i = 0; i < sectionPositions.length; i++) {
    const currentSection = sectionPositions[i];
    const nextSection = sectionPositions[i + 1];
    
    const startPos = currentSection.position;
    const endPos = nextSection ? nextSection.position : text.length;
    
    const sectionText = text.substring(startPos, endPos).trim();
    sections[currentSection.name] = sectionText;
  }

  // If no sections found, put everything in 'other'
  if (sectionPositions.length === 0) {
    sections.other = text;
  }

  log.info('Sections detected', {
    found: sectionPositions.map(s => s.name),
    totalSections: sectionPositions.length
  });

  return sections;
}

// ==========================================================================
// 3. BASIC TEXT CLEANING
// =============================================================================

/**
 * Clean and normalize extracted text
 * @param {string} text - Raw text from PDF
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  if (!text) return '';

  let cleaned = text;

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Remove page numbers (common patterns)
  cleaned = cleaned.replace(/\bPage \d+\b/gi, '');
  cleaned = cleaned.replace(/\b\d+\s*\/\s*\d+\b/g, '');

  // Remove common PDF artifacts
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

// =============================================================================
// 4. MAIN ANALYSIS FUNCTION
// =============================================================================

/**
 * Main PDF analysis function
 * Extracts and structures PDF content for Gemini AI
 * 
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Object>} Structured PDF data ready for AI analysis
 */
async function analyzePdf(filePath) {
  try {
    log.info('Starting PDF analysis', { filePath });

    // Step 1: Extract text from PDF
    const extracted = await extractTextFromPdf(filePath);
    const rawText = extracted.text;

    // Step 2: Clean the text
    const cleanedText = cleanText(rawText);

    // Step 3: Detect and organize sections
    const sections = detectSections(cleanedText);

    // Step 4: Prepare structured output for Gemini
    const analysis = {
      // Metadata
      metadata: {
        fileName: filePath.split('/').pop(),
        pages: extracted.numPages,
        extractedAt: new Date().toISOString(),
        textLength: cleanedText.length,
        sectionsFound: Object.keys(sections).filter(key => sections[key].length > 0)
      },

      // Full text (for Gemini to analyze)
      fullText: cleanedText,

      // Organized sections (helps Gemini understand structure)
      sections: sections,

      // Ready for Phase 4 integration
      status: 'ready_for_gemini_analysis'
    };

    log.info('PDF analysis complete', {
      pages: analysis.metadata.pages,
      textLength: analysis.metadata.textLength,
      sectionsFound: analysis.metadata.sectionsFound.length
    });

    return analysis;

  } catch (error) {
    log.error('PDF analysis failed', { error: error.message });
    throw error;
  }
}

// =============================================================================
// 5. HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a human-readable summary of PDF extraction
 * @param {Object} analysis - Analysis result from analyzePdf()
 * @returns {string} Formatted summary
 */
function generateSummary(analysis) {
  const { metadata, sections } = analysis;

  let summary = '=== PDF EXTRACTION SUMMARY ===\n\n';
  summary += `File: ${metadata.fileName}\n`;
  summary += `Pages: ${metadata.pages}\n`;
  summary += `Text Length: ${metadata.textLength} characters\n`;
  summary += `Extracted: ${metadata.extractedAt}\n\n`;

  summary += '=== SECTIONS DETECTED ===\n';
  metadata.sectionsFound.forEach(section => {
    const sectionLength = sections[section].length;
    summary += `- ${section}: ${sectionLength} characters\n`;
  });

  summary += '\n=== STATUS ===\n';
  summary += `Status: ${analysis.status}\n`;
  summary += 'Ready to send to Gemini AI for analysis\n';

  return summary;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  extractTextFromPdf,
  detectSections,
  cleanText,
  analyzePdf,
  generateSummary
};