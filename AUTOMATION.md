# API Data Automation

This document explains how the API data is automatically generated and kept in sync with the project YAML files.

## Overview

The Web API (`/api/client.html`) uses pre-built JSON data for performance and GitHub Pages compatibility. This data is automatically generated from the YAML files in `_data/projects/`.

## Automation Methods

### 1. Jekyll Plugin (Automatic on GitHub Pages)
- **File**: `_plugins/api_generator.rb`
- **When it runs**: During every Jekyll build
- **How it works**:
  - Reads all YAML files from `_data/projects/`
  - Generates combined JSON (`api/data/projects.json`)
  - Creates JavaScript module (`api/data/drupal-tools-data.js`)
  - Creates individual JSON files for each project

### 2. Git Pre-commit Hook (Local Development)
- **File**: `.git/hooks/pre-commit`
- **When it runs**: Before every commit
- **What it does**:
  - Checks if any YAML files were staged
  - Runs `npm run build-api` if changes detected
  - Automatically stages the generated API data

### 3. GitHub Actions (CI/CD)
- **File**: `.github/workflows/build-api.yml`
- **When it runs**: On pushes to main/master, pull requests, or manual trigger
- **Features**:
  - Builds API data in isolated environment
  - Commits generated data back to repository
  - Ensures API is always up-to-date

### 4. NPM Scripts (Manual Control)
```bash
# Build API data once
npm run build-api

# Watch for changes and rebuild automatically
npm run watch-api

# Build and stage before committing
npm run precommit
```

## Data Flow

```
┌─────────────────┐
│  _data/projects/ │
│   *.yml files    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│   Automation    │────▶│   Generated      │
│ (Jekyll/Git/NPM) │     │   JSON Data      │
└─────────────────┘     └──────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │   GitHub Pages   │
                    │     /api/*       │
                    └──────────────────┘
```

## File Structure After Build

```
api/
├── data/
│   ├── projects.json           # All projects + metadata
│   ├── drupal-tools-data.js    # JavaScript module
│   ├── blt.json               # Individual project data
│   ├── acquia-desktop.json    # Individual project data
│   └── ...                     # One JSON per project
├── client.html                 # Web UI
├── index.html                  # API documentation
└── drupal-tools.js            # Client library
```

## Troubleshooting

### API data is out of sync
Run: `npm run build-api`

### Pre-commit hook not working
```bash
chmod +x .git/hooks/pre-commit
```

### GitHub Actions failing
Check: `.github/workflows/build-api.yml`

### Local development with auto-rebuild
```bash
npm run watch-api
```

## Performance

- Initial load: ~50KB of JSON data
- Search: Instant (client-side)
- No external dependencies on GitHub Pages
- Cached by browsers for 1 hour