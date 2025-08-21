#!/usr/bin/env node

/**
 * Claude Code Hook Script
 * 
 * This script monitors Claude Code output for the phrase "You're absolutely right!"
 * and increments the counter via the API when detected.
 * 
 * Setup:
 * 1. Make sure this script is executable: chmod +x claude-hook.js
 * 2. Set your API endpoint and secret as environment variables:
 *    export COUNTER_API_URL="https://absolutely-right.lefley.dev/api/increment"
 *    export COUNTER_API_SECRET="your-api-secret-here"
 * 3. Configure this as a Claude Code hook
 * 
 * Usage as Claude Code Hook:
 * Add this to your Claude Code settings or use the hook configuration.
 */

const https = require('https');
const http = require('http');
const url = require('url');

// Configuration
const API_URL = process.env.COUNTER_API_URL || 'https://absolutely-right.lefley.dev/api/increment';
const API_SECRET = process.env.COUNTER_API_SECRET;
const TRIGGER_PHRASE = "You're absolutely right!";

// Validate configuration
if (!API_SECRET) {
  console.error('❌ COUNTER_API_SECRET environment variable is required');
  process.exit(1);
}

function makeAPIRequest(data, callback) {
  const parsedUrl = url.parse(API_URL);
  const isHttps = parsedUrl.protocol === 'https:';
  const client = isHttps ? https : http;
  
  const postData = JSON.stringify(data);
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': `Bearer ${API_SECRET}`,
      'User-Agent': 'Claude-Code-Hook/1.0'
    }
  };

  const req = client.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(body);
        callback(null, response, res.statusCode);
      } catch (error) {
        callback(new Error(`Failed to parse response: ${body}`), null, res.statusCode);
      }
    });
  });

  req.on('error', (error) => {
    callback(error, null, null);
  });

  req.setTimeout(10000, () => {
    req.destroy();
    callback(new Error('Request timeout'), null, null);
  });

  req.write(postData);
  req.end();
}

function incrementCounter() {
  console.log('🎯 Detected "You\'re absolutely right!" - incrementing counter...');
  
  makeAPIRequest({}, (error, response, statusCode) => {
    if (error) {
      console.error('❌ Failed to increment counter:', error.message);
      return;
    }
    
    if (statusCode === 200 || statusCode === 201) {
      console.log(`✅ Counter incremented! New total: ${response.total || 'unknown'}`);
    } else {
      console.error(`❌ API returned status ${statusCode}:`, response);
    }
  });
}

function processInput() {
  // Read from stdin (Claude Code output)
  let buffer = '';
  
  process.stdin.on('data', (data) => {
    buffer += data.toString();
    
    // Check for the trigger phrase
    if (buffer.includes(TRIGGER_PHRASE)) {
      // Count occurrences in this chunk
      const matches = (buffer.match(new RegExp(TRIGGER_PHRASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      
      // Increment counter for each occurrence
      for (let i = 0; i < matches; i++) {
        incrementCounter();
      }
      
      // Reset buffer to avoid double counting
      buffer = '';
    }
    
    // Keep buffer size manageable (last 1000 chars)
    if (buffer.length > 1000) {
      buffer = buffer.slice(-1000);
    }
  });

  process.stdin.on('end', () => {
    // Final check on remaining buffer
    if (buffer.includes(TRIGGER_PHRASE)) {
      const matches = (buffer.match(new RegExp(TRIGGER_PHRASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      for (let i = 0; i < matches; i++) {
        incrementCounter();
      }
    }
  });
}

// Handle CLI usage for testing
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    console.log('🧪 Testing counter increment...');
    incrementCounter();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Claude Code Hook - "You're Absolutely Right!" Counter

Environment Variables:
  COUNTER_API_URL      API endpoint URL (default: https://absolutely-right.lefley.dev/api/increment)
  COUNTER_API_SECRET   API secret token (required)

Usage:
  node claude-hook.js               # Run as hook (reads from stdin)
  node claude-hook.js --test        # Test API connection
  node claude-hook.js --help        # Show this help

As Claude Code Hook:
  Configure this script as a post-output hook in your Claude Code settings.
    `);
  } else {
    console.log('🔍 Monitoring Claude Code output for "You\'re absolutely right!"...');
    console.log('   Press Ctrl+C to stop');
    processInput();
  }
}