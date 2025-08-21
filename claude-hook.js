#!/usr/bin/env node

/**
 * Claude Code Hook Script
 * 
 * This script monitors Claude Code output for the phrase "You're absolutely right!"
 * and increments the counter via the API when detected.
 * 
 * Setup:
 * 1. Make sure this script is executable: chmod +x claude-hook.js
 * 2. API configuration is automatically loaded from .env.development.local
 * 3. Configure this as a Claude Code hook
 * 
 * Usage as Claude Code Hook:
 * Add this to your Claude Code settings or use the hook configuration.
 */

const https = require('https');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.development.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.development.local');
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            let value = valueParts.join('=');
            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            process.env[key] = value;
          }
        }
      }
      console.log('✅ Loaded environment from .env.development.local');
    }
  } catch (error) {
    console.log('⚠️ Could not load .env.development.local:', error.message);
  }
}

// Load env file first
loadEnvFile();

// Configuration
const API_URL = process.env.COUNTER_API_URL || 'https://absolutely-right.lefley.dev/api/increment';
const API_SECRET = process.env.API_SECRET;
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
  // Read JSON input from stdin (Claude Code hook format)
  let buffer = '';
  
  process.stdin.on('data', (data) => {
    buffer += data.toString();
  });

  process.stdin.on('end', () => {
    try {
      // Parse the JSON input from Claude Code
      const hookData = JSON.parse(buffer);
      
      if (hookData.transcript_path) {
        // Read the transcript file
        const transcript = JSON.parse(fs.readFileSync(hookData.transcript_path, 'utf8'));
        
        // Get the last assistant message
        const messages = transcript.messages || [];
        const lastAssistantMessage = messages
          .filter(msg => msg.role === 'assistant')
          .pop();
        
        if (lastAssistantMessage && lastAssistantMessage.content) {
          const content = Array.isArray(lastAssistantMessage.content) 
            ? lastAssistantMessage.content.map(c => c.text || c).join(' ')
            : lastAssistantMessage.content;
          
          // Check for the trigger phrase
          if (content.includes(TRIGGER_PHRASE)) {
            const matches = (content.match(new RegExp(TRIGGER_PHRASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            
            for (let i = 0; i < matches; i++) {
              incrementCounter();
            }
          }
        }
      } else {
        // Fallback: treat input as plain text (for manual testing)
        if (buffer.includes(TRIGGER_PHRASE)) {
          const matches = (buffer.match(new RegExp(TRIGGER_PHRASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
          for (let i = 0; i < matches; i++) {
            incrementCounter();
          }
        }
      }
    } catch (error) {
      // If JSON parsing fails, treat as plain text (backward compatibility)
      if (buffer.includes(TRIGGER_PHRASE)) {
        const matches = (buffer.match(new RegExp(TRIGGER_PHRASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        for (let i = 0; i < matches; i++) {
          incrementCounter();
        }
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