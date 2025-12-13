#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

class DrupalToolsServer {
  constructor() {
    this.server = new Server(
      {
        name: "drupal-tools-suggester",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.projectsPath = path.join(process.cwd(), '_data', 'projects');
    this.indexedData = new Map();
    this.dataLoaded = false;
    this.setupHandlers();
    this.loadProjectData();
  }

  async loadProjectData() {
    try {
      const files = await fs.readdir(this.projectsPath);

      for (const file of files) {
        if (file.endsWith('.yml') || file.endsWith('.yaml')) {
          const filePath = path.join(this.projectsPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = yaml.load(content);

          const id = file.replace(/\.(yml|yaml)$/, '');
          this.indexedData.set(id, {
            ...data,
            id,
            path: filePath,
          });
        }
      }

      console.error(`Loaded ${this.indexedData.size} projects from _data/projects/`);
      this.dataLoaded = true;
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_tools",
            description: "List all available Drupal tools/projects with basic information",
            inputSchema: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  description: "Optional category filter (e.g., 'testing', 'cli', 'deployment')",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of tools to return (default: 50)",
                  default: 50,
                },
              },
            },
          },
          {
            name: "search_tools",
            description: "Search for Drupal tools by query string",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query to find matching tools",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return (default: 10)",
                  default: 10,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "get_tool",
            description: "Get detailed information about a specific tool by ID or name",
            inputSchema: {
              type: "object",
              properties: {
                tool_id: {
                  type: "string",
                  description: "The ID of the tool (usually the filename without .yml extension)",
                },
              },
              required: ["tool_id"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "list_tools":
          return this.handleListTools(args);

        case "search_tools":
          return this.handleSearchTools(args);

        case "get_tool":
          return this.handleGetTool(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async handleListTools(args) {
    // Wait for data to be loaded
    if (!this.dataLoaded) {
      await new Promise(resolve => {
        const checkData = () => {
          if (this.dataLoaded) resolve();
          else setTimeout(checkData, 10);
        };
        checkData();
      });
    }

    const { category, limit = 50 } = args;

    let tools = Array.from(this.indexedData.values());

    if (category) {
      tools = tools.filter(tool =>
        tool.category?.includes(category.toLowerCase())
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
              docs: tool.docs,
            })),
            total: tools.length,
          }, null, 2),
        },
      ],
    };
  }

  async handleSearchTools(args) {
    // Wait for data to be loaded
    if (!this.dataLoaded) {
      await new Promise(resolve => {
        const checkData = () => {
          if (this.dataLoaded) resolve();
          else setTimeout(checkData, 10);
        };
        checkData();
      });
    }

    const { query, limit = 10 } = args;
    const queryLower = query.toLowerCase();

    const scored = Array.from(this.indexedData.values())
      .map(tool => {
        let score = 0;

        // Title matches get highest score
        if (tool.name.toLowerCase().includes(queryLower)) {
          score += 100;
        }

        // Category matches
        tool.category?.forEach(cat => {
          if (cat.toLowerCase().includes(queryLower)) {
            score += 50;
          }
        });

        // Tag matches
        tool.tags?.forEach(tag => {
          if (tag.toLowerCase().includes(queryLower)) {
            score += 30;
          }
        });

        // Description matches
        if (tool.description.toLowerCase().includes(queryLower)) {
          score += 20;
        }

        // Homepage/source matches
        if (tool.homepage?.toLowerCase().includes(queryLower) ||
            tool.source?.toLowerCase().includes(queryLower)) {
          score += 10;
        }

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
              docs: tool.docs,
            })),
            total: scored.length,
          }, null, 2),
        },
      ],
    };
  }

  async handleGetTool(args) {
    // Wait for data to be loaded
    if (!this.dataLoaded) {
      await new Promise(resolve => {
        const checkData = () => {
          if (this.dataLoaded) resolve();
          else setTimeout(checkData, 10);
        };
        checkData();
      });
    }

    const { tool_id } = args;

    const tool = this.indexedData.get(tool_id);

    if (!tool) {
      // Try to find by name as fallback
      const found = Array.from(this.indexedData.values())
        .find(t => t.name.toLowerCase() === tool_id.toLowerCase());

      if (!found) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Tool with ID or name '${tool_id}' not found`,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(found, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(tool, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Drupal Tools MCP server running on stdio");
  }
}

const server = new DrupalToolsServer();
server.run().catch(console.error);