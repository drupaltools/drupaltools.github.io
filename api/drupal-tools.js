// Drupal Tools API - Can be hosted on GitHub Pages
// This provides HTTP endpoints similar to the MCP server functionality

// Load all project data
const PROJECTS_DATA = {};
const CATEGORIES = new Set();
const ALL_TOOLS = [];

// This would be pre-built during Jekyll build
// For now, we'll load dynamically (note: this won't work on GitHub Pages due to CORS)
async function loadData() {
  // In production, this would be a pre-built JSON file
  const response = await fetch('_data/projects-index.json');
  const projects = await response.json();

  projects.forEach(project => {
    PROJECTS_DATA[project.id] = project;
    ALL_TOOLS.push(project);
    project.category?.forEach(cat => CATEGORIES.add(cat));
  });
}

// API Endpoints
const DrupalToolsAPI = {
  // List all tools with optional filtering
  listTools: async (category = null, limit = 50) => {
    let tools = ALL_TOOLS;

    if (category) {
      tools = tools.filter(tool =>
        tool.category?.includes(category.toLowerCase())
      );
    }

    return {
      tools: tools.slice(0, limit).map(tool => ({
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
    };
  },

  // Search tools with scoring
  searchTools: async (query, limit = 10) => {
    const queryLower = query.toLowerCase();

    const scored = ALL_TOOLS.map(tool => {
      let score = 0;

      // Title matches
      if (tool.name.toLowerCase().includes(queryLower)) score += 100;

      // Category matches
      tool.category?.forEach(cat => {
        if (cat.toLowerCase().includes(queryLower)) score += 50;
      });

      // Tag matches
      tool.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) score += 30;
      });

      // Description matches
      if (tool.description.toLowerCase().includes(queryLower)) score += 20;

      return { tool, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.tool);

    return {
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
    };
  },

  // Get specific tool
  getTool: async (toolId) => {
    const tool = PROJECTS_DATA[toolId] ||
                 ALL_TOOLS.find(t => t.name.toLowerCase() === toolId.toLowerCase());

    if (!tool) {
      return { error: `Tool '${toolId}' not found` };
    }

    return tool;
  },

  // Get all categories
  getCategories: async () => {
    return Array.from(CATEGORIES).sort();
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DrupalToolsAPI;
} else {
  window.DrupalToolsAPI = DrupalToolsAPI;
}