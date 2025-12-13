#!/usr/bin/env node

// Build script to generate JSON data for the API
// Run this with: node _scripts/build-api-data.js

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectsDir = path.join(__dirname, '../_data/projects');
const outputDir = path.join(__dirname, '../api/data');

async function buildApiData() {
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const files = await fs.readdir(projectsDir);
    const projects = [];
    const categories = new Set();

    // Process each YAML file
    for (const file of files) {
      if (file.endsWith('.yml') || file.endsWith('.yaml')) {
        const filePath = path.join(projectsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = yaml.load(content);

        const id = file.replace(/\.(yml|yaml)$/, '');
        const project = {
          ...data,
          id,
          path: filePath
        };

        projects.push(project);

        // Collect categories
        if (data.category) {
          data.category.forEach(cat => categories.add(cat));
        }
      }
    }

    // Write combined data file
    const indexData = {
      projects,
      categories: Array.from(categories).sort(),
      total: projects.length,
      updated: new Date().toISOString()
    };

    await fs.writeFile(
      path.join(outputDir, 'projects.json'),
      JSON.stringify(indexData, null, 2)
    );

    // Write individual project files
    for (const project of projects) {
      await fs.writeFile(
        path.join(outputDir, `${project.id}.json`),
        JSON.stringify(project, null, 2)
      );
    }

    console.log(`✅ Built API data:`);
    console.log(`   - ${projects.length} projects processed`);
    console.log(`   - ${categories.size} categories found`);
    console.log(`   - Data written to api/data/`);

    // Generate JavaScript module for GitHub Pages
    const jsModule = `// Auto-generated Drupal Tools data
window.DrupalToolsData = ${JSON.stringify(indexData, null, 2)};`;

    await fs.writeFile(
      path.join(outputDir, 'drupal-tools-data.js'),
      jsModule
    );

    console.log(`   - JavaScript module created for GitHub Pages`);

  } catch (error) {
    console.error('❌ Error building API data:', error);
    process.exit(1);
  }
}

buildApiData();