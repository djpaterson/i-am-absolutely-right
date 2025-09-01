#!/usr/bin/env node

/**
 * Test Script for Claude Code Hook
 * 
 * This script tests the claude-hook.js functionality by creating mock input
 * and verifying the complete pipeline works correctly.
 * 
 * Usage:
 *   node test-hook.js --test        # Test "absolutely right" detection
 *   node test-hook.js --test-issue  # Test issue detection
 *   node test-hook.js --help        # Show help
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const scriptDir = path.dirname(path.resolve(__filename));
const hookScriptPath = path.join(scriptDir, 'claude-hook.js');

function createMockInput(testMessage) {
  // Create a temporary transcript file with mock data
  const tempDir = path.join(scriptDir, '.temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const tempTranscriptPath = path.join(tempDir, `test-transcript-${Date.now()}.jsonl`);
  const mockTranscriptEntry = {
    type: 'assistant',
    uuid: `test-${Date.now()}`,
    message: {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: testMessage
        }
      ]
    }
  };
  
  fs.writeFileSync(tempTranscriptPath, JSON.stringify(mockTranscriptEntry) + '\n');
  
  const mockHookData = {
    transcript_path: tempTranscriptPath
  };
  
  return {
    input: JSON.stringify(mockHookData),
    tempFile: tempTranscriptPath
  };
}

function cleanupTempFiles(tempFile) {
  try {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    const tempDir = path.dirname(tempFile);
    if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
      fs.rmdirSync(tempDir);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

function runTest(testMessage, testType) {
  console.log(`🧪 Testing ${testType} with processInput() method...`);
  
  const { input, tempFile } = createMockInput(testMessage);
  
  // Spawn the hook script as a child process
  const hookProcess = spawn('node', [hookScriptPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let output = '';
  let errorOutput = '';
  
  hookProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  hookProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  
  hookProcess.on('close', (code) => {
    // Clean up temp files
    cleanupTempFiles(tempFile);
    
    if (code === 0) {
      console.log('✅ Test completed successfully');
      if (output.trim()) {
        console.log('Output:', output.trim());
        
        // Try to parse and validate the JSON output
        try {
          const jsonOutput = JSON.parse(output.trim());
          if (jsonOutput.stopReason) {
            console.log('✅ Valid hook output format detected');
            
            // Check for right counter detection (updated to look for actual matched phrase)
            if (jsonOutput.stopReason.includes('🎯 Detected')) {
              console.log('✅ "Right" phrase detected correctly');
            }
            
            // Check for issue detection
            if (jsonOutput.stopReason.includes('🔍 Detected issue phrase')) {
              console.log('✅ Issue phrase detected correctly');
            }
            
            // Show what was actually detected
            console.log(`📝 Detection result: ${jsonOutput.stopReason}`);
          }
        } catch (parseError) {
          console.log('⚠️  Output is not valid JSON (might be debug output)');
        }
      } else {
        console.log('ℹ️  No output (phrase not detected or no API calls made)');
      }
    } else {
      console.error(`❌ Test failed with exit code ${code}`);
      if (errorOutput.trim()) {
        console.error('Error output:', errorOutput.trim());
      }
    }
  });
  
  hookProcess.on('error', (error) => {
    cleanupTempFiles(tempFile);
    console.error('❌ Failed to start hook process:', error);
  });
  
  // Send the mock input to the hook script
  hookProcess.stdin.write(input);
  hookProcess.stdin.end();
}

// Handle CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    runTest("You're absolutely right!", "right counter");
  } else if (args.includes('--test-issue')) {
    runTest("I can see the issue!", "issue detection");
  } else if (args.includes('--text') && args.length >= 2) {
    // Find the --text flag and get everything after it as the test message
    const textIndex = args.indexOf('--text');
    const testMessage = args.slice(textIndex + 1).join(' ');
    if (testMessage.trim()) {
      runTest(testMessage, "custom phrase");
    } else {
      console.error('❌ No text provided after --text flag');
      process.exit(1);
    }
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Claude Code Hook Tester

Usage:
  node test-hook.js --test              # Test "absolutely right" counter detection
  node test-hook.js --test-issue        # Test issue detection counter
  node test-hook.js --text <message>    # Test with custom message
  node test-hook.js --help              # Show this help

Examples:
  node test-hook.js --text "You are absolutely correct!"
  node test-hook.js --text "I found the issue in the code"
  node test-hook.js --text "You're completely right about this"

This script tests the claude-hook.js functionality by:
1. Creating mock Claude Code hook input with test phrases
2. Running the actual hook script with the mock input
3. Validating the output format and phrase detection
4. Cleaning up temporary files

The test uses the same processInput() method that runs in production,
ensuring the test validates the actual hook behavior.
    `);
  } else {
    console.log('Use --help to see available options or --text "your message" to test custom phrases');
  }
}