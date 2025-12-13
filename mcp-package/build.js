#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const rootDir = join(__dirname, '..');
const dataDir = join(rootDir, '_data', 'projects');
const distDir = join(__dirname, 'dist');
const srcDir = join(__dirname, 'src');

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

console.log('Building @drupaltools/mcp package...');

// Read all YAML files and convert to JSON
const projects = {};
let fileCount = 0;

try {
  const files = readdirSync(dataDir).filter(file => file.endsWith('.yml'));

  files.forEach(file => {
    const filePath = join(dataDir, file);
    const content = readFileSync(filePath, 'utf8');
    const data = yaml.load(content);

    // Use filename without .yml as ID
    const id = file.replace('.yml', '');
    projects[id] = { ...data, id };
    fileCount++;
  });

  console.log(`✓ Processed ${fileCount} YAML files`);
} catch (error) {
  console.error('✗ Failed to read YAML files:', error);
  console.error('Make sure you\'re running this from the correct directory');
  process.exit(1);
}

// Write the combined projects data as JSON
const projectsPath = join(distDir, 'projects.json');
writeFileSync(projectsPath, JSON.stringify(projects, null, 2));
console.log(`✓ Created projects.json with ${Object.keys(projects).length} tools`);

// Copy the main server file
const serverSrc = join(srcDir, 'index.js');
const serverDest = join(distDir, 'index.js');
const serverContent = readFileSync(serverSrc, 'utf8');
writeFileSync(serverDest, serverContent);
console.log('✓ Copied server to dist/');

// Copy README
const readmeSrc = join(rootDir, 'README.md');
const readmeDest = join(distDir, 'README.md');
if (existsSync(readmeSrc)) {
  const readmeContent = readFileSync(readmeSrc, 'utf8');
  writeFileSync(readmeDest, readmeContent);
  console.log('✓ Copied README.md');
}

// Create a simple test file
const testContent = `#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing @drupaltools/mcp server...');

const server = spawn('node', [join(__dirname, 'index.js')], {
  stdio: ['pipe', 'pipe', 'inherit'],
  cwd: __dirname
});

let responseCount = 0;
const expectedResponses = 2;

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\\n').filter(line => line.trim());

  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      if (response.id) {
        responseCount++;
        console.log(\`✓ Response \${responseCount} received\`);

        if (responseCount >= expectedResponses) {
          console.log('\\n✓ All tests passed!');
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
}) + '\\n');

// List tools
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list'
}) + '\\n');

// Timeout after 5 seconds
setTimeout(() => {
  console.error('✗ Test timed out');
  server.kill();
  process.exit(1);
}, 5000);
`;

const testDest = join(distDir, 'test.js');
writeFileSync(testDest, testContent);
console.log('✓ Created test.js');

// Create package.json for distribution
const packageSrc = join(__dirname, 'package.json');
const packageContent = JSON.parse(readFileSync(packageSrc, 'utf8'));

// Update paths for distribution
// When published from dist/, these files become the package root
packageContent.main = 'index.js';
packageContent.bin = {
  'drupaltools-mcp': 'index.js'
};

// Update files list to include only what's in dist
packageContent.files = ['*.js', '*.json', '*.md'];
writeFileSync(join(distDir, 'package.json'), JSON.stringify(packageContent, null, 2));
console.log('✓ Created package.json in dist/');

console.log('\\n✅ Build completed successfully!');
console.log(`\\nTo test locally:`);
console.log(`  cd ${distDir}`);
console.log(`  npm link`);
console.log(`  # Then add to Claude Desktop config:`);
console.log(`  # "drupaltools": { "command": "drupaltools-mcp" }`);
console.log(`\\nTo publish to npm:`);
console.log(`  cd ${distDir}`);
console.log(`  npm publish`);