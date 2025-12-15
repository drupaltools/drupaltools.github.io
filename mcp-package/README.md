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

### Required GitHub Repository Secrets

To enable automated publishing, you need to set up the following secrets in your GitHub repository:

1. **NPM_TOKEN** (Required for npm publishing)
   - Go to: https://www.npmjs.com
   - Create an account or log in
   - Generate an access token: Account Settings → Access Tokens → Generate New Token
   - Set the token with automation permissions
   - Add to GitHub: Repository Settings → Secrets and variables → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: Your npm access token

2. **GITHUB_TOKEN** (Already provided by GitHub Actions)
   - This is automatically available in workflows with `permissions: contents: write`

### Package Name

**Package Name:** `@drupaltools/mcp`

This is the name you'll use to install the package:
```bash
npx @drupaltools/mcp
```

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

#### Option 1: Tag-based Publishing (Recommended)
1. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   This will automatically trigger the publish workflow

#### Option 2: Manual Trigger
1. Go to: Repository → Actions → "Publish to npm"
2. Click "Run workflow"
3. Enter the version number (e.g., "1.0.0")
4. Click "Run workflow"

#### What the workflow does:
- ✅ Builds the MCP package with latest data
- ✅ Runs tests to ensure everything works
- ✅ Publishes to npm registry
- ✅ Creates a GitHub release
- ✅ Updates version numbers in package.json files

### Publishing for the First Time

1. **Set up npm account** (if you don't have one):
   - Visit https://www.npmjs.com
   - Click "Sign up"
   - Verify your email address

2. **Generate npm token**:
   - Log in to npm
   - Go to Account Settings → Access Tokens
   - Click "Generate New Token"
   - Name: `drupaltools-mcp` (or any descriptive name)
   - Select permissions: "Automation"
   - Click "Generate Token"
   - **Important**: Copy the token immediately (you won't see it again)

3. **Add token to GitHub**:
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

4. **Publish the package**:
   ```bash
   cd mcp-package
   npm publish
   ```

### Post-Publishing Verification

After publishing, verify the package:
1. Visit https://www.npmjs.com/package/@drupaltools/mcp
2. Test installation:
   ```bash
   npx @drupaltools/mcp@latest --version
   ```
3. The package should be publicly available for anyone to use

## Contributing

To add or update tools:

1. Visit https://github.com/drupaltools/drupaltools.github.io
2. Edit or add YAML files in the `_data/projects/` directory
3. Submit a pull request

The MCP package will be automatically updated when changes are merged (if the workflow is triggered).

## Support

- Issues: https://github.com/drupaltools/drupaltools.github.io/issues
- Documentation: https://drupaltools.github.io