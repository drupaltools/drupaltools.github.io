#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load embedded project data
const PROJECTS_DATA = loadProjectsData();

function loadProjectsData() {
  try {
    // Try to load from the embedded JSON file first
    const projectsJson = readFileSync(join(__dirname, 'projects.json'), 'utf8');
    return JSON.parse(projectsJson);
  } catch (error) {
    console.error('Failed to load projects data:', error);
    process.exit(1);
  }
}

class DrupalToolsServer {
  constructor() {
    this.server = new Server(
      {
        name: "drupal-tools-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "list_tools",
          description: "List all available Drupal tools/projects with optional filtering",
          inputSchema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "Filter by category (e.g., 'testing', 'cli', 'deployment')",
              },
              limit: {
                type: "number",
                description: "Maximum number of tools to return",
                default: 50,
              },
            },
          },
        },
        {
          name: "search_tools",
          description: "Search for Drupal tools using semantic matching",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for tools",
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return",
                default: 10,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_tool",
          description: "Get detailed information about a specific Drupal tool",
          inputSchema: {
            type: "object",
            properties: {
              tool_id: {
                type: "string",
                description: "The tool ID or tool name",
              },
            },
            required: ["tool_id"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list_tools":
            return await this.handleListTools(args);
          case "search_tools":
            return await this.handleSearchTools(args);
          case "get_tool":
            return await this.handleGetTool(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async handleListTools(args) {
    const { category = null, limit = 50 } = args;
    let tools = Object.values(PROJECTS_DATA);

    if (category) {
      tools = tools.filter(tool =>
        tool.category && tool.category.includes(category.toLowerCase())
      );
    }

    tools = tools.slice(0, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            tools: tools.map(tool => ({
              id: tool.id,
              name: tool.name,
              description: tool.description,
              categories: tool.category || [],
              tags: tool.tags || [],
              drupal_versions: tool.drupal_versions || [],
              homepage: tool.homepage,
              docs: tool.docs
            })),
            total: tools.length
          }, null, 2),
        },
      ],
    };
  }

  async handleSearchTools(args) {
    const { query, limit = 10 } = args;
    const queryLower = query.toLowerCase();
    const tools = Object.values(PROJECTS_DATA);

    const scored = tools.map(tool => {
      let score = 0;

      // Title matches
      if (tool.name.toLowerCase().includes(queryLower)) score += 100;

      // Category matches
      if (tool.category) {
        tool.category.forEach(cat => {
          if (cat.toLowerCase().includes(queryLower)) score += 50;
        });
      }

      // Tag matches
      if (tool.tags) {
        tool.tags.forEach(tag => {
          if (tag.toLowerCase().includes(queryLower)) score += 30;
        });
      }

      // Description matches
      if (tool.description.toLowerCase().includes(queryLower)) score += 20;

      // Homepage/source matches
      if (tool.homepage && tool.homepage.toLowerCase().includes(queryLower)) score += 10;
      if (tool.source && tool.source.toLowerCase().includes(queryLower)) score += 10;

      return { tool, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.tool);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            query,
            results: scored.map(tool => ({
              id: tool.id,
              name: tool.name,
              description: tool.description,
              categories: tool.category || [],
              tags: tool.tags || [],
              drupal_versions: tool.drupal_versions || [],
              homepage: tool.homepage,
              docs: tool.docs
            })),
            total: scored.length
          }, null, 2),
        },
      ],
    };
  }

  async handleGetTool(args) {
    const { tool_id } = args;

    // Try to find by ID first, then by name
    let tool = PROJECTS_DATA[tool_id];

    if (!tool) {
      const tools = Object.values(PROJECTS_DATA);
      tool = tools.find(t => t.name.toLowerCase() === tool_id.toLowerCase());
    }

    if (!tool) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Tool '${tool_id}' not found`
            }, null, 2),
          },
        ],
      };
    }

    // Return complete tool information
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            ...tool,
            id: tool.id || tool_id
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Drupal Tools MCP server running on stdio");
    console.error(`Loaded ${Object.keys(PROJECTS_DATA).length} tools from embedded data`);
  }
}

// Start the server
const server = new DrupalToolsServer();
server.run().catch(console.error);