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
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Set NODE_ENV=production when running as Claude hook
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Load environment variables with dotenv from script directory (silently)
const scriptDir = path.dirname(path.resolve(__filename));
dotenv.config({ path: path.join(scriptDir, '.env'), quiet: true });
dotenv.config({ path: path.join(scriptDir, `.env.${process.env.NODE_ENV}.local`), quiet: true });

// Configuration
const API_URL = process.env.COUNTER_API_URL || 'https://your-domain.com/api/increment';
const API_SECRET = process.env.API_SECRET;
const ABSOLUTELY_RIGHT_PHRASE = /you(?:'re| are)\s+(?:(?:absolutely|completely)\s+)?(?:right|correct)\b/i;
const ISSUE_PATTERN = /(?:now\s+)?i\s+(?:can\s+)?(?:see|understand|get|found|spot|spotted)\s+the\s+(?:issue|problem|bug)/i;

// Validate configuration
if (!API_SECRET) {
  console.error('❌ API_SECRET environment variable is required');
  process.exit(1);
}

let allMessages = [];


function makeAPIRequest(data) {
  return new Promise((resolve, reject) => {
    const parsedUrl =  new URL(API_URL);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${API_SECRET}`,
        'User-Agent': 'Claude-Code-Hook/1.0'
      }
    };

    // Making API request
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ response, statusCode: res.statusCode });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Track processed messages to prevent duplicates
// Use absolute path to the hook's directory, not the current working directory
const PROCESSED_IDS_FILE = path.join(scriptDir, '.processed-messages.json');

function loadProcessedIds() {
  try {
    if (fs.existsSync(PROCESSED_IDS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROCESSED_IDS_FILE, 'utf8'));
      return new Set(data);
    }
  } catch (error) {
    // Could not load processed message IDs
  }
  return new Set();
}

function saveProcessedIds(processedIds) {
  try {
    fs.writeFileSync(PROCESSED_IDS_FILE, JSON.stringify([...processedIds]));
  } catch (error) {
    // Could not save processed message IDs
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

  process.stdin.on('end', async () => {
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
        
        // Process all unprocessed assistant messages
        let allApiPromises = [];
        let rightCount = 0;
        let issueCount = 0;
        let lastIssuePhrase = '';
        let lastAbsolutelyRightPhrase = '';
        
        for (const assistantMessage of assistantMessages) {
          const messageId = assistantMessage.uuid;
          const message = assistantMessage.message;
          
          // Skip if we've already processed this message
          if (processedMessageIds.has(messageId)) {
            continue;
          }

          // Extract text content from the message
          let textContent = '';
          if (message.content && Array.isArray(message.content)) {
            textContent = message.content
              .filter(c => c.type === 'text')
              .map(c => c.text)
              .join(' ');
          }
          
          // Check for "absolutely right" phrase
          const rightMatches = textContent.match(ABSOLUTELY_RIGHT_PHRASE);
          if (rightMatches && rightMatches.length > 0) {
            rightCount += rightMatches.length;
            lastAbsolutelyRightPhrase = rightMatches[0];
            
            for (let i = 0; i < rightMatches.length; i++) {
              allApiPromises.push(makeAPIRequest({type: 'right'}));
            }
          }
          
          // Check for issue detection phrases
          const issueMatches = textContent.match(ISSUE_PATTERN);
          if (issueMatches && issueMatches.length > 0) {
            issueCount++;
            lastIssuePhrase = issueMatches[0];
            allApiPromises.push(makeAPIRequest({type: 'issue'}));
          }
          
          // Mark this message as processed
          processedMessageIds.add(messageId);
        }
        
        // Build accumulated messages
        if (rightCount > 0) {
          allMessages.push(`🎯 Detected "${lastAbsolutelyRightPhrase}" ${rightCount} time(s)!`);
        }
        if (issueCount > 0) {
          if (issueCount === 1) {
            allMessages.push(`🔍 Detected issue phrase: "${lastIssuePhrase}"!`);
          } else {
            allMessages.push(`🔍 Detected ${issueCount} issue phrases!`);
          }
        }
        
        // Wait for all API requests to complete
        if (allApiPromises.length > 0) {
          await Promise.all(allApiPromises).catch(error => allMessages.push(`Error getting API responses: ${error}`));
        }
        
        // Save processed IDs
        saveProcessedIds(processedMessageIds);
        
        // Output JSON message for Claude Code display
        if (allMessages.length > 0) {
          const combinedMessage = allMessages.join('\n');
          console.log(JSON.stringify({
            continue: true,
            systemMessage: combinedMessage
          }));
        }
        
        process.exit(0);
      }
    } catch (error) {
      // Output JSON message for Claude Code display
      console.log(JSON.stringify({
          continue: true,
          systemMessage: `Failed to parse claude outputs\n${error}\n\n`
        }));
      process.exit(0);
    }
  });
}

// Run as Claude Code hook
if (require.main === module) {
  processInput();
}
