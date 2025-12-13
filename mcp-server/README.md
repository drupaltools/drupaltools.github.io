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

## Development

The server is built using the [Model Context Protocol SDK](https://modelcontextprotocol.io/docs/sdk).

Key features:
- Static content only - no external APIs
- Read-only operations
- Minimal latency and cost
- Automatic indexing on startup
- Deterministic tool suggestions