/**
 * Test script for the enhanced Notion parser with subpages
 * 
 * Usage:
 * npx ts-node scripts/test-notion-parser.ts <notion-api-key> <page-id> [depth]
 * 
 * Example:
 * npx ts-node scripts/test-notion-parser.ts secret_abc123 f123456789abcdef1234 2
 */

import { getPageWithSubpages } from '../src/lib/api/notion';
import fs from 'fs';
import path from 'path';

// Get command line arguments
const apiKey = process.argv[2];
const pageId = process.argv[3];
const depth = parseInt(process.argv[4] || '2', 10);

if (!apiKey || !pageId) {
  console.error('Usage: npx ts-node scripts/test-notion-parser.ts <notion-api-key> <page-id> [depth]');
  process.exit(1);
}

// Output directory for test results
const outputDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to count total pages in result (including nested subpages)
const countTotalPages = (result: any): number => {
  if (!result || !result.subpages || !Array.isArray(result.subpages)) {
    return 1; // Just the main page
  }
  
  // Count this page plus the sum of all subpages
  return 1 + result.subpages.reduce((count: number, subpage: any) => count + countTotalPages(subpage), 0);
};

// Helper to extract all page titles into a flat list
const extractPageTitles = (result: any, titles: string[] = []): string[] => {
  if (!result || !result.page) {
    return titles;
  }
  
  // Extract title from page properties
  let pageTitle = 'Untitled';
  try {
    if (result.page.properties) {
      const properties = result.page.properties;
      // Find title property (could be named "title" or "Name" depending on page structure)
      const titleProperty = 
        (properties.title && properties.title.title) ? properties.title :
        (properties.Name && properties.Name.title) ? properties.Name :
        Object.values(properties).find((prop: any) => 
          prop && prop.type === 'title' && prop.title && Array.isArray(prop.title) && prop.title.length > 0
        );
      
      if (titleProperty && titleProperty.title && Array.isArray(titleProperty.title)) {
        pageTitle = titleProperty.title
          .map((t: any) => t && t.plain_text ? t.plain_text : '')
          .join('');
      }
    }
  } catch (error) {
    console.error('Error extracting page title');
  }
  
  titles.push(pageTitle);
  
  // Process subpages recursively
  if (result.subpages && Array.isArray(result.subpages)) {
    result.subpages.forEach((subpage: any) => extractPageTitles(subpage, titles));
  }
  
  return titles;
};

// Helper to sanitize content for console output
const formatStructure = (result: any, level = 0): string => {
  if (!result || !result.page) {
    return '';
  }
  
  // Extract title from page properties
  let pageTitle = 'Untitled';
  try {
    if (result.page.properties) {
      const properties = result.page.properties;
      // Find title property
      const titleProperty = 
        (properties.title && properties.title.title) ? properties.title :
        (properties.Name && properties.Name.title) ? properties.Name :
        Object.values(properties).find((prop: any) => 
          prop && prop.type === 'title' && prop.title && Array.isArray(prop.title) && prop.title.length > 0
        );
      
      if (titleProperty && titleProperty.title && Array.isArray(titleProperty.title)) {
        pageTitle = titleProperty.title
          .map((t: any) => t && t.plain_text ? t.plain_text : '')
          .join('');
      }
    }
  } catch (error) {
    console.error('Error extracting page title');
  }
  
  const indent = '  '.repeat(level);
  let output = `${indent}📄 ${pageTitle} (${result.blocks?.length || 0} blocks)\n`;
  
  // Process subpages recursively
  if (result.subpages && Array.isArray(result.subpages)) {
    result.subpages.forEach((subpage: any) => {
      output += formatStructure(subpage, level + 1);
    });
  }
  
  return output;
};

// Main function
async function testNotionParser() {
  console.log(`Testing Notion parser with page ID: ${pageId} (depth: ${depth})`);
  console.log(`Using API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  
  try {
    console.time('Fetch time');
    
    // Fetch the page and its subpages
    const result = await getPageWithSubpages(apiKey, pageId, depth);
    
    console.timeEnd('Fetch time');
    
    // Count total pages
    const totalPages = countTotalPages(result);
    
    // Extract all page titles
    const pageTitles = extractPageTitles(result);
    
    // Print summary
    console.log('\n===== PARSER TEST RESULTS =====');
    console.log(`Total pages fetched: ${totalPages}`);
    console.log(`Main page ID: ${result.page?.id || 'unknown'}`);
    console.log(`Main page blocks: ${result.blocks?.length || 0}`);
    console.log(`Direct subpages: ${result.subpages?.length || 0}`);
    
    // Print page hierarchy
    console.log('\n===== PAGE HIERARCHY =====');
    console.log(formatStructure(result));
    
    // Save results to file
    const outputFile = path.join(outputDir, `notion-test-${Date.now()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`\nDetailed results saved to: ${outputFile}`);
    
    // Success!
    console.log('\n✅ Parser test completed successfully');
    
  } catch (error) {
    console.error('Error testing Notion parser:', error);
    process.exit(1);
  }
}

// Run the test
testNotionParser().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 