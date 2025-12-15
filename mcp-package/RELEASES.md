# Releases

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] - 2024-12-15

### Added
- Model Context Protocol (MCP) server for discovering Drupal development tools
- Semantic search functionality for Drupal tools
- Support for 160+ Drupal tools and utilities
- npm package distribution with `drupaltools-mcp` binary
- Integration with Claude Desktop via stdio transport

### Features
- `list_tools`: List all available Drupal tools with optional filtering
- `search_tools`: Search for tools using semantic matching with weighted scoring
- `get_tool`: Get detailed information about specific tools by ID or name
- Smart scoring algorithm for search relevance (title: 100pts, category: 50pts, tags: 30pts, description: 20pts, homepage: 10pts)

[Unreleased]: https://github.com/drupaltools/drupaltools.github.io/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/drupaltools/drupaltools.github.io/releases/tag/v1.0.3