# Drupal Tools MCP Server

A simple MCP (Model Context Protocol) server that suggests Drupal tools from the `_data/projects` folder. This server provides semantic search and discovery of Drupal development tools, utilities, and projects.

## Features

- **list_tools**: List all available Drupal tools/projects with optional filtering
- **search_tools**: Search for tools using semantic matching
- **get_tool**: Get detailed information about a specific tool

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the MCP server:
```bash
npm run mcp
```

## Usage with Claude Desktop

Add the following to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "drupal-tools": {
      "command": "node",
      "args": ["/path/to/drupaltools.github.io/mcp-server/index.js"],
      "cwd": "/path/to/drupaltools.github.io"
    }
  }
}
```

## Available Tools

### 1. list_tools
Lists all available Drupal tools/projects.

**Parameters:**
- `category` (optional): Filter by category (e.g., 'testing', 'cli', 'deployment')
- `limit` (optional, default: 50): Maximum number of tools to return

**Example:**
```javascript
{
  "name": "list_tools",
  "arguments": {
    "category": "testing",
    "limit": 10
  }
}
```

### 2. search_tools
Search for tools using a query string. Uses smart scoring:
- Title matches: 100 points
- Category matches: 50 points
- Tag matches: 30 points
- Description matches: 20 points
- Homepage/source matches: 10 points

**Parameters:**
- `query` (required): Search query
- `limit` (optional, default: 10): Maximum results to return

**Example:**
```javascript
{
  "name": "search_tools",
  "arguments": {
    "query": "docker",
    "limit": 5
  }
}
```

### 3. get_tool
Get detailed information about a specific tool by ID or name.

**Parameters:**
- `tool_id` (required): The tool ID (filename without .yml) or tool name

**Returns:**
All data from the YAML file plus:
- `id`: Tool identifier
- `path`: File path to the YAML

**Response Structure:**
```json
{
  "name": "Tool Name",
  "year_created": 2020,
  "source": "https://github.com/example/tool",
  "homepage": "https://github.com/example/tool",
  "docs": "https://docs.example.com",
  "description": "Tool description",
  "requires": ["git", "composer"],
  "drupal_versions": [9, 10],
  "category": ["testing", "cli"],
  "tags": ["popular"],
  "similar": ["other-tool"],
  "id": "tool-id",
  "path": "/path/to/_data/projects/tool-id.yml"
}
```

**Example:**
```javascript
{
  "name": "get_tool",
  "arguments": {
    "tool_id": "blt"
  }
}
```

## Data Format

The server reads YAML files from `_data/projects/*.yml`. Each file contains:

```yaml
name: Tool Name
year_created: 2020
source: https://github.com/example/tool
homepage: https://github.com/example/tool
docs: https://docs.example.com
description: "Tool description"
requires:
  - git
  - composer
drupal_versions:
  - 9
  - 10
category:
  - testing
  - cli
tags:
  - popular
similar:
  - other-tool
```

## Testing

Run the test suite:
```bash
node mcp-server/test.js
```

Or test individual functionality:
```bash
node mcp-server/test-get-tool.js
```

## Testing

### Using MCP Inspector (Recommended)

The MCP SDK includes an inspector tool for interactive testing:

```bash
npx @modelcontextprotocol/inspector node mcp-server/index.js
```

This opens a web UI where you can:
- See all available tools and their schemas
- Test each tool with custom parameters
- View real-time responses
- Debug issues

### Quick Command-Line Test

Create a simple test to verify functionality:

```javascript
// test-mcp.js
import { spawn } from 'child_process';

const server = spawn('node', ['mcp-server/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
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

// Test search for "testing" tools
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'search_tools',
    arguments: { query: 'testing', limit: 5 }
  }
}) + '\n');
```

## Development

The server is built using the **JavaScript/TypeScript MCP SDK** (`@modelcontextprotocol/sdk` v1.24.3) with ES modules.

### Key Architecture Decisions:
- **Language**: Pure JavaScript with ES modules (no TypeScript compilation)
- **Transport**: Stdio for easy integration with Claude Desktop
- **Data Loading**: Asynchronous loading with lazy initialization
- **Scoring**: Deterministic scoring algorithm for search relevance
- **Error Handling**: Graceful fallbacks (ID lookup → name lookup)

### Architecture:
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   YAML Files    │────▶│   Load Project   │────▶│   Indexed Data  │
│ (_data/projects)│     │      Data        │     │     (Map)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   MCP Client    │────▶│   Tool Handlers  │────▶│   Search/Filter │
│ (Claude Desktop)│     │ (list/search/get)│     │    Logic        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

Key features:
- Static content only - no external APIs
- Read-only operations
- Minimal latency and cost
- Automatic indexing on startup (186+ tools)
- Deterministic tool suggestions
- Smart semantic search with field-weighted scoring

## MCP vs Web API

This MCP server provides stdin/stdout communication for AI assistants. For web-based access, see the [REST API](../api/) which provides similar functionality over HTTP.

### Key Differences:

| Aspect | MCP Server | Web API |
|--------|-------------|----------|
| **Protocol** | stdin/stdout (JSON-RPC) | HTTP/REST |
| **Use Case** | AI assistant integration | Web applications |
| **Deployment** | Local only | GitHub Pages compatible |
| **Authentication** | Not needed | Not needed |
| **Data Access** | Real-time from YAML files | Pre-built JSON data |

Both APIs provide the same core functionality:
- `list_tools` → GET /tools
- `search_tools` → GET /search
- `get_tool` → GET /tool/{id}