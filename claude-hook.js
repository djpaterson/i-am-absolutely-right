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

// Track processed messages to prevent duplicates
const PROCESSED_IDS_FILE = path.join(__dirname, '.processed-messages.json');

function loadProcessedIds() {
  try {
    if (fs.existsSync(PROCESSED_IDS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROCESSED_IDS_FILE, 'utf8'));
      return new Set(data);
    }
  } catch (error) {
    console.log('⚠️ Could not load processed message IDs:', error.message);
  }
  return new Set();
}

function saveProcessedIds(processedIds) {
  try {
    fs.writeFileSync(PROCESSED_IDS_FILE, JSON.stringify([...processedIds]));
  } catch (error) {
    console.log('⚠️ Could not save processed message IDs:', error.message);
  }
}

function processInput() {
  // Load processed IDs from file
  const processedMessageIds = loadProcessedIds();
  
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
        // Read the JSONL transcript file
        const transcriptContent = fs.readFileSync(hookData.transcript_path, 'utf8');
        const lines = transcriptContent.trim().split('\n');
        
        // Parse each line as JSON and find assistant messages
        const assistantMessages = [];
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.type === 'assistant' && entry.message && entry.message.role === 'assistant') {
              assistantMessages.push(entry);
            }
          } catch (parseError) {
            // Skip invalid lines
          }
        }
        
        // Get the last assistant message
        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
        
        if (lastAssistantMessage && lastAssistantMessage.message) {
          const messageId = lastAssistantMessage.uuid;
          const message = lastAssistantMessage.message;
          
          // Skip if we've already processed this message
          if (processedMessageIds.has(messageId)) {
            console.log(`🔄 Already processed message ${messageId}`);
            return;
          }
          
          // Extract text content from the message
          let textContent = '';
          if (message.content && Array.isArray(message.content)) {
            textContent = message.content
              .filter(c => c.type === 'text')
              .map(c => c.text)
              .join(' ');
          }
          
          // Check for the trigger phrase
          if (textContent.includes(TRIGGER_PHRASE)) {
            const matches = (textContent.match(new RegExp(TRIGGER_PHRASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            
            console.log(`🎯 Found "${TRIGGER_PHRASE}" ${matches} time(s) in message ${messageId}`);
            
            for (let i = 0; i < matches; i++) {
              incrementCounter();
            }
            
            // Mark this message as processed
            processedMessageIds.add(messageId);
            saveProcessedIds(processedMessageIds);
          } else {
            // Still mark as processed to avoid checking again
            processedMessageIds.add(messageId);
            saveProcessedIds(processedMessageIds);
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
      console.error('❌ Error processing hook input:', error.message);
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