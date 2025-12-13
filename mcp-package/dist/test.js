#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Testing @drupaltools/mcp server...');

const server = spawn('node', ['/var/www/html/NON-DRUPAL/drupaltools.github.io/mcp-package/dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  cwd: '/var/www/html/NON-DRUPAL/drupaltools.github.io/mcp-package/dist'
});

let responseCount = 0;
const expectedResponses = 2;

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());

  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      if (response.id) {
        responseCount++;
        console.log(`✓ Response ${responseCount} received`);

        if (responseCount >= expectedResponses) {
          console.log('\n✓ All tests passed!');
          server.kill();
          process.exit(0);
        }
      }
    } catch (e) {
      // Ignore non-JSON lines
    }
  });
});

server.on('error', (err) => {
  console.error('✗ Failed to start server:', err);
  process.exit(1);
});

// Send initialization
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0.0' }
  }
}) + '\n');

// List tools
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list'
}) + '\n');

// Timeout after 5 seconds
setTimeout(() => {
  console.error('✗ Test timed out');
  server.kill();
  process.exit(1);
}, 5000);
