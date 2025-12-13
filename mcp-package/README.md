# @drupaltools/mcp

A Model Context Protocol (MCP) server for discovering Drupal development tools, utilities, and projects. This MCP server provides intelligent search and categorization of 186+ Drupal tools to help developers find the right tools for their needs.

## Installation

### Using npx (Recommended)

No installation required! Just add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "drupaltools": {
      "type": "stdio",
      "command": "npx",
      "args": ["@drupaltools/mcp@latest"]
    }
  }
}
```

### Global Install

```bash
npm install -g @drupaltools/mcp
```

Then add to Claude Desktop configuration:

```json
{
  "mcpServers": {
    "drupaltools": {
      "type": "stdio",
      "command": "drupaltools-mcp"
    }
  }
}
```

## Available Tools

### 1. `list_tools`
List all available Drupal tools with optional filtering.

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

### 2. `search_tools`
Search for tools using intelligent semantic matching.

**Scoring:**
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

### 3. `get_tool`
Get detailed information about a specific tool.

**Parameters:**
- `tool_id` (required): The tool ID or tool name

**Example:**
```javascript
{
  "name": "get_tool",
  "arguments": {
    "tool_id": "blt"
  }
}
```

## Categories

Tools are categorized into:
- **cli**: Command-line tools and utilities
- **testing**: Testing frameworks and utilities
- **deployment**: Deployment and automation tools
- **development**: Development aids and utilities
- **debug**: Debugging and analysis tools
- **ci**: Continuous integration tools
- **performance**: Performance optimization tools
- **security**: Security scanning and analysis
- **monitoring**: Monitoring and logging tools
- **migration**: Migration and data import/export tools

## Example Usage in Claude Desktop

Once configured, you can ask Claude to:

> "Show me 5 tools for testing Drupal sites"

> "Search for Docker-based Drupal development tools"

> "Tell me about BLT (Acquia Lightning) tool"

> "List all CLI tools for Drupal"

## Data Source

This MCP server contains data for 186+ Drupal tools sourced from the Drupal Tools community project (https://drupaltools.github.io). The data is embedded in the package, so it works offline and doesn't require external API calls.

## Publishing

### Manual Publishing

From the project root:

```bash
cd mcp-package
./publish.sh  # Or: ./publish.sh 1.2.3
```

Or using npm script:

```bash
cd mcp-package
npm run build
npm test
npm run publish:npm
```

### Automated Publishing via GitHub Actions

1. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Or manually trigger the workflow in GitHub Actions with a version number

3. The workflow will:
   - Build the package
   - Run tests
   - Publish to npm
   - Create a GitHub release

## Contributing

To add or update tools:

1. Visit https://github.com/drupaltools/drupaltools.github.io
2. Edit or add YAML files in the `_data/projects/` directory
3. Submit a pull request

The MCP package will be automatically updated when changes are merged (if the workflow is triggered).

## License

MIT

## Support

- Issues: https://github.com/drupaltools/drupaltools.github.io/issues
- Documentation: https://drupaltools.github.io