#!/usr/bin/env node

// Watch for changes in _data/projects and rebuild API data
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const projectsDir = '_data/projects';

console.log('Watching for changes in _data/projects...');
console.log('Press Ctrl+C to stop\n');

// Initial build
console.log('Building initial API data...');
exec('node _scripts/build-api-data.js', (error, stdout, stderr) => {
  if (error) {
    console.error('Build error:', error);
    return;
  }
  console.log(stdout);
});

// Watch for file changes
fs.watch(projectsDir, { recursive: true }, (eventType, filename) => {
  if (filename && (filename.endsWith('.yml') || filename.endsWith('.yaml'))) {
    console.log(`\n📝 Detected change in: ${filename}`);

    // Debounce rapid changes
    setTimeout(() => {
      console.log('🔄 Rebuilding API data...');
      exec('node _scripts/build-api-data.js', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Build error:', error.message);
          return;
        }
        console.log('✅ ' + stdout);
      });
    }, 500);
  }
});